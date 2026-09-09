package io.promorunner.config;

import com.zaxxer.hikari.HikariDataSource;
import io.promorunner.tenancy.TenantAwareDataSource;
import org.springframework.beans.BeansException;
import org.springframework.beans.factory.config.BeanPostProcessor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DataSourceTenancyConfig {

  @Bean
  static BeanPostProcessor tenantAwareDataSourceWrapper() {
    return new BeanPostProcessor() {
      @Override
      public Object postProcessAfterInitialization(Object bean, String beanName)
          throws BeansException {
        if (bean instanceof HikariDataSource hikari) {
          return new TenantAwareDataSource(hikari);
        }
        return bean;
      }
    };
  }
}
