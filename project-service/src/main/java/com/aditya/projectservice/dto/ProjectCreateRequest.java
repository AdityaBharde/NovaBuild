package com.aditya.projectservice.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ProjectCreateRequest {
    @NotBlank(message = "Project name cannot be empty")
    private String name;
    private String description;
}