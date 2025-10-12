package com.ls.dto;

import java.time.LocalDateTime;

public record UserDto(
    String id,
    String email,
    String firstName,
    String lastName,
    String leetstackUsername,
    LocalDateTime createdDate,
    LocalDateTime lastUpdatedDate
) {}
