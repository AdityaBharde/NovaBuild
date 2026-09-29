package com.aditya.intelligentservice.service.impl;

import com.aditya.commonlib.enums.ChatEventStatus;
import com.aditya.commonlib.enums.ChatEventType;
import com.aditya.commonlib.enums.MessageRole;
import com.aditya.commonlib.event.AiGenerationCompletedEvent;
import com.aditya.commonlib.event.FileStoreRequestEvent;
import com.aditya.commonlib.event.UsageLogEvent;
import com.aditya.commonlib.security.AuthUtil;
import com.aditya.intelligentservice.client.WorkspaceClient;
import com.aditya.intelligentservice.dto.StreamResponse;
import com.aditya.intelligentservice.entity.ChatEvent;
import com.aditya.intelligentservice.entity.ChatMessage;
import com.aditya.intelligentservice.entity.ChatSession;
import com.aditya.intelligentservice.llm.FileTreeContextAdvisor;
import com.aditya.intelligentservice.llm.LlmResponseParser;
import com.aditya.intelligentservice.llm.PromptUtils;
import com.aditya.intelligentservice.repository.ChatEventRepository;
import com.aditya.intelligentservice.repository.ChatMessageRepository;
import com.aditya.intelligentservice.repository.ChatSessionRepository;
import com.aditya.intelligentservice.service.AiGenerationService;
import com.aditya.intelligentservice.service.UsageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.scheduler.Schedulers;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicReference;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiGenerationServiceImpl implements AiGenerationService {

    private final ChatClient chatClient;
    private final FileTreeContextAdvisor fileTreeContextAdvisor;
    private final ChatSessionRepository chatSessionRepository;
    private final LlmResponseParser llmResponseParser;
    private final ChatMessageRepository chatMessageRepository;
    private final ChatEventRepository chatEventRepository;
    private final UsageService usageService;
    private final WorkspaceClient workspaceClient;
    private final KafkaTemplate<String, Object> kafkaTemplate;

    @Override
    public Flux<StreamResponse> streamResponse(String userMessage, Long projectId) {
        Long rawUserId = AuthUtil.getCurrentUserId();
        final Long userId = (rawUserId != null) ? rawUserId : 1L;

        ChatSession chatSession = createChatSessionIfNotExists(projectId, userId);

        StringBuilder fullResponseBuffer = new StringBuilder();
        AtomicReference<Long> startTime = new AtomicReference<>(System.currentTimeMillis());
        AtomicReference<Long> endTime = new AtomicReference<>(0L);

        String augmentedPrompt = fileTreeContextAdvisor.buildFileTreePrompt(projectId, userMessage);

        return chatClient.prompt()
                .system(PromptUtils.CODE_GENERATION_SYSTEM_PROMPT)
                .user(augmentedPrompt)
                .stream()
                .chatResponse()
                .doOnNext(response -> {
                    if (response.getResults() != null && !response.getResults().isEmpty()) {
                        String content = response.getResult().getOutput().getText();
                        if (content != null && !content.isEmpty() && endTime.get() == 0) {
                            endTime.set(System.currentTimeMillis());
                        }
                        fullResponseBuffer.append(content != null ? content : "");
                    }
                })
                .doOnComplete(() -> {
                    Schedulers.boundedElastic().schedule(() -> {
                        long duration = (System.currentTimeMillis() - startTime.get()) / 1000;
                        finalizeChats(userMessage, chatSession, fullResponseBuffer.toString(), duration, userId);
                    });
                })
                .doOnError(error -> log.error("Error during streaming for projectId: {}", projectId, error))
                .map(response -> {
                    if (response.getResults() != null && !response.getResults().isEmpty()) {
                        String text = response.getResult().getOutput().getText();
                        return new StreamResponse(text != null ? text : "");
                    }
                    return new StreamResponse("");
                });
    }

    private void finalizeChats(String userMessage, ChatSession chatSession, String fullText, Long duration, Long userId) {
        Long projectId = chatSession.getProjectId();

        usageService.recordTokenUsage(chatSession.getUserId(), 500);

        kafkaTemplate.send("usage-log-events", String.valueOf(userId), UsageLogEvent.builder()
                .userId(String.valueOf(userId))
                .projectId(String.valueOf(projectId))
                .modelName("gpt-4o")
                .promptTokens(200)
                .completionTokens(300)
                .totalTokens(500)
                .timestamp(LocalDateTime.now())
                .build());

        chatMessageRepository.save(
                ChatMessage.builder()
                        .chatSession(chatSession)
                        .role(MessageRole.USER)
                        .content(userMessage)
                        .tokensUsed(200)
                        .build()
        );

        ChatMessage assistantChatMessage = ChatMessage.builder()
                .role(MessageRole.ASSISTANT)
                .content(fullText)
                .chatSession(chatSession)
                .tokensUsed(300)
                .build();

        assistantChatMessage = chatMessageRepository.save(assistantChatMessage);

        List<ChatEvent> chatEventList = llmResponseParser.parseChatEvents(fullText, assistantChatMessage);
        chatEventList.add(0, ChatEvent.builder()
                .type(ChatEventType.THOUGHT)
                .status(ChatEventStatus.CONFIRMED)
                .chatMessage(assistantChatMessage)
                .content("Thought for " + duration + "s")
                .sequenceOrder(0)
                .build());

        Map<String, String> updatedFiles = new HashMap<>();

        chatEventList.stream()
                .filter(e -> e.getType() == ChatEventType.FILE_EDIT)
                .forEach(e -> {
                    String sagaId = UUID.randomUUID().toString();
                    e.setSagaId(sagaId);
                    FileStoreRequestEvent fileStoreRequestEvent = new FileStoreRequestEvent(
                            projectId,
                            sagaId,
                            e.getFilePath(),
                            e.getContent(),
                            userId
                    );
                    kafkaTemplate.send("file-storage-request-event", "project-" + projectId, fileStoreRequestEvent);
                    if (e.getFilePath() != null && e.getContent() != null) {
                        updatedFiles.put(e.getFilePath(), e.getContent());
                    }
                });

        chatEventRepository.saveAll(chatEventList);

        kafkaTemplate.send("ai-generation-completed-events", String.valueOf(projectId), AiGenerationCompletedEvent.builder()
                .sessionId(chatSession.getId().toString())
                .projectId(String.valueOf(projectId))
                .userId(String.valueOf(userId))
                .status("SUCCESS")
                .responseText(fullText)
                .updatedFiles(updatedFiles)
                .promptTokens(200)
                .completionTokens(300)
                .timestamp(LocalDateTime.now())
                .build());
    }

    private ChatSession createChatSessionIfNotExists(Long projectId, Long userId) {
        ChatSession chatSession = chatSessionRepository.findByProjectIdAndUserId(projectId, userId).orElse(null);
        if (chatSession == null) {
            chatSession = ChatSession.builder()
                    .projectId(projectId)
                    .userId(userId)
                    .build();
            chatSession = chatSessionRepository.save(chatSession);
        }
        return chatSession;
    }
}