package com.aditya.novabuild.dto.auth;

public record LoginRequest(
    String username,
    String password
) {
}
