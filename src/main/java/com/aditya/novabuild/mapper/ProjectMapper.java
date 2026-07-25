package com.aditya.novabuild.mapper;

import com.aditya.novabuild.dto.project.ProjectResponse;
import com.aditya.novabuild.dto.project.ProjectSummaryResponse;
import com.aditya.novabuild.model.Project;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface ProjectMapper {
        ProjectResponse toProjectResponse(Project project);
        ProjectSummaryResponse toProjectSummaryResponse(Project project);
        List<ProjectSummaryResponse> toProjectSummaryResponseList(List<Project> projects);
        Project toProject(ProjectResponse projectResponse);

}
