package com.aditya.novabuild.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@Getter
public enum ProjectPermission {
    VIEW("project:view"),
    EDIT("project:edit"),
    DELETE("project:delete"),
    MANAGE_MEMBERS("project_members:manage-members"),
    VIEW_MEMBERS("project_members:view-members");

    private final String permission;

}
