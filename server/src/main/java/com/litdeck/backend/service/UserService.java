package com.litdeck.backend.service;

import com.litdeck.backend.dto.UserRequestDto;
import com.litdeck.backend.dto.UserResponseDto;
import com.litdeck.backend.entity.UserEntity;
import com.litdeck.backend.repository.UserRepository;
import org.jooq.exception.DataAccessException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
public class UserService {

    private final UserRepository userRepository;

    @Autowired
    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * Create a new user
     */
    public UserResponseDto createUser(UserRequestDto request) {
        // Check if username already exists
        if (userRepository.checkUserExistsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("Username already exists");
        }

        // Check if LeetCode username already exists
        if (userRepository.checkUserExistsByLeetcodeUsername(request.getLeetcodeUsername())) {
            throw new IllegalArgumentException("LeetCode username already exists");
        }

        UserEntity userEntity = new UserEntity();
        userEntity.setUsername(request.getUsername());
        userEntity.setEmail(request.getEmail());
        userEntity.setLeetcodeUsername(request.getLeetcodeUsername());
        userEntity.setCreatedAt(LocalDateTime.now());

        UserEntity createdUser = userRepository.createUser(userEntity);
        return mapEntityToResponseDto(createdUser);
    }

    /**
     * Complete user profile (for auth flow)
     */
    public UserResponseDto completeProfile(UUID userId, String email, UserRequestDto request) {
        // Check if user already exists
        if (userRepository.checkUserExistsById(userId)) {
            throw new IllegalArgumentException("User profile already exists");
        }

        // Check if username already taken
        if (userRepository.checkUserExistsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("Username already exists");
        }

        UserEntity userEntity = new UserEntity();
        userEntity.setId(userId);
        userEntity.setUsername(request.getUsername());
        userEntity.setEmail(email);
        userEntity.setLeetcodeUsername(request.getLeetcodeUsername());
        userEntity.setCreatedAt(LocalDateTime.now());

        UserEntity createdUser = userRepository.createUserByAuth(userEntity);
        return mapEntityToResponseDto(createdUser);
    }

    /**
     * Get user by ID
     */
    public Optional<UserResponseDto> getUserById(UUID id) {
        return userRepository.getUserById(id)
                .map(this::mapEntityToResponseDto);
    }

    /**
     * Get user by username
     */
    public Optional<UserResponseDto> getUserByUsername(String username) {
        return userRepository.getUserByUsername(username)
                .map(this::mapEntityToResponseDto);
    }

    /**
     * Get user by LeetCode username
     */
    public Optional<UserResponseDto> getUserByLeetcodeUsername(String leetcodeUsername) {
        return userRepository.getUserByLeetcodeUsername(leetcodeUsername)
                .map(this::mapEntityToResponseDto);
    }

    /**
     * Check if user exists by ID
     */
    public boolean checkUserExistsById(UUID id) {
        return userRepository.checkUserExistsById(id);
    }

    /**
     * Check if user exists by username
     */
    public boolean checkUserExistsByUsername(String username) {
        return userRepository.checkUserExistsByUsername(username);
    }

    /**
     * Map entity to response DTO
     */
    private UserResponseDto mapEntityToResponseDto(UserEntity entity) {
        return new UserResponseDto(
                entity.getId(),
                entity.getUsername(),
                entity.getEmail(),
                entity.getLeetcodeUsername(),
                entity.getCreatedAt()
        );
    }
}