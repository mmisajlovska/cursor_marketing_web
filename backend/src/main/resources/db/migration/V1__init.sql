-- PromoRunner V1 schema. Seed demo tenant before enabling FORCE RLS.

CREATE TABLE tenants (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug            VARCHAR(63) UNIQUE NOT NULL,
    company_name    VARCHAR(255) NOT NULL,
    plan            VARCHAR(50) NOT NULL DEFAULT 'starter',
    custom_domain   VARCHAR(255),
    is_active       BOOLEAN NOT NULL DEFAULT true,
    max_mau         INTEGER NOT NULL DEFAULT 10000,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE tenant_brand_config (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id            UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    logo_url             TEXT,
    primary_color        VARCHAR(7) NOT NULL DEFAULT '#4F46E5',
    secondary_color      VARCHAR(7) NOT NULL DEFAULT '#7C3AED',
    background_color     VARCHAR(7) NOT NULL DEFAULT '#1E1B4B',
    game_title           VARCHAR(120) NOT NULL DEFAULT 'PromoRunner',
    consent_label_text   TEXT NOT NULL DEFAULT 'I agree to receive marketing emails.',
    character_sprite_url TEXT,
    obstacle_sprite_urls JSONB,
    background_sprite_url TEXT,
    plays_before_gate    INTEGER NOT NULL DEFAULT 3,
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (tenant_id)
);

CREATE TABLE users (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id             UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    email                 VARCHAR(255) NOT NULL,
    display_name          VARCHAR(255),
    avatar_url            TEXT,
    auth_provider         VARCHAR(50) NOT NULL,
    provider_uid          VARCHAR(255),
    free_plays_remaining  INTEGER,
    is_email_verified     BOOLEAN NOT NULL DEFAULT false,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_seen_at          TIMESTAMPTZ,
    UNIQUE (tenant_id, email)
);

CREATE INDEX idx_users_tenant_email ON users(tenant_id, email);

CREATE TABLE marketing_consents (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id),
    user_id         UUID NOT NULL REFERENCES users(id),
    consented       BOOLEAN NOT NULL,
    consent_version VARCHAR(20) NOT NULL DEFAULT '1.0',
    ip_address      INET,
    user_agent      TEXT,
    consented_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    withdrawn_at    TIMESTAMPTZ
);

CREATE INDEX idx_consents_tenant_user ON marketing_consents(tenant_id, user_id);

CREATE TABLE game_sessions (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id    UUID NOT NULL REFERENCES tenants(id),
    user_id      UUID NOT NULL REFERENCES users(id),
    started_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    ended_at     TIMESTAMPTZ,
    final_score  INTEGER,
    duration_ms  INTEGER,
    device_type  VARCHAR(20),
    is_completed BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX idx_sessions_tenant_user ON game_sessions(tenant_id, user_id);
CREATE INDEX idx_sessions_tenant_score ON game_sessions(tenant_id, final_score DESC);

CREATE TABLE scores (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id      UUID NOT NULL REFERENCES tenants(id),
    user_id        UUID NOT NULL REFERENCES users(id),
    best_score     INTEGER NOT NULL DEFAULT 0,
    total_plays    INTEGER NOT NULL DEFAULT 0,
    last_played_at TIMESTAMPTZ,
    rank           INTEGER,
    UNIQUE (tenant_id, user_id)
);

CREATE INDEX idx_scores_tenant_best ON scores(tenant_id, best_score DESC);

CREATE TABLE magic_link_tokens (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL REFERENCES tenants(id),
    email       VARCHAR(255) NOT NULL,
    token_hash  VARCHAR(64) NOT NULL,
    expires_at  TIMESTAMPTZ NOT NULL,
    used_at     TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_magic_link_hash ON magic_link_tokens(token_hash);

CREATE OR REPLACE FUNCTION marketing_consents_append_only()
RETURNS trigger AS $$
BEGIN
    RAISE EXCEPTION 'marketing_consents is append-only';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER marketing_consents_no_mutation
    BEFORE UPDATE OR DELETE ON marketing_consents
    FOR EACH ROW
    EXECUTE PROCEDURE marketing_consents_append_only();

INSERT INTO tenants (id, slug, company_name, plan, is_active, max_mau)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'demo',
    'Demo Tenant',
    'starter',
    true,
    10000
);

INSERT INTO tenant_brand_config (
    tenant_id,
    game_title,
    consent_label_text
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'PromoRunner',
    'I agree to receive marketing emails.'
);

CREATE OR REPLACE FUNCTION promorunner_tenant_isolation(tenant_column UUID)
RETURNS boolean AS $$
BEGIN
    RETURN tenant_column = NULLIF(current_setting('app.tenant_id', true), '')::uuid;
END;
$$ LANGUAGE plpgsql STABLE;

DO $$
DECLARE
    tbl text;
BEGIN
    FOREACH tbl IN ARRAY ARRAY[
        'tenant_brand_config',
        'users',
        'marketing_consents',
        'game_sessions',
        'scores',
        'magic_link_tokens'
    ]
    LOOP
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
        EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', tbl);
        EXECUTE format(
            'CREATE POLICY tenant_isolation ON %I USING (promorunner_tenant_isolation(tenant_id)) WITH CHECK (promorunner_tenant_isolation(tenant_id))',
            tbl
        );
    END LOOP;
END $$;
