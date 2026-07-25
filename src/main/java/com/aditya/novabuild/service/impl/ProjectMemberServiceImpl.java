package com.aditya.novabuild.service.impl;

import com.aditya.novabuild.dto.member.InviteMemberRequest;
import com.aditya.novabuild.dto.member.MemberResponse;
import com.aditya.novabuild.dto.member.UpdateMemberRoleRequest;
import com.aditya.novabuild.exception.BadRequestException;
import com.aditya.novabuild.exception.ResourceNotFoundException;
import com.aditya.novabuild.mapper.ProjectMemberMapper;
import com.aditya.novabuild.model.Project;
import com.aditya.novabuild.model.ProjectMember;
import com.aditya.novabuild.model.ProjectMemberId;
import com.aditya.novabuild.model.User;
import com.aditya.novabuild.repository.ProjectMemberRepository;
import com.aditya.novabuild.repository.ProjectRepository;
import com.aditya.novabuild.repository.UserRepository;
import com.aditya.novabuild.security.AuthUtil;
import com.aditya.novabuild.service.ProjectMemberService;
import jakarta.transaction.Transactional;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
@RequiredArgsConstructor
@Transactional
public class ProjectMemberServiceImpl implements ProjectMemberService {

    ProjectMemberRepository projectMemberRepository;
    ProjectRepository projectRepository;
    ProjectMemberMapper projectMemberMapper;
    UserRepository userRepository;
    AuthUtil authUtil;

    @Override
    @PreAuthorize("@security.canViewProject(#projectId)")
    public List<MemberResponse> getProjectMembers(Long projectId) {
        Long userId = authUtil.getCurrentUserId();
        Project project = getAccessibleProject(projectId, userId);

        return projectMemberRepository.findByProjectId(projectId)
                .stream()
                .map(projectMemberMapper::toMemberResponseFromMember)
                .toList();
    }

    @Override
    @PreAuthorize("@security.canManageMembers(#projectId)")
    public MemberResponse inviteMember(Long projectId, InviteMemberRequest request, Long userId) {
        Project project = getAccessibleProject(projectId, userId);

        User user = userRepository.getUserByUsername(request.username())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + request.username()));

        if (user.getId().equals(userId)) throw new BadRequestException("Cannot invite self");

        ProjectMemberId projectMemberId = new ProjectMemberId(projectId, user.getId());

        if (projectMemberRepository.existsById(projectMemberId)) throw new BadRequestException("User already invited");

        ProjectMember member = ProjectMember.builder()
                .projectMemberId(projectMemberId)
                .project(project)
                .user(user)
                .role(request.role())
                .invitedAt(Instant.now())
                .build();
        projectMemberRepository.save(member);
        return projectMemberMapper.toMemberResponseFromMember(member);
    }

    @Override
    @PreAuthorize("@security.canManageMembers(#projectId)")
    public MemberResponse updateMemberRole(Long projectId, Long memberId, UpdateMemberRoleRequest request, Long userId) {
        Project project = getAccessibleProject(projectId, userId);

        ProjectMemberId projectMemberId = new ProjectMemberId(projectId, memberId);
        ProjectMember projectMember = projectMemberRepository.findById(projectMemberId)
                .orElseThrow(() -> new ResourceNotFoundException("Project member not found"));
        projectMember.setRole(request.role());
        projectMemberRepository.save(projectMember);
        return  projectMemberMapper.toMemberResponseFromMember(projectMember);
    }

    @Override
    @PreAuthorize("@security.canManageMembers(#projectId)")
    public void removeProjectMember(Long projectId, Long memberId, Long userId) {
        Project project = getAccessibleProject(projectId, userId);

        ProjectMemberId projectMemberId = new ProjectMemberId(projectId, memberId);
        if (!projectMemberRepository.existsById(projectMemberId)) throw new ResourceNotFoundException("Project member not found");
        projectMemberRepository.deleteById(projectMemberId);
    }

    private Project getAccessibleProject(Long projectId, Long userId) {
        return projectRepository.findAccessibleByProjectId(projectId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
    }
}
