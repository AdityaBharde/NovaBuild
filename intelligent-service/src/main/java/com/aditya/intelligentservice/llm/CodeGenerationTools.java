package com.aditya.intelligentservice.llm;

import com.aditya.commonlib.dto.FileNode;
import com.aditya.commonlib.dto.FileTreeDto;
import com.aditya.intelligentservice.client.WorkspaceClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Component
@RequiredArgsConstructor
public class CodeGenerationTools {

    private final WorkspaceClient workspaceClient;

    public String readProjectStructure(Long projectId, String path) {
        log.info("Executing readProjectStructure for project {} (path: {})", projectId, path);
        try {
            FileTreeDto treeDto = workspaceClient.getFileTree(projectId);
            if (treeDto == null || treeDto.files() == null || treeDto.files().isEmpty()) {
                return "Project is empty. No files exist yet.";
            }

            List<String> paths = treeDto.files().stream()
                    .map(FileNode::path)
                    .filter(p -> p != null && !p.isBlank())
                    .collect(Collectors.toList());

            if (paths.isEmpty()) {
                return "Project is empty. No files exist yet.";
            }

            return "Project structure:\n" + paths.stream()
                    .map(p -> "- " + p)
                    .collect(Collectors.joining("\n"));
        } catch (Exception e) {
            log.error("Failed to read project structure for project {}: {}", projectId, e.getMessage());
            return "Error reading project structure: " + e.getMessage();
        }
    }

    public List<String> readFiles(Long projectId, List<String> paths) {
        return readFiles(projectId, this.workspaceClient, paths);
    }

    public List<String> readFiles(Long projectId, WorkspaceClient client, List<String> paths) {
        List<String> result = new ArrayList<>();
        if (paths == null || paths.isEmpty()) {
            return result;
        }

        WorkspaceClient targetClient = client != null ? client : this.workspaceClient;

        for (String path : paths) {
            if (path == null || path.isBlank()) continue;
            String cleanPath = sanitizePath(path);
            log.info("Requested file content: {} for project {}", cleanPath, projectId);
            try {
                String content = targetClient.getFileContent(projectId, cleanPath);
                result.add(String.format("--- START OF FILE: %s ---\n%s\n--- END OF FILE ---", cleanPath, content));
            } catch (Exception e) {
                log.error("Failed to read file {}: {}", cleanPath, e.getMessage());
                result.add(String.format("--- ERROR READING FILE: %s: %s ---", cleanPath, e.getMessage()));
            }
        }
        return result;
    }

    public String saveFile(Long projectId, String path, String content) {
        String cleanPath = sanitizePath(path);
        log.info("Saving file {} for project {}", cleanPath, projectId);
        try {
            workspaceClient.saveFile(projectId, cleanPath, content != null ? content : "");
            return "File successfully saved: " + cleanPath;
        } catch (Exception e) {
            log.error("Failed to save file {}: {}", cleanPath, e.getMessage());
            throw new RuntimeException("Failed to save file " + cleanPath + ": " + e.getMessage(), e);
        }
    }

    public String deleteFile(Long projectId, String path) {
        String cleanPath = sanitizePath(path);
        log.info("Deleting file {} for project {}", cleanPath, projectId);
        try {
            workspaceClient.deleteFile(projectId, cleanPath);
            return "File successfully deleted: " + cleanPath;
        } catch (Exception e) {
            log.error("Failed to delete file {}: {}", cleanPath, e.getMessage());
            throw new RuntimeException("Failed to delete file " + cleanPath + ": " + e.getMessage(), e);
        }
    }

    public String sanitizePath(String path) {
        if (path == null || path.isBlank()) {
            throw new IllegalArgumentException("File path cannot be empty");
        }
        String clean = path.trim().replace('\\', '/');
        while (clean.startsWith("/")) {
            clean = clean.substring(1);
        }
        if (clean.contains("..")) {
            throw new IllegalArgumentException("Path traversal not allowed: " + path);
        }
        return clean;
    }
}