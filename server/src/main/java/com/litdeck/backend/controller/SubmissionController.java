package com.litdeck.backend.controller;

import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/submissions")
public class SubmissionController {

    // TODO: Add SubmissionService when implemented
    // private final SubmissionService submissionService;

    // @Autowired
    // public SubmissionController(SubmissionService submissionService) {
    //     this.submissionService = submissionService;
    // }

    /**
     * Get submissions by user ID
     * GET /api/submissions?user_id={user_id}
     */
    @GetMapping
    public List<SubmissionResponseDto> getSubmissions(
            @RequestParam(required = false) String user_id) {

        if (user_id == null || user_id.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Missing user_id parameter");
        }

        try {
            UUID userUUID = UUID.fromString(user_id);

            // TODO: Implement when SubmissionService is available
            // return submissionService.getSubmissionsByUserId(userUUID);

            // Placeholder response
            return List.of();

        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid user_id parameter");
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to get submissions");
        }
    }

    /**
     * Create a new submission
     * POST /api/submissions
     */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SubmissionResponseDto createSubmission(
            @Valid @RequestBody SubmissionRequestDto request) {

        try {
            // TODO: Get authenticated user's UUID from JWT context
            // UUID userID = SecurityContextUtils.getUserUUIDFromContext();
            UUID userID = UUID.randomUUID(); // Placeholder

            String submissionID;
            if (request.isInternal()) {
                String shortID = UUID.randomUUID().toString().replace("-", "").substring(0, 12);
                submissionID = "internal-user-" + shortID;
            } else {
                if (request.getLeetcodeSubmissionId() == null || request.getLeetcodeSubmissionId().trim().isEmpty()) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "LeetcodeSubmissionID is required when isInternal is false");
                }
                submissionID = "leetcode-" + request.getLeetcodeSubmissionId();
            }

            LocalDateTime submittedTime;
            try {
                submittedTime = LocalDateTime.parse(request.getSubmittedAt(), DateTimeFormatter.ISO_LOCAL_DATE_TIME);
            } catch (Exception e) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid time format");
            }

            // TODO: Implement when SubmissionService is available
            // SubmissionDto submissionToAdd = new SubmissionDto();
            // submissionToAdd.setId(submissionID);
            // submissionToAdd.setUserId(userID);
            // submissionToAdd.setTitle(request.getTitle());
            // submissionToAdd.setTitleSlug(request.getTitleSlug());
            // submissionToAdd.setCreatedAt(LocalDateTime.now());
            // submissionToAdd.setSubmittedAt(submittedTime);

            // return submissionService.createSubmission(submissionToAdd);

            // Placeholder response
            SubmissionResponseDto response = new SubmissionResponseDto();
            response.setId(submissionID);
            response.setUserId(userID.toString());
            response.setTitle(request.getTitle());
            response.setTitleSlug(request.getTitleSlug());
            response.setCreatedAt(LocalDateTime.now());
            response.setSubmittedAt(submittedTime);
            return response;

        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            // Check if it's a conflict error (submission already exists)
            if (e.getMessage() != null && e.getMessage().contains("already exists")) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Submission with this ID already exists");
            }

            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to create new submission: " + e.getMessage());
        }
    }

    /**
     * DTO for submission request
     */
    public static class SubmissionRequestDto {
        private boolean isInternal;
        private String leetcodeSubmissionId;
        private String title;
        private String titleSlug;
        private String submittedAt;

        // Constructors
        public SubmissionRequestDto() {}

        public SubmissionRequestDto(boolean isInternal, String leetcodeSubmissionId, String title, String titleSlug, String submittedAt) {
            this.isInternal = isInternal;
            this.leetcodeSubmissionId = leetcodeSubmissionId;
            this.title = title;
            this.titleSlug = titleSlug;
            this.submittedAt = submittedAt;
        }

        // Getters and setters
        public boolean isInternal() {
            return isInternal;
        }

        public void setInternal(boolean internal) {
            isInternal = internal;
        }

        public String getLeetcodeSubmissionId() {
            return leetcodeSubmissionId;
        }

        public void setLeetcodeSubmissionId(String leetcodeSubmissionId) {
            this.leetcodeSubmissionId = leetcodeSubmissionId;
        }

        public String getTitle() {
            return title;
        }

        public void setTitle(String title) {
            this.title = title;
        }

        public String getTitleSlug() {
            return titleSlug;
        }

        public void setTitleSlug(String titleSlug) {
            this.titleSlug = titleSlug;
        }

        public String getSubmittedAt() {
            return submittedAt;
        }

        public void setSubmittedAt(String submittedAt) {
            this.submittedAt = submittedAt;
        }
    }

    public static class SubmissionResponseDto {
        private String id;
        private String userId;
        private String title;
        private String titleSlug;
        private LocalDateTime createdAt;
        private LocalDateTime submittedAt;

        public SubmissionResponseDto() {}

        // Getters and setters
        public String getId() {
            return id;
        }

        public void setId(String id) {
            this.id = id;
        }

        public String getUserId() {
            return userId;
        }

        public void setUserId(String userId) {
            this.userId = userId;
        }

        public String getTitle() {
            return title;
        }

        public void setTitle(String title) {
            this.title = title;
        }

        public String getTitleSlug() {
            return titleSlug;
        }

        public void setTitleSlug(String titleSlug) {
            this.titleSlug = titleSlug;
        }

        public LocalDateTime getCreatedAt() {
            return createdAt;
        }

        public void setCreatedAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
        }

        public LocalDateTime getSubmittedAt() {
            return submittedAt;
        }

        public void setSubmittedAt(LocalDateTime submittedAt) {
            this.submittedAt = submittedAt;
        }
    }
}