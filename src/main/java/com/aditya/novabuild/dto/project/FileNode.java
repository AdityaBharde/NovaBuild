package com.aditya.novabuild.dto.project;

import java.time.Instant;

public record FileNode(
        String path,
        Instant lastModified,
        Long size,
        String type
) {
}
