package com.aditya.intelligentservice.service;


import com.aditya.intelligentservice.dto.ChatResponse;

import java.util.List;

public interface ChatService {

    List<ChatResponse> getProjectChatHistory(Long projectId);
}