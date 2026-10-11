package com.aditya.projectservice.service;


import com.aditya.commonlib.dto.FileTreeDto;
import com.aditya.projectservice.dto.project.FileContentResponse;

public interface ProjectFileService {
    FileTreeDto getFileTree(Long projectId);

    String getFileContent(Long projectId, String path);

    void saveFile(Long projectId, String filePath, String fileContent);

    void deleteFile(Long projectId, String filePath);
}
