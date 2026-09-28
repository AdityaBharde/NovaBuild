package com.aditya.projectservice.repository;

import com.aditya.projectservice.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {
    // Fetches all projects belonging to a specific user
    List<Project> findByUserId(Long userId);
}