package com.careerpilot.backend.repository;

import com.careerpilot.backend.entity.ResumeRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ResumeRecordRepository extends JpaRepository<ResumeRecord, UUID> {
    List<ResumeRecord> findAllByUserIdOrderByCreatedAtDesc(UUID userId);
    Optional<ResumeRecord> findByIdAndUserId(UUID id, UUID userId);
    long countByUserId(UUID userId);
}
