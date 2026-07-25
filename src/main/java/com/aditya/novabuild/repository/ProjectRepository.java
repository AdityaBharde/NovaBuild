package com.aditya.novabuild.repository;

import com.aditya.novabuild.model.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {

    @Query("""
            SELECT p
            FROM Project p
            WHERE p.deletedAt IS NULL
              AND EXISTS (
                    SELECT pm
                    FROM ProjectMember pm
                    WHERE pm.project = p
                      AND pm.user.id = :userId
              )
            ORDER BY p.updatedAt DESC
            """)
    List<Project> findAllAccessibleByUser(@Param("userId") Long userId);

    @Query("""
            SELECT p
            FROM Project p
            WHERE p.id = :projectId
              AND p.deletedAt IS NULL
              AND EXISTS (
                    SELECT pm
                    FROM ProjectMember pm
                    WHERE pm.project = p
                      AND pm.user.id = :userId
              )
            """)
    Optional<Project> findAccessibleByProjectId(
            @Param("projectId") Long projectId,
            @Param("userId") Long userId
    );
}