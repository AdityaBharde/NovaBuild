package com.aditya.novabuild.common.dto.member;

import com.aditya.novabuild.common.enums.ProjectRole;
import jakarta.validation.constraints.NotNull;

public record UpdateMemberRoleRequest(
        @NotNull ProjectRole role
) {
}
