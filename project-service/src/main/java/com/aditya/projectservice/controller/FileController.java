package com.aditya.projectservice.controller;

import com.aditya.commonlib.dto.FileTreeDto;
import com.aditya.projectservice.service.ProjectFileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/projects/{projectId}/files")
public class FileController {

    private final ProjectFileService projectFileService;

    @GetMapping
    @PreAuthorize("@security.canViewProject(#projectId)")
    public ResponseEntity<FileTreeDto> getFileTree(@PathVariable Long projectId) {
        return ResponseEntity.ok(projectFileService.getFileTree(projectId));
    }

    @GetMapping("/content")
    @PreAuthorize("@security.canViewProject(#projectId)")
    public ResponseEntity<String> getFile(
            @PathVariable Long projectId,
            @RequestParam String path) {
        return ResponseEntity.ok(projectFileService.getFileContent(projectId, path));
    }

    @PostMapping("/content")
    @PreAuthorize("@security.canEditProject(#projectId)")
    public ResponseEntity<Void> saveFile(
            @PathVariable Long projectId,
            @RequestParam String path,
            @RequestBody String content) {
        projectFileService.saveFile(projectId, path, content);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping
    @PreAuthorize("@security.canDeleteProject(#projectId)")
    public ResponseEntity<Void> deleteFile(
            @PathVariable Long projectId,
            @RequestParam String path) {
        projectFileService.deleteFile(projectId, path);
        return ResponseEntity.noContent().build();
    }
}
