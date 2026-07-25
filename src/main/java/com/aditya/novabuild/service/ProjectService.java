package com.aditya.novabuild.service;

import com.aditya.novabuild.dto.project.ProjectRequest;
import com.aditya.novabuild.dto.project.ProjectResponse;
import com.aditya.novabuild.dto.project.ProjectSummaryResponse;
import org.springframework.stereotype.Service;

import java.util.List;


public interface ProjectService {
    List<ProjectSummaryResponse> getUserProjects();

    ProjectResponse getUserProjectById(Long id);

    ProjectResponse createProject(ProjectRequest projectRequest);

    ProjectResponse updateProject(Long id, ProjectRequest projectRequest);

    void softDelete(Long id);
}
