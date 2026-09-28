package com.aditya.projectservice.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ProjectVersionRequest {
    private String promptUsed;

    @NotBlank(message = "File tree JSON cannot be empty")
    private String fileTreeJson;
}