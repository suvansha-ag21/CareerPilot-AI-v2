package com.careerpilot.backend.repository;

import com.careerpilot.backend.entity.InterviewSession;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface InterviewSessionRepository extends JpaRepository<InterviewSession, UUID> {
    List<InterviewSession> findAllByUserIdOrderByCreatedAtDesc(UUID userId);
    Optional<InterviewSession> findByIdAndUserId(UUID id, UUID userId);
}
