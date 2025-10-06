package com.litdeck.backend.repository;

import com.litdeck.backend.entity.UserEntity;
import com.litdeck.backend.jooq.tables.Users;
import com.litdeck.backend.jooq.tables.records.UsersRecord;
import org.jooq.DSLContext;
import org.jooq.exception.DataAccessException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static com.litdeck.backend.jooq.Tables.USERS;

@Repository
public class UserRepository {

    private final DSLContext dsl;

    @Autowired
    public UserRepository(DSLContext dsl) {
        this.dsl = dsl;
    }

    /**
     * Create a new user
     */
    public UserEntity createUser(UserEntity user) {
        UsersRecord record = dsl.insertInto(USERS)
                .set(USERS.USERNAME, user.getUsername())
                .set(USERS.LEETCODE_USERNAME, user.getLeetcodeUsername())
                .set(USERS.EMAIL, user.getEmail())
                .set(USERS.CREATED_AT, LocalDateTime.now())
                .returning(USERS.ID)
                .fetchOne();

        if (record != null) {
            user.setId(UUID.fromString(record.getId()));
            user.setCreatedAt(record.getCreatedAt());
        }

        return user;
    }

    /**
     * Create user by auth - prevents race conditions with ON CONFLICT
     */
    public UserEntity createUserByAuth(UserEntity user) {
        if (user.getId() == null) {
            throw new IllegalArgumentException("Cannot create user from auth without a valid ID");
        }

        try {
            UsersRecord record = dsl.insertInto(USERS)
                    .set(USERS.ID, user.getId().toString())
                    .set(USERS.EMAIL, user.getEmail())
                    .set(USERS.USERNAME, user.getUsername())
                    .set(USERS.LEETCODE_USERNAME, user.getLeetcodeUsername())
                    .set(USERS.CREATED_AT, user.getCreatedAt() != null ? user.getCreatedAt() : LocalDateTime.now())
                    .onConflict(USERS.ID)
                    .doNothing()
                    .returning()
                    .fetchOne();

            // If record is null, it means the user already existed (conflict)
            if (record == null) {
                // User already exists, fetch and return existing user
                return getUserById(user.getId())
                        .orElseThrow(() -> new DataAccessException("User should exist but not found: " + user.getId()));
            }

            return mapRecordToEntity(record);
        } catch (Exception e) {
            throw new DataAccessException("Error creating user from auth: " + e.getMessage(), e);
        }
    }

    /**
     * Get user by ID
     */
    public Optional<UserEntity> getUserById(UUID id) {
        UsersRecord record = dsl.selectFrom(USERS)
                .where(USERS.ID.eq(id.toString()))
                .fetchOne();

        return record != null ? Optional.of(mapRecordToEntity(record)) : Optional.empty();
    }

    /**
     * Get user by username
     */
    public Optional<UserEntity> getUserByUsername(String username) {
        UsersRecord record = dsl.selectFrom(USERS)
                .where(USERS.USERNAME.eq(username))
                .fetchOne();

        return record != null ? Optional.of(mapRecordToEntity(record)) : Optional.empty();
    }

    /**
     * Get user by LeetCode username
     */
    public Optional<UserEntity> getUserByLeetcodeUsername(String leetcodeUsername) {
        UsersRecord record = dsl.selectFrom(USERS)
                .where(USERS.LEETCODE_USERNAME.eq(leetcodeUsername))
                .fetchOne();

        return record != null ? Optional.of(mapRecordToEntity(record)) : Optional.empty();
    }

    /**
     * Check if user exists by ID
     */
    public boolean checkUserExistsById(UUID id) {
        return dsl.fetchExists(
                dsl.selectOne()
                        .from(USERS)
                        .where(USERS.ID.eq(id.toString()))
        );
    }

    /**
     * Check if user exists by username
     */
    public boolean checkUserExistsByUsername(String username) {
        return dsl.fetchExists(
                dsl.selectOne()
                        .from(USERS)
                        .where(USERS.USERNAME.eq(username))
        );
    }

    /**
     * Check if user exists by LeetCode username
     */
    public boolean checkUserExistsByLeetcodeUsername(String leetcodeUsername) {
        return dsl.fetchExists(
                dsl.selectOne()
                        .from(USERS)
                        .where(USERS.LEETCODE_USERNAME.eq(leetcodeUsername))
        );
    }

    /**
     * Map jOOQ record to entity
     */
    private UserEntity mapRecordToEntity(UsersRecord record) {
        return new UserEntity(
                UUID.fromString(record.getId()),
                record.getUsername(),
                record.getEmail(),
                record.getLeetcodeUsername(),
                record.getCreatedAt()
        );
    }
}