package com.careerpilot.backend.service;

import com.careerpilot.backend.client.AiServiceClient;
import com.careerpilot.backend.entity.ResumeRecord;
import com.careerpilot.backend.repository.ResumeRecordRepository;
import com.careerpilot.backend.repository.UserRepository;
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

class ResumeServiceTest {

    private ResumeRecordRepository resumeRepository;
    private UserRepository userRepository;
    private AiServiceClient aiServiceClient;
    private ResumeService service;
    private final UUID userId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        resumeRepository = mock(ResumeRecordRepository.class);
        userRepository = mock(UserRepository.class);
        aiServiceClient = mock(AiServiceClient.class);
        service = new ResumeService(resumeRepository, userRepository, aiServiceClient, new ObjectMapper());
    }

    @Test
    void testUploadAndListResumes() {
        UUID resumeId = UUID.randomUUID();
        when(resumeRepository.save(any(ResumeRecord.class))).thenAnswer(inv -> {
            ResumeRecord r = inv.getArgument(0);
            if (r.getId() == null) r.setId(resumeId);
            return r;
        });

        byte[] fakePdf = "%PDF-1.4 test resume content".getBytes();
        Map<String, Object> uploaded = service.upload(userId, fakePdf, "test_resume.pdf", "application/pdf", "My Master Resume");

        assertEquals("My Master Resume", uploaded.get("title"));
        assertEquals("PDF", uploaded.get("fileType"));

        ResumeRecord record = new ResumeRecord();
        record.setId(resumeId);
        record.setUserId(userId);
        record.setRecordData(new ObjectMapper().valueToTree(uploaded).toString());

        when(resumeRepository.findAllByUserIdOrderByCreatedAtDesc(userId)).thenReturn(List.of(record));

        List<Map<String, Object>> list = service.list(userId);
        assertEquals(1, list.size());
        assertEquals("My Master Resume", list.get(0).get("title"));
    }
}
