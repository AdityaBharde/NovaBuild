package com.aditya.novabuild.common.dto.ai;

import com.aditya.novabuild.common.enums.ChatEventType;

public record ChatEventResponse(
        Long id,
        ChatEventType type,
        Integer sequenceOrder,
        String content,
        String filePath,
        String metadata
) {
}
