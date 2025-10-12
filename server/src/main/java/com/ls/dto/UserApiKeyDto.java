package com.ls.dto;

import java.time.LocalDateTime;

public record UserApiKeyDto(
    Long id,
    String userId,
    String keyHash,
    String label,
    boolean revoked,
    LocalDateTime createdDate,
    LocalDateTime lastUsedDate
) {}
