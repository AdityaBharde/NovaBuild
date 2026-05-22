package com.aditya.novabuild.service;


import com.aditya.novabuild.dto.member.InviteMemberRequest;
import com.aditya.novabuild.dto.member.MemberResponse;
import com.aditya.novabuild.model.ProjectMember;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public interface ProjectMemberService {
    List<ProjectMember> getProjectMembers(Long projectId, Long userId);

    MemberResponse inviteMember(Long projectId, InviteMemberRequest request, Long userId);

    MemberResponse updateMemberRole(Long projectId, Long memberId, InviteMemberRequest request, Long userId);

    MemberResponse deleteProjectMember(Long projectId, Long memberId, Long userId);
}
