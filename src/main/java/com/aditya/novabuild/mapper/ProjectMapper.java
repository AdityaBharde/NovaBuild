package com.aditya.novabuild.mapper;

import com.aditya.novabuild.dto.project.ProjectResponse;
import com.aditya.novabuild.model.Project;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface ProjectMapper {
        ProjectResponse toProjectResponse(Project project);
}
