package com.careerpilot.backend.repository;

import com.careerpilot.backend.entity.UserSkillRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserSkillRecordRepository extends JpaRepository<UserSkillRecord, UUID> {
    List<UserSkillRecord> findAllByUserIdOrderByCreatedAtDesc(UUID userId);
    Optional<UserSkillRecord> findByIdAndUserId(UUID id, UUID userId);
    long countByUserId(UUID userId);
}
