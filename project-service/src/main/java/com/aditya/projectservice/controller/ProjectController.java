package com.aditya.projectservice.controller;

import com.aditya.projectservice.dto.ProjectCreateRequest;
import com.aditya.projectservice.dto.ProjectVersionRequest;
import com.aditya.projectservice.entity.Project;
import com.aditya.projectservice.entity.ProjectVersion;
import com.aditya.projectservice.service.ProjectService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;

    // 1. Create a new project
    @PostMapping
    public ResponseEntity<Project> createProject(@Valid @RequestBody ProjectCreateRequest request) {
        Long userId = SecurityContextUtil.getCurrentUserId();
        Project createdProject = projectService.createProject(userId, request);
        return new ResponseEntity<>(createdProject, HttpStatus.CREATED);
    }

    // 2. Get all projects for the logged-in user
    @GetMapping
    public ResponseEntity<List<Project>> getUserProjects() {
        Long userId = SecurityContextUtil.getCurrentUserId();
        return ResponseEntity.ok(projectService.getProjectsByUser(userId));
    }

    // 3. Save a newly generated file tree from the AI
    @PostMapping("/{projectId}/versions")
    public ResponseEntity<ProjectVersion> saveVersion(
            @PathVariable Long projectId,
            @Valid @RequestBody ProjectVersionRequest request) {
        Long userId = SecurityContextUtil.getCurrentUserId();
        if (!projectService.getProjectsByUser(userId).stream().anyMatch(p -> p.getId().equals(projectId))) {
            return new ResponseEntity<>(HttpStatus.FORBIDDEN);
        }
        ProjectVersion version = projectService.saveProjectVersion(projectId, request);
        return new ResponseEntity<>(version, HttpStatus.CREATED);
    }

    // 4. Get the latest version of a project
    @GetMapping("/{projectId}/versions/latest")
    public ResponseEntity<ProjectVersion> getLatestVersion(@PathVariable Long projectId) {
        return ResponseEntity.ok(projectService.getLatestVersion(projectId));
    }

    // 5. Get version history (Undo feature)
    @GetMapping("/{projectId}/versions")
    public ResponseEntity<List<ProjectVersion>> getVersionHistory(@PathVariable Long projectId) {
        return ResponseEntity.ok(projectService.getProjectVersions(projectId));
    }
}