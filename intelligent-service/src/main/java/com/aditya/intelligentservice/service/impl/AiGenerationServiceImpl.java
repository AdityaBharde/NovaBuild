package com.aditya.intelligentservice.service.impl;

import com.aditya.commonlib.enums.ChatEventStatus;
import com.aditya.commonlib.enums.ChatEventType;
import com.aditya.commonlib.enums.MessageRole;
import com.aditya.commonlib.event.AiGenerationCompletedEvent;
import com.aditya.commonlib.event.UsageLogEvent;
import com.aditya.commonlib.security.AuthUtil;
import com.aditya.intelligentservice.client.WorkspaceClient;
import com.aditya.intelligentservice.dto.StreamResponse;
import com.aditya.intelligentservice.entity.ChatEvent;
import com.aditya.intelligentservice.entity.ChatMessage;
import com.aditya.intelligentservice.entity.ChatSession;
import com.aditya.intelligentservice.entity.ChatSessionId;
import com.aditya.intelligentservice.llm.FileTreeContextAdvisor;
import com.aditya.intelligentservice.llm.IncrementalProtocolParser;
import com.aditya.intelligentservice.llm.LlmResponseParser;
import com.aditya.intelligentservice.llm.PromptUtils;
import com.aditya.intelligentservice.llm.ToolRegistry;
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
import reactor.core.publisher.FluxSink;
import reactor.core.scheduler.Schedulers;

