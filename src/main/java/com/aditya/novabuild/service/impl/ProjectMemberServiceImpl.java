package com.aditya.novabuild.service.impl;

import com.aditya.novabuild.dto.member.InviteMemberRequest;
import com.aditya.novabuild.dto.member.MemberResponse;
import com.aditya.novabuild.dto.member.UpdateMemberRoleRequest;
import com.aditya.novabuild.mapper.ProjectMemberMapper;
import com.aditya.novabuild.model.Project;
import com.aditya.novabuild.model.ProjectMember;
import com.aditya.novabuild.model.ProjectMemberId;
import com.aditya.novabuild.model.User;
import com.aditya.novabuild.repository.ProjectMemberRepository;
import com.aditya.novabuild.repository.ProjectRepository;
import com.aditya.novabuild.repository.UserRepository;
import com.aditya.novabuild.service.ProjectMemberService;
import jakarta.transaction.Transactional;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
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

    @Override
    public List<MemberResponse> getProjectMembers(Long projectId, Long userId) {
        Project project = getaccessibleProject(projectId, userId);
        List<MemberResponse> memberResponseList = new ArrayList<>();
        memberResponseList.add(projectMemberMapper.toMemberResponseFromOwner(project.getOwner()));

        memberResponseList.addAll(projectMemberRepository.findByProjectId(userId)
                .stream()
                .map(projectMemberMapper::toMemberResponseFromMember)
                .toList()
        );

        return memberResponseList;
    }

    @Override
    public MemberResponse inviteMember(Long projectId, InviteMemberRequest request, Long userId) {
        Project project = getaccessibleProject(projectId, userId);
        if (!project.getOwner().getId().equals(userId)) {
            throw new IllegalStateException("Only Owner can invite member");
        }
        User user = userRepository.getUserByEmail(request.email()).orElseThrow();

        if (user.getId().equals(userId)) throw new IllegalStateException("Cannot invite self");

        ProjectMemberId projectMemberId = new ProjectMemberId(projectId, user.getId());

        if (projectMemberRepository.existsByProjectId(projectId)) throw new IllegalStateException("User already invited");

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
    public MemberResponse updateMemberRole(Long projectId, Long memberId, UpdateMemberRoleRequest request, Long userId) {
        Project project = getaccessibleProject(projectId, userId);
        if (!project.getOwner().getId().equals(userId)) {
            throw new IllegalStateException("Only Owner can update member role");
        }
        ProjectMemberId projectMemberId = new ProjectMemberId(projectId, memberId);
        ProjectMember projectMember = projectMemberRepository.findById(projectMemberId).orElseThrow();
        projectMember.setRole(request.role());
        projectMemberRepository.save(projectMember);
        return  projectMemberMapper.toMemberResponseFromMember(projectMember);
    }

    @Override
    public void removeProjectMember(Long projectId, Long memberId, Long userId) {
        Project project = getaccessibleProject(projectId, userId);
        if (!project.getOwner().getId().equals(userId)) {
            throw new IllegalStateException("Only Owner can delete member");
        }
        ProjectMemberId projectMemberId = new ProjectMemberId(projectId, memberId);
        if (!projectMemberRepository.existsById(projectMemberId)) throw new IllegalStateException("User already Deleted");
        projectMemberRepository.deleteById(projectMemberId);
    }

    public Project getaccessibleProject(Long id, Long userId) {
        return projectRepository.findAllAccessibleByProjectId(id, userId).orElseThrow();
    }
}
