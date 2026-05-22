package com.aditya.novabuild.dto.auth;

public record UserProfileResponse(
        Long id,
        String email,
        String username,
        String avatarUrl
) {
}
