package com.aditya.projectservice.service.impl;

import com.aditya.projectservice.dto.ProjectCreateRequest;
import com.aditya.projectservice.dto.ProjectVersionRequest;
import com.aditya.projectservice.entity.Project;
import com.aditya.projectservice.entity.ProjectVersion;
import com.aditya.projectservice.repository.ProjectRepository;
import com.aditya.projectservice.repository.ProjectVersionRepository;
import com.aditya.projectservice.service.ProjectService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProjectServiceImpl implements ProjectService {

    private final ProjectRepository projectRepository;
    private final ProjectVersionRepository versionRepository;

    @Override
    public Project createProject(Long userId, ProjectCreateRequest request) {
        Project project = Project.builder()
                .userId(userId)
                .name(request.getName())
                .description(request.getDescription())
                .build();
        return projectRepository.save(project);
    }

    @Override
    public List<Project> getProjectsByUser(Long userId) {
        return projectRepository.findByUserId(userId);
    }

    @Override
    @Transactional
    public ProjectVersion saveProjectVersion(Long projectId, ProjectVersionRequest request) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found with ID: " + projectId));

        List<ProjectVersion> existingVersions = versionRepository.findByProjectIdOrderByVersionNumberDesc(projectId);
        int nextVersionNumber = existingVersions.isEmpty() ? 1 : existingVersions.get(0).getVersionNumber() + 1;

        ProjectVersion newVersion = ProjectVersion.builder()
                .project(project)
                .versionNumber(nextVersionNumber)
                .promptUsed(request.getPromptUsed())
                .fileTreeJson(request.getFileTreeJson())
                .build();

        return versionRepository.save(newVersion);
    }

    @Override
    public List<ProjectVersion> getProjectVersions(Long projectId) {
        return versionRepository.findByProjectIdOrderByVersionNumberDesc(projectId);
    }

    @Override
    public ProjectVersion getLatestVersion(Long projectId) {
        return versionRepository.findByProjectIdOrderByVersionNumberDesc(projectId)
                .stream()
                .findFirst()
                .orElseThrow(() -> new RuntimeException("No versions found for project: " + projectId));
    }
}