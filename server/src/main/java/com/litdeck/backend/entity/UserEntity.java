package com.litdeck.backend.entity;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Entity class representing a User in the database
 * This class works with jOOQ generated classes
 */
public class UserEntity {

    private UUID id;
    private String username;
    private String email;
    private String leetcodeUsername;
    private LocalDateTime createdAt;

    public UserEntity() {}

    public UserEntity(UUID id, String username, String email, String leetcodeUsername, LocalDateTime createdAt) {
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

    @Override
    public String toString() {
        return "UserEntity{" +
                "id=" + id +
                ", username='" + username + '\'' +
                ", email='" + email + '\'' +
                ", leetcodeUsername='" + leetcodeUsername + '\'' +
                ", createdAt=" + createdAt +
                '}';
    }
}