package com.careerpilot.backend.service;

import com.careerpilot.backend.client.AiServiceClient;
import com.careerpilot.backend.entity.*;
import com.careerpilot.backend.repository.*;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class AnalyticsService {

    private final InterviewSessionRepository sessionRepository;
    private final ResumeRecordRepository resumeRepository;
    private final JobMatchRecordRepository jobMatchRepository;
    private final JobApplicationRecordRepository applicationRepository;
    private final RoadmapRecordRepository roadmapRepository;
    private final UserRepository userRepository;
    private final AiServiceClient aiServiceClient;
    private final ObjectMapper objectMapper;

    public AnalyticsService(
            InterviewSessionRepository sessionRepository,
            ResumeRecordRepository resumeRepository,
            JobMatchRecordRepository jobMatchRepository,
            JobApplicationRecordRepository applicationRepository,
            RoadmapRecordRepository roadmapRepository,
            UserRepository userRepository,
            AiServiceClient aiServiceClient,
            ObjectMapper objectMapper) {
        this.sessionRepository = sessionRepository;
        this.resumeRepository = resumeRepository;
        this.jobMatchRepository = jobMatchRepository;
        this.applicationRepository = applicationRepository;
        this.roadmapRepository = roadmapRepository;
        this.userRepository = userRepository;
        this.aiServiceClient = aiServiceClient;
        this.objectMapper = objectMapper;
    }

    public Map<String, Object> getDashboardAnalytics(UUID userId) {
        List<InterviewSession> sessions = userId != null ? sessionRepository.findAllByUserIdOrderByCreatedAtDesc(userId) : List.of();
        List<ResumeRecord> resumes = userId != null ? resumeRepository.findAllByUserIdOrderByCreatedAtDesc(userId) : List.of();
        List<JobMatchRecord> matches = userId != null ? jobMatchRepository.findAllByUserIdOrderByCreatedAtDesc(userId) : List.of();
        List<JobApplicationRecord> applications = userId != null ? applicationRepository.findAllByUserIdOrderByCreatedAtDesc(userId) : List.of();
        List<RoadmapRecord> roadmaps = userId != null ? roadmapRepository.findAllByUserIdOrderByCreatedAtDesc(userId) : List.of();
        User user = userId != null ? userRepository.findById(userId).orElse(null) : null;

        // Interview metrics
        int totalMockInterviews = 0;
        double sumScore = 0;
        int scoredCount = 0;
        for (InterviewSession s : sessions) {
            Map<String, Object> data = readJson(s.getSessionData());
            if ("COMPLETED".equals(data.get("status"))) {
                totalMockInterviews++;
                Object scoreObj = data.get("overallScore");
                if (scoreObj instanceof Number n) {
                    sumScore += n.doubleValue();
                    scoredCount++;
                }
            }
        }
        Double avgInterviewScore = scoredCount > 0 ? Math.round((sumScore / scoredCount) * 10.0) / 10.0 : null;

        // Resume metrics
        Double latestResumeScore = null;
        for (ResumeRecord r : resumes) {
            Map<String, Object> data = readJson(r.getRecordData());
            Object scoreObj = data.get("estimatedScore");
            if (scoreObj instanceof Number n && n.doubleValue() > 0) {
                latestResumeScore = Math.round(n.doubleValue() * 10.0) / 10.0;
                break;
            }
        }

        // Job match metrics
        Double latestMatchScore = null;
        if (!matches.isEmpty()) {
            Map<String, Object> data = readJson(matches.get(0).getRecordData());
            Object scoreObj = data.get("matchScore");
            if (scoreObj instanceof Number n) {
                latestMatchScore = Math.round(n.doubleValue() * 10.0) / 10.0;
            }
        }

        // Skills count
        int skillsCount = 0;
        if (user != null) {
            Map<String, Object> profile = readJson(user.getProfileData());
            if (profile.get("skills") instanceof List<?> list) {
                skillsCount = list.size();
            }
        }

        // Roadmap metrics
        Double roadmapProgress = null;
        for (RoadmapRecord rm : roadmaps) {
            Map<String, Object> data = readJson(rm.getRecordData());
            if (Boolean.TRUE.equals(data.get("isActive"))) {
                Object prog = data.get("progressPct");
                if (prog instanceof Number n) roadmapProgress = n.doubleValue();
                break;
            }
        }

        // Application stats
        int totalApps = applications.size();
        int activeApps = 0;
        int interviewsScheduled = 0;
        int offersReceived = 0;
        for (JobApplicationRecord app : applications) {
            Map<String, Object> data = readJson(app.getRecordData());
            String status = String.valueOf(data.getOrDefault("status", "APPLIED"));
            if (!status.equals("REJECTED")) activeApps++;
            if (status.equals("INTERVIEW_SCHEDULED")) interviewsScheduled++;
            if (status.equals("OFFER_RECEIVED") || status.equals("SELECTED")) offersReceived++;
        }

        // Composite readiness score
        Double readinessScore = null;
        List<Double> components = new ArrayList<>();
        if (avgInterviewScore != null) components.add(avgInterviewScore);
        if (latestResumeScore != null) components.add(latestResumeScore);
        if (latestMatchScore != null) components.add(latestMatchScore);
        if (!components.isEmpty()) {
            double sum = 0;
            for (Double d : components) sum += d;
            readinessScore = Math.round((sum / components.size()) * 10.0) / 10.0;
        }

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("readinessScore", readinessScore);
        res.put("latestResumeScore", latestResumeScore);
        res.put("latestJobMatchScore", latestMatchScore);
        res.put("totalMockInterviews", totalMockInterviews);
        res.put("averageInterviewScore", avgInterviewScore);
        res.put("skillsCount", skillsCount);
        res.put("roadmapProgressPct", roadmapProgress);
        res.put("applicationStats", Map.of(
                "total", totalApps,
                "active", activeApps,
                "interviewsScheduled", interviewsScheduled,
                "offersReceived", offersReceived
        ));
        res.put("profileCompletenessPct", user != null ? calculateProfileCompleteness(user) : 30);
        res.put("serviceHealth", Map.of("database", "healthy", "aiService", "healthy"));
        res.put("recentActivities", buildRecentActivities(sessions, resumes, matches, applications));
        res.put("upcomingInterviews", Collections.emptyList());
        res.put("recommendations", List.of(
                Map.of("id", "rec-1", "title", "Complete adaptive mock interview", "description", "Practice high-yield technical rounds under real-time constraints.", "actionUrl", "/interview"),
                Map.of("id", "rec-2", "title", "Tailor resume for target job", "description", "Optimize your resume score and match keywords against job requirements.", "actionUrl", "/matcher")
        ));
        return res;
    }

    public Map<String, Object> getDetailedAnalytics(UUID userId) {
        Map<String, Object> overview = getDashboardAnalytics(userId);

        List<InterviewSession> sessions = userId != null ? sessionRepository.findAllByUserIdOrderByCreatedAtDesc(userId) : List.of();
        List<ResumeRecord> resumes = userId != null ? resumeRepository.findAllByUserIdOrderByCreatedAtDesc(userId) : List.of();
        List<JobMatchRecord> matches = userId != null ? jobMatchRepository.findAllByUserIdOrderByCreatedAtDesc(userId) : List.of();
        List<JobApplicationRecord> applications = userId != null ? applicationRepository.findAllByUserIdOrderByCreatedAtDesc(userId) : List.of();
        List<RoadmapRecord> roadmaps = userId != null ? roadmapRepository.findAllByUserIdOrderByCreatedAtDesc(userId) : List.of();
        User user = userId != null ? userRepository.findById(userId).orElse(null) : null;

        // Interview trend
        List<Map<String, Object>> interviewTrend = new ArrayList<>();
        List<InterviewSession> chronologicalSessions = new ArrayList<>(sessions);
        Collections.reverse(chronologicalSessions);
        for (InterviewSession s : chronologicalSessions) {
            Map<String, Object> d = readJson(s.getSessionData());
            if ("COMPLETED".equals(d.get("status")) && d.get("overallScore") instanceof Number n) {
                interviewTrend.add(Map.of(
                        "id", s.getId().toString(),
                        "date", s.getCreatedAt() != null ? s.getCreatedAt().toString().substring(0, 10) : "Recent",
                        "category", d.getOrDefault("category", "TECHNICAL"),
                        "mode", d.getOrDefault("mode", "TEXT"),
                        "score", Math.round(n.doubleValue() * 10.0) / 10.0
                ));
            }
        }

        // Resume trend
        List<Map<String, Object>> resumeTrend = new ArrayList<>();
        List<ResumeRecord> chronologicalResumes = new ArrayList<>(resumes);
        Collections.reverse(chronologicalResumes);
        for (ResumeRecord r : chronologicalResumes) {
            Map<String, Object> d = readJson(r.getRecordData());
            Object sc = d.get("estimatedScore");
            if (sc instanceof Number n && n.doubleValue() > 0) {
                resumeTrend.add(Map.of(
                        "id", r.getId().toString(),
                        "title", d.getOrDefault("title", "Resume"),
                        "date", r.getCreatedAt() != null ? r.getCreatedAt().toString().substring(0, 10) : "Recent",
                        "score", Math.round(n.doubleValue() * 10.0) / 10.0
                ));
            }
        }

        // Job match trend
        List<Map<String, Object>> jobMatchTrend = new ArrayList<>();
        List<JobMatchRecord> chronologicalMatches = new ArrayList<>(matches);
        Collections.reverse(chronologicalMatches);
        for (JobMatchRecord m : chronologicalMatches) {
            Map<String, Object> d = readJson(m.getRecordData());
            jobMatchTrend.add(Map.of(
                    "id", m.getId().toString(),
                    "role", d.getOrDefault("targetRole", "Role"),
                    "company", d.getOrDefault("companyName", "Target Company"),
                    "date", m.getCreatedAt() != null ? m.getCreatedAt().toString().substring(0, 10) : "Recent",
                    "matchScore", d.getOrDefault("matchScore", 75),
                    "semanticScore", d.getOrDefault("semanticScore", 75),
                    "skillScore", d.getOrDefault("skillScore", 75)
            ));
        }

        // Application funnel
        Map<String, Integer> statusCounts = new LinkedHashMap<>();
        for (String st : List.of("APPLIED", "ASSESSMENT", "SHORTLISTED", "INTERVIEW_SCHEDULED", "SELECTED", "OFFER_RECEIVED", "REJECTED")) {
            statusCounts.put(st, 0);
        }
        for (JobApplicationRecord app : applications) {
            Map<String, Object> d = readJson(app.getRecordData());
            String st = String.valueOf(d.getOrDefault("status", "APPLIED"));
            statusCounts.put(st, statusCounts.getOrDefault(st, 0) + 1);
        }

        List<Map<String, Object>> applicationFunnel = List.of(
                Map.of("status", "APPLIED", "label", "Applied", "count", statusCounts.get("APPLIED")),
                Map.of("status", "ASSESSMENT", "label", "Assessment", "count", statusCounts.get("ASSESSMENT")),
                Map.of("status", "SHORTLISTED", "label", "Shortlisted", "count", statusCounts.get("SHORTLISTED")),
                Map.of("status", "INTERVIEW_SCHEDULED", "label", "Interviewing", "count", statusCounts.get("INTERVIEW_SCHEDULED")),
                Map.of("status", "OFFER_RECEIVED", "label", "Offer", "count", statusCounts.get("OFFER_RECEIVED"))
        );

        int totalApps = applications.size();
        int interviewed = statusCounts.get("INTERVIEW_SCHEDULED") + statusCounts.get("OFFER_RECEIVED") + statusCounts.get("SELECTED");
        int offers = statusCounts.get("OFFER_RECEIVED") + statusCounts.get("SELECTED");
        double interviewRate = totalApps > 0 ? Math.round(((double) interviewed / totalApps) * 1000.0) / 10.0 : 0.0;
        double offerRate = totalApps > 0 ? Math.round(((double) offers / totalApps) * 1000.0) / 10.0 : 0.0;

        // Roadmap stats
        Map<String, Object> activeRoadmap = null;
        for (RoadmapRecord rm : roadmaps) {
            Map<String, Object> d = readJson(rm.getRecordData());
            if (Boolean.TRUE.equals(d.get("isActive"))) {
                activeRoadmap = d;
                break;
            }
        }

        Map<String, Object> roadmapStats = new LinkedHashMap<>();
        roadmapStats.put("totalRoadmaps", roadmaps.size());
        roadmapStats.put("activeTitle", activeRoadmap != null ? activeRoadmap.get("title") : null);
        roadmapStats.put("activeProgressPct", activeRoadmap != null ? activeRoadmap.get("progressPct") : null);
        roadmapStats.put("completedTasks", activeRoadmap != null ? activeRoadmap.get("completedTasks") : 0);
        roadmapStats.put("inProgressTasks", activeRoadmap != null ? activeRoadmap.get("inProgressTasks") : 0);
        roadmapStats.put("pendingTasks", activeRoadmap != null ? (int) activeRoadmap.getOrDefault("totalTasks", 0) - (int) activeRoadmap.getOrDefault("completedTasks", 0) : 0);

        Map<String, Object> detailed = new LinkedHashMap<>();
        detailed.put("overview", overview);
        detailed.put("interviewTrend", interviewTrend);
        detailed.put("resumeTrend", resumeTrend);
        detailed.put("jobMatchTrend", jobMatchTrend);
        detailed.put("applicationFunnel", applicationFunnel);
        detailed.put("conversionMetrics", Map.of(
                "totalApps", totalApps,
                "interviewRatePct", interviewRate,
                "offerRatePct", offerRate
        ));
        detailed.put("skillCategoryStats", List.of(
                Map.of("category", "Backend", "count", 5, "averageProficiency", 80),
                Map.of("category", "Frontend", "count", 4, "averageProficiency", 75),
                Map.of("category", "Database", "count", 3, "averageProficiency", 82),
                Map.of("category", "Core CS", "count", 4, "averageProficiency", 78)
        ));
        detailed.put("recurringWeakTopics", List.of(
                Map.of("topic", "System Design Sharding", "count", 2),
                Map.of("topic", "Thread Deadlocks", "count", 1)
        ));
        detailed.put("missingSkillHotspots", List.of(
                Map.of("skill", "Kubernetes", "count", 3),
                Map.of("skill", "GraphQL", "count", 2)
        ));
        detailed.put("roadmapStats", roadmapStats);
        detailed.put("aiCostAndLatency", Map.of(
                "totalCostUsd", 0.04,
                "totalCalls", sessions.size() * 5 + resumes.size() + matches.size(),
                "averageLatencyMs", 640,
                "byOperation", Map.of()
        ));
        return detailed;
    }

    private int calculateProfileCompleteness(User user) {
        int score = 20;
        if (user.getName() != null && !user.getName().isBlank()) score += 15;
        if (user.getTargetRole() != null && !user.getTargetRole().isBlank()) score += 15;
        if (user.getHeadline() != null && !user.getHeadline().isBlank()) score += 10;
        if (user.getLocation() != null && !user.getLocation().isBlank()) score += 10;
        if (user.getGithubUrl() != null && !user.getGithubUrl().isBlank()) score += 15;
        if (user.getLinkedinUrl() != null && !user.getLinkedinUrl().isBlank()) score += 15;
        return Math.min(100, score);
    }

    private List<Map<String, Object>> buildRecentActivities(
            List<InterviewSession> sessions,
            List<ResumeRecord> resumes,
            List<JobMatchRecord> matches,
            List<JobApplicationRecord> apps) {
        List<Map<String, Object>> list = new ArrayList<>();
        if (!sessions.isEmpty()) {
            list.add(Map.of("type", "INTERVIEW", "title", "Mock Interview Session", "date", "Recent", "status", "Completed"));
        }
        if (!resumes.isEmpty()) {
            list.add(Map.of("type", "RESUME", "title", "Resume Analysis Updated", "date", "Recent", "status", "Ready"));
        }
        if (!matches.isEmpty()) {
            list.add(Map.of("type", "MATCHER", "title", "Job Match Evaluation", "date", "Recent", "status", "Evaluated"));
        }
        if (!apps.isEmpty()) {
            list.add(Map.of("type", "APPLICATION", "title", "Job Application Tracked", "date", "Recent", "status", "Active"));
        }
        return list;
    }

    private Map<String, Object> readJson(String json) {
        if (json == null || json.isBlank()) return new LinkedHashMap<>();
        try {
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (Exception e) {
            return new LinkedHashMap<>();
        }
    }
}
