package com.aditya.novabuild.dto.member;


import com.aditya.novabuild.enums.ProjectRole;

public record InviteMemberRequest(
        String email,
        ProjectRole role
) {
}
