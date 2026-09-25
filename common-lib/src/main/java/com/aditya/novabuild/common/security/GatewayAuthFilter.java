package com.aditya.novabuild.common.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList;

/**
 * Authentication filter for downstream microservices (account-service,
 * intelligent-service) that sit behind the api-gateway.
 * <p>
 * The api-gateway validates the JWT and forwards the authenticated user's
 * identity via HTTP headers:
 * <ul>
 *   <li>{@code X-User-Id} — the user's database ID</li>
 *   <li>{@code X-Username} — the user's email/username</li>
 * </ul>
 * <p>
 * This filter reads those headers and populates the Spring SecurityContext
 * with a {@link JwtUserPrincipal}, allowing downstream code to use
 * {@link SecurityContextUtil#getCurrentUserId()} as before.
 * <p>
 * <b>Security note:</b> This filter trusts the headers unconditionally. In
 * production, you MUST ensure that only the api-gateway can reach downstream
 * services (via network policies, service mesh, or firewall rules). If
 * external clients can bypass the gateway and hit services directly, they
 * could forge these headers.
 * <p>
 * This class is NOT annotated with {@code @Component} — each service
 * registers it explicitly in their {@code SecurityFilterChain} configuration.
 */
public class GatewayAuthFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(GatewayAuthFilter.class);

    public static final String HEADER_USER_ID = "X-User-Id";
    public static final String HEADER_USERNAME = "X-Username";

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String userIdHeader = request.getHeader(HEADER_USER_ID);
        String usernameHeader = request.getHeader(HEADER_USERNAME);

        if (userIdHeader != null && usernameHeader != null) {
            try {
                Long userId = Long.parseLong(userIdHeader);
                JwtUserPrincipal principal = new JwtUserPrincipal(userId, usernameHeader, new ArrayList<>());

                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(principal, null, principal.authorities());

                SecurityContextHolder.getContext().setAuthentication(authentication);
            } catch (NumberFormatException e) {
                log.warn("Invalid X-User-Id header value: {}", userIdHeader);
            }
        }

        filterChain.doFilter(request, response);
    }
}
