package com.careerpilot.backend.service;

import com.careerpilot.backend.client.AiServiceClient;
import com.careerpilot.backend.entity.InterviewSession;
import com.careerpilot.backend.entity.User;
import com.careerpilot.backend.repository.InterviewSessionRepository;
import com.careerpilot.backend.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.Mockito.*;

class InterviewSessionServiceTest {

    private InterviewSessionRepository sessions;
    private UserRepository users;
    private AiServiceClient aiServiceClient;
    private InterviewSessionService service;
    private final UUID userId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        sessions = mock(InterviewSessionRepository.class);
        users = mock(UserRepository.class);
        aiServiceClient = mock(AiServiceClient.class);
        service = new InterviewSessionService(sessions, users, aiServiceClient, new ObjectMapper());
    }

    @Test
    void startCreatesOwnedSessionWithOpeningQuestion() {
        User user = new User();
        user.setTargetRole("Backend Developer");
        when(users.findById(userId)).thenReturn(Optional.of(user));
        when(aiServiceClient.generateInterviewQuestion(anyMap())).thenReturn(Mono.just(
                Map.of("question", "Explain transaction isolation.", "topic_tag", "Databases", "model_answer", "Answer")));
        UUID sessionId = UUID.randomUUID();
        when(sessions.save(any(InterviewSession.class))).thenAnswer(invocation -> {
            InterviewSession entity = invocation.getArgument(0);
            entity.setId(sessionId);
            return entity;
        });

        Map<String, Object> created = service.start(userId, Map.of(
                "category", "TECHNICAL",
                "difficulty", "MEDIUM",
                "mode", "TEXT",
                "durationMinutes", 30,
                "questionLimit", 5));

        assertEquals(sessionId.toString(), created.get("id"));
        assertEquals("IN_PROGRESS", created.get("status"));
        assertEquals(1, ((List<?>) created.get("questions")).size());
        verify(sessions, times(2)).save(any(InterviewSession.class));
    }

    @Test
    void submitAnswerPersistsEvaluationAndNextQuestion() {
        User user = new User();
        user.setTargetRole("Backend Developer");
        when(users.findById(userId)).thenReturn(Optional.of(user));
        AtomicReference<InterviewSession> saved = new AtomicReference<>();
        UUID sessionId = UUID.randomUUID();
        when(sessions.save(any(InterviewSession.class))).thenAnswer(invocation -> {
            InterviewSession entity = invocation.getArgument(0);
            entity.setId(sessionId);
            saved.set(entity);
            return entity;
        });
        when(aiServiceClient.generateInterviewQuestion(anyMap())).thenReturn(Mono.just(
                Map.of("question", "Explain transaction isolation.", "topic_tag", "Databases", "model_answer", "Answer")));

        Map<String, Object> created = service.start(userId, Map.of());
        Map<String, Object> openingQuestion = (Map<String, Object>) ((List<?>) created.get("questions")).get(0);
        when(sessions.findByIdAndUserId(sessionId, userId)).thenAnswer(invocation -> Optional.of(saved.get()));
        when(aiServiceClient.evaluateInterviewAnswer(anyMap())).thenReturn(Mono.just(Map.of(
                "score", 82.0,
                "criteria_scores", Map.of(
                        "technicalAccuracy", 80,
                        "depthOfUnderstanding", 80,
                        "completeness", 80,
                        "clarityAndStructure", 90,
                        "practicalExamples", 80),
                "feedback", "Good explanation.",
                "next_question", Map.of(
                        "question", "How do indexes affect writes?",
                        "topic_tag", "Databases",
                        "model_answer", "Indexes trade write cost for read speed.",
                        "is_follow_up", false))));

        Map<String, Object> updated = service.submitAnswer(userId, sessionId, Map.of(
                "questionId", openingQuestion.get("id"),
                "answerText", "Isolation controls concurrent transaction visibility."));

        List<?> questions = (List<?>) updated.get("questions");
        assertEquals(2, questions.size());
        assertEquals(1, updated.get("answeredCount"));
        assertEquals("Isolation controls concurrent transaction visibility.",
                ((Map<?, ?>) questions.get(0)).get("userAnswer"));
    }

    @Test
    void startFallsBackGracefullyWhenAiServiceFails() {
        User user = new User();
        user.setTargetRole("Full Stack Engineer");
        when(users.findById(userId)).thenReturn(Optional.of(user));
        when(aiServiceClient.generateInterviewQuestion(anyMap())).thenThrow(new RuntimeException("Connection refused"));
        UUID sessionId = UUID.randomUUID();
        when(sessions.save(any(InterviewSession.class))).thenAnswer(invocation -> {
            InterviewSession entity = invocation.getArgument(0);
            entity.setId(sessionId);
            return entity;
        });

        Map<String, Object> created = service.start(userId, Map.of(
                "category", "TECHNICAL",
                "difficulty", "MEDIUM",
                "mode", "TEXT",
                "durationMinutes", 30,
                "questionLimit", 5));

        assertEquals(sessionId.toString(), created.get("id"));
        assertEquals("IN_PROGRESS", created.get("status"));
        List<?> questions = (List<?>) created.get("questions");
        assertEquals(1, questions.size());
        Map<?, ?> firstQ = (Map<?, ?>) questions.get(0);
        assertNotNull(firstQ.get("question"));
        assertNotNull(firstQ.get("topicTag"));
    }

    @Test
    void getDoesNotExposeAnotherUsersSession() {
        UUID sessionId = UUID.randomUUID();
        when(sessions.findByIdAndUserId(sessionId, userId)).thenReturn(Optional.empty());

        assertThrows(ResponseStatusException.class, () -> service.get(userId, sessionId));
    }
}
