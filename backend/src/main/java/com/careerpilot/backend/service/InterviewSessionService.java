package com.careerpilot.backend.service;

import com.careerpilot.backend.client.AiServiceClient;
import com.careerpilot.backend.entity.InterviewSession;
import com.careerpilot.backend.entity.User;
import com.careerpilot.backend.repository.InterviewSessionRepository;
import com.careerpilot.backend.repository.UserRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClientRequestException;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Flux;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Supplier;

@Service
public class InterviewSessionService {

    private final InterviewSessionRepository sessions;
    private final UserRepository users;
    private final AiServiceClient aiServiceClient;
    private final ObjectMapper objectMapper;

    public InterviewSessionService(
            InterviewSessionRepository sessions,
            UserRepository users,
            AiServiceClient aiServiceClient,
            ObjectMapper objectMapper) {
        this.sessions = sessions;
        this.users = users;
        this.aiServiceClient = aiServiceClient;
        this.objectMapper = objectMapper;
    }

    public List<Map<String, Object>> list(UUID userId) {
        return sessions.findAllByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::readSession)
                .toList();
    }

    public Map<String, Object> get(UUID userId, UUID sessionId) {
        return readSession(findOwned(userId, sessionId));
    }

    public Map<String, Object> start(UUID userId, Map<String, Object> input) {
        User user = users.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        String targetRole = stringValue(input.get("targetRole"), user.getTargetRole());
        String category = stringValue(input.get("category"), "TECHNICAL");
        String difficulty = stringValue(input.get("difficulty"), "MEDIUM");
        String mode = stringValue(input.get("mode"), "TEXT");
        int durationMinutes = intValue(input.get("durationMinutes"), 30);
        int questionLimit = intValue(input.get("questionLimit"), 5);
        if (!Set.of("TECHNICAL", "HR", "DSA", "JAVA", "PYTHON", "SQL", "FULL_STACK",
                "PROJECT_BASED", "BEHAVIORAL", "MIXED").contains(category)
                || !Set.of("EASY", "MEDIUM", "HARD").contains(difficulty)
                || !Set.of("TEXT", "VOICE").contains(mode)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid interview configuration");
        }
        if (targetRole.length() < 2 || targetRole.length() > 120
                || durationMinutes < 5 || durationMinutes > 90
                || questionLimit < 3 || questionLimit > 20) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Interview settings are outside allowed limits");
        }

        Map<String, Object> aiRequest = new LinkedHashMap<>();
        aiRequest.put("user_id", userId.toString());
        aiRequest.put("category", category);
        aiRequest.put("target_role", targetRole);
        aiRequest.put("subcategories", listValue(input.get("subcategories")));
        aiRequest.put("difficulty", difficulty);
        aiRequest.put("years_experience", user.getYearsExperience());
        putIfPresent(aiRequest, "resume_id", input.get("resumeId"));
        putIfPresent(aiRequest, "target_job_description", input.get("targetJobDescription"));

        Map<String, Object> generated = requestAi(() -> aiServiceClient.generateInterviewQuestion(aiRequest).block());
        Map<String, Object> question = new LinkedHashMap<>();
        question.put("id", UUID.randomUUID().toString());
        question.put("questionOrder", 1);
        question.put("question", generated.get("question"));
        question.put("topicTag", generated.getOrDefault("topic_tag", "General"));
        question.put("modelAnswer", generated.getOrDefault("model_answer", ""));
        question.put("isFollowUp", false);
        question.put("userAnswer", null);
        question.put("score", null);
        question.put("criteriaScores", null);
        question.put("feedback", null);

        Map<String, Object> state = new LinkedHashMap<>();
        state.put("category", aiRequest.get("category"));
        state.put("targetRole", targetRole);
        state.put("subcategories", aiRequest.get("subcategories"));
        state.put("difficulty", difficulty);
        state.put("mode", mode);
        state.put("durationMinutes", durationMinutes);
        state.put("questionLimit", questionLimit);
        state.put("status", "IN_PROGRESS");
        state.put("createdAt", Instant.now().toString());
        state.put("answeredCount", 0);
        state.put("questions", new ArrayList<>(List.of(question)));
        state.put("feedbackSummary", null);
        state.put("overallScore", null);
        putIfPresent(state, "resumeId", input.get("resumeId"));

        InterviewSession entity = new InterviewSession();
        entity.setUserId(userId);
        entity.setSessionData("{}");
        entity = sessions.save(entity);
        state.put("id", entity.getId().toString());
        entity.setSessionData(writeSession(state));
        sessions.save(entity);
        return state;
    }

    public Map<String, Object> submitAnswer(UUID userId, UUID sessionId, Map<String, Object> input) {
        return submitAnswer(userId, sessionId, input, null);
    }

    public Map<String, Object> transcribeAudio(
            UUID userId,
            UUID sessionId,
            byte[] audio,
            String filename,
            String mimeType,
            double durationSeconds) {
        findOwned(userId, sessionId);
        Map<String, Object> response = requestAi(() ->
                aiServiceClient.transcribeAudio(audio, filename, mimeType, durationSeconds).block());
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("transcript", response.get("transcript"));
        result.put("speechMetrics", response.get("speech_metrics"));
        return result;
    }

    public Map<String, Object> submitVoiceAnswer(
            UUID userId,
            UUID sessionId,
            String questionId,
            byte[] audio,
            String filename,
            String mimeType,
            double durationSeconds) {
        Map<String, Object> transcription = transcribeAudio(
                userId, sessionId, audio, filename, mimeType, durationSeconds);
        Map<String, Object> input = new LinkedHashMap<>();
        input.put("questionId", questionId);
        input.put("answerText", transcription.get("transcript"));
        input.put("speechMetrics", transcription.get("speechMetrics"));
        return submitAnswer(userId, sessionId, input);
    }

    public Flux<String> streamHint(UUID userId, UUID sessionId, String questionId) {
        Map<String, Object> state = get(userId, sessionId);
        Map<String, Object> question = questionList(state).stream()
                .filter(item -> questionId.equals(item.get("id")))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Question not found"));
        Map<String, Object> request = new LinkedHashMap<>();
        request.put("category", state.get("category"));
        request.put("difficulty", state.get("difficulty"));
        request.put("target_role", state.get("targetRole"));
        request.put("question", question.get("question"));
        request.put("topic_tag", question.get("topicTag"));
        return aiServiceClient.streamInterviewHint(request)
                .onErrorMap(WebClientRequestException.class, ex -> new ResponseStatusException(
                        HttpStatus.SERVICE_UNAVAILABLE,
                        "AI service is unavailable. Configure APP_AI_SERVICE_BASE_URL and deploy the AI service.",
                        ex));
    }

    private Map<String, Object> submitAnswer(
            UUID userId,
            UUID sessionId,
            Map<String, Object> input,
            Object suppliedSpeechMetrics) {
        InterviewSession entity = findOwned(userId, sessionId);
        Map<String, Object> state = readSession(entity);
        if (!"IN_PROGRESS".equals(state.get("status"))) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Interview session is not in progress");
        }
        List<Map<String, Object>> questions = questionList(state);
        String questionId = stringValue(input.get("questionId"), "");
        Map<String, Object> current = questions.stream()
                .filter(question -> questionId.equals(question.get("id")))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Question not found"));
        if (current.get("userAnswer") != null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This question has already been answered");
        }

        String answer = stringValue(input.get("answerText"), "").trim();
        if (answer.length() < 5) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Answer must contain at least 5 characters");
        }
        Map<String, Object> pending = questions.stream()
                .filter(question -> question.get("userAnswer") == null)
                .findFirst()
                .orElse(null);
        if (pending != current) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Answer the current question before continuing");
        }

        int answeredCount = intValue(state.get("answeredCount"), 0) + 1;
        int questionLimit = intValue(state.get("questionLimit"), 5);
        Map<String, Object> aiRequest = new LinkedHashMap<>();
        aiRequest.put("user_id", userId.toString());
        aiRequest.put("category", state.get("category"));
        aiRequest.put("difficulty", state.get("difficulty"));
        aiRequest.put("target_role", state.get("targetRole"));
        aiRequest.put("subcategories", listValue(state.get("subcategories")));
        aiRequest.put("current_question", current.get("question"));
        aiRequest.put("current_topic_tag", current.get("topicTag"));
        aiRequest.put("current_model_answer", current.get("modelAnswer"));
        aiRequest.put("current_is_follow_up", Boolean.TRUE.equals(current.get("isFollowUp")));
        aiRequest.put("user_answer", answer);
        aiRequest.put("remaining_questions", Math.max(0, questionLimit - answeredCount));
        aiRequest.put("previous_qa", previousAnswers(questions, current));
        putIfPresent(aiRequest, "resume_id", state.get("resumeId"));
        putIfPresent(aiRequest, "submission_context", input.get("submissionContext"));

        Map<String, Object> evaluation = requestAi(() -> aiServiceClient.evaluateInterviewAnswer(aiRequest).block());
        current.put("userAnswer", answer);
        current.put("score", evaluation.get("score"));
        current.put("criteriaScores", evaluation.get("criteria_scores"));
        current.put("feedback", evaluation.get("feedback"));
        putIfPresent(current, "speechMetrics",
                suppliedSpeechMetrics != null ? suppliedSpeechMetrics : input.get("speechMetrics"));
        state.put("answeredCount", answeredCount);

        Map<String, Object> next = asMap(evaluation.get("next_question"));
        if (next != null && questions.size() < questionLimit) {
            Map<String, Object> nextQuestion = new LinkedHashMap<>();
            nextQuestion.put("id", UUID.randomUUID().toString());
            nextQuestion.put("questionOrder", questions.size() + 1);
            nextQuestion.put("question", next.get("question"));
            nextQuestion.put("topicTag", next.getOrDefault("topic_tag", "General"));
            nextQuestion.put("modelAnswer", next.getOrDefault("model_answer", ""));
            nextQuestion.put("isFollowUp", Boolean.TRUE.equals(next.get("is_follow_up")));
            nextQuestion.put("userAnswer", null);
            nextQuestion.put("score", null);
            nextQuestion.put("criteriaScores", null);
            nextQuestion.put("feedback", null);
            questions.add(nextQuestion);
        } else {
            completeState(userId, state, questions);
        }

        state.put("questions", questions);
        entity.setSessionData(writeSession(state));
        sessions.save(entity);
        return state;
    }

    public Map<String, Object> complete(UUID userId, UUID sessionId) {
        InterviewSession entity = findOwned(userId, sessionId);
        Map<String, Object> state = readSession(entity);
        completeState(userId, state, questionList(state));
        entity.setSessionData(writeSession(state));
        sessions.save(entity);
        return state;
    }

    public void delete(UUID userId, UUID sessionId) {
        sessions.delete(findOwned(userId, sessionId));
    }

    private void completeState(UUID userId, Map<String, Object> state, List<Map<String, Object>> questions) {
        List<Map<String, Object>> answered = questions.stream()
                .filter(question -> question.get("userAnswer") != null)
                .toList();
        Map<String, Object> summary;
        if (answered.isEmpty()) {
            summary = emptySummary();
        } else {
            Map<String, Object> aiRequest = new LinkedHashMap<>();
            aiRequest.put("category", state.get("category"));
            aiRequest.put("difficulty", state.get("difficulty"));
            aiRequest.put("target_role", state.get("targetRole"));
            aiRequest.put("answered_questions", answered.stream().map(question -> {
                Map<String, Object> item = new LinkedHashMap<>();
                item.put("question", question.get("question"));
                item.put("topic_tag", question.get("topicTag"));
                item.put("user_answer", question.get("userAnswer"));
                item.put("score", question.get("score"));
                item.put("criteria_scores", question.get("criteriaScores"));
                item.put("feedback", question.get("feedback"));
                return item;
            }).toList());
            Map<String, Object> result = requestAi(() -> aiServiceClient.summarizeInterview(aiRequest).block());
            summary = normalizeSummary(result);
        }

        state.put("status", "COMPLETED");
        state.put("answeredCount", answered.size());
        state.put("feedbackSummary", summary);
        state.put("overallScore", summary.get("overallScore"));
    }

    private Map<String, Object> normalizeSummary(Map<String, Object> result) {
        Map<String, Object> normalized = new LinkedHashMap<>();
        normalized.put("overallScore", result.get("overall_score"));
        normalized.put("executiveSummary", result.get("executive_summary"));
        normalized.put("strengths", result.get("strengths"));
        normalized.put("areasToImprove", result.get("areas_to_improve"));
        normalized.put("weakTopics", result.get("weak_topics"));
        normalized.put("rubricAverages", result.get("rubric_averages"));
        normalized.put("ragTopicsCovered", result.get("rag_topics_covered"));
        normalized.put("nextRecommendations", result.get("next_recommendations"));
        return normalized;
    }

    private Map<String, Object> emptySummary() {
        Map<String, Object> rubric = new LinkedHashMap<>();
        rubric.put("technicalAccuracy", 0);
        rubric.put("depthOfUnderstanding", 0);
        rubric.put("completeness", 0);
        rubric.put("clarityAndStructure", 0);
        rubric.put("practicalExamples", 0);
        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("overallScore", 0);
        summary.put("executiveSummary", "No answers were submitted.");
        summary.put("strengths", List.of());
        summary.put("areasToImprove", List.of());
        summary.put("weakTopics", List.of());
        summary.put("rubricAverages", rubric);
        summary.put("ragTopicsCovered", List.of());
        summary.put("nextRecommendations", List.of());
        return summary;
    }

    private List<Map<String, Object>> previousAnswers(
            List<Map<String, Object>> questions, Map<String, Object> current) {
        List<Map<String, Object>> previous = new ArrayList<>();
        for (Map<String, Object> question : questions) {
            if (question == current || question.get("userAnswer") == null) {
                continue;
            }
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("question", question.get("question"));
            item.put("topic_tag", question.get("topicTag"));
            item.put("user_answer", question.get("userAnswer"));
            item.put("score", question.get("score"));
            item.put("is_follow_up", question.get("isFollowUp"));
            previous.add(item);
        }
        return previous;
    }

    private InterviewSession findOwned(UUID userId, UUID sessionId) {
        return sessions.findByIdAndUserId(sessionId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Interview session not found"));
    }

    private Map<String, Object> readSession(InterviewSession entity) {
        try {
            return objectMapper.readValue(entity.getSessionData(), new TypeReference<>() {});
        } catch (Exception ex) {
            throw new IllegalStateException("Could not read interview session data", ex);
        }
    }

    private String writeSession(Map<String, Object> state) {
        try {
            return objectMapper.writeValueAsString(state);
        } catch (Exception ex) {
            throw new IllegalStateException("Could not save interview session data", ex);
        }
    }

    private Map<String, Object> requestAi(Supplier<Map> request) {
        try {
            Map result = request.get();
            if (result == null) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "AI service returned an empty response");
            }
            return asMap(result);
        } catch (WebClientRequestException ex) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "AI service is unavailable. Configure APP_AI_SERVICE_BASE_URL and deploy the AI service.",
                    ex);
        }
    }

    private Map<String, Object> asMap(Object value) {
        if (!(value instanceof Map<?, ?> source)) {
            return null;
        }
        Map<String, Object> result = new LinkedHashMap<>();
        source.forEach((key, item) -> result.put(String.valueOf(key), item));
        return result;
    }

    private List<Map<String, Object>> questionList(Map<String, Object> state) {
        Object value = state.get("questions");
        if (!(value instanceof List<?> list)) {
            throw new IllegalStateException("Interview session has invalid question data");
        }
        return list.stream().map(this::asMap).collect(java.util.stream.Collectors.toCollection(ArrayList::new));
    }

    private List<String> listValue(Object value) {
        if (!(value instanceof List<?> list)) {
            return List.of();
        }
        return list.stream().map(String::valueOf).toList();
    }

    private String stringValue(Object value, String fallback) {
        return value == null || String.valueOf(value).isBlank() ? fallback : String.valueOf(value);
    }

    private int intValue(Object value, int fallback) {
        if (value instanceof Number number) {
            return number.intValue();
        }
        try {
            return value == null ? fallback : Integer.parseInt(String.valueOf(value));
        } catch (NumberFormatException ex) {
            return fallback;
        }
    }

    private void putIfPresent(Map<String, Object> map, String key, Object value) {
        if (value != null) {
            map.put(key, value);
        }
    }
}
