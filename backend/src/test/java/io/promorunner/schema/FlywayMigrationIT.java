package io.promorunner.schema;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import io.promorunner.domain.tenant.Tenant;
import io.promorunner.domain.tenant.TenantRepository;
import io.promorunner.domain.user.User;
import io.promorunner.domain.user.UserRepository;
import io.promorunner.support.AbstractIntegrationTest;
import io.promorunner.tenancy.TenantContext;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.support.TransactionTemplate;

class FlywayMigrationIT extends AbstractIntegrationTest {

  @Autowired private JdbcTemplate jdbcTemplate;
  @Autowired private TenantRepository tenantRepository;
  @Autowired private UserRepository userRepository;
  @Autowired private TransactionTemplate transactionTemplate;

  @AfterEach
  void clearTenant() {
    TenantContext.clear();
  }

  @Test
  void migratesCoreTablesAndDemoTenant() {
    Integer tables =
        jdbcTemplate.queryForObject(
            """
            SELECT COUNT(*) FROM information_schema.tables
            WHERE table_schema = 'public'
              AND table_name IN (
                'tenants', 'tenant_brand_config', 'users', 'marketing_consents',
                'game_sessions', 'scores', 'magic_link_tokens'
              )
            """,
            Integer.class);
    assertThat(tables).isEqualTo(7);
    assertThat(tenantRepository.findBySlugIgnoreCaseAndActiveTrue("demo")).isPresent();
  }

  @Test
  void rejectsDuplicateEmailInSameTenant() {
    Tenant demo = tenantRepository.findBySlugIgnoreCaseAndActiveTrue("demo").orElseThrow();
    TenantContext.set(demo.getId(), demo.getSlug());

    transactionTemplate.executeWithoutResult(
        status -> {
          User first = new User();
          first.setEmail("dup-" + UUID.randomUUID() + "@example.com");
          first.setAuthProvider("magic_link");
          userRepository.saveAndFlush(first);

          User second = new User();
          second.setEmail(first.getEmail());
          second.setAuthProvider("magic_link");

          assertThatThrownBy(() -> userRepository.saveAndFlush(second))
              .isInstanceOf(DataIntegrityViolationException.class);
          status.setRollbackOnly();
        });
  }

  @Test
  void consentTableIsAppendOnly() {
    Tenant demo = tenantRepository.findBySlugIgnoreCaseAndActiveTrue("demo").orElseThrow();
    TenantContext.set(demo.getId(), demo.getSlug());
    User user =
        transactionTemplate.execute(
            status -> {
              User created = new User();
              created.setEmail("consent-" + UUID.randomUUID() + "@example.com");
              created.setAuthProvider("magic_link");
              return userRepository.saveAndFlush(created);
            });

    jdbcTemplate.update(
        """
        INSERT INTO marketing_consents (tenant_id, user_id, consented, consent_version)
        VALUES (?, ?, true, '1.0')
        """,
        demo.getId(),
        user.getId());

    assertThatThrownBy(
            () ->
                jdbcTemplate.update(
                    "UPDATE marketing_consents SET consented = false WHERE user_id = ?",
                    user.getId()))
        .hasMessageContaining("append-only");
  }
}
