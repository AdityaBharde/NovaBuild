package com.aditya.intelligentservice.service.impl;

import com.aditya.commonlib.enums.ChatEventStatus;
import com.aditya.commonlib.enums.ChatEventType;
import com.aditya.commonlib.enums.MessageRole;
import com.aditya.commonlib.event.FileStoreRequestEvent;
import com.aditya.commonlib.security.AuthUtil;
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
import org.springframework.ai.chat.metadata.Usage;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.scheduler.Schedulers;

import java.util.List;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicReference;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiGenerationServiceImpl implements AiGenerationService {

    private final ChatClient chatClient;
    private final AuthUtil authUtil;
    private final FileTreeContextAdvisor fileTreeContextAdvisor;
    private final ChatSessionRepository chatSessionRepository;
    private final LlmResponseParser llmResponseParser;
    private final ChatMessageRepository chatMessageRepository;
    private final ChatEventRepository chatEventRepository;
    private final UsageService usageService;
    private final KafkaTemplate<String, Object> kafkaTemplate;


    @Override
    @PreAuthorize("@security.canEditProject(#projectId)")
    public Flux<StreamResponse> streamResponse(String userMessage, Long projectId) {

//        usageService.checkDailyTokensUsage();

        Long userId = authUtil.getCurrentUserId();
        ChatSession chatSession = createChatSessionIfNotExists(projectId, userId);

        String promptWithContext = fileTreeContextAdvisor.buildFileTreePrompt(projectId, userMessage);

        StringBuilder fullResponseBuffer = new StringBuilder();
        AtomicReference<Long> startTime = new AtomicReference<>(System.currentTimeMillis());
        AtomicReference<Long> endTime = new AtomicReference<>(0L);
        AtomicReference<Usage> usageRef = new AtomicReference<>();

        return chatClient.prompt()
                .system(PromptUtils.CODE_GENERATION_SYSTEM_PROMPT)
                .user(promptWithContext)
                .stream()
                .chatResponse()
                .doOnNext(response -> {
                    if (response.getResults() != null && !response.getResults().isEmpty()) {
                        String content = response.getResult().getOutput().getText();

                        if(content != null && !content.isEmpty() && endTime.get() == 0) { // first non-empty chunk received
                            endTime.set(System.currentTimeMillis());
                        }
                        if(response.getMetadata() != null && response.getMetadata().getUsage() != null) {
                            usageRef.set(response.getMetadata().getUsage());
                        }
                        if (content != null) {
                            fullResponseBuffer.append(content);
                        }
                    }

                })
                .doOnComplete(() -> {
                    Schedulers.boundedElastic().schedule(() -> {
//                        parseAndSaveFiles(fullResponseBuffer.toString(), projectId);

                        long duration = (endTime.get() - startTime.get()) /  1000;
                        finalizeChats(userMessage, chatSession, fullResponseBuffer.toString(), duration, usageRef.get(), userId);
                    });
                })
                .doOnError(error -> log.error("Error during streaming for projectId: {}", projectId))
                .map(response -> {
                    if (response.getResults() != null && !response.getResults().isEmpty()) {
                        String text = response.getResult().getOutput().getText();
                        return new StreamResponse(text != null ? text : "");
                    }
                    return new StreamResponse("");
                });
    }

    private void finalizeChats(String userMessage, ChatSession chatSession, String fullText, Long duration, Usage usage, Long userId) {
        Long projectId = chatSession.getProjectId();

        int promptTokens = 0;
        int completionTokens = 0;
        int totalTokens = 0;

        if (usage != null) {
            if (usage.getTotalTokens() != null) {
                totalTokens = usage.getTotalTokens().intValue();
                usageService.recordTokenUsage(chatSession.getUserId(), totalTokens);
            }
            if (usage.getPromptTokens() != null) {
                promptTokens = usage.getPromptTokens().intValue();
            }
            if (usage.getGenerationTokens() != null) {
                completionTokens = usage.getGenerationTokens().intValue();
            }
        }

        // Save the User message
        chatMessageRepository.save(
                ChatMessage.builder()
                        .chatSession(chatSession)
                        .role(MessageRole.USER)
                        .content(userMessage)
                        .tokensUsed(promptTokens)
                        .build()
        );

        ChatMessage assistantChatMessage = ChatMessage.builder()
                .role(MessageRole.ASSISTANT)
                .content(fullText)
                .chatSession(chatSession)
                .tokensUsed(completionTokens)
                .build();

        assistantChatMessage = chatMessageRepository.save(assistantChatMessage);

        List<ChatEvent> chatEventList = llmResponseParser.parseChatEvents(fullText, assistantChatMessage);
        chatEventList.add(0, ChatEvent.builder()
                        .type(ChatEventType.THOUGHT)
                        .status(ChatEventStatus.CONFIRMED)
                        .chatMessage(assistantChatMessage)
                        .content("Thought for "+duration+"s")
                        .sequenceOrder(0)
                .build());

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
                    log.info("Storage request event sent: {}", e.getFilePath());
                    kafkaTemplate.send("file-storage-request-event", "project-"+projectId, fileStoreRequestEvent);
                });

        chatEventRepository.saveAll(chatEventList);
    }

    private ChatSession createChatSessionIfNotExists(Long projectId, Long userId) {
        ChatSession chatSession = chatSessionRepository.findByProjectIdAndUserId(projectId, userId).orElse(null);

        if(chatSession == null) {
            chatSession = ChatSession.builder()
                    .projectId(projectId)
                    .userId(userId)
                    .build();

            chatSession = chatSessionRepository.save(chatSession);
        }
        return chatSession;
    }
}