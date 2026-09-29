package com.aditya.intelligentservice.llm;

import com.aditya.commonlib.dto.FileNode;
import com.aditya.intelligentservice.client.WorkspaceClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class FileTreeContextAdvisor {

    private final WorkspaceClient workspaceClient;

    public String buildFileTreePrompt(Long projectId, String userPrompt) {
        try {
            List<FileNode> fileTree = workspaceClient.getFileTree(projectId).files();
            String fileTreeContext = fileTree != null ? fileTree.toString() : "[]";
            return String.format("%s\n\n---- FILE_TREE ----\n%s", userPrompt, fileTreeContext);
        } catch (Exception e) {
            log.warn("Could not fetch file tree for project {}: {}", projectId, e.getMessage());
            return userPrompt;
        }
    }
}
