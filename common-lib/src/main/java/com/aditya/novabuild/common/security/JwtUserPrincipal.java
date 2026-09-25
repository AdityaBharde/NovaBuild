package com.aditya.novabuild.common.security;

import org.springframework.security.core.GrantedAuthority;

import java.util.List;

/**
 * Immutable principal representing an authenticated user extracted from a JWT.
 * <p>
 * Used in two contexts:
 * <ul>
 *   <li><b>api-gateway</b>: Created after JWT verification, placed into the
 *       reactive SecurityContext.</li>
 *   <li><b>downstream services</b>: Created from the gateway-forwarded
 *       {@code X-User-Id} and {@code X-Username} headers.</li>
 * </ul>
 */
public record JwtUserPrincipal(
        Long userId,
        String username,
        List<GrantedAuthority> authorities
) {
}
