package com.aditya.projectservice.controller;

import com.aditya.commonlib.dto.FileTreeDto;
import com.aditya.commonlib.enums.ProjectPermission;
import com.aditya.projectservice.service.ProjectFileService;
import com.aditya.projectservice.service.ProjectService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RequiredArgsConstructor
@RequestMapping({"/internal/v1", "/internal"})
@RestController
public class InternalWorkspaceController {

    private final ProjectService projectService;
    private final ProjectFileService projectFileService;

    @GetMapping("/projects/{projectId}/files/tree")
    @PreAuthorize("@security.canViewProject(#projectId)")
    public FileTreeDto getFileTree(@PathVariable Long projectId) {
        return projectFileService.getFileTree(projectId);
    }

    @GetMapping("/projects/{projectId}/files/content")
    @PreAuthorize("@security.canViewProject(#projectId)")
    public String getFileContent(@PathVariable Long projectId, @RequestParam String path) {
        return projectFileService.getFileContent(projectId, path);
    }

    @PostMapping("/projects/{projectId}/files/content")
    @PreAuthorize("@security.canEditProject(#projectId)")
    public void saveFile(
            @PathVariable Long projectId,
            @RequestParam String path,
            @RequestBody String content) {
        projectFileService.saveFile(projectId, path, content);
    }

    @DeleteMapping("/projects/{projectId}/files")
    @PreAuthorize("@security.canDeleteProject(#projectId)")
    public void deleteFile(
            @PathVariable Long projectId,
            @RequestParam String path) {
        projectFileService.deleteFile(projectId, path);
    }

    @GetMapping("/projects/{projectId}/permissions/check")
    @PreAuthorize("isAuthenticated()")
    public boolean checkProjectPermission(
            @PathVariable Long projectId,
            @RequestParam ProjectPermission permission) {
        return projectService.hasPermission(projectId, permission);
    }
}
