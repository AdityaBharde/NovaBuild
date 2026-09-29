package com.aditya.projectservice.service;

import com.aditya.commonlib.event.AiGenerationCompletedEvent;
import com.aditya.projectservice.entity.Project;
import com.aditya.projectservice.entity.ProjectFile;
import com.aditya.projectservice.entity.ProjectVersion;
import com.aditya.projectservice.repository.ProjectFileRepository;
import com.aditya.projectservice.repository.ProjectRepository;
import com.aditya.projectservice.repository.ProjectVersionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class KafkaConsumerService {

    private final ProjectRepository projectRepository;
    private final ProjectVersionRepository projectVersionRepository;
    private final ProjectFileRepository projectFileRepository;

    @Transactional
    @KafkaListener(topics = "ai-generation-completed-events", groupId = "project-service-group")
    public void handleAiGenerationCompleted(AiGenerationCompletedEvent event) {
        log.info("Received AiGenerationCompletedEvent for project: {}", event.getProjectId());

        if (!"SUCCESS".equalsIgnoreCase(event.getStatus()) || event.getUpdatedFiles() == null || event.getUpdatedFiles().isEmpty()) {
            log.warn("Ai generation event skipped or unsuccessful for project: {}", event.getProjectId());
            return;
        }

        try {
            Long projectId = Long.parseLong(event.getProjectId());
            Project project = projectRepository.findById(projectId).orElse(null);
            if (project == null) {
                log.error("Project not found for id: {}", event.getProjectId());
                return;
            }

            Integer nextVersion = projectVersionRepository.findMaxVersionNumberByProjectId(projectId).orElse(0) + 1;

            ProjectVersion version = ProjectVersion.builder()
                    .project(project)
                    .versionNumber(nextVersion)
                    .promptUsed("AI Generated Version " + nextVersion)
                    .createdAt(LocalDateTime.now())
                    .build();

            version = projectVersionRepository.save(version);

            for (Map.Entry<String, String> entry : event.getUpdatedFiles().entrySet()) {
                String path = entry.getKey();
                String content = entry.getValue();

                ProjectFile file = ProjectFile.builder()
                        .projectVersion(version)
                        .filePath(path)
                        .content(content)
                        .language(determineLanguage(path))
                        .build();

                projectFileRepository.save(file);
            }

            log.info("Successfully updated project {} with new version {} containing {} files", projectId, nextVersion, event.getUpdatedFiles().size());
        } catch (Exception e) {
            log.error("Error applying AI generated code to project {}: {}", event.getProjectId(), e.getMessage(), e);
        }
    }

    private String determineLanguage(String path) {
        if (path.endsWith(".java")) return "java";
        if (path.endsWith(".js") || path.endsWith(".jsx")) return "javascript";
        if (path.endsWith(".ts") || path.endsWith(".tsx")) return "typescript";
        if (path.endsWith(".json")) return "json";
        if (path.endsWith(".html")) return "html";
        if (path.endsWith(".css")) return "css";
        return "plaintext";
    }
}
