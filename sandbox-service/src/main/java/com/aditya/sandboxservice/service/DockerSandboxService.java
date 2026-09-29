package com.aditya.sandboxservice.service;

import com.aditya.commonlib.event.SandboxStatusEvent;
import com.aditya.sandboxservice.entity.SandboxInstance;
import com.aditya.sandboxservice.repository.SandboxInstanceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Random;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class DockerSandboxService {

    private final SandboxInstanceRepository repository;
    private final KafkaTemplate<String, Object> kafkaTemplate;

    @Value("${sandbox.preview-domain:localhost}")
    private String previewDomain;

    public static final String TOPIC_SANDBOX_STATUS = "sandbox-status-events";

    @Transactional
    public SandboxInstance deploySandbox(String projectId, String userId) {
        log.info("Deploying dynamic preview container for project: {}", projectId);

        SandboxInstance instance = repository.findByProjectId(projectId)
                .orElseGet(() -> SandboxInstance.builder()
                        .projectId(projectId)
                        .userId(userId)
                        .build());

        int port = 3000 + new Random().nextInt(1000);
        String mockContainerId = "novabuild-preview-" + projectId + "-" + UUID.randomUUID().toString().substring(0, 8);
        String previewUrl = "http://" + previewDomain + ":" + port;

        instance.setContainerId(mockContainerId);
        instance.setExposedPort(port);
        instance.setStatus("RUNNING");
        instance.setPreviewUrl(previewUrl);

        instance = repository.save(instance);

        // Publish status event to Kafka
        SandboxStatusEvent statusEvent = SandboxStatusEvent.builder()
                .projectId(projectId)
                .containerId(mockContainerId)
                .status("RUNNING")
                .previewUrl(previewUrl)
                .exposedPort(port)
                .timestamp(LocalDateTime.now())
                .build();

        kafkaTemplate.send(TOPIC_SANDBOX_STATUS, projectId, statusEvent);
        log.info("Sandbox container deployed successfully for project {}: {}", projectId, previewUrl);
        return instance;
    }

    @Transactional
    public SandboxInstance stopSandbox(String projectId) {
        SandboxInstance instance = repository.findByProjectId(projectId).orElse(null);
        if (instance != null) {
            instance.setStatus("STOPPED");
            instance = repository.save(instance);

            SandboxStatusEvent statusEvent = SandboxStatusEvent.builder()
                    .projectId(projectId)
                    .containerId(instance.getContainerId())
                    .status("STOPPED")
                    .timestamp(LocalDateTime.now())
                    .build();
            kafkaTemplate.send(TOPIC_SANDBOX_STATUS, projectId, statusEvent);
        }
        return instance;
    }

    public SandboxInstance getSandboxStatus(String projectId) {
        return repository.findByProjectId(projectId).orElse(null);
    }
}
