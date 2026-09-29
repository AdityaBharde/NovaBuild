package com.aditya.intelligentservice.repository;


import com.aditya.intelligentservice.entity.ChatEvent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ChatEventRepository extends JpaRepository<ChatEvent, Long> {
    Optional<ChatEvent> findBySagaId(String s);
}