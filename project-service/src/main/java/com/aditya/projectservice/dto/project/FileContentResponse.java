package com.aditya.projectservice.dto.project;

public record FileContentResponse(
        String path,
        String content
) {
}