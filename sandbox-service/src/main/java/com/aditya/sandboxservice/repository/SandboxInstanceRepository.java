package com.aditya.sandboxservice.repository;

import com.aditya.sandboxservice.entity.SandboxInstance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SandboxInstanceRepository extends JpaRepository<SandboxInstance, String> {
    Optional<SandboxInstance> findByProjectId(String projectId);
}
