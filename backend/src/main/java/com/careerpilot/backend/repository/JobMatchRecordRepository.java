package com.careerpilot.backend.repository;

import com.careerpilot.backend.entity.JobMatchRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface JobMatchRecordRepository extends JpaRepository<JobMatchRecord, UUID> {
    List<JobMatchRecord> findAllByUserIdOrderByCreatedAtDesc(UUID userId);
    Optional<JobMatchRecord> findByIdAndUserId(UUID id, UUID userId);
    long countByUserId(UUID userId);
}
