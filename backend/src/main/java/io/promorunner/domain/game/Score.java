package io.promorunner.domain.game;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.UUID;
import org.hibernate.annotations.TenantId;

@Entity
@Table(name = "scores")
public class Score {

  @Id private UUID id;

  @TenantId
  @Column(name = "tenant_id", nullable = false)
  private UUID tenantId;

  @Column(name = "user_id", nullable = false)
  private UUID userId;

  @Column(name = "best_score", nullable = false)
  private int bestScore;

  @Column(name = "total_plays", nullable = false)
  private int totalPlays;

  @Column(name = "last_played_at")
  private OffsetDateTime lastPlayedAt;

  @Column(name = "rank")
  private Integer rank;

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

  public int getBestScore() {
    return bestScore;
  }

  public void setBestScore(int bestScore) {
    this.bestScore = bestScore;
  }

  public int getTotalPlays() {
    return totalPlays;
  }

  public void setTotalPlays(int totalPlays) {
    this.totalPlays = totalPlays;
  }

  public OffsetDateTime getLastPlayedAt() {
    return lastPlayedAt;
  }

  public void setLastPlayedAt(OffsetDateTime lastPlayedAt) {
    this.lastPlayedAt = lastPlayedAt;
  }

  public Integer getRank() {
    return rank;
  }

  public void setRank(Integer rank) {
    this.rank = rank;
  }
}