import java.time.LocalDateTime;
import java.util.*;

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
    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final AuthUtil authUtil;
    private final ToolRegistry toolRegistry;
    private final WorkspaceClient workspaceClient;

    private record ToolCallPending(String name, String rawArgs, String body) {}

    @Override
    public Flux<StreamResponse> streamResponse(
            String userMessage,
            Long projectId
    ) {
        Long rawUserId = authUtil.getCurrentUserId();
        final Long userId = rawUserId != null ? rawUserId : 1L;

        final ChatSession chatSession =
                createChatSessionIfNotExists(projectId, userId);

        final String messageId = UUID.randomUUID().toString();

        return Flux.<StreamResponse>create(sink -> {
            try {
                sink.next(StreamResponse.messageStart(messageId));
                sink.next(StreamResponse.status("Thinking..."));

                StringBuilder completeUserFacingText = new StringBuilder();
                StringBuilder completeRawResponse = new StringBuilder();
                Map<String, String> persistedFiles = new LinkedHashMap<>();
                Set<String> executedToolsSignature = new HashSet<>();

                int iteration = 0;
                int maxIterations = 5;
                String currentPrompt = fileTreeContextAdvisor.buildFileTreePrompt(
                        projectId,
                        userMessage
                );
                boolean continueLoop = true;
                long startTime = System.currentTimeMillis();

                while (continueLoop && iteration < maxIterations && !sink.isCancelled()) {
                    iteration++;
                    log.info("Starting agent iteration {} for project {}", iteration, projectId);

                    final StringBuilder iterationRawBuffer = new StringBuilder();
                    final List<ToolCallPending> pendingToolCalls = new ArrayList<>();

                    IncrementalProtocolParser parser = new IncrementalProtocolParser(new IncrementalProtocolParser.ProtocolEventListener() {
                        @Override
                        public void onStatus(String status) {
                            sink.next(StreamResponse.status(status));
                        }

                        @Override
                        public void onToolCall(String toolName, String rawArgs, String body) {
                            pendingToolCalls.add(new ToolCallPending(toolName, rawArgs, body));
                        }

                        @Override
                        public void onFileGenerating(String path) {
                            sink.next(StreamResponse.status("Generating " + path + "..."));
                        }

                        @Override
                        public void onFileCompleted(String path, String content) {
                            sink.next(StreamResponse.status("Saving " + path + "..."));
                            try {
                                workspaceClient.saveFile(projectId, path, content);
                                persistedFiles.put(path, content);
                                sink.next(StreamResponse.fileChanged(path, "created", content));
                                sink.next(StreamResponse.status("Saved " + path));
                                log.info("Successfully persisted file: {} for project {}", path, projectId);
                            } catch (Exception e) {
                                log.error("Failed to save file {} for project {}: {}", path, projectId, e.getMessage());
                                sink.next(StreamResponse.error("Failed to save " + path + ": " + e.getMessage()));
                            }
                        }

                        @Override
                        public void onTextDelta(String text) {
                            completeUserFacingText.append(text);
                            sink.next(StreamResponse.textDelta(text));
                        }

                        @Override
                        public void onError(String error) {
                            sink.next(StreamResponse.error(error));
                        }
                    });

                    long modelIterationStartedAt = System.nanoTime();
                    long[] firstChunkAtNanos = {0L};
                    try {
                        chatClient.prompt()
                                .system(PromptUtils.CODE_GENERATION_SYSTEM_PROMPT)
                                .user(currentPrompt)
                                .stream()
                                .chatResponse()
                                .map(response -> {
                                    if (response.getResult() == null
                                            || response.getResult().getOutput() == null) {
                                        return "";
                                    }
                                    String text = response.getResult().getOutput().getText();
                                    return text != null ? text : "";
                                })
                                .filter(text -> !text.isEmpty())
                                .doOnNext(chunk -> {
                                    if (firstChunkAtNanos[0] == 0L) firstChunkAtNanos[0] = System.nanoTime();
                                    if (!sink.isCancelled()) {
                                        iterationRawBuffer.append(chunk);
                                        parser.processChunk(chunk);
                                    }
                                })
                                .blockLast();

                        parser.finish();
                        long modelIterationMs = (System.nanoTime() - modelIterationStartedAt) / 1_000_000;
                        long timeToFirstChunkMs = firstChunkAtNanos[0] == 0L ? -1L : (firstChunkAtNanos[0] - modelIterationStartedAt) / 1_000_000;
                        log.info("AI model iteration completed: projectId={}, iteration={}, durationMs={}, timeToFirstChunkMs={}, streamedChars={}", projectId, iteration, modelIterationMs, timeToFirstChunkMs, iterationRawBuffer.length());
                        completeRawResponse.append(iterationRawBuffer).append("\n");

                    } catch (Exception e) {
                        log.error("Generation error in iteration {} for project {}: {}", iteration, projectId, e.getMessage(), e);
                        sink.next(StreamResponse.error("AI response stream error: " + e.getMessage()));
                        break;
                    }

                    if (!pendingToolCalls.isEmpty()) {
                        StringBuilder toolResultsSummary = new StringBuilder();
                        boolean anyNewToolExecuted = false;

                        for (ToolCallPending toolCall : pendingToolCalls) {
                            String sig = toolCall.name() + ":" + toolCall.rawArgs();
                            if (executedToolsSignature.contains(sig)) {
                                log.info("Skipping duplicate tool execution: {}", sig);
                                continue;
                            }
                            executedToolsSignature.add(sig);
                            anyNewToolExecuted = true;

                            sink.next(StreamResponse.toolStart(toolCall.name(), toolCall.rawArgs()));
                            sink.next(StreamResponse.status("Executing " + toolCall.name() + "..."));

                            long toolStartedAt = System.nanoTime();
                            ToolRegistry.ToolExecutionResult result = toolRegistry.executeTool(
                                    projectId,
                                    toolCall.name(),
                                    toolCall.rawArgs(),
                                    toolCall.body()
                            );
                            long toolDurationMs = (System.nanoTime() - toolStartedAt) / 1_000_000;
                            log.info("AI tool completed: projectId={}, tool={}, durationMs={}, success={}", projectId, toolCall.name(), toolDurationMs, result.success());

                            sink.next(StreamResponse.toolResult(
                                    toolCall.name(),
                                    result.result(),
                                    result.success()
                            ));

                            String normalizedTool = toolCall.name().toLowerCase().replaceAll("[_-]", "");
                            if (("savefile".equals(normalizedTool) || "createfile".equals(normalizedTool) || "updatefile".equals(normalizedTool))
                                    && result.success()) {
                                String savedPath = toolRegistry.parsePathArgument(toolCall.rawArgs(), null);
                                String savedContent = toolCall.body() != null && !toolCall.body().isBlank()
                                        ? toolCall.body()
                                        : toolRegistry.parseContentArgument(toolCall.rawArgs());
                                if (!savedPath.isBlank()) {
                                    persistedFiles.put(savedPath, savedContent);
                                    sink.next(StreamResponse.fileChanged(savedPath, "created", savedContent));
                                    sink.next(StreamResponse.status("Saved " + savedPath));
                                    log.info("Persisted file via tool {}: {} for project {}", toolCall.name(), savedPath, projectId);
                                }
                            }

                            toolResultsSummary.append(String.format(
                                    "<tool_result name=\"%s\">\n%s\n</tool_result>\n",
                                    toolCall.name(),
                                    result.success() ? result.result() : ("Error: " + result.errorMessage())
                            ));
                        }

                        if (anyNewToolExecuted) {
                            currentPrompt = String.format(
                                    "Original request: %s\n\nTool execution results:\n%s\nPlease proceed with planning and generating the files based on these tool results.",
                                    userMessage,
                                    toolResultsSummary
                            );
                            continueLoop = true;
                        } else {
                            continueLoop = false;
                        }
                    } else {
                        // No tool calls pending. Check if files were generated.
                        if (persistedFiles.isEmpty()) {
                            // Attempt to extract from code blocks if model used Markdown instead of <file> tags
                            extractAndPersistCodeBlocks(projectId, iterationRawBuffer.toString(), userMessage, persistedFiles, sink);
                        }

                        if (persistedFiles.isEmpty() && isFileGenerationRequest(userMessage) && iteration < maxIterations) {
                            log.warn("Iteration {} ended without persisted files for file-generation request '{}'. Continuing agent loop.", iteration, userMessage);
                            sink.next(StreamResponse.status("Generating required files..."));
                            currentPrompt = String.format(
                                    "Original request: %s\n\nCRITICAL REQUIREMENT: You have completed reasoning or planning, but NO code files have been outputted! You MUST output the complete code wrapped inside <file path=\"...\">...</file> tags. If creating an HTML page, output <file path=\"index.html\">...complete HTML5 code...</file>. Please output the required files now.",
                                    userMessage
                            );
                            continueLoop = true;
                        } else {
                            continueLoop = false;
                        }
                    }
                }

                // If after all iterations no files were persisted for a file-generation request
                if (persistedFiles.isEmpty()) {
                    extractAndPersistCodeBlocks(projectId, completeRawResponse.toString(), userMessage, persistedFiles, sink);
                }

                if (persistedFiles.isEmpty() && isFileGenerationRequest(userMessage)) {
                    log.error("File generation task completed with 0 files persisted for project {}", projectId);
                    sink.next(StreamResponse.error("No files were generated for this request. Please specify the desired implementation or try again."));
                }

                long totalDurationMs = System.currentTimeMillis() - startTime;
                log.info("AI generation finished: projectId={}, durationMs={}, iterations={}, filesPersisted={}", projectId, totalDurationMs, iteration, persistedFiles.size());
                long duration = totalDurationMs / 1000;

                String finalAssistantMessage = buildAccurateFinalOutcome(
                        userMessage,
                        completeUserFacingText.toString(),
                        completeRawResponse.toString(),
                        persistedFiles
                );

                if (completeUserFacingText.length() == 0 || isGenericCompletionMessage(completeUserFacingText.toString())) {
                    sink.next(StreamResponse.textDelta(finalAssistantMessage));
                }

                finalizeChats(
                        userMessage,
                        chatSession,
                        completeRawResponse.toString(),
                        finalAssistantMessage,
                        persistedFiles,
                        duration,
                        userId
                );

                sink.next(StreamResponse.messageComplete(messageId));
                sink.complete();

            } catch (Exception e) {
                log.error("Fatal error during chat stream for project {}: {}", projectId, e.getMessage(), e);
                sink.next(StreamResponse.error("Chat generation error: " + e.getMessage()));
                sink.complete();
            }
        }, FluxSink.OverflowStrategy.BUFFER)
        .subscribeOn(Schedulers.boundedElastic());
    }

    private void finalizeChats(
            String userMessage,
            ChatSession chatSession,
            String fullRawText,
            String userFacingText,
            Map<String, String> updatedFiles,
            Long duration,
            Long userId
    ) {
        Long projectId = chatSession.getId().getProjectId();

        usageService.recordTokenUsage(
                chatSession.getId().getUserId(),
                500
        );

        try {
            kafkaTemplate.send(
                    "usage-log-events",
                    String.valueOf(userId),
                    UsageLogEvent.builder()
                            .userId(String.valueOf(userId))
                            .projectId(String.valueOf(projectId))
                            .modelName("gpt-4o")
                            .promptTokens(200)
                            .completionTokens(300)
                            .totalTokens(500)
                            .timestamp(LocalDateTime.now())
                            .build()
            );
        } catch (Exception e) {
            log.warn("Kafka usage log event failed: {}", e.getMessage());
        }

        ChatMessage userChatMessage = ChatMessage.builder()
                .chatSession(chatSession)
                .role(MessageRole.USER)
                .content(userMessage)
                .tokensUsed(200)
                .build();

        chatMessageRepository.save(userChatMessage);

        String cleanContent = userFacingText != null && !userFacingText.isBlank()
                ? userFacingText.trim()
                : llmResponseParser.extractUserFacingMessage(fullRawText);

        ChatMessage assistantChatMessage = ChatMessage.builder()
                .chatSession(chatSession)
                .role(MessageRole.ASSISTANT)
                .content(cleanContent)
                .tokensUsed(300)
                .build();

        assistantChatMessage =
                chatMessageRepository.save(assistantChatMessage);

        List<ChatEvent> chatEventList =
                llmResponseParser.parseChatEvents(
                        fullRawText,
                        assistantChatMessage
                );

        chatEventList.add(
                0,
                ChatEvent.builder()
                        .type(ChatEventType.THOUGHT)
                        .status(ChatEventStatus.CONFIRMED)
                        .chatMessage(assistantChatMessage)
                        .content("Thought for " + duration + "s")
                        .sequenceOrder(0)
                        .build()
        );

        for (ChatEvent event : chatEventList) {
            if (event.getType() == ChatEventType.FILE_EDIT) {
                event.setStatus(ChatEventStatus.CONFIRMED);
            }
        }

        chatEventRepository.saveAll(chatEventList);

        try {
            kafkaTemplate.send(
                    "ai-generation-completed-events",
                    String.valueOf(projectId),
                    AiGenerationCompletedEvent.builder()
                            .sessionId(chatSession.getId().toString())
                            .projectId(String.valueOf(projectId))
                            .userId(String.valueOf(userId))
                            .status("SUCCESS")
                            .responseText(cleanContent)
                            .updatedFiles(updatedFiles)
                            .promptTokens(200)
                            .completionTokens(300)
                            .timestamp(LocalDateTime.now())
                            .build()
            );
        } catch (Exception e) {
            log.warn("Kafka completion event failed: {}", e.getMessage());
        }
    }

    private ChatSession createChatSessionIfNotExists(
            Long projectId,
            Long userId
    ) {
        ChatSessionId id = new ChatSessionId(projectId, userId);

        return chatSessionRepository.findById(id)
                .orElseGet(() ->
                        chatSessionRepository.save(
                                ChatSession.builder()
                                        .id(id)
                                        .build()
                        )
                );
    }

    private boolean isFileGenerationRequest(String userPrompt) {
        if (userPrompt == null || userPrompt.isBlank()) return false;
        String lower = userPrompt.toLowerCase();
        return lower.contains("create") || lower.contains("build") || lower.contains("generate")
                || lower.contains("make") || lower.contains("add") || lower.contains("update")
                || lower.contains("modify") || lower.contains("page") || lower.contains("html")
                || lower.contains("hero") || lower.contains("form") || lower.contains("landing")
                || lower.contains("component") || lower.contains("file") || lower.contains("write")
                || lower.contains("code") || lower.contains("navbar") || lower.contains("section");
    }

    private boolean isGenericCompletionMessage(String text) {
        if (text == null || text.isBlank()) return true;
        String trimmed = text.trim().toLowerCase();
        return trimmed.equals("completed.")
                || trimmed.equals("completed task successfully.")
                || trimmed.equals("the implementation is complete.")
                || trimmed.equals("completed")
                || trimmed.equals("done.")
                || trimmed.equals("done");
    }

    private String buildAccurateFinalOutcome(
            String userPrompt,
            String streamedUserFacingText,
            String fullRawText,
            Map<String, String> persistedFiles
    ) {
        if (!persistedFiles.isEmpty()) {
            String filesList = persistedFiles.keySet().stream()
                    .map(p -> "- `" + p + "`")
                    .collect(java.util.stream.Collectors.joining("\n"));
            String summaryHeader = String.format("Created and saved %d file(s) to your project:\n%s", persistedFiles.size(), filesList);

            String candidate = !streamedUserFacingText.isBlank()
                    ? streamedUserFacingText.trim()
                    : llmResponseParser.extractUserFacingMessage(fullRawText);

            if (candidate.isBlank() || isGenericCompletionMessage(candidate)) {
                return summaryHeader;
            }

            if (!candidate.contains(persistedFiles.keySet().iterator().next())) {
                return candidate + "\n\n" + summaryHeader;
            }

            return candidate;
        }

        if (isFileGenerationRequest(userPrompt)) {
            return "Failed to generate the requested files. No files were saved to the workspace.";
        }

        String candidate = !streamedUserFacingText.isBlank()
                ? streamedUserFacingText.trim()
                : llmResponseParser.extractUserFacingMessage(fullRawText);

        return !candidate.isBlank() ? candidate : "Request processed.";
    }

    private void extractAndPersistCodeBlocks(
            Long projectId,
            String rawText,
            String userMessage,
            Map<String, String> persistedFiles,
            FluxSink<StreamResponse> sink
    ) {
        if (rawText == null || rawText.isBlank()) return;

        // 1. Check for complete HTML document in fenced code block
        java.util.regex.Pattern htmlDocPattern = java.util.regex.Pattern.compile(
                "(?i)```(?:html|htm)?\\s*(<!DOCTYPE html[\\s\\S]*?</html>)\\s*```"
        );
        java.util.regex.Matcher htmlMatcher = htmlDocPattern.matcher(rawText);
        if (htmlMatcher.find()) {
            String htmlContent = htmlMatcher.group(1).trim();
            saveExtractedFile(projectId, "index.html", htmlContent, persistedFiles, sink);
            return;
        }

        // Raw HTML without markdown fence
        java.util.regex.Pattern rawHtmlPattern = java.util.regex.Pattern.compile(
                "(?i)(<!DOCTYPE html[\\s\\S]*?</html>)"
        );
        java.util.regex.Matcher rawHtmlMatcher = rawHtmlPattern.matcher(rawText);
        if (rawHtmlMatcher.find()) {
            String htmlContent = rawHtmlMatcher.group(1).trim();
            saveExtractedFile(projectId, "index.html", htmlContent, persistedFiles, sink);
            return;
        }

        // React snippets are intentionally not written to guessed paths.
        // A component saved as Hero.tsx is not necessarily imported by the app,
        // so this fallback previously reported success for code that never rendered.
        // Ask the agent protocol to provide explicit <file path="..."> payloads instead.
    }

    private void saveExtractedFile(
            Long projectId,
            String path,
            String content,
            Map<String, String> persistedFiles,
            FluxSink<StreamResponse> sink
    ) {
        try {
            sink.next(StreamResponse.status("Saving " + path + "..."));
            workspaceClient.saveFile(projectId, path, content);
            persistedFiles.put(path, content);
            sink.next(StreamResponse.fileChanged(path, "created", content));
            sink.next(StreamResponse.status("Saved " + path));
            log.info("Saved extracted file: {} for project {}", path, projectId);
        } catch (Exception e) {
            log.error("Failed to save extracted file {}: {}", path, e.getMessage());
            sink.next(StreamResponse.error("Failed to save " + path + ": " + e.getMessage()));
        }
    }
}