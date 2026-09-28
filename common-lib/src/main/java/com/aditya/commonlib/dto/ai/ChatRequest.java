package com.aditya.commonlib.dto.ai;

public record ChatRequest(
        String message,
        Long projectId
) {
}
