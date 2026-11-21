package com.careerpilot.backend.repository;

import com.careerpilot.backend.entity.JobApplicationRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface JobApplicationRecordRepository extends JpaRepository<JobApplicationRecord, UUID> {
    List<JobApplicationRecord> findAllByUserIdOrderByCreatedAtDesc(UUID userId);
    Optional<JobApplicationRecord> findByIdAndUserId(UUID id, UUID userId);
    long countByUserId(UUID userId);
}
