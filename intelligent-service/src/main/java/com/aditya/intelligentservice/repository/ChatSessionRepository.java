package com.aditya.intelligentservice.repository;


import com.aditya.intelligentservice.entity.ChatSession;
import com.aditya.intelligentservice.entity.ChatSessionId;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface ChatSessionRepository extends JpaRepository<ChatSession, Long> {
    Optional<ChatSession> findByProjectId(Long projectId);
    Optional<ChatSession> findByProjectIdAndUserId(Long projectId, Long userId);
}
