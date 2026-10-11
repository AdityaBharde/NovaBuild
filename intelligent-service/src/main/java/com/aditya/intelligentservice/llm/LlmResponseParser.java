
package com.aditya.intelligentservice.llm;

import com.aditya.commonlib.enums.ChatEventStatus;
import com.aditya.commonlib.enums.ChatEventType;
import com.aditya.intelligentservice.entity.ChatEvent;
import com.aditya.intelligentservice.entity.ChatMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
@Slf4j
public class LlmResponseParser {

    private static final Pattern GENERIC_TAG_PATTERN = Pattern.compile(
            "<(message|file|tool)\\b([^>]*)>([\\s\\S]*?)</\\1\\s*>",
            Pattern.CASE_INSENSITIVE
    );

    private static final Pattern ATTRIBUTE_PATTERN = Pattern.compile(
            "\\b(path|args|phase|name)\\s*=\\s*(?:\"([^\"]*)\"|'([^']*)'|([^\\s>\"']+))",
            Pattern.CASE_INSENSITIVE
    );

    public List<ChatEvent> parseChatEvents(
            String fullResponse,
            ChatMessage parentMessage
    ) {
        List<ChatEvent> events = new ArrayList<>();

        if (fullResponse == null || fullResponse.isBlank()) {
            log.warn("Cannot parse empty LLM response");
            return events;
        }

        if (parentMessage == null) {
            log.warn("Cannot parse LLM response without a parent message");
            return events;
        }

        int orderCounter = 1;

        Matcher matcher = GENERIC_TAG_PATTERN.matcher(fullResponse);

        while (matcher.find()) {
            String tagName = matcher.group(1).toLowerCase();
            String attributes = matcher.group(2);
            String content = matcher.group(3).trim();

            Map<String, String> attrMap = extractAttributes(attributes);

            ChatEvent.ChatEventBuilder builder = ChatEvent.builder()
                    .status(ChatEventStatus.CONFIRMED)
                    .chatMessage(parentMessage)
                    .content(content)
                    .sequenceOrder(orderCounter);

            switch (tagName) {
                case "message" -> {
                    String phase = attrMap.get("phase");

                    // Do not expose planning messages as normal chat events.
                    if ("planning".equalsIgnoreCase(phase)) {
                        continue;
                    }

                    builder.type(ChatEventType.MESSAGE);
                }

                case "file" -> {
                    String path = attrMap.get("path");

                    if (path == null || path.isBlank()) {
                        log.warn("Skipping generated file because its path is missing");
                        continue;
                    }

                    builder.type(ChatEventType.FILE_EDIT)
                            .status(ChatEventStatus.PENDING)
                            .filePath(path);

                    // Keep the generated file content in the event.
                }

                case "tool" -> {
                    builder.type(ChatEventType.TOOL_LOG)
                            .metadata(attrMap.get("args"));
                }

                default -> {
                    continue;
                }
            }

            events.add(builder.build());
            orderCounter++;
        }

        if (events.isEmpty()) {
            log.warn("No valid chat events found in the LLM response");
        }

        return events;
    }

    public String extractUserFacingMessage(String fullResponse) {
        if (fullResponse == null || fullResponse.isBlank()) {
            return "";
        }

        // 1. Look for <message phase="completed">...</message>
        Pattern completedPattern = Pattern.compile(
                "<message\\b[^>]*\\bphase\\s*=\\s*\"completed\"[^>]*>([\\s\\S]*?)</message\\s*>",
                Pattern.CASE_INSENSITIVE
        );
        Matcher matcher = completedPattern.matcher(fullResponse);
        if (matcher.find()) {
            String text = matcher.group(1).trim();
            if (!text.isEmpty()) {
                return text;
            }
        }

        // 2. Look for any <message> without phase="planning"
        Pattern generalMessagePattern = Pattern.compile(
                "<message\\b([^>]*)>([\\s\\S]*?)</message\\s*>",
                Pattern.CASE_INSENSITIVE
        );
        Matcher generalMatcher = generalMessagePattern.matcher(fullResponse);
        StringBuilder messagesText = new StringBuilder();
        while (generalMatcher.find()) {
            String attrs = generalMatcher.group(1);
            if (!attrs.toLowerCase().contains("phase=\"planning\"") && !attrs.toLowerCase().contains("phase=\"start\"")) {
                String text = generalMatcher.group(2).trim();
                if (!text.isEmpty()) {
                    if (messagesText.length() > 0) messagesText.append("\n\n");
                    messagesText.append(text);
                }
            }
        }
        if (messagesText.length() > 0) {
            return messagesText.toString();
        }

        // 3. Fallback: Strip internal protocol tags
        String stripped = fullResponse
                .replaceAll("(?i)<message\\b[^>]*\\bphase\\s*=\\s*\"(planning|start)\"[^>]*>[\\s\\S]*?</message\\s*>", "")
                .replaceAll("(?i)<tool\\b[^>]*>[\\s\\S]*?</tool\\s*>", "")
                .replaceAll("(?i)<tool\\b[^>]*/>", "")
                .replaceAll("(?i)<file\\b[^>]*>[\\s\\S]*?</file\\s*>", "")
                .replaceAll("(?i)</?message\\b[^>]*>", "")
                .trim();

        if (!stripped.isBlank()) {
            return stripped;
        }

        return "";
    }

    private Map<String, String> extractAttributes(String attributeString) {
        Map<String, String> attributes = new HashMap<>();

        if (attributeString == null || attributeString.isBlank()) {
            return attributes;
        }

        Matcher matcher = ATTRIBUTE_PATTERN.matcher(attributeString);

        while (matcher.find()) {
            String val = matcher.group(2) != null ? matcher.group(2)
                    : matcher.group(3) != null ? matcher.group(3)
                    : matcher.group(4);
            attributes.put(
                    matcher.group(1).toLowerCase(),
                    val != null ? val : ""
            );
        }

        return attributes;
    }
}