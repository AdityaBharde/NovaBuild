package com.aditya.projectservice.service.impl;

import com.aditya.commonlib.dto.FileNode;
import com.aditya.commonlib.dto.FileTreeDto;
import com.aditya.commonlib.exception.ResourceNotFoundException;
import com.aditya.projectservice.dto.project.FileContentResponse;
import com.aditya.projectservice.entity.Project;
import com.aditya.projectservice.entity.ProjectFile;
import com.aditya.projectservice.mapper.ProjectFileMapper;
import com.aditya.projectservice.repository.ProjectFileRepository;
import com.aditya.projectservice.repository.ProjectRepository;
import com.aditya.projectservice.service.ProjectFileService;
import io.minio.GetObjectArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.RemoveObjectArgs;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.net.URLConnection;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class ProjectFileServiceImpl implements ProjectFileService {

    private final ProjectRepository projectRepository;
    private final ProjectFileRepository projectFileRepository;
    private final MinioClient minioClient;
    private final ProjectFileMapper projectFileMapper;

    @Value("${minio.project-bucket}")
    private String projectBucket;

    private static final String BUCKET_NAME = "projects";

    private String getBucketName() {
        return (projectBucket != null && !projectBucket.isBlank()) ? projectBucket : BUCKET_NAME;
    }

    private String sanitizeAndValidatePath(String path) {
        if (path == null || path.isBlank()) {
            throw new IllegalArgumentException("File path cannot be empty");
        }
        String clean = path.trim().replace('\\', '/');
        while (clean.startsWith("/")) {
            clean = clean.substring(1);
        }
        if (clean.contains("..")) {
            throw new IllegalArgumentException("Path traversal not allowed: " + path);
        }
        return clean;
    }

    @Override
    public FileTreeDto getFileTree(Long projectId) {
        List<ProjectFile> projectFileList = projectFileRepository.findByProjectId(projectId);
        List<FileNode> projectFileNodes = projectFileMapper.toListOfFileNode(projectFileList);
        return new FileTreeDto(projectFileNodes);
    }

    @Override
    public String getFileContent(Long projectId, String path) {
        String cleanPath = sanitizeAndValidatePath(path);
        String objectName = projectId + "/" + cleanPath;
        try (
                InputStream is = minioClient.getObject(
                        GetObjectArgs.builder()
                                .bucket(getBucketName())
                                .object(objectName)
                                .build())) {

            return new String(is.readAllBytes(), StandardCharsets.UTF_8);
        } catch (Exception e) {
            log.error("Failed to read file: {}/{}", projectId, cleanPath, e);
            throw new RuntimeException("Failed to read file content: " + cleanPath, e);
        }
    }

    @Override
    @Transactional
    public void saveFile(Long projectId, String path, String content) {
        Project project = projectRepository.findById(projectId).orElseThrow(
                () -> new ResourceNotFoundException("Project", projectId.toString())
        );

        String cleanPath = sanitizeAndValidatePath(path);
        String objectKey = projectId + "/" + cleanPath;

        try {
            byte[] contentBytes = content != null ? content.getBytes(StandardCharsets.UTF_8) : new byte[0];
            InputStream inputStream = new ByteArrayInputStream(contentBytes);
            // saving the file content
            minioClient.putObject(
                    PutObjectArgs.builder()
                            .bucket(getBucketName())
                            .object(objectKey)
                            .stream(inputStream, contentBytes.length, -1)
                            .contentType(determineContentType(cleanPath))
                            .build());

            // Saving the metaData
            ProjectFile file = projectFileRepository.findByProjectIdAndPath(projectId, cleanPath)
                    .orElseGet(() -> ProjectFile.builder()
                            .project(project)
                            .path(cleanPath)
                            .minioObjectKey(objectKey) // Use the key we generated
                            .createdAt(Instant.now())
                            .build());

            file.setUpdatedAt(Instant.now());
            projectFileRepository.save(file);
            log.info("Saved file: {}", objectKey);
        } catch (Exception e) {
            log.error("Failed to save file {}/{}", projectId, cleanPath, e);
            throw new RuntimeException("File save failed: " + cleanPath, e);
        }
    }

    @Override
    @Transactional
    public void deleteFile(Long projectId, String path) {
        Project project = projectRepository.findById(projectId).orElseThrow(
                () -> new ResourceNotFoundException("Project", projectId.toString())
        );

        String cleanPath = sanitizeAndValidatePath(path);
        String objectKey = projectId + "/" + cleanPath;

        try {
            minioClient.removeObject(
                    RemoveObjectArgs.builder()
                            .bucket(getBucketName())
                            .object(objectKey)
                            .build());

            projectFileRepository.findByProjectIdAndPath(projectId, cleanPath)
                    .ifPresent(projectFileRepository::delete);
            log.info("Deleted file: {}", objectKey);
        } catch (Exception e) {
            log.error("Failed to delete file {}/{}", projectId, cleanPath, e);
            throw new RuntimeException("File deletion failed: " + cleanPath, e);
        }
    }

    private String determineContentType(String path) {
        String type = URLConnection.guessContentTypeFromName(path);
        if (type != null) return type;
        if (path.endsWith(".jsx") || path.endsWith(".ts") || path.endsWith(".tsx")) return "text/javascript";
        if (path.endsWith(".json")) return "application/json";
        if (path.endsWith(".css")) return "text/css";
        if (path.endsWith(".html") || path.endsWith(".htm")) return "text/html";

        return "text/plain";
    }
}
