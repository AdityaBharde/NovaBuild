package com.aditya.commonlib.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiGenerationCompletedEvent {
    private String sessionId;
    private String projectId;
    private String userId;
    private String status;
    private String responseText;
    private Map<String, String> updatedFiles;
    private Integer promptTokens;
    private Integer completionTokens;
    private LocalDateTime timestamp;
}
