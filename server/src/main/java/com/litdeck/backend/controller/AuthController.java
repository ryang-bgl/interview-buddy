package com.litdeck.backend.controller;

import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    // TODO: Add UserService when implemented
    // private final UserService userService;

    // @Autowired
    // public AuthController(UserService userService) {
    //     this.userService = userService;
    // }

    /**
     * Get authentication status for the current user
     * GET /api/auth/status
     * This endpoint should be protected by JWT authentication middleware
     */
    @GetMapping("/status")
    public AuthStatusResponseDto getUserAuthStatus(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        // TODO: Extract user ID and email from JWT token
        // UUID userID = JwtUtil.getUserIdFromToken(authHeader);
        // String email = JwtUtil.getEmailFromToken(authHeader);

        // Placeholder values
        UUID userID = UUID.randomUUID();
        String email = "user@example.com";

        // TODO: Implement when UserService is available
        // Check if user exists in the database with retry logic
        // boolean exists = userService.checkUserExistsById(userID);
        // if (!exists) {
        //     Thread.sleep(250); // Retry delay
        //     exists = userService.checkUserExistsById(userID);
        // }
        // String leetcodeUsername = exists ? userService.getUserById(userID).getLeetcodeUsername() : "";

        // Placeholder implementation
        boolean exists = false;
        String leetcodeUsername = exists ? "placeholder_username" : "";

        return new AuthStatusResponseDto(
            userID.toString(),
            email,
            exists,
            exists, // profile_complete is initially the same as profile_exists
            leetcodeUsername
        );
    }

    // DTO for auth status response
    public static class AuthStatusResponseDto {
        private String userId;
        private String email;
        private boolean profileExists;
        private boolean profileComplete;
        private String leetcodeUsername;

        public AuthStatusResponseDto() {}

        public AuthStatusResponseDto(String userId, String email, boolean profileExists,
                                   boolean profileComplete, String leetcodeUsername) {
            this.userId = userId;
            this.email = email;
            this.profileExists = profileExists;
            this.profileComplete = profileComplete;
            this.leetcodeUsername = leetcodeUsername;
        }

        // Getters and setters
        public String getUserId() {
            return userId;
        }

        public void setUserId(String userId) {
            this.userId = userId;
        }

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public boolean isProfileExists() {
            return profileExists;
        }

        public void setProfileExists(boolean profileExists) {
            this.profileExists = profileExists;
        }

        public boolean isProfileComplete() {
            return profileComplete;
        }

        public void setProfileComplete(boolean profileComplete) {
            this.profileComplete = profileComplete;
        }

        public String getLeetcodeUsername() {
            return leetcodeUsername;
        }

        public void setLeetcodeUsername(String leetcodeUsername) {
            this.leetcodeUsername = leetcodeUsername;
        }
    }
}