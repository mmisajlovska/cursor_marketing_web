package io.promorunner.config;

import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

/** Maps Render-style {@code DATABASE_URL} / {@code REDIS_URL} onto Spring Boot properties. */
public class DatabaseUrlEnvironmentPostProcessor implements EnvironmentPostProcessor {

  @Override
  public void postProcessEnvironment(
      ConfigurableEnvironment environment, SpringApplication application) {
    Map<String, Object> properties = new HashMap<>();
    String databaseUrl = firstNonBlank(environment.getProperty("DATABASE_URL"));
    if (databaseUrl != null) {
      applyDatabaseUrl(databaseUrl, properties);
    }
    String redisUrl = firstNonBlank(environment.getProperty("REDIS_URL"));
    if (redisUrl != null) {
      properties.put("spring.data.redis.url", redisUrl);
    }
    if (!properties.isEmpty()) {
      environment
          .getPropertySources()
          .addFirst(new MapPropertySource("renderUrlBindings", properties));
    }
  }

  static void applyDatabaseUrl(String raw, Map<String, Object> properties) {
    String normalized = raw;
    if (normalized.startsWith("postgres://")) {
      normalized = "http://" + normalized.substring("postgres://".length());
    } else if (normalized.startsWith("postgresql://")) {
      normalized = "http://" + normalized.substring("postgresql://".length());
    } else if (normalized.startsWith("jdbc:postgresql://")) {
      properties.put("spring.datasource.url", raw);
      return;
    }
    URI uri = URI.create(normalized);
    String userInfo = uri.getUserInfo();
    String username = null;
    String password = null;
    if (userInfo != null) {
      int colon = userInfo.indexOf(':');
      if (colon >= 0) {
        username = decode(userInfo.substring(0, colon));
        password = decode(userInfo.substring(colon + 1));
      } else {
        username = decode(userInfo);
      }
    }
    String path = uri.getPath() == null ? "" : uri.getPath();
    if (path.startsWith("/")) {
      path = path.substring(1);
    }
    int port = uri.getPort() == -1 ? 5432 : uri.getPort();
    properties.put(
        "spring.datasource.url", "jdbc:postgresql://%s:%d/%s".formatted(uri.getHost(), port, path));
    if (username != null) {
      properties.put("spring.datasource.username", username);
    }
    if (password != null) {
      properties.put("spring.datasource.password", password);
    }
  }

  private static String decode(String value) {
    return URLDecoder.decode(value, StandardCharsets.UTF_8);
  }

  private static String firstNonBlank(String value) {
    if (value == null || value.isBlank()) {
      return null;
    }
    return value;
  }
}
