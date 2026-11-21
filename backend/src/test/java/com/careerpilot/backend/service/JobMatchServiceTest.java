package com.careerpilot.backend.service;

import com.careerpilot.backend.client.AiServiceClient;
import com.careerpilot.backend.entity.JobMatchRecord;
import com.careerpilot.backend.entity.ResumeRecord;
import com.careerpilot.backend.repository.JobMatchRecordRepository;
import com.careerpilot.backend.repository.ResumeRecordRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class JobMatchServiceTest {

    private JobMatchRecordRepository matchRepository;
    private ResumeRecordRepository resumeRepository;
    private AiServiceClient aiServiceClient;
    private JobMatchService service;
    private final UUID userId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        matchRepository = mock(JobMatchRecordRepository.class);
        resumeRepository = mock(ResumeRecordRepository.class);
        aiServiceClient = mock(AiServiceClient.class);
        service = new JobMatchService(matchRepository, resumeRepository, aiServiceClient, new ObjectMapper());
    }

    @Test
    void testEvaluateJobMatch() {
        UUID resumeId = UUID.randomUUID();
        ResumeRecord resumeRecord = new ResumeRecord();
        resumeRecord.setId(resumeId);
        resumeRecord.setUserId(userId);
        resumeRecord.setRecordData("{\"id\":\"" + resumeId + "\",\"title\":\"Java Engineer\",\"extractedText\":\"Experienced Java Spring Boot developer with PostgreSQL.\",\"skills\":[\"Java\",\"Spring Boot\"]}");

        when(resumeRepository.findByIdAndUserId(resumeId, userId)).thenReturn(Optional.of(resumeRecord));

        UUID matchId = UUID.randomUUID();
        when(matchRepository.save(any(JobMatchRecord.class))).thenAnswer(inv -> {
            JobMatchRecord r = inv.getArgument(0);
            if (r.getId() == null) r.setId(matchId);
            return r;
        });

        Map<String, Object> result = service.evaluate(userId, Map.of(
                "resumeId", resumeId.toString(),
                "targetRole", "Senior Java Engineer",
                "jobDescription", "Looking for Java Spring Boot microservice developer"
        ), null, null);

        assertNotNull(result);
        assertEquals("Senior Java Engineer", result.get("targetRole"));
        assertTrue(result.containsKey("matchScore"));
    }

    @Test
    void testAnalyzePublic() {
        Map<String, Object> publicResult = service.analyzePublic(Map.of(
                "resumeText", "Java developer",
                "jobDescription", "Senior Java Developer"
        ));
        assertNotNull(publicResult);
        assertTrue(publicResult.containsKey("matchScore"));
    }
}
