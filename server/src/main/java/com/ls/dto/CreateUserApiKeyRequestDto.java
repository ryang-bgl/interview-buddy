package com.ls.dto;

public record CreateUserApiKeyRequestDto(
    String userId,
    String label
) {}
