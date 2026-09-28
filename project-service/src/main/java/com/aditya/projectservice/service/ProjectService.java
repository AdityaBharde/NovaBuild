package com.aditya.projectservice.service;

import com.aditya.projectservice.dto.ProjectCreateRequest;
import com.aditya.projectservice.dto.ProjectVersionRequest;
import com.aditya.projectservice.entity.Project;
import com.aditya.projectservice.entity.ProjectVersion;

import java.util.List;

public interface ProjectService {
    Project createProject(Long userId, ProjectCreateRequest request);
    List<Project> getProjectsByUser(Long userId);
    ProjectVersion saveProjectVersion(Long projectId, ProjectVersionRequest request);
    List<ProjectVersion> getProjectVersions(Long projectId);
    ProjectVersion getLatestVersion(Long projectId);
}