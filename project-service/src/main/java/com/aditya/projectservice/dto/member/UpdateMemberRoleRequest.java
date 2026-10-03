package com.aditya.projectservice.dto.member;

import com.aditya.commonlib.enums.ProjectRole;
import jakarta.validation.constraints.NotNull;

public record UpdateMemberRoleRequest(
        @NotNull ProjectRole role) {
}