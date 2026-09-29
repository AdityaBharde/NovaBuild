package com.aditya.intelligentservice.dto;


import com.aditya.commonlib.enums.MessageRole;
import java.time.Instant;
import java.util.List;

public record ChatResponse(
        Long id,
        MessageRole role,
        List<ChatEventResponse> events,
        String content,
        Integer tokensUsed,
        Instant createdAt

) {
}