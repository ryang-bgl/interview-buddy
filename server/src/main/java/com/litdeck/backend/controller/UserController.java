package com.litdeck.backend.controller;

import com.litdeck.backend.dto.UserRequestDto;
import com.litdeck.backend.dto.UserResponseDto;
import com.litdeck.backend.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    @Autowired
    public UserController(UserService userService) {
        this.userService = userService;
    }

    /**
     * Register a new user
     * POST /api/users/register
     */
    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponseDto register(@Valid @RequestBody UserRequestDto request) {
        try {
            return userService.createUser(request);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, e.getMessage());
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to create user");
        }
    }

    /**
     * Get user by username
     * GET /api/users?username={username}
     */
    @GetMapping
    public UserResponseDto getUser(@RequestParam(required = false) String username) {
        if (username == null || username.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Username parameter is required");
        }

        try {
            return userService.getUserByUsername(username)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to get user");
        }
    }

    /**
     * Complete user profile (for auth flow)
     * POST /api/users/profile
     * This would normally be secured with JWT authentication
     */
    @PostMapping("/profile")
    public UserResponseDto completeProfile(
            @Valid @RequestBody UserRequestDto request,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        // TODO: Extract user ID and email from JWT token
        // For now, this is a placeholder implementation
        UUID userId = UUID.randomUUID(); // This should come from JWT
        String email = request.getEmail(); // This should come from JWT

        try {
            return userService.completeProfile(userId, email, request);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, e.getMessage());
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to create user profile");
        }
    }
}