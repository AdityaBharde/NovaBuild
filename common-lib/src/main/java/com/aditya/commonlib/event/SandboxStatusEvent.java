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
public class SandboxStatusEvent implements Serializable {
    private String projectId;
    private String containerId;
    private String status; // STARTING, RUNNING, STOPPED, ERROR
    private String previewUrl;
    private int exposedPort;
    private String errorMessage;
    private LocalDateTime timestamp;
}
