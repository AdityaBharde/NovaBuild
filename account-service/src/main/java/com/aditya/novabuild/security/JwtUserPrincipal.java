package com.aditya.novabuild.security;

import org.springframework.security.core.GrantedAuthority;

import java.util.List;

public record JwtUserPrincipal(
        Long UserId,
        String username,
        List<GrantedAuthority> authorities
) {

}
