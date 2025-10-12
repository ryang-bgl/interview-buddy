package com.ls.dto;

public record CreateUserApiKeyResponseDto(
    String rawApiKey,
    UserApiKeyDto apiKey
) {}
