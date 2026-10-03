package com.aditya.projectservice.service;

import com.aditya.projectservice.dto.project.DeployResponse;
import org.jspecify.annotations.Nullable;

public interface DeploymentService {
    @Nullable DeployResponse deploy(Long projectId);
}