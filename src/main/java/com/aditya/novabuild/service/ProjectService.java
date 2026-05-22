package com.aditya.novabuild.service;

import com.aditya.novabuild.dto.project.ProjectSummaryResponse;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public interface ProjectService {
    List<ProjectSummaryResponse> getAllProjects(Long userId);
}
