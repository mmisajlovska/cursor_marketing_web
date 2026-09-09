package io.promorunner.domain.tenant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.TenantId;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "tenant_brand_config")
public class TenantBrandConfig {

  @Id private UUID id;

  @TenantId
  @Column(name = "tenant_id", nullable = false)
  private UUID tenantId;

  @Column(name = "logo_url")
  private String logoUrl;

  @Column(name = "primary_color", nullable = false, length = 7)
  private String primaryColor;

  @Column(name = "secondary_color", nullable = false, length = 7)
  private String secondaryColor;

  @Column(name = "background_color", nullable = false, length = 7)
  private String backgroundColor;

  @Column(name = "game_title", nullable = false, length = 120)
  private String gameTitle;

  @Column(name = "consent_label_text", nullable = false)
  private String consentLabelText;

  @Column(name = "character_sprite_url")
  private String characterSpriteUrl;

  @JdbcTypeCode(SqlTypes.JSON)
  @Column(name = "obstacle_sprite_urls")
  private List<String> obstacleSpriteUrls;

  @Column(name = "background_sprite_url")
  private String backgroundSpriteUrl;

  @Column(name = "plays_before_gate", nullable = false)
  private int playsBeforeGate;

  @Column(name = "updated_at", nullable = false)
  private OffsetDateTime updatedAt;

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

  public String getLogoUrl() {
    return logoUrl;
  }

  public void setLogoUrl(String logoUrl) {
    this.logoUrl = logoUrl;
  }

  public String getPrimaryColor() {
    return primaryColor;
  }

  public void setPrimaryColor(String primaryColor) {
    this.primaryColor = primaryColor;
  }

  public String getSecondaryColor() {
    return secondaryColor;
  }

  public void setSecondaryColor(String secondaryColor) {
    this.secondaryColor = secondaryColor;
  }

  public String getBackgroundColor() {
    return backgroundColor;
  }

  public void setBackgroundColor(String backgroundColor) {
    this.backgroundColor = backgroundColor;
  }

  public String getGameTitle() {
    return gameTitle;
  }

  public void setGameTitle(String gameTitle) {
    this.gameTitle = gameTitle;
  }

  public String getConsentLabelText() {
    return consentLabelText;
  }

  public void setConsentLabelText(String consentLabelText) {
    this.consentLabelText = consentLabelText;
  }

  public String getCharacterSpriteUrl() {
    return characterSpriteUrl;
  }

  public void setCharacterSpriteUrl(String characterSpriteUrl) {
    this.characterSpriteUrl = characterSpriteUrl;
  }

  public List<String> getObstacleSpriteUrls() {
    return obstacleSpriteUrls;
  }

  public void setObstacleSpriteUrls(List<String> obstacleSpriteUrls) {
    this.obstacleSpriteUrls = obstacleSpriteUrls;
  }

  public String getBackgroundSpriteUrl() {
    return backgroundSpriteUrl;
  }

  public void setBackgroundSpriteUrl(String backgroundSpriteUrl) {
    this.backgroundSpriteUrl = backgroundSpriteUrl;
  }

  public int getPlaysBeforeGate() {
    return playsBeforeGate;
  }

  public void setPlaysBeforeGate(int playsBeforeGate) {
    this.playsBeforeGate = playsBeforeGate;
  }

  public OffsetDateTime getUpdatedAt() {
    return updatedAt;
  }

  public void setUpdatedAt(OffsetDateTime updatedAt) {
    this.updatedAt = updatedAt;
  }
}
