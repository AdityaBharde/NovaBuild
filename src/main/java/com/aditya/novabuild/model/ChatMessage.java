package com.aditya.novabuild.model;

import com.aditya.novabuild.enums.MessageRole;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

import java.time.Instant;

@Getter
@Setter
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ChatMessage {

    Long id;
    ChatSession chatSession;

    String content;
    String toolCalls;

    MessageRole role;

    Integer tokensUsed;
    Instant createdAt;

}
