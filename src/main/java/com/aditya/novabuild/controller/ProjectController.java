package com.aditya.novabuild.controller;


import com.aditya.novabuild.dto.project.ProjectRequest;
import com.aditya.novabuild.dto.project.ProjectResponse;
import com.aditya.novabuild.dto.project.ProjectSummaryResponse;
import com.aditya.novabuild.security.AuthUtil;
import com.aditya.novabuild.service.ProjectService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {
    private final ProjectService projectService;
    private final AuthUtil authUtil;

    @GetMapping
    public ResponseEntity<List<ProjectSummaryResponse>> getMyProjects(){
        Long userId= authUtil.getCurrentUserId();
        return ResponseEntity.ok(projectService.getUserProjects());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProjectResponse> getProjectById(@PathVariable Long id) {
        Long userId = authUtil.getCurrentUserId();
        return ResponseEntity.ok(projectService.getUserProjectById(id));
    }

    @PostMapping
    public ResponseEntity<ProjectResponse> createProject(@Valid @RequestBody ProjectRequest projectRequest) {
        Long userId = authUtil.getCurrentUserId();
        return ResponseEntity.status(HttpStatus.CREATED).body(projectService.createProject(projectRequest));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ProjectResponse> updateProject(@PathVariable Long id, @Valid @RequestBody ProjectRequest projectRequest) {
        Long userId = authUtil.getCurrentUserId();
        return ResponseEntity.ok(projectService.updateProject(id, projectRequest));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProject(@PathVariable Long id) {
        Long userId = authUtil.getCurrentUserId();
        projectService.softDelete(id);
        return ResponseEntity.noContent().build();
    }

}
