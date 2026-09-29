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
public class ProjectFileChangedEvent implements Serializable {
    private String projectId;
    private String filePath;
    private String changeType; // CREATED, UPDATED, DELETED
    private String content;
    private String modifiedByUserId;
    private LocalDateTime timestamp;
}
