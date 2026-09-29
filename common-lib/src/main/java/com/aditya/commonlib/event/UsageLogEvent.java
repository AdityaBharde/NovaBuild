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
public class UsageLogEvent implements Serializable {
    private String userId;
    private String projectId;
    private String modelName;
    private int promptTokens;
    private int completionTokens;
    private int totalTokens;
    private LocalDateTime timestamp;
}
