package com.aditya.novabuild.mapper;

import com.aditya.novabuild.dto.member.MemberResponse;
import com.aditya.novabuild.dto.project.ProjectResponse;
import com.aditya.novabuild.dto.project.ProjectSummaryResponse;
import com.aditya.novabuild.model.Project;
import com.aditya.novabuild.model.User;
import org.mapstruct.Mapper;

import java.util.List;

@Mapper(componentModel = "spring")
public interface ProjectMapper {
        ProjectResponse toProjectResponse(Project project);
        ProjectSummaryResponse toProjectSummaryResponse(Project project);
        List<ProjectSummaryResponse> toProjectSummaryResponseList(List<Project> projects);
        Project toProject(ProjectResponse projectResponse);
}
