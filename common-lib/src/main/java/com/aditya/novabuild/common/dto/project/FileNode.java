package com.aditya.novabuild.common.dto.project;

import java.time.Instant;

public record FileNode(
        String path,
        Instant lastModified,
        Long size,
        String type
) {
}
