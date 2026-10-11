package com.aditya.account_service.dto.auth;

public record UserProfileResponse(
        Long id,
        String username,
        String name
) {
}
