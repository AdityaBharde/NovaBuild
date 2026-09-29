package com.aditya.commonlib.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiGenerationRequestedEvent implements Serializable {
    private String sessionId;
    private String projectId;
    private String userId;
    private String prompt;
    private LocalDateTime timestamp;
}
