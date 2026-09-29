package com.aditya.projectservice.repository;

import com.aditya.projectservice.entity.ProjectFile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectFileRepository extends JpaRepository<ProjectFile, Long> {
    List<ProjectFile> findByProjectVersionId(Long versionId);
    Optional<ProjectFile> findByProjectVersionIdAndFilePath(Long versionId, String filePath);
}
