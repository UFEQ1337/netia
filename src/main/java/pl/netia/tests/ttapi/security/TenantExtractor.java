package pl.netia.tests.ttapi.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;

@Component
public class TenantExtractor {

    private final String tenantClaim;

    public TenantExtractor(@Value("${app.security.tenant-claim}") String tenantClaim) {
        this.tenantClaim = tenantClaim;
    }

    public String extractTenantId(Authentication authentication) {
        if (!(authentication instanceof JwtAuthenticationToken jwtToken)) {
            throw new AccessDeniedException("Wymagany token JWT");
        }
        Object tenantId = jwtToken.getToken().getClaims().get(tenantClaim);
        if (tenantId == null) {
            throw new AccessDeniedException("Token JWT nie zawiera wymaganego claimu: " + tenantClaim);
        }
        return tenantId.toString();
    }
}
