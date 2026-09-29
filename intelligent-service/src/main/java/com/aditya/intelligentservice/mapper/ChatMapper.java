package com.aditya.intelligentservice.mapper;

import com.aditya.intelligentservice.dto.ChatResponse;
import com.aditya.intelligentservice.entity.ChatMessage;
import org.mapstruct.Mapper;

import java.util.List;

@Mapper(componentModel = "spring")
public interface ChatMapper {

    List<ChatResponse> fromListOfChatMessage(List<ChatMessage> chatMessageList);
}