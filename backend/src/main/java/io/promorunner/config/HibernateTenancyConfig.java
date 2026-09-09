package io.promorunner.config;

import io.promorunner.tenancy.TenantIdentifierResolver;
import org.hibernate.cfg.AvailableSettings;
import org.springframework.boot.autoconfigure.orm.jpa.HibernatePropertiesCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class HibernateTenancyConfig {

  @Bean
  HibernatePropertiesCustomizer tenantIdentifierResolverCustomizer(
      TenantIdentifierResolver resolver) {
    return hibernateProperties ->
        hibernateProperties.put(AvailableSettings.MULTI_TENANT_IDENTIFIER_RESOLVER, resolver);
  }
}
