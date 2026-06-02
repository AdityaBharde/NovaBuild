package com.aditya.novabuild.service.impl;

import com.aditya.novabuild.dto.project.ProjectRequest;
import com.aditya.novabuild.dto.project.ProjectResponse;
import com.aditya.novabuild.dto.project.ProjectSummaryResponse;
import com.aditya.novabuild.mapper.ProjectMapper;
import com.aditya.novabuild.model.Project;
import com.aditya.novabuild.model.User;
import com.aditya.novabuild.repository.ProjectRepository;
import com.aditya.novabuild.repository.UserRepository;
import com.aditya.novabuild.service.ProjectService;
import jakarta.transaction.Transactional;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
@FieldDefaults(makeFinal = true , level = AccessLevel.PRIVATE)
@RequiredArgsConstructor
@Transactional
public class ProjectServiceImpl implements ProjectService {

    ProjectRepository projectRepository;
    UserRepository userRepository;
    ProjectMapper projectMapper;

    @Override
    public ProjectResponse createProject(ProjectRequest projectRequest, Long userId) {
        User owner = userRepository.findById(userId).orElseThrow();
        Project project = Project.builder().
                name(projectRequest.name())
                .owner(owner)
                .isPublic(false)
                .build();
        project=projectRepository.save(project);
        return projectMapper.toProjectResponse(project);
    }
    @Override
    public List<ProjectSummaryResponse> getUserProjects(Long userId) {
        return projectMapper.toProjectSummaryResponseList(projectRepository.findAllAccessibleByUser(userId));
    }

    @Override
    public ProjectResponse getUserProjectById(Long id, Long userId) {
        return projectMapper.toProjectResponse(projectRepository.findAllAccessibleByProjectId(id,userId).orElseThrow());
    }

    @Override
    public ProjectResponse updateProject(Long id, ProjectRequest projectRequest, Long userId) {
        Project project = getaccessibleProject(id,userId);
        project.setName(projectRequest.name());
        project = projectRepository.save(project);
        return projectMapper.toProjectResponse(project);
    }

    @Override
    public void softDelete(Long id, Long userId) {
        Project project = getaccessibleProject(id,userId);
        if(project.getDeletedAt()!=null) throw new IllegalStateException("Project already deleted");
        project.setDeletedAt(Instant.now());
        projectRepository.save(project);
    }
    public Project getaccessibleProject(Long id, Long userId){
        return projectRepository.findAllAccessibleByProjectId(id,userId).orElseThrow();
    }
}
