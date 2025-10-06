package com.litdeck.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.LocalDateTime;
import java.util.UUID;

public class UserResponseDto {

    private UUID id;

    private String username;

    private String email;

    @JsonProperty("leetcode_username")
    private String leetcodeUsername;

    @JsonProperty("created_at")
    private LocalDateTime createdAt;

    public UserResponseDto() {}

    public UserResponseDto(UUID id, String username, String email, String leetcodeUsername, LocalDateTime createdAt) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.leetcodeUsername = leetcodeUsername;
        this.createdAt = createdAt;
    }

    // Getters and Setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getLeetcodeUsername() {
        return leetcodeUsername;
    }

    public void setLeetcodeUsername(String leetcodeUsername) {
        this.leetcodeUsername = leetcodeUsername;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}