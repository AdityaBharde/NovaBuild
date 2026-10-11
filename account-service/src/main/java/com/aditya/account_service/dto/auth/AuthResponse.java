package com.aditya.account_service.dto.auth;

public record AuthResponse(
        String token,
        UserProfileResponse user
) {

}
