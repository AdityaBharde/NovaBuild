package com.aditya.novabuild.security;

import com.aditya.novabuild.model.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import javax.crypto.SecretKey;
import java.util.ArrayList;
import java.util.Date;

@Component
public class AuthUtil {

    @Value("${jwt.secret}")
    private String secret;

    public SecretKey getSecretKey() {
        return Keys.hmacShaKeyFor(secret.getBytes());
    }

    public String generateAccessToken(User user) {
        return Jwts.builder()
                .subject(user.getUsername())
                .signWith(getSecretKey())
                .claim("userId" ,user.getId().toString())
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis()+ (1000*60*10)))
                .compact();
    }

    public JwtUserPrincipal verifyAccessToken(String token){
        Claims claims = Jwts.parser()
                .verifyWith(getSecretKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
        Long userId = Long.parseLong(claims.get("userId", String.class));
        String username = claims.getSubject();
        return new JwtUserPrincipal(userId,username,new ArrayList<>());
    }
    public Long getCurrentUserId(){
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication== null || !(authentication.getPrincipal() instanceof JwtUserPrincipal user)){
            throw  new AuthenticationCredentialsNotFoundException("No JWT Found");
        }
        return user.UserId();
    }

}
