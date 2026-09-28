package com.aditya.projectservice.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "project_versions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectVersion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column(nullable = false)
    private Integer versionNumber;

    // The prompt the user typed to generate this version
    @Column(columnDefinition = "TEXT")
    private String promptUsed;

    // Storing the entire file tree as a JSON string for easy retrieval
    @Column(columnDefinition = "TEXT")
    private String fileTreeJson;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}