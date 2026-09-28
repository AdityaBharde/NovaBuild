package com.aditya.projectservice.entity;


import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "project_files")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectFile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "version_id", nullable = false)
    private ProjectVersion projectVersion;

    // e.g., "src/components/Button.jsx" or "package.json"
    @Column(nullable = false)
    private String filePath;

    // The actual code content. Using TEXT or LONGTEXT for large files
    @Lob
    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    // e.g., "javascript", "css", "json" (helpful for syntax highlighting in Monaco Editor)
    private String language;
}