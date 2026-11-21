package com.careerpilot.backend.client;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.Map;

@Component
public class AiServiceClient {

    private final WebClient webClient;

    public AiServiceClient(
            @Value("${app.ai-service.base-url}") String baseUrl,
            @Value("${app.ai-service.internal-key}") String internalKey) {
        this.webClient = WebClient.builder()
                .baseUrl(baseUrl)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .defaultHeader("X-Internal-Service-Key", internalKey)
                .build();
    }

    public Mono<Map> checkHealth() {
        return webClient.get()
                .uri("/internal/ai/health")
                .retrieve()
                .bodyToMono(Map.class);
    }

    public Mono<Map> matchJob(Map<String, Object> payload) {
        return webClient.post()
                .uri("/internal/ai/matches/evaluate")
                .bodyValue(payload)
                .retrieve()
                .bodyToMono(Map.class);
    }

    public Mono<Map> generateInterviewQuestion(Map<String, Object> payload) {
        return webClient.post()
                .uri("/internal/ai/interviews/start-question")
                .bodyValue(payload)
                .retrieve()
                .bodyToMono(Map.class);
    }

    public Mono<Map> evaluateInterviewAnswer(Map<String, Object> payload) {
        return webClient.post()
                .uri("/internal/ai/interviews/evaluate-and-next")
                .bodyValue(payload)
                .retrieve()
                .bodyToMono(Map.class);
    }
}
