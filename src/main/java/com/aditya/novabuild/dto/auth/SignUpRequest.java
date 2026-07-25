package com.aditya.novabuild.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SignUpRequest(
        @Size(min=4,max = 30) String name,
        @NotBlank @Email String username,
        @NotBlank @Size(min = 4) String password
) {
}
