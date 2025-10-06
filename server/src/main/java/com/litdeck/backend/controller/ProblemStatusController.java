package com.litdeck.backend.controller;

import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/problems")
public class ProblemStatusController {

    // TODO: Add ProblemService and SubmissionService when implemented
    // private final ProblemService problemService;
    // private final SubmissionService submissionService;

    // @Autowired
    // public ProblemStatusController(ProblemService problemService, SubmissionService submissionService) {
    //     this.problemService = problemService;
    //     this.submissionService = submissionService;
    // }

    /**
     * Get problems with user submission status
     * GET /api/problems/with-status
     * This endpoint should be protected by JWT authentication middleware
     */
    @GetMapping("/with-status")
    public List<ProblemWithStatusDto> getProblemsWithStatus(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        // TODO: Extract user ID from JWT token
        // UUID userID = JwtUtil.getUserIdFromToken(authHeader);
        UUID userID = UUID.randomUUID(); // Placeholder

        // TODO: Implement when services are available
        // This endpoint should return problems along with user's submission status
        // return problemService.getProblemsWithStatus(userID);

        // Placeholder response
        return List.of();
    }

    // DTO for problems with user status
    public static class ProblemWithStatusDto {
        private Integer id;
        private Integer frontendId;
        private String title;
        private String titleSlug;
        private String difficulty;
        private Boolean isPremium;
        private List<String> topicTags;

        // User-specific status fields
        private boolean hasSolved;
        private boolean hasAttempted;
        private String lastSubmissionStatus;
        private java.time.LocalDateTime lastSubmissionTime;

        public ProblemWithStatusDto() {}

        // Getters and setters
        public Integer getId() {
            return id;
        }

        public void setId(Integer id) {
            this.id = id;
        }

        public Integer getFrontendId() {
            return frontendId;
        }

        public void setFrontendId(Integer frontendId) {
            this.frontendId = frontendId;
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

        public String getDifficulty() {
            return difficulty;
        }

        public void setDifficulty(String difficulty) {
            this.difficulty = difficulty;
        }

        public Boolean getIsPremium() {
            return isPremium;
        }

        public void setIsPremium(Boolean isPremium) {
            this.isPremium = isPremium;
        }

        public List<String> getTopicTags() {
            return topicTags;
        }

        public void setTopicTags(List<String> topicTags) {
            this.topicTags = topicTags;
        }

        public boolean isHasSolved() {
            return hasSolved;
        }

        public void setHasSolved(boolean hasSolved) {
            this.hasSolved = hasSolved;
        }

        public boolean isHasAttempted() {
            return hasAttempted;
        }

        public void setHasAttempted(boolean hasAttempted) {
            this.hasAttempted = hasAttempted;
        }

        public String getLastSubmissionStatus() {
            return lastSubmissionStatus;
        }

        public void setLastSubmissionStatus(String lastSubmissionStatus) {
            this.lastSubmissionStatus = lastSubmissionStatus;
        }

        public java.time.LocalDateTime getLastSubmissionTime() {
            return lastSubmissionTime;
        }

        public void setLastSubmissionTime(java.time.LocalDateTime lastSubmissionTime) {
            this.lastSubmissionTime = lastSubmissionTime;
        }
    }
}