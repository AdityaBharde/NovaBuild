package com.aditya.projectservice.mapper;

import com.aditya.commonlib.enums.ProjectRole;
import com.aditya.projectservice.dto.project.ProjectResponse;
import com.aditya.projectservice.dto.project.ProjectSummaryResponse;
import com.aditya.projectservice.entity.Project;
import org.mapstruct.Mapper;

import java.util.List;

@Mapper(componentModel = "spring")
public interface ProjectMapper {

    ProjectResponse toProjectResponse(Project project);

    ProjectSummaryResponse toProjectSummaryResponse(Project project, ProjectRole role);

    List<ProjectSummaryResponse> toListOfProjectSummaryResponse(List<Project> projects);

}