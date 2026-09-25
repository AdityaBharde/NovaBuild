package com.aditya.novabuild.common.dto.member;

import com.aditya.novabuild.common.enums.ProjectRole;

import java.time.Instant;

public record MemberResponse(
        Long userId,
        String username,
        String name,
        ProjectRole projectRole,
        Instant invitedAt
) {
}
