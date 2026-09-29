package com.aditya.intelligentservice.llm;

import com.aditya.intelligentservice.client.WorkspaceClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class CodeGenerationTools {

    public List<String> readFiles(Long projectId, WorkspaceClient workspaceClient, List<String> paths) {
        List<String> result = new ArrayList<>();
        for (String path : paths) {
            String cleanPath = path.startsWith("/") ? path.substring(1) : path;
            log.info("Requested file content: {}", cleanPath);
            try {
                String content = workspaceClient.getFileContent(projectId, cleanPath);
                result.add(String.format("--- START OF FILE: %s ---\n%s\n--- END OF FILE ---", cleanPath, content));
            } catch (Exception e) {
                log.error("Failed to read file {}: {}", cleanPath, e.getMessage());
            }
        }
        return result;
    }
}