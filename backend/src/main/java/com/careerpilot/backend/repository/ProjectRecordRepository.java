package com.careerpilot.backend.repository;

import com.careerpilot.backend.entity.ProjectRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProjectRecordRepository extends JpaRepository<ProjectRecord, UUID> {
    List<ProjectRecord> findAllByUserIdOrderByCreatedAtDesc(UUID userId);
    Optional<ProjectRecord> findByIdAndUserId(UUID id, UUID userId);
    long countByUserId(UUID userId);
}
