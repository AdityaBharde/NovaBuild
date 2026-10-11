package com.aditya.intelligentservice.llm;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.*;

@Slf4j
@Component
@RequiredArgsConstructor
public class ToolRegistry {

    private final CodeGenerationTools codeGenerationTools;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public record ToolExecutionResult(
            String toolName,
            String result,
            boolean success,
            String errorMessage
    ) {}

    public boolean hasTool(String name) {
        if (name == null) return false;
        String normalized = normalizeToolName(name);
        return switch (normalized) {
            case "readprojectstructure", "readfiles", "readfile", "savefile", "createfile", "updatefile", "deletefile" -> true;
            default -> false;
        };
    }

    public ToolExecutionResult executeTool(Long projectId, String toolName, String rawArgs, String body) {
        String normalized = normalizeToolName(toolName);
        log.info("Executing tool '{}' (normalized: '{}') for project {}", toolName, normalized, projectId);

        try {
            switch (normalized) {
                case "readprojectstructure" -> {
                    String path = parsePathArgument(rawArgs, body);
                    String result = codeGenerationTools.readProjectStructure(projectId, path);
                    return new ToolExecutionResult(toolName, result, true, null);
                }

                case "readfiles", "readfile" -> {
                    List<String> paths = parsePathsArgument(rawArgs, body);
                    if (paths.isEmpty()) {
                        return new ToolExecutionResult(toolName, null, false, "No valid file paths provided for readFiles");
                    }
                    List<String> fileContents = codeGenerationTools.readFiles(projectId, paths);
                    String combined = String.join("\n\n", fileContents);
                    return new ToolExecutionResult(toolName, combined, true, null);
                }

                case "savefile", "createfile", "updatefile" -> {
                    String path = parsePathArgument(rawArgs, null);
                    String content = body != null && !body.isBlank() ? body : parseContentArgument(rawArgs);
                    if (path == null || path.isBlank()) {
                        return new ToolExecutionResult(toolName, null, false, "Path argument is required for " + toolName);
                    }
                    String result = codeGenerationTools.saveFile(projectId, path, content);
                    return new ToolExecutionResult(toolName, result, true, null);
                }

                case "deletefile" -> {
                    String path = parsePathArgument(rawArgs, body);
                    if (path == null || path.isBlank()) {
                        return new ToolExecutionResult(toolName, null, false, "Path argument is required for deleteFile");
                    }
                    String result = codeGenerationTools.deleteFile(projectId, path);
                    return new ToolExecutionResult(toolName, result, true, null);
                }

                default -> {
                    log.warn("Unknown tool name: {}", toolName);
                    return new ToolExecutionResult(toolName, null, false, "Unknown tool: " + toolName);
                }
            }
        } catch (Exception e) {
            log.error("Tool execution failed for {}: {}", toolName, e.getMessage(), e);
            return new ToolExecutionResult(toolName, null, false, e.getMessage());
        }
    }

    private String normalizeToolName(String toolName) {
        if (toolName == null) return "";
        return toolName.trim().toLowerCase().replaceAll("[_-]", "");
    }

    public String parsePathArgument(String rawArgs, String body) {
        if (rawArgs != null && !rawArgs.isBlank()) {
            String trimmed = rawArgs.trim();
            if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
                try {
                    JsonNode node = objectMapper.readTree(trimmed);
                    if (node.has("path")) return node.get("path").asText();
                    if (node.has("directory")) return node.get("directory").asText();
                    if (node.has("dir")) return node.get("dir").asText();
                } catch (Exception ignored) {
                }
            } else {
                return trimmed;
            }
        }

        if (body != null && !body.isBlank()) {
            String trimmed = body.trim();
            if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
                try {
                    JsonNode node = objectMapper.readTree(trimmed);
                    if (node.has("path")) return node.get("path").asText();
                    if (node.has("directory")) return node.get("directory").asText();
                } catch (Exception ignored) {
                }
            } else {
                return trimmed;
            }
        }

        return "";
    }

    public String parseContentArgument(String rawArgs) {
        if (rawArgs == null || rawArgs.isBlank()) return "";
        String trimmed = rawArgs.trim();
        if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
            try {
                JsonNode node = objectMapper.readTree(trimmed);
                if (node.has("content")) return node.get("content").asText();
            } catch (Exception ignored) {
            }
        }
        return "";
    }

    private List<String> parsePathsArgument(String rawArgs, String body) {
        List<String> paths = new ArrayList<>();
        String source = (rawArgs != null && !rawArgs.isBlank()) ? rawArgs.trim() : (body != null ? body.trim() : "");
        if (source.isEmpty()) return paths;

        if (source.startsWith("[") && source.endsWith("]")) {
            try {
                JsonNode array = objectMapper.readTree(source);
                for (JsonNode item : array) {
                    paths.add(item.asText());
                }
                return paths;
            } catch (Exception ignored) {
            }
        } else if (source.startsWith("{") && source.endsWith("}")) {
            try {
                JsonNode node = objectMapper.readTree(source);
                if (node.has("paths") && node.get("paths").isArray()) {
                    for (JsonNode item : node.get("paths")) {
                        paths.add(item.asText());
                    }
                    return paths;
                }
                if (node.has("path")) {
                    paths.add(node.get("path").asText());
                    return paths;
                }
            } catch (Exception ignored) {
            }
        }

        // Fallback: comma or newline separated
        for (String part : source.split("[,\\n]")) {
            String clean = part.trim().replaceAll("[\"\']", "");
            if (!clean.isEmpty()) {
                paths.add(clean);
            }
        }
        return paths;
    }
}
