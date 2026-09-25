package com.aditya.novabuild.common.dto.project;

import java.time.Instant;

public record ProjectSummaryResponse(
        Long id,
        String name,
        Instant createdAt
) {
}
