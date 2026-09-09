package io.promorunner.domain.tenant;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TenantBrandConfigRepository extends JpaRepository<TenantBrandConfig, UUID> {

  Optional<TenantBrandConfig> findByTenantId(UUID tenantId);
}
