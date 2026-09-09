# PromoRunner API

Spring Boot 3.3 / Java 21 backend. Bind address is `0.0.0.0` and the HTTP port is `$PORT` (default `8080`) so the same artifact can run locally and on Render.

## Local development

From the repository root:

```bash
docker compose up db redis -d
cd backend
./mvnw spotless:apply
./mvnw spring-boot:run
```

On Windows PowerShell use `.\mvnw.cmd` instead of `./mvnw`.

Health check: `GET http://localhost:8080/actuator/health`

Tenant resolution for local calls (no subdomain): send `X-Tenant-Slug: demo` after the schema PR is merged. In the `dev` profile the API also falls back to the seeded `demo` tenant.

## Quality gates

Postgres must be up (`docker compose up db -d` from the repo root). Then:

```bash
cd backend
./mvnw spotless:check
./mvnw -B verify
```

## Environment

See [`.env.example`](../.env.example). Render will supply `PORT`, `DATABASE_URL`, and optionally `REDIS_URL`. Redis is optional in this foundation stage (`APP_REDIS_ENABLED=false` by default).
