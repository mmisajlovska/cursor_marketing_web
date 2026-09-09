package io.promorunner.tenancy;

import java.util.UUID;
import org.hibernate.context.spi.CurrentTenantIdentifierResolver;
import org.springframework.stereotype.Component;

@Component
public class TenantIdentifierResolver implements CurrentTenantIdentifierResolver<UUID> {

  /** Used when no request tenant is bound (actuator, schema validation). */
  public static final UUID UNSET = UUID.fromString("00000000-0000-0000-0000-000000000000");

  @Override
  public UUID resolveCurrentTenantIdentifier() {
    UUID tenantId = TenantContext.getTenantId();
    return tenantId != null ? tenantId : UNSET;
  }

  @Override
  public boolean validateExistingCurrentSessions() {
    return false;
  }
}
