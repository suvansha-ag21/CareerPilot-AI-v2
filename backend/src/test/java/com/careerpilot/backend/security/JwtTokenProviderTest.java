package com.careerpilot.backend.security;

import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class JwtTokenProviderTest {

    @Test
    void refreshTokensAreSignedSeparatelyAndContainTheUserId() {
        JwtTokenProvider provider = new JwtTokenProvider(
                "access-secret-for-unit-tests-at-least-32-bytes",
                "refresh-secret-for-unit-tests-at-least-32-bytes",
                900_000,
                7);
        UUID userId = UUID.randomUUID();

        String refreshToken = provider.generateRefreshToken(userId);
        String accessToken = provider.generateAccessToken(userId, "user@example.com", "USER");

        assertTrue(provider.validateRefreshToken(refreshToken));
        assertEquals(userId, provider.getUserIdFromRefreshToken(refreshToken));
        assertFalse(provider.validateRefreshToken(accessToken));
    }
}
