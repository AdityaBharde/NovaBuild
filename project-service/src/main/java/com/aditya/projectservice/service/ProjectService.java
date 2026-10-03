package com.aditya.projectservice.service;



import com.aditya.commonlib.enums.ProjectPermission;
import com.aditya.projectservice.dto.project.ProjectRequest;
import com.aditya.projectservice.dto.project.ProjectResponse;
import com.aditya.projectservice.dto.project.ProjectSummaryResponse;

import java.util.List;

public interface ProjectService {
    List<ProjectSummaryResponse> getUserProjects();

    ProjectSummaryResponse getUserProjectById(Long id);

    ProjectResponse createProject(ProjectRequest request);

    ProjectResponse updateProject(Long id, ProjectRequest request);

    void softDelete(Long id);

    boolean hasPermission(Long projectId, ProjectPermission permission);
}