package com.aditya.novabuild.dto.auth;

public record SignUpRequest(
        String name,
        String email,
        String password
) {
}
