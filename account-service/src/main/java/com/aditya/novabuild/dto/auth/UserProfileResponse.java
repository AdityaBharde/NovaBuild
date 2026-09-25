package com.aditya.novabuild.dto.auth;

public record UserProfileResponse(
        Long id,
        String username,
        String name
) {
}
