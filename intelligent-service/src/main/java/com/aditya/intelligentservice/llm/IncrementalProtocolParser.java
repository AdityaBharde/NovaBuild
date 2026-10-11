package com.aditya.intelligentservice.llm;

import lombok.extern.slf4j.Slf4j;

import java.util.HashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
public class IncrementalProtocolParser {

    public interface ProtocolEventListener {
        void onStatus(String status);
        void onToolCall(String toolName, String rawArgs, String body);
        void onFileGenerating(String path);
        void onFileCompleted(String path, String content);
        void onTextDelta(String text);
        void onError(String error);
    }

    private enum State {
        DEFAULT,
        IN_PLANNING_MESSAGE,
        IN_COMPLETED_MESSAGE,
        IN_FILE,
        IN_TOOL
    }

    private static final Pattern TAG_START_PATTERN = Pattern.compile(
            "^<(message|file|tool)\\b([^>]*)>",
            Pattern.CASE_INSENSITIVE
    );

    private static final Pattern ATTRIBUTE_PATTERN = Pattern.compile(
            "\\b(path|args|phase|name)\\s*=\\s*(?:\"([^\"]*)\"|'([^']*)'|([^\\s>\"']+))",
            Pattern.CASE_INSENSITIVE
    );

    private final ProtocolEventListener listener;
    private State state = State.DEFAULT;
    private final StringBuilder buffer = new StringBuilder();

    private final StringBuilder fileContentBuffer = new StringBuilder();
    private String currentFilePath = "";

    private final StringBuilder toolBodyBuffer = new StringBuilder();
    private String currentToolName = "";
    private String currentToolArgs = "";

    private final StringBuilder planningBuffer = new StringBuilder();

    public IncrementalProtocolParser(ProtocolEventListener listener) {
        this.listener = listener;
    }

    public synchronized void processChunk(String chunk) {
        if (chunk == null || chunk.isEmpty()) {
            return;
        }

        // Filter provider termination marker
        if ("[DONE]".equalsIgnoreCase(chunk.trim())) {
            return;
        }

        buffer.append(chunk);
        parseBuffer();
    }

    private void parseBuffer() {
        boolean progress = true;
        while (progress && buffer.length() > 0) {
            progress = switch (state) {
                case DEFAULT -> parseDefault();
                case IN_PLANNING_MESSAGE -> parsePlanning();
                case IN_COMPLETED_MESSAGE -> parseCompleted();
                case IN_FILE -> parseFile();
                case IN_TOOL -> parseTool();
            };
        }
    }

    private boolean parseDefault() {
        int ltIndex = buffer.indexOf("<");
        if (ltIndex == -1) {
            // No tag start, emit all as text delta if not purely whitespace
            String text = buffer.toString();
            buffer.setLength(0);
            if (!text.isBlank()) {
                listener.onTextDelta(text);
            }
            return false;
        }

        if (ltIndex > 0) {
            String prefix = buffer.substring(0, ltIndex);
            buffer.delete(0, ltIndex);
            if (!prefix.isBlank()) {
                listener.onTextDelta(prefix);
            }
            return true;
        }

        // buffer starts with '<'
        int gtIndex = buffer.indexOf(">");
        if (gtIndex == -1) {
            // Tag is incomplete; wait for more chunks
            // Unless the buffer is getting too long without finding '>', check if it's really a protocol tag
            if (buffer.length() > 256) {
                // Not a valid protocol tag, emit '<' and continue
                char c = buffer.charAt(0);
                buffer.deleteCharAt(0);
                listener.onTextDelta(String.valueOf(c));
                return true;
            }
            return false;
        }

        String tagString = buffer.substring(0, gtIndex + 1);

        // Check if closing tag
        if (tagString.startsWith("</")) {
            buffer.delete(0, gtIndex + 1);
            // Stray closing tags in default state are safely consumed
            return true;
        }

        Matcher matcher = TAG_START_PATTERN.matcher(tagString);
        if (matcher.find()) {
            String tagName = matcher.group(1).toLowerCase();
            String attributes = matcher.group(2);
            Map<String, String> attrMap = extractAttributes(attributes);
            buffer.delete(0, gtIndex + 1);

            switch (tagName) {
                case "message" -> {
                    String phase = attrMap.getOrDefault("phase", "");
                    if ("planning".equalsIgnoreCase(phase) || "start".equalsIgnoreCase(phase)) {
                        state = State.IN_PLANNING_MESSAGE;
                        planningBuffer.setLength(0);
                    } else {
                        state = State.IN_COMPLETED_MESSAGE;
                    }
                }
                case "file" -> {
                    currentFilePath = attrMap.getOrDefault("path", attrMap.getOrDefault("name", "")).trim();
                    currentFilePath = currentFilePath.replaceAll("^[\"']+|[\"']+$", "").trim();
                    if (currentFilePath.isEmpty()) {
                        currentFilePath = "index.html";
                    }
                    fileContentBuffer.setLength(0);
                    state = State.IN_FILE;
                    listener.onFileGenerating(currentFilePath);
                }
                case "tool" -> {
                    currentToolName = attrMap.getOrDefault("name", attrMap.getOrDefault("tool", attrMap.getOrDefault("args", ""))).trim();
                    currentToolArgs = attrMap.getOrDefault("args", attrMap.getOrDefault("path", ""));
                    toolBodyBuffer.setLength(0);
                    if (tagString.endsWith("/>")) {
                        // Self-closing
                        listener.onToolCall(currentToolName, currentToolArgs, "");
                    } else {
                        state = State.IN_TOOL;
                    }
                }
            }
            return true;
        }

        // Not a protocol tag (e.g. <span> or other html tag outside file)
        buffer.delete(0, gtIndex + 1);
        listener.onTextDelta(tagString);
        return true;
    }

