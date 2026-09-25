package com.aditya.novabuild.common.dto.auth;

public record UserProfileResponse(
        Long id,
        String username,
        String name
) {
}
