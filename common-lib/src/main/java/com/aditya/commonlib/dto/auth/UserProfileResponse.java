package com.aditya.commonlib.dto.auth;

public record UserProfileResponse(
        Long id,
        String username,
        String name
) {
}
