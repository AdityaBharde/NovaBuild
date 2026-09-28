package com.aditya.intelligentservice.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;

@FeignClient(name = "PROJECT-SERVICE")
public interface WorkspaceClient {

    @GetMapping("/api/projects/{projectId}/versions/latest")
    String getLatestProjectVersion(
            @RequestHeader("X-User-Id") Long userId,
            @PathVariable("projectId") Long projectId
    );
}