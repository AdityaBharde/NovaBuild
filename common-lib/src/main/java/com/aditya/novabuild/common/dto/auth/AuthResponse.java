package com.aditya.novabuild.common.dto.auth;

public record AuthResponse(
        String token,
        UserProfileResponse user
) {
}
