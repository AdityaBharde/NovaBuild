package com.aditya.projectservice.controller;

import com.aditya.commonlib.security.AuthUtil;
import com.aditya.projectservice.dto.ProjectCreateRequest;
import com.aditya.projectservice.dto.ProjectVersionRequest;
import com.aditya.projectservice.entity.Project;
import com.aditya.projectservice.entity.ProjectVersion;
import com.aditya.projectservice.service.KafkaProducerService;
import com.aditya.projectservice.service.ProjectService;
import com.aditya.commonlib.event.SandboxDeployEvent;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/v1/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;
    private final KafkaProducerService kafkaProducerService;

    private Long resolveUserId(String headerUserId) {
        if (headerUserId != null && !headerUserId.isEmpty()) {
            try {
                return Long.parseLong(headerUserId);
            } catch (NumberFormatException e) {
                return (long) headerUserId.hashCode();
            }
        }
        Long current = AuthUtil.getCurrentUserId();
        if (current != null) {
            return current;
        }
        return 1L;
    }

    @PostMapping
    public ResponseEntity<Project> createProject(
            @RequestHeader(value = "X-User-Id", required = false) String headerUserId,
            @Valid @RequestBody ProjectCreateRequest request) {
        Long userId = resolveUserId(headerUserId);
        Project createdProject = projectService.createProject(userId, request);
        return new ResponseEntity<>(createdProject, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<Project>> getUserProjects(
            @RequestHeader(value = "X-User-Id", required = false) String headerUserId) {
        Long userId = resolveUserId(headerUserId);
        return ResponseEntity.ok(projectService.getProjectsByUser(userId));
    }

    @PostMapping("/{projectId}/versions")
    public ResponseEntity<ProjectVersion> saveVersion(
            @PathVariable Long projectId,
            @Valid @RequestBody ProjectVersionRequest request) {
        ProjectVersion version = projectService.saveProjectVersion(projectId, request);
        return new ResponseEntity<>(version, HttpStatus.CREATED);
    }

    @GetMapping("/{projectId}/versions/latest")
    public ResponseEntity<ProjectVersion> getLatestVersion(@PathVariable Long projectId) {
        return ResponseEntity.ok(projectService.getLatestVersion(projectId));
    }

    @GetMapping("/{projectId}/versions")
    public ResponseEntity<List<ProjectVersion>> getVersionHistory(@PathVariable Long projectId) {
        return ResponseEntity.ok(projectService.getProjectVersions(projectId));
    }

    @PostMapping("/{projectId}/preview/deploy")
    public ResponseEntity<String> triggerPreviewDeploy(
            @PathVariable Long projectId,
            @RequestHeader(value = "X-User-Id", required = false) String headerUserId) {
        Long userId = resolveUserId(headerUserId);
        kafkaProducerService.sendSandboxDeployEvent(SandboxDeployEvent.builder()
                .projectId(String.valueOf(projectId))
                .userId(String.valueOf(userId))
                .action("START")
                .timestamp(LocalDateTime.now())
                .build());
        return ResponseEntity.ok("Sandbox preview deployment triggered for project: " + projectId);
    }
}