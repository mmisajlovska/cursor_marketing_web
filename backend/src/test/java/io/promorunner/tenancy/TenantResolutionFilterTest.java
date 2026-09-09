package io.promorunner.tenancy;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class TenantResolutionFilterTest {

  @Test
  void parsesSubdomainFromPromorunnerHost() {
    assertThat(TenantResolutionFilter.slugFromHost("acme.promorunner.io")).contains("acme");
    assertThat(TenantResolutionFilter.slugFromHost("ACME.promorunner.io:443")).contains("acme");
  }

  @Test
  void ignoresBareLocalhost() {
    assertThat(TenantResolutionFilter.slugFromHost("localhost:8080")).isEmpty();
    assertThat(TenantResolutionFilter.slugFromHost("127.0.0.1")).isEmpty();
  }

  @Test
  void parsesDemoLocalhostSubdomain() {
    assertThat(TenantResolutionFilter.slugFromHost("demo.localhost")).contains("demo");
  }
}
