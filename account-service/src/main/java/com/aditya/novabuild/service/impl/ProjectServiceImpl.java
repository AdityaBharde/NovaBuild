package com.aditya.novabuild.service.impl;

import com.aditya.novabuild.dto.project.ProjectRequest;
import com.aditya.novabuild.dto.project.ProjectResponse;
import com.aditya.novabuild.dto.project.ProjectSummaryResponse;
import com.aditya.novabuild.enums.ProjectRole;
import com.aditya.novabuild.exception.BadRequestException;
import com.aditya.novabuild.exception.ResourceNotFoundException;
import com.aditya.novabuild.mapper.ProjectMapper;
import com.aditya.novabuild.model.Project;
import com.aditya.novabuild.model.ProjectMember;
import com.aditya.novabuild.model.ProjectMemberId;
import com.aditya.novabuild.model.User;
import com.aditya.novabuild.repository.ProjectMemberRepository;
import com.aditya.novabuild.repository.ProjectRepository;
import com.aditya.novabuild.repository.UserRepository;
import com.aditya.novabuild.security.AuthUtil;
import com.aditya.novabuild.service.ProjectService;
import jakarta.transaction.Transactional;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Transactional
public class ProjectServiceImpl implements ProjectService {

    ProjectRepository projectRepository;
    UserRepository userRepository;
    ProjectMapper projectMapper;
    ProjectMemberRepository projectMemberRepository;
    AuthUtil authUtil;

    @Override
    public ProjectResponse createProject(ProjectRequest projectRequest) {

        User owner = userRepository.findById(authUtil.getCurrentUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Project project = Project.builder()
                .name(projectRequest.name())
                .isPublic(false)
                .build();

        project = projectRepository.save(project);

        Instant now = Instant.now();

        ProjectMember projectMember = ProjectMember.builder()
                .projectMemberId(new ProjectMemberId(project.getId(), owner.getId()))
                .project(project)
                .user(owner)
                .role(ProjectRole.OWNER)
                .invitedAt(now)
                .acceptedAt(now)
                .build();

        projectMemberRepository.save(projectMember);

        return projectMapper.toProjectResponse(project);
    }

    @Override
    public List<ProjectSummaryResponse> getUserProjects() {
        Long userId = authUtil.getCurrentUserId();

        return projectMapper.toProjectSummaryResponseList(
                projectRepository.findAllAccessibleByUser(userId)
        );
    }

    @Override
    @PreAuthorize("@security.canViewProject(#projectId)")
    public ProjectResponse getUserProjectById(Long projectId) {

        Long userId = authUtil.getCurrentUserId();
        Project project = getAccessibleProject(projectId, userId);

        return projectMapper.toProjectResponse(project);
    }

    @Override
    @PreAuthorize("@security.canEditProject(#id)")
    public ProjectResponse updateProject(Long id, ProjectRequest projectRequest) {

        Long userId = authUtil.getCurrentUserId();
        Project project = getAccessibleProject(id, userId);

        project.setName(projectRequest.name());
        project = projectRepository.save(project);

        return projectMapper.toProjectResponse(project);
    }

    @Override
    public void softDelete(Long id) {

        Long userId = authUtil.getCurrentUserId();
        Project project = getAccessibleProject(id, userId);

        if (project.getDeletedAt() != null) {
            throw new BadRequestException("Project already deleted");
        }

        project.setDeletedAt(Instant.now());
        projectRepository.save(project);
    }

    private Project getAccessibleProject(Long projectId, Long userId) {
        return projectRepository.findAccessibleByProjectId(projectId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
    }
}