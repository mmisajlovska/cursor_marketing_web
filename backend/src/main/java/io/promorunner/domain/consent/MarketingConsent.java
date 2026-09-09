package io.promorunner.domain.consent;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.UUID;
import org.hibernate.annotations.TenantId;

@Entity
@Table(name = "marketing_consents")
public class MarketingConsent {

  @Id private UUID id;

  @TenantId
  @Column(name = "tenant_id", nullable = false)
  private UUID tenantId;

  @Column(name = "user_id", nullable = false)
  private UUID userId;

  @Column(nullable = false)
  private boolean consented;

  @Column(name = "consent_version", nullable = false, length = 20)
  private String consentVersion;

  @Column(name = "ip_address", columnDefinition = "inet")
  private String ipAddress;

  @Column(name = "user_agent")
  private String userAgent;

  @Column(name = "consented_at", nullable = false)
  private OffsetDateTime consentedAt;

  @Column(name = "withdrawn_at")
  private OffsetDateTime withdrawnAt;

  public UUID getId() {
    return id;
  }

  public void setId(UUID id) {
    this.id = id;
  }

  public UUID getTenantId() {
    return tenantId;
  }

  public void setTenantId(UUID tenantId) {
    this.tenantId = tenantId;
  }

  public UUID getUserId() {
    return userId;
  }

  public void setUserId(UUID userId) {
    this.userId = userId;
  }

  public boolean isConsented() {
    return consented;
  }

  public void setConsented(boolean consented) {
    this.consented = consented;
  }

  public String getConsentVersion() {
    return consentVersion;
  }

  public void setConsentVersion(String consentVersion) {
    this.consentVersion = consentVersion;
  }

  public String getIpAddress() {
    return ipAddress;
  }

  public void setIpAddress(String ipAddress) {
    this.ipAddress = ipAddress;
  }

  public String getUserAgent() {
    return userAgent;
  }

  public void setUserAgent(String userAgent) {
    this.userAgent = userAgent;
  }

  public OffsetDateTime getConsentedAt() {
    return consentedAt;
  }

  public void setConsentedAt(OffsetDateTime consentedAt) {
    this.consentedAt = consentedAt;
  }

  public OffsetDateTime getWithdrawnAt() {
    return withdrawnAt;
  }

  public void setWithdrawnAt(OffsetDateTime withdrawnAt) {
    this.withdrawnAt = withdrawnAt;
  }
}
