package com.aditya.projectservice.service;



import com.aditya.projectservice.dto.member.InviteMemberRequest;
import com.aditya.projectservice.dto.member.MemberResponse;
import com.aditya.projectservice.dto.member.UpdateMemberRoleRequest;

import java.util.List;

public interface ProjectMemberService {
    List<MemberResponse> getProjectMembers(Long projectId);

    MemberResponse inviteMember(Long projectId, InviteMemberRequest request);

    MemberResponse updateMemberRole(Long projectId, Long memberId, UpdateMemberRoleRequest request);

    void removeProjectMember(Long projectId, Long memberId);
}