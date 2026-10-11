package com.aditya.intelligentservice.repository;

import com.aditya.intelligentservice.entity.ChatSession;
import com.aditya.intelligentservice.entity.ChatSessionId;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ChatSessionRepository extends JpaRepository<ChatSession, ChatSessionId> {
}
