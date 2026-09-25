package com.aditya.novabuild.common.security;

import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * Static utility for extracting the authenticated user from the Spring
 * SecurityContext. Works regardless of how the principal was set — whether
 * by a JWT filter (account-service) or a gateway-header filter (downstream
 * services).
 * <p>
 * This is intentionally a static utility (not a Spring bean) so it can be
 * used without injection in any layer — services, mappers, or filters.
 */
public final class SecurityContextUtil {

    private SecurityContextUtil() {
        // Utility class — prevent instantiation
    }

    /**
     * Extracts the current authenticated user's ID from the SecurityContext.
     *
     * @return the user ID
     * @throws AuthenticationCredentialsNotFoundException if no valid
     *         authentication is present
     */
    public static Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof JwtUserPrincipal principal)) {
            throw new AuthenticationCredentialsNotFoundException("No authenticated user found in SecurityContext");
        }
        return principal.userId();
    }

    /**
     * Extracts the current authenticated user's username from the SecurityContext.
     *
     * @return the username
     * @throws AuthenticationCredentialsNotFoundException if no valid
     *         authentication is present
     */
    public static String getCurrentUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof JwtUserPrincipal principal)) {
            throw new AuthenticationCredentialsNotFoundException("No authenticated user found in SecurityContext");
        }
        return principal.username();
    }
}
