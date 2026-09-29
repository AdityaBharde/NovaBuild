package com.aditya.intelligentservice.service.impl;

import com.aditya.commonlib.security.AuthUtil;
import com.aditya.intelligentservice.dto.ChatResponse;
import com.aditya.intelligentservice.entity.ChatMessage;
import com.aditya.intelligentservice.entity.ChatSession;
import com.aditya.intelligentservice.entity.ChatSessionId;
import com.aditya.intelligentservice.mapper.ChatMapper;
import com.aditya.intelligentservice.repository.ChatMessageRepository;
import com.aditya.intelligentservice.repository.ChatSessionRepository;
import com.aditya.intelligentservice.service.ChatService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatServiceImpl implements ChatService {

    private final ChatMessageRepository chatMessageRepository;
    private final ChatSessionRepository chatSessionRepository;
    private final AuthUtil authUtil;
    private final ChatMapper chatMapper;

    @Override
    public List<ChatResponse> getProjectChatHistory(Long projectId) {
        Long userId = authUtil.getCurrentUserId();

        ChatSession chatSession = chatSessionRepository.findByProjectIdAndUserId(projectId, userId).orElse(null);

        List<ChatMessage> chatMessageList = chatMessageRepository.findByChatSession(chatSession);

        return chatMapper.fromListOfChatMessage(chatMessageList);
    }
}