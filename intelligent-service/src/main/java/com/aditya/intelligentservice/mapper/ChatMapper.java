package com.aditya.intelligentservice.mapper;

import com.aditya.intelligentservice.dto.ChatResponse;
import com.aditya.intelligentservice.entity.ChatMessage;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

import java.util.List;

@Mapper(
        componentModel = "spring",
        unmappedTargetPolicy = ReportingPolicy.WARN
)
public interface ChatMapper {

    @Mapping(target = "id", source = "id")
    @Mapping(target = "role", source = "role")
    @Mapping(target = "events", source = "events")
    @Mapping(target = "content", source = "content")
    @Mapping(target = "tokensUsed", source = "tokensUsed")
    @Mapping(target = "createdAt", source = "createdAt")
    ChatResponse fromChatMessage(ChatMessage chatMessage);

    List<ChatResponse> fromListOfChatMessage(
            List<ChatMessage> chatMessageList
    );
}