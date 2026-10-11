package com.aditya.projectservice.controller;

import com.aditya.commonlib.dto.FileTreeDto;
import com.aditya.projectservice.dto.project.FileContentResponse;
import com.aditya.projectservice.service.ProjectFileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/projects/{projectId}/files")
public class FileController {

    private final ProjectFileService projectFileService;

    @GetMapping
    public ResponseEntity<FileTreeDto> getFileTree(@PathVariable Long projectId) {
        return ResponseEntity.ok(projectFileService.getFileTree(projectId));
    }

    @GetMapping("/content")
    public ResponseEntity<String> getFile(
            @PathVariable Long projectId,
            @RequestParam String path) {
        return ResponseEntity.ok(projectFileService.getFileContent(projectId, path));
    }

    @PostMapping("/content")
    public ResponseEntity<Void> saveFile(
            @PathVariable Long projectId,
            @RequestParam String path,
            @RequestBody String content) {
        projectFileService.saveFile(projectId, path, content);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping
    public ResponseEntity<Void> deleteFile(
            @PathVariable Long projectId,
            @RequestParam String path) {
        projectFileService.deleteFile(projectId, path);
        return ResponseEntity.noContent().build();
    }
}
