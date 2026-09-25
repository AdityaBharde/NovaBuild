package com.aditya.novabuild.model;

import com.aditya.novabuild.enums.ProjectRole;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.Instant;

@Getter
@Setter
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "project_members")
@Builder
public class ProjectMember {

    @EmbeddedId
    ProjectMemberId projectMemberId;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("projectId")
    Project project;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("userId")
    User user;

    ProjectRole role;

    Instant invitedAt;
    Instant acceptedAt;

}
