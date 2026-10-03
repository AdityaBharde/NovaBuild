package com.aditya.accountservice.dto.auth;

public record AuthResponse(
        String token,
        UserProfileResponse user
) {

}