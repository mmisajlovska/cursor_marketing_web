package io.promorunner.tenancy;

import io.promorunner.config.AppProperties;
import io.promorunner.domain.tenant.Tenant;
import io.promorunner.domain.tenant.TenantRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Locale;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 20)
public class TenantResolutionFilter extends OncePerRequestFilter {

  private static final Logger log = LoggerFactory.getLogger(TenantResolutionFilter.class);

  private final TenantRepository tenantRepository;
  private final AppProperties appProperties;

  public TenantResolutionFilter(TenantRepository tenantRepository, AppProperties appProperties) {
    this.tenantRepository = tenantRepository;
    this.appProperties = appProperties;
  }

  @Override
  protected boolean shouldNotFilter(HttpServletRequest request) {
    String path = request.getRequestURI();
    return path.startsWith("/actuator") || path.startsWith("/error");
  }

  @Override
  protected void doFilterInternal(
      HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
      throws ServletException, IOException {
    try {
      Optional<String> slug = resolveSlug(request);
      if (slug.isEmpty()) {
        writeUnknownTenant(response, "");
        return;
      }
      Optional<Tenant> tenant =
          tenantRepository.findBySlugIgnoreCaseAndActiveTrue(slug.get().toLowerCase(Locale.ROOT));
      if (tenant.isEmpty()) {
        writeUnknownTenant(response, slug.get());
        return;
      }
      Tenant resolved = tenant.get();
      TenantContext.set(resolved.getId(), resolved.getSlug());
      filterChain.doFilter(request, response);
    } finally {
      TenantContext.clear();
    }
  }

  Optional<String> resolveSlug(HttpServletRequest request) {
    AppProperties.Tenancy tenancy = appProperties.getTenancy();
    String header = request.getHeader(tenancy.getHeaderName());
    if (header != null && !header.isBlank()) {
      return Optional.of(header.trim().toLowerCase(Locale.ROOT));
    }
    Optional<String> fromHost = slugFromHost(request.getHeader("Host"));
    if (fromHost.isPresent()) {
      return fromHost;
    }
    if (tenancy.isAllowDevDefaultSlug()
        && tenancy.getDevDefaultSlug() != null
        && !tenancy.getDevDefaultSlug().isBlank()) {
      return Optional.of(tenancy.getDevDefaultSlug().toLowerCase(Locale.ROOT));
    }
    return Optional.empty();
  }

  static Optional<String> slugFromHost(String hostHeader) {
    if (hostHeader == null || hostHeader.isBlank()) {
      return Optional.empty();
    }
    String host = hostHeader.trim().toLowerCase(Locale.ROOT);
    int colon = host.indexOf(':');
    if (colon >= 0) {
      host = host.substring(0, colon);
    }
    if ("localhost".equals(host) || "127.0.0.1".equals(host)) {
      return Optional.empty();
    }
    String[] parts = host.split("\\.");
    if (parts.length >= 3) {
      return Optional.of(parts[0]);
    }
    if (parts.length == 2 && "localhost".equals(parts[1])) {
      return Optional.of(parts[0]);
    }
    return Optional.empty();
  }

  private static void writeUnknownTenant(HttpServletResponse response, String slug)
      throws IOException {
    log.debug("Unknown or missing tenant slug '{}'", slug);
    response.setStatus(HttpServletResponse.SC_NOT_FOUND);
    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
    response
        .getWriter()
        .write("{\"error\":\"unknown_tenant\",\"slug\":\"%s\"}".formatted(escape(slug)));
  }

  private static String escape(String value) {
    return value.replace("\\", "\\\\").replace("\"", "\\\"");
  }
}
