package com.aditya.commonlib.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiGenerationCompletedEvent implements Serializable {
    private String sessionId;
    private String projectId;
    private String userId;
    private String status; // SUCCESS, FAILED
    private String responseText;
    private Map<String, String> updatedFiles; // relative path -> file content
    private int promptTokens;
    private int completionTokens;
    private LocalDateTime timestamp;
}