    private boolean parsePlanning() {
        int closeIndex = indexOfIgnoreCase(buffer, "</message>");
        if (closeIndex != -1) {
            String planPart = buffer.substring(0, closeIndex);
            planningBuffer.append(planPart);
            buffer.delete(0, closeIndex + "</message>".length());
            state = State.DEFAULT;

            String fullPlan = planningBuffer.toString().trim();
            if (!fullPlan.isEmpty()) {
                String summary = fullPlan.length() > 120 ? fullPlan.substring(0, 117) + "..." : fullPlan;
                listener.onStatus("Planning: " + summary);
            }
            return true;
        }

        // Hold trailing partial '</message>' if any
        int safeLength = getSafeLengthBeforeClosingTag(buffer, "</message>");
        if (safeLength > 0) {
            String part = buffer.substring(0, safeLength);
            planningBuffer.append(part);
            buffer.delete(0, safeLength);
        }
        return false;
    }

    private boolean parseCompleted() {
        int closeIndex = indexOfIgnoreCase(buffer, "</message>");
        if (closeIndex != -1) {
            String textPart = buffer.substring(0, closeIndex);
            buffer.delete(0, closeIndex + "</message>".length());
            state = State.DEFAULT;
            if (!textPart.isEmpty()) {
                listener.onTextDelta(textPart);
            }
            return true;
        }

        int safeLength = getSafeLengthBeforeClosingTag(buffer, "</message>");
        if (safeLength > 0) {
            String part = buffer.substring(0, safeLength);
            buffer.delete(0, safeLength);
            listener.onTextDelta(part);
            return true;
        }
        return false;
    }

    private boolean parseFile() {
        int closeIndex = indexOfIgnoreCase(buffer, "</file>");
        if (closeIndex != -1) {
            String filePart = buffer.substring(0, closeIndex);
            fileContentBuffer.append(filePart);
            buffer.delete(0, closeIndex + "</file>".length());
            state = State.DEFAULT;

            listener.onFileCompleted(currentFilePath, fileContentBuffer.toString());
            return true;
        }

        int safeLength = getSafeLengthBeforeClosingTag(buffer, "</file>");
        if (safeLength > 0) {
            String part = buffer.substring(0, safeLength);
            fileContentBuffer.append(part);
            buffer.delete(0, safeLength);
            return true;
        }
        return false;
    }

    private boolean parseTool() {
        int closeIndex = indexOfIgnoreCase(buffer, "</tool>");
        if (closeIndex != -1) {
            String toolPart = buffer.substring(0, closeIndex);
            toolBodyBuffer.append(toolPart);
            buffer.delete(0, closeIndex + "</tool>".length());
            state = State.DEFAULT;

            listener.onToolCall(currentToolName, currentToolArgs, toolBodyBuffer.toString());
            return true;
        }

        int safeLength = getSafeLengthBeforeClosingTag(buffer, "</tool>");
        if (safeLength > 0) {
            String part = buffer.substring(0, safeLength);
            toolBodyBuffer.append(part);
            buffer.delete(0, safeLength);
            return true;
        }
        return false;
    }

    public synchronized void finish() {
        // Flush remaining buffer
        if (state == State.IN_FILE && !currentFilePath.isEmpty()) {
            fileContentBuffer.append(buffer);
            listener.onFileCompleted(currentFilePath, fileContentBuffer.toString());
        } else if (state == State.IN_TOOL && !currentToolName.isEmpty()) {
            toolBodyBuffer.append(buffer);
            listener.onToolCall(currentToolName, currentToolArgs, toolBodyBuffer.toString());
        } else if (state == State.IN_COMPLETED_MESSAGE || state == State.DEFAULT) {
            String remaining = buffer.toString().trim();
            if (!remaining.isEmpty() && !remaining.startsWith("<")) {
                listener.onTextDelta(remaining);
            }
        }
        buffer.setLength(0);
        state = State.DEFAULT;
    }

    private int indexOfIgnoreCase(StringBuilder sb, String target) {
        String lowerSb = sb.toString().toLowerCase();
        return lowerSb.indexOf(target.toLowerCase());
    }

    private int getSafeLengthBeforeClosingTag(StringBuilder sb, String closingTag) {
        String str = sb.toString();
        String lowerStr = str.toLowerCase();
        String lowerTag = closingTag.toLowerCase();

        for (int i = 1; i < lowerTag.length(); i++) {
            String prefix = lowerTag.substring(0, i);
            if (lowerStr.endsWith(prefix)) {
                return str.length() - prefix.length();
            }
        }
        return str.length();
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
            attributes.put(matcher.group(1).toLowerCase(), val != null ? val : "");
        }
        return attributes;
    }
}
