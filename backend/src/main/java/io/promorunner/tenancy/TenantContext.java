package io.promorunner.tenancy;

import java.util.UUID;

/**
 * Request-scoped tenant identity. Always clear in a {@code finally} block — ThreadLocal leaks
 * across pooled request threads. Do not use from unmanaged async threads without wrapping.
 */
public final class TenantContext {

  private static final ThreadLocal<UUID> TENANT_ID = new ThreadLocal<>();
  private static final ThreadLocal<String> TENANT_SLUG = new ThreadLocal<>();

  private TenantContext() {}

  public static void set(UUID tenantId, String slug) {
    TENANT_ID.set(tenantId);
    TENANT_SLUG.set(slug);
  }

  public static UUID getTenantId() {
    return TENANT_ID.get();
  }

  public static String getTenantSlug() {
    return TENANT_SLUG.get();
  }

  public static void clear() {
    TENANT_ID.remove();
    TENANT_SLUG.remove();
  }
}
