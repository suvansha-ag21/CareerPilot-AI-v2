package com.careerpilot.backend.repository;

import com.careerpilot.backend.entity.FlashcardDrillRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface FlashcardDrillRecordRepository extends JpaRepository<FlashcardDrillRecord, UUID> {
    List<FlashcardDrillRecord> findAllByUserIdOrderByCreatedAtDesc(UUID userId);
    Optional<FlashcardDrillRecord> findByIdAndUserId(UUID id, UUID userId);
    long countByUserId(UUID userId);
}
