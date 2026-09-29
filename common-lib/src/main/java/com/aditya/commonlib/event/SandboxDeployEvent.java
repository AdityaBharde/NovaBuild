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
public class SandboxDeployEvent implements Serializable {
    private String projectId;
    private String userId;
    private String action; // START, RESTART, STOP
    private LocalDateTime timestamp;
}
