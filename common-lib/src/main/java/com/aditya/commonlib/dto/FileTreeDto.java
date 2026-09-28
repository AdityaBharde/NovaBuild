package com.aditya.commonlib.dto;

import com.aditya.commonlib.dto.project.FileNode;

import java.util.List;

public record FileTreeDto(List<FileNode> files) {
}