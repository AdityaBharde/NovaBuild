package com.aditya.accountservice.dto.auth;

public record UserProfileResponse(
        Long id,
        String username,
        String name
) {
}