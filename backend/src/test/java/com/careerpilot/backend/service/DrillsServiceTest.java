package com.careerpilot.backend.service;

import com.careerpilot.backend.client.AiServiceClient;
import com.careerpilot.backend.entity.FlashcardDrillRecord;
import com.careerpilot.backend.repository.FlashcardDrillRecordRepository;
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

class DrillsServiceTest {

    private FlashcardDrillRecordRepository drillRepository;
    private AiServiceClient aiServiceClient;
    private DrillsService service;
    private final UUID userId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        drillRepository = mock(FlashcardDrillRecordRepository.class);
        aiServiceClient = mock(AiServiceClient.class);
        service = new DrillsService(drillRepository, aiServiceClient, new ObjectMapper());
    }

    @Test
    void testGenerateAndReviewDrill() {
        UUID drillId = UUID.randomUUID();
        when(drillRepository.save(any(FlashcardDrillRecord.class))).thenAnswer(inv -> {
            FlashcardDrillRecord r = inv.getArgument(0);
            if (r.getId() == null) r.setId(drillId);
            return r;
        });

        List<Map<String, Object>> drills = service.generate(userId, Map.of(
                "targetRole", "Backend Engineer",
                "topics", List.of("Concurrency")
        ));

        assertFalse(drills.isEmpty());

        FlashcardDrillRecord record = new FlashcardDrillRecord();
        record.setId(drillId);
        record.setUserId(userId);
        record.setRecordData(new ObjectMapper().valueToTree(drills.get(0)).toString());

        when(drillRepository.findByIdAndUserId(drillId, userId)).thenReturn(Optional.of(record));

        Map<String, Object> reviewed = service.review(userId, drillId, 4);
        assertNotNull(reviewed);
        assertTrue((int) reviewed.get("repetitions") >= 1);
    }
}
