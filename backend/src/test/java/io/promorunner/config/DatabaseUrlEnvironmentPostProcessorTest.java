package io.promorunner.config;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashMap;
import java.util.Map;
import org.junit.jupiter.api.Test;

class DatabaseUrlEnvironmentPostProcessorTest {

  @Test
  void mapsRenderPostgresUrl() {
    Map<String, Object> properties = new HashMap<>();
    DatabaseUrlEnvironmentPostProcessor.applyDatabaseUrl(
        "postgres://promorunner:s3cret@dpg-host:5432/promorunner", properties);

    assertThat(properties.get("spring.datasource.url"))
        .isEqualTo("jdbc:postgresql://dpg-host:5432/promorunner");
    assertThat(properties.get("spring.datasource.username")).isEqualTo("promorunner");
    assertThat(properties.get("spring.datasource.password")).isEqualTo("s3cret");
  }
}
