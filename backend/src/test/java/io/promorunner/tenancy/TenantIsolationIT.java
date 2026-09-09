package io.promorunner.tenancy;

import static org.assertj.core.api.Assertions.assertThat;

import io.promorunner.domain.tenant.Tenant;
import io.promorunner.domain.tenant.TenantRepository;
import io.promorunner.domain.user.User;
import io.promorunner.domain.user.UserRepository;
import io.promorunner.support.AbstractIntegrationTest;
import java.util.List;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.support.TransactionTemplate;

class TenantIsolationIT extends AbstractIntegrationTest {

  @Autowired private TenantRepository tenantRepository;
  @Autowired private UserRepository userRepository;
  @Autowired private TransactionTemplate transactionTemplate;

  @AfterEach
  void clearTenant() {
    TenantContext.clear();
  }

  @Test
  void usersAreIsolatedByTenantIdentifier() {
    Tenant tenantA = tenantRepository.findBySlugIgnoreCaseAndActiveTrue("demo").orElseThrow();
    Tenant tenantB = persistTenant("acme-" + java.util.UUID.randomUUID(), "Acme");

    TenantContext.set(tenantA.getId(), tenantA.getSlug());
    transactionTemplate.executeWithoutResult(
        status -> userRepository.saveAndFlush(user("alpha@example.com")));

    TenantContext.set(tenantB.getId(), tenantB.getSlug());
    transactionTemplate.executeWithoutResult(
        status -> userRepository.saveAndFlush(user("beta@example.com")));

    TenantContext.set(tenantA.getId(), tenantA.getSlug());
    List<User> tenantAUsers = transactionTemplate.execute(status -> userRepository.findAll());
    assertThat(tenantAUsers).extracting(User::getEmail).contains("alpha@example.com");
    assertThat(tenantAUsers).extracting(User::getEmail).doesNotContain("beta@example.com");

    TenantContext.set(tenantB.getId(), tenantB.getSlug());
    List<User> tenantBUsers = transactionTemplate.execute(status -> userRepository.findAll());
    assertThat(tenantBUsers).extracting(User::getEmail).contains("beta@example.com");
  }

  @Test
  void sameEmailAllowedAcrossTenants() {
    Tenant tenantA = tenantRepository.findBySlugIgnoreCaseAndActiveTrue("demo").orElseThrow();
    Tenant tenantB = persistTenant("globex-" + java.util.UUID.randomUUID(), "Globex");

    TenantContext.set(tenantA.getId(), tenantA.getSlug());
    transactionTemplate.executeWithoutResult(
        status -> userRepository.saveAndFlush(user("shared@example.com")));

    TenantContext.set(tenantB.getId(), tenantB.getSlug());
    transactionTemplate.executeWithoutResult(
        status -> userRepository.saveAndFlush(user("shared@example.com")));

    List<User> tenantBUsers = transactionTemplate.execute(status -> userRepository.findAll());
    assertThat(tenantBUsers).hasSize(1);
  }

  private Tenant persistTenant(String slug, String companyName) {
    return transactionTemplate.execute(
        status -> {
          Tenant tenant = new Tenant();
          tenant.setSlug(slug);
          tenant.setCompanyName(companyName);
          tenant.setPlan("starter");
          tenant.setActive(true);
          tenant.setMaxMau(10000);
          return tenantRepository.saveAndFlush(tenant);
        });
  }

  private static User user(String email) {
    User user = new User();
    user.setEmail(email);
    user.setAuthProvider("google");
    return user;
  }
}
