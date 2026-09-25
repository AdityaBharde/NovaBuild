package com.aditya.novabuild.dto.auth;

public record AuthResponse(
        String token,
        UserProfileResponse user
) {

}
