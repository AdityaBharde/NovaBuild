package com.aditya.projectservice.repository;

import com.aditya.projectservice.entity.ProjectVersion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectVersionRepository extends JpaRepository<ProjectVersion, Long> {
    // Gets all versions for a project, ordered from newest to oldest
    List<ProjectVersion> findByProjectIdOrderByVersionNumberDesc(Long projectId);

    // Gets a specific version of a project
    Optional<ProjectVersion> findByProjectIdAndVersionNumber(Long projectId, Integer versionNumber);
}