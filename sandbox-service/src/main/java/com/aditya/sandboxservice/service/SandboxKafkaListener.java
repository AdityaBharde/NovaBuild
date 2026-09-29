package com.aditya.sandboxservice.service;

import com.aditya.commonlib.event.SandboxDeployEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class SandboxKafkaListener {

    private final DockerSandboxService dockerSandboxService;

    @KafkaListener(topics = "sandbox-deploy-events", groupId = "sandbox-service-group")
    public void handleSandboxDeploy(SandboxDeployEvent event) {
        log.info("Received SandboxDeployEvent for project: {}, action: {}", event.getProjectId(), event.getAction());
        if ("START".equalsIgnoreCase(event.getAction()) || "RESTART".equalsIgnoreCase(event.getAction())) {
            dockerSandboxService.deploySandbox(event.getProjectId(), event.getUserId());
        } else if ("STOP".equalsIgnoreCase(event.getAction())) {
            dockerSandboxService.stopSandbox(event.getProjectId());
        }
    }
}
