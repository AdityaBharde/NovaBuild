package com.aditya.novabuild.service;

import com.aditya.novabuild.dto.project.FileContentResponse;
import com.aditya.novabuild.dto.project.FileNode;

import java.util.List;


public interface FileService {

    List<FileNode> getFileTree(Long projectId, Long userId);

    FileContentResponse getFileContent(Long projectId, String path, Long userId);
}
