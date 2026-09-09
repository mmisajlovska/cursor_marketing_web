package io.promorunner.tenancy;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.util.UUID;
import javax.sql.DataSource;
import org.springframework.jdbc.datasource.DelegatingDataSource;

/**
 * Sets PostgreSQL {@code app.tenant_id} on every borrowed connection so RLS policies apply.
 * Session-level {@code set_config(..., false)} is used because connections are pooled; the value is
 * cleared before the connection is returned.
 */
public class TenantAwareDataSource extends DelegatingDataSource {

  public TenantAwareDataSource(DataSource targetDataSource) {
    super(targetDataSource);
  }

  @Override
  public Connection getConnection() throws SQLException {
    return bind(super.getConnection());
  }

  @Override
  public Connection getConnection(String username, String password) throws SQLException {
    return bind(super.getConnection(username, password));
  }

  private Connection bind(Connection connection) throws SQLException {
    applyTenant(connection, TenantContext.getTenantId());
    return new TenantAwareConnection(connection);
  }

  static void applyTenant(Connection connection, UUID tenantId) throws SQLException {
    try (PreparedStatement statement =
        connection.prepareStatement("SELECT set_config('app.tenant_id', ?, false)")) {
      statement.setString(1, tenantId == null ? "" : tenantId.toString());
      statement.execute();
    }
  }

  private static final class TenantAwareConnection extends DelegatingConnection {

    private TenantAwareConnection(Connection delegate) {
      super(delegate);
    }

    @Override
    public void close() throws SQLException {
      try {
        applyTenant(getDelegate(), null);
      } finally {
        super.close();
      }
    }
  }
}
