package io.promorunner.config;

import java.util.ArrayList;
import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app")
public class AppProperties {

  private final Redis redis = new Redis();
  private final Tenancy tenancy = new Tenancy();
  private final Cors cors = new Cors();

  public Redis getRedis() {
    return redis;
  }

  public Tenancy getTenancy() {
    return tenancy;
  }

  public Cors getCors() {
    return cors;
  }

  public static class Redis {
    private boolean enabled;

    public boolean isEnabled() {
      return enabled;
    }

    public void setEnabled(boolean enabled) {
      this.enabled = enabled;
    }
  }

  public static class Tenancy {
    private String headerName = "X-Tenant-Slug";
    private boolean allowDevDefaultSlug;
    private String devDefaultSlug = "demo";

    public String getHeaderName() {
      return headerName;
    }

    public void setHeaderName(String headerName) {
      this.headerName = headerName;
    }

    public boolean isAllowDevDefaultSlug() {
      return allowDevDefaultSlug;
    }

    public void setAllowDevDefaultSlug(boolean allowDevDefaultSlug) {
      this.allowDevDefaultSlug = allowDevDefaultSlug;
    }

    public String getDevDefaultSlug() {
      return devDefaultSlug;
    }

    public void setDevDefaultSlug(String devDefaultSlug) {
      this.devDefaultSlug = devDefaultSlug;
    }
  }

  public static class Cors {
    private List<String> additionalOrigins = new ArrayList<>();

    public List<String> getAdditionalOrigins() {
      return additionalOrigins;
    }

    public void setAdditionalOrigins(List<String> additionalOrigins) {
      this.additionalOrigins = additionalOrigins;
    }
  }
}
