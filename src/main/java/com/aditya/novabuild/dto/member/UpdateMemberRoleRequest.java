package com.aditya.novabuild.dto.member;


import com.aditya.novabuild.enums.ProjectRole;
import jakarta.validation.constraints.NotNull;

public record UpdateMemberRoleRequest(
        @NotNull ProjectRole role) {
}
