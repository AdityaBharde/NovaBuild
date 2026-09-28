package com.aditya.commonlib.security;

import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;


public final class SecurityContextUtil {

    private SecurityContextUtil() {
        // Utility class — prevent instantiation
    }

    public static Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof JwtUserPrincipal principal)) {
            throw new AuthenticationCredentialsNotFoundException("No authenticated user found in SecurityContext");
        }
        return principal.userId();
    }


    public static String getCurrentUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof JwtUserPrincipal principal)) {
            throw new AuthenticationCredentialsNotFoundException("No authenticated user found in SecurityContext");
        }
        return principal.username();
    }
}
