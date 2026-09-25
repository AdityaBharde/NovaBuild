package com.aditya.novabuild.service;

import com.aditya.novabuild.dto.ai.ChatResponse;

import java.util.List;

public interface ChatService {

    List<ChatResponse> getProjectChatHistory(Long projectId);
}