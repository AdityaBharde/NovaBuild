package com.aditya.novabuild.common.dto.ai;

public record ChatRequest(
        String message,
        Long projectId
) {
}
