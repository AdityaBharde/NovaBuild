package com.aditya.commonlib.dto.auth;

public record AuthResponse(
        String token,
        UserProfileResponse user
) {
}
