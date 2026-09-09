package io.promorunner.config;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import io.promorunner.support.AbstractIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.web.servlet.MockMvc;

class SecurityIT extends AbstractIntegrationTest {

  @Autowired private MockMvc mockMvc;

  @Test
  void healthRemainsPublic() throws Exception {
    mockMvc.perform(get("/actuator/health")).andExpect(status().isOk());
  }

  @Test
  void apiRequiresAuthentication() throws Exception {
    mockMvc
        .perform(get("/api/v1/game/session/eligibility").header("X-Tenant-Slug", "demo"))
        .andExpect(status().isUnauthorized());
  }

  @Test
  void unknownTenantIsNotFound() throws Exception {
    mockMvc
        .perform(get("/api/v1/game/session/eligibility").header("X-Tenant-Slug", "missing"))
        .andExpect(status().isNotFound())
        .andExpect(jsonPath("$.error").value("unknown_tenant"));
  }
}
