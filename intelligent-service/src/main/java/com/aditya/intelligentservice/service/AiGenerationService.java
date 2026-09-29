package com.aditya.intelligentservice.service;

import com.aditya.intelligentservice.dto.StreamResponse;
import reactor.core.publisher.Flux;

public interface AiGenerationService {
    Flux<StreamResponse> streamResponse(String message, Long projectId);
}