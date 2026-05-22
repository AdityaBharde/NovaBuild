package com.aditya.novabuild.controller;


import com.aditya.novabuild.dto.project.ProjectSummaryResponse;
import com.aditya.novabuild.service.ProjectService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {
    private final ProjectService projectService;

    @GetMapping
    public ResponseEntity<List<ProjectSummaryResponse>> getProjects(){
        Long userId=1L;
        return ResponseEntity.ok(projectService.getAllProjects(userId));
    }
}
