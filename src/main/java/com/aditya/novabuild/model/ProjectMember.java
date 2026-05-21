package com.aditya.novabuild.model;

import com.aditya.novabuild.enums.ProjectRole;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

import java.time.Instant;

@Getter
@Setter
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ProjectMember {
    ProjectMemberId projectMemberId;
    Project project;
    User user;
    ProjectRole role;

    Instant invitedAt;
    Instant acceptedAt;

}
