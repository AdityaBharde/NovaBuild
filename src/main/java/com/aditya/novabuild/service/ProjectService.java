package com.aditya.novabuild.service;

import com.aditya.novabuild.dto.project.ProjectRequest;
import com.aditya.novabuild.dto.project.ProjectResponse;
import com.aditya.novabuild.dto.project.ProjectSummaryResponse;
import org.springframework.stereotype.Service;

import java.util.List;


public interface ProjectService {
    List<ProjectSummaryResponse> getUserProjects(Long userId);

    ProjectResponse getUserProjectById(Long id, Long userId);

    ProjectResponse createProject(ProjectRequest projectRequest, Long userId);

    ProjectResponse updateProject(Long id, ProjectRequest projectRequest, Long userId);

    void softDelete(Long id, Long userId);
}
