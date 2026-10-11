package com.aditya.intelligentservice.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record StreamResponse(
        String type,
        String text,
        String status,
        String tool,
        String args,
        String result,
        Boolean success,
        String path,
        String action,
        String content,
        String messageId,
        String error
) {
    public StreamResponse(String text) {
        this("text_delta", text, null, null, null, null, null, null, null, null, null, null);
    }

    public static StreamResponse messageStart(String messageId) {
        return new StreamResponse("message_start", null, null, null, null, null, null, null, null, null, messageId, null);
    }

    public static StreamResponse status(String status) {
        return new StreamResponse("status", null, status, null, null, null, null, null, null, null, null, null);
    }

    public static StreamResponse toolStart(String tool, String args) {
        return new StreamResponse("tool_start", null, null, tool, args, null, null, null, null, null, null, null);
    }

    public static StreamResponse toolResult(String tool, String result, boolean success) {
        return new StreamResponse("tool_result", null, null, tool, null, result, success, null, null, null, null, null);
    }

    public static StreamResponse textDelta(String text) {
        return new StreamResponse("text_delta", text, null, null, null, null, null, null, null, null, null, null);
    }

    public static StreamResponse fileChanged(String path, String action, String content) {
        return new StreamResponse("file_changed", null, null, null, null, null, null, path, action, content, null, null);
    }

    public static StreamResponse messageComplete(String messageId) {
        return new StreamResponse("message_complete", null, null, null, null, null, null, null, null, null, messageId, null);
    }

    public static StreamResponse error(String error) {
        return new StreamResponse("error", null, null, null, null, null, null, null, null, null, null, error);
    }
}