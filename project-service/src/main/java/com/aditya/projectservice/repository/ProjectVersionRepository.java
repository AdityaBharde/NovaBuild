package com.aditya.projectservice.repository;

import com.aditya.projectservice.entity.ProjectVersion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectVersionRepository extends JpaRepository<ProjectVersion, Long> {
    List<ProjectVersion> findByProjectIdOrderByVersionNumberDesc(Long projectId);
    Optional<ProjectVersion> findByProjectIdAndVersionNumber(Long projectId, Integer versionNumber);

    @Query("SELECT MAX(pv.versionNumber) FROM ProjectVersion pv WHERE pv.project.id = :projectId")
    Optional<Integer> findMaxVersionNumberByProjectId(@Param("projectId") Long projectId);
}