package com.aditya.accountservice.dto.auth;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SignupRequest(
        @JsonAlias({"username", "email"})
        @Email
        @NotBlank
        String email,

        @Size(min = 1, max = 30)
        String name,

        @Size(min = 4)
        String password
) {
}