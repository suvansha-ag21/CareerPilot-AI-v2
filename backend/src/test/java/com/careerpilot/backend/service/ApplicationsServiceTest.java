package com.careerpilot.backend.service;

import com.careerpilot.backend.entity.JobApplicationRecord;
import com.careerpilot.backend.repository.JobApplicationRecordRepository;
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

class ApplicationsServiceTest {

    private JobApplicationRecordRepository repository;
    private ApplicationsService service;
    private final UUID userId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        repository = mock(JobApplicationRecordRepository.class);
        service = new ApplicationsService(repository, new ObjectMapper());
    }

    @Test
    void createAndListApplications() {
        UUID appId = UUID.randomUUID();
        when(repository.save(any(JobApplicationRecord.class))).thenAnswer(invocation -> {
            JobApplicationRecord r = invocation.getArgument(0);
            r.setId(appId);
            return r;
        });

        Map<String, Object> created = service.create(userId, Map.of(
                "company", "Google",
                "jobRole", "Software Engineer",
                "status", "APPLIED"
        ));

        assertEquals("Google", created.get("company"));
        assertEquals("Software Engineer", created.get("jobRole"));

        JobApplicationRecord entity = new JobApplicationRecord();
        entity.setId(appId);
        entity.setUserId(userId);
        entity.setRecordData(new ObjectMapper().valueToTree(created).toString());
        when(repository.findAllByUserIdOrderByCreatedAtDesc(userId)).thenReturn(List.of(entity));

        List<Map<String, Object>> list = service.list(userId, "ALL", "ALL", null);
        assertEquals(1, list.size());
        assertEquals("Google", list.get(0).get("company"));
    }
}
