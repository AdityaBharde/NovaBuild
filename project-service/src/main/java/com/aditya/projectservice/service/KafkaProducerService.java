package com.aditya.projectservice.service;

import com.aditya.commonlib.event.ProjectFileChangedEvent;
import com.aditya.commonlib.event.SandboxDeployEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class KafkaProducerService {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public static final String TOPIC_PROJECT_FILE_CHANGED = "project-file-events";
    public static final String TOPIC_SANDBOX_DEPLOY = "sandbox-deploy-events";

    public void sendFileChangedEvent(ProjectFileChangedEvent event) {
        log.info("Publishing ProjectFileChangedEvent for project: {}, file: {}", event.getProjectId(), event.getFilePath());
        kafkaTemplate.send(TOPIC_PROJECT_FILE_CHANGED, event.getProjectId(), event);
    }

    public void sendSandboxDeployEvent(SandboxDeployEvent event) {
        log.info("Publishing SandboxDeployEvent for project: {}, action: {}", event.getProjectId(), event.getAction());
        kafkaTemplate.send(TOPIC_SANDBOX_DEPLOY, event.getProjectId(), event);
    }
}
