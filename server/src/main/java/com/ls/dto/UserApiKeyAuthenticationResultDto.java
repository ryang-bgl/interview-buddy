package com.ls.dto;

public record UserApiKeyAuthenticationResultDto(
    UserDto user,
    UserApiKeyDto apiKey
) {}
