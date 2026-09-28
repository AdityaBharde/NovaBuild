package com.aditya.commonlib.security;

import org.springframework.security.core.GrantedAuthority;

import java.util.List;


public record JwtUserPrincipal(
        Long userId,
        String username,
        List<GrantedAuthority> authorities
) {
}
