package com.aditya.commonlib.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UsageLogEvent {
    private String userId;
    private String projectId;
    private String modelName;
    private Integer promptTokens;
    private Integer completionTokens;
    private Integer totalTokens;
    private LocalDateTime timestamp;
}
