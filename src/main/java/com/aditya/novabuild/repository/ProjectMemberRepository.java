package com.aditya.novabuild.repository;

import com.aditya.novabuild.enums.ProjectRole;
import com.aditya.novabuild.model.ProjectMember;
import com.aditya.novabuild.model.ProjectMemberId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectMemberRepository extends JpaRepository<ProjectMember, ProjectMemberId> {

    List<ProjectMember> findByProjectId(Long projectId);

    boolean existsByProjectId(Long projectId);

    @Query("SELECT pm.role FROM ProjectMember pm where pm.project.id = :projectId AND pm.user.id = :userId")
    Optional<ProjectRole> findRoleByProjectIdAndUserId(@Param("projectId") Long projectId, @Param("userId") Long userId);
}