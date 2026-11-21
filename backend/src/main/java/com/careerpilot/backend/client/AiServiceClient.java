package com.careerpilot.backend.client;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import reactor.core.publisher.Flux;

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

    public Mono<Map> matchJobMultipart(
            String userId,
            String resumeId,
            String resumeText,
            String resumeSkillsJson,
            int candidateYears,
            String jobDescription,
            String targetRole,
            String companyName,
            String experienceLevel,
            String jobType,
            byte[] jdFileBytes,
            String jdFilename) {
        MultipartBodyBuilder body = new MultipartBodyBuilder();
        body.part("user_id", userId);
        body.part("resume_id", resumeId);
        body.part("resume_text", resumeText != null ? resumeText : "");
        body.part("resume_skills_json", resumeSkillsJson != null ? resumeSkillsJson : "[]");
        body.part("candidate_years", candidateYears);
        if (jobDescription != null) body.part("job_description", jobDescription);
        if (targetRole != null) body.part("target_role", targetRole);
        if (companyName != null) body.part("company_name", companyName);
        if (experienceLevel != null) body.part("experience_level", experienceLevel);
        if (jobType != null) body.part("job_type", jobType);
        if (jdFileBytes != null && jdFilename != null) {
            body.part("jd_file", new ByteArrayResource(jdFileBytes) {
                @Override
                public String getFilename() {
                    return jdFilename;
                }
            });
        }
        return webClient.post()
                .uri("/internal/ai/matches/evaluate")
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .body(BodyInserters.fromMultipartData(body.build()))
                .retrieve()
                .bodyToMono(Map.class);
    }

    public Mono<Map> parseAndEvaluateResume(
            byte[] fileBytes,
            String filename,
            String userId,
            String resumeId,
            String targetRole,
            String experienceLevel,
            String analysisType,
            String fileType) {
        MultipartBodyBuilder body = new MultipartBodyBuilder();
        body.part("file", new ByteArrayResource(fileBytes) {
            @Override
            public String getFilename() {
                return filename;
            }
        });
        body.part("user_id", userId);
        body.part("resume_id", resumeId);
        body.part("target_role", targetRole != null ? targetRole : "Full Stack Developer");
        body.part("experience_level", experienceLevel != null ? experienceLevel : "Fresher");
        body.part("analysis_type", analysisType != null ? analysisType : "COMPLETE_ANALYSIS");
        body.part("file_type", fileType != null ? fileType : "PDF");

        return webClient.post()
                .uri("/internal/ai/resumes/parse-and-evaluate")
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .body(BodyInserters.fromMultipartData(body.build()))
                .retrieve()
                .bodyToMono(Map.class);
    }

    public Mono<Map> tailorResume(Map<String, Object> payload) {
        return webClient.post()
                .uri("/internal/ai/resumes/tailor")
                .bodyValue(payload)
                .retrieve()
                .bodyToMono(Map.class);
    }

    public Mono<Map> deleteResumeVectors(String userId, String resumeId) {
        return webClient.post()
                .uri("/internal/ai/resumes/vectors/delete")
                .bodyValue(Map.of("user_id", userId, "resume_id", resumeId))
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

    public Mono<Map> summarizeInterview(Map<String, Object> payload) {
        return webClient.post()
                .uri("/internal/ai/interviews/summarize")
                .bodyValue(payload)
                .retrieve()
                .bodyToMono(Map.class);
    }

    public Mono<Map> transcribeAudio(byte[] audio, String filename, String mimeType, double durationSeconds) {
        MultipartBodyBuilder body = new MultipartBodyBuilder();
        body.part("audio", new ByteArrayResource(audio) {
            @Override
            public String getFilename() {
                return filename;
            }
        }).contentType(MediaType.parseMediaType(mimeType));
        body.part("mime_type", mimeType);
        body.part("duration_seconds", durationSeconds);
        return webClient.post()
                .uri("/internal/ai/interviews/transcribe-audio")
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .body(BodyInserters.fromMultipartData(body.build()))
                .retrieve()
                .bodyToMono(Map.class);
    }

    public Flux<String> streamInterviewHint(Map<String, Object> payload) {
        return webClient.post()
                .uri("/internal/ai/interviews/stream-hint")
                .accept(MediaType.TEXT_EVENT_STREAM)
                .bodyValue(payload)
                .retrieve()
                .bodyToFlux(String.class);
    }

    public Mono<Map> generateDrills(Map<String, Object> payload) {
        return webClient.post()
                .uri("/internal/ai/drills/generate")
                .bodyValue(payload)
                .retrieve()
                .bodyToMono(Map.class);
    }

    public Mono<Map> analyzeGitHub(String repoUrl) {
        return webClient.post()
                .uri("/internal/ai/projects/analyze-github")
                .bodyValue(Map.of("repo_url", repoUrl))
                .retrieve()
                .bodyToMono(Map.class);
    }

    public Mono<Map> analyzeSkillGap(Map<String, Object> payload) {
        return webClient.post()
                .uri("/internal/ai/skills/analyze-gap")
                .bodyValue(payload)
                .retrieve()
                .bodyToMono(Map.class);
    }

    public Mono<Map> generateRoadmap(Map<String, Object> payload) {
        return webClient.post()
                .uri("/internal/ai/roadmap/generate")
                .bodyValue(payload)
                .retrieve()
                .bodyToMono(Map.class);
    }
}
