package com.aditya.novabuild.repository;

import com.aditya.novabuild.model.ProjectMember;
import com.aditya.novabuild.model.ProjectMemberId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectMemberRepository extends JpaRepository<ProjectMember, ProjectMemberId> {

    List<ProjectMember> findByProjectId(Long projectId);

    boolean existsByProjectId(Long projectId);

}
