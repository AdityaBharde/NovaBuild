package com.aditya.novabuild.service;


import com.aditya.novabuild.dto.member.InviteMemberRequest;
import com.aditya.novabuild.dto.member.MemberResponse;
import com.aditya.novabuild.dto.member.UpdateMemberRoleRequest;

import java.util.List;


public interface ProjectMemberService {
    List<MemberResponse> getProjectMembers(Long projectId);

    MemberResponse inviteMember(Long projectId, InviteMemberRequest request, Long userId);

    MemberResponse updateMemberRole(Long projectId, Long memberId, UpdateMemberRoleRequest request, Long userId);

    void removeProjectMember(Long projectId, Long memberId, Long userId);
}
