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
            StringBuilder sb = new StringBuilder();
            if (fileTree == null || fileTree.isEmpty()) {
                sb.append("Current Project Files: [Empty Project - no files exist yet. Ready for index.html or initial components]");
            } else {
                sb.append("Current Project Files:\n");
                for (FileNode node : fileTree) {
                    sb.append("- ").append(node.path()).append("\n");
                }
            }
            return String.format("%s\n\n---- PROJECT CONTEXT ----\n%s", userPrompt, sb.toString().trim());
        } catch (Exception e) {
            log.warn("Could not fetch file tree for project {}: {}", projectId, e.getMessage());
            return userPrompt;
        }
    }
}
