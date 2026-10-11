package com.aditya.intelligentservice.config;

import org.springframework.boot.web.reactive.function.client.WebClientCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenRouterConfig {

    /**
     * Injects the required HTTP-Referer and X-Title headers into Spring WebClient.
     * OpenRouter requires these headers for all free models to prevent abuse.
     */
    @Bean
    public WebClientCustomizer openRouterWebClientCustomizer() {
        return webClientBuilder -> webClientBuilder
                .defaultHeader("HTTP-Referer", "http://localhost:8083")
                .defaultHeader("X-Title", "NovaBuild Local");
    }
}
