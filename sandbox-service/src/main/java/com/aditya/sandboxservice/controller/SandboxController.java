package com.aditya.sandboxservice.controller;

import com.aditya.sandboxservice.entity.SandboxInstance;
import com.aditya.sandboxservice.service.DockerSandboxService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/sandbox")
@RequiredArgsConstructor
public class SandboxController {

    private final DockerSandboxService dockerSandboxService;

    @PostMapping("/{projectId}/deploy")
    public ResponseEntity<SandboxInstance> deploy(
            @PathVariable String projectId,
            @RequestHeader(value = "X-User-Id", required = false) String userId) {
        SandboxInstance instance = dockerSandboxService.deploySandbox(projectId, userId != null ? userId : "user-1");
        return ResponseEntity.ok(instance);
    }

    @PostMapping("/{projectId}/stop")
    public ResponseEntity<SandboxInstance> stop(@PathVariable String projectId) {
        SandboxInstance instance = dockerSandboxService.stopSandbox(projectId);
        return ResponseEntity.ok(instance);
    }

    @GetMapping("/{projectId}/status")
    public ResponseEntity<SandboxInstance> getStatus(@PathVariable String projectId) {
        SandboxInstance instance = dockerSandboxService.getSandboxStatus(projectId);
        if (instance == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(instance);
    }
}
