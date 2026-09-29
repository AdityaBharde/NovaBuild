package com.aditya.sandboxservice.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "sandbox_instances")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SandboxInstance {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false, unique = true)
    private String projectId;

    private String userId;

    private String containerId;

    private String status; // CREATED, RUNNING, STOPPED, ERROR

    private int exposedPort;

    private String previewUrl;

    private String errorMessage;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
