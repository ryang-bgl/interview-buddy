package com.litdeck.backend.controller;

import com.litdeck.backend.controller.GlobalExceptionHandler.*;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/reviews")
public class ReviewController {

    // TODO: Add ReviewService and SubmissionService when implemented
    // private final ReviewService reviewService;
    // private final SubmissionService submissionService;

    // @Autowired
    // public ReviewController(ReviewService reviewService, SubmissionService submissionService) {
    //     this.reviewService = reviewService;
    //     this.submissionService = submissionService;
    // }

    /**
     * Create a new review
     * POST /api/reviews
     */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CreateReviewResponseDto createReview(
            @Valid @RequestBody CreateReviewRequestDto request) {

        // TODO: Implement FSRS logic and create review
        // ReviewSchedule reviewToAdd = reviewService.createInitialReview(request.getSubmissionId());
        // return new CreateReviewResponseDto(reviewToAdd.getId());

        // Placeholder response
        return new CreateReviewResponseDto(1);
    }

    /**
     * Get reviews for authenticated user
     * GET /api/reviews?status={status}&page={page}&per_page={per_page}
     */
    @GetMapping
    public ReviewListResponseDto getReviews(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int per_page) {

        // TODO: Get authenticated user's UUID from JWT context
        // UUID userID = SecurityContextUtils.getUserUUIDFromContext();
        UUID userID = UUID.randomUUID(); // Placeholder

        // Validate pagination parameters
        if (page < 1) page = 1;
        if (per_page < 1 || per_page > 100) per_page = 10;

        int offset = (page - 1) * per_page;

        // TODO: Implement when ReviewService is available
        // switch (status) {
        //     case "due":
        //         return reviewService.getDueReviews(userID, per_page, offset);
        //     case "upcoming":
        //         return reviewService.getUpcomingReviews(userID, per_page, offset);
        //     default:
        //         return reviewService.getAllReviews(userID, per_page, offset);
        // }

        // Placeholder response
        return new ReviewListResponseDto(List.of(), 0, page, per_page);
    }

    /**
     * Update review schedule based on rating
     * PUT /api/reviews
     */
    @PutMapping
    public UpdateReviewResponseDto updateReviewSchedule(
            @Valid @RequestBody UpdateReviewRequestDto request) {

        if (request.getId() < 0) {
            throw new IllegalArgumentException("Review ID should not be below 0");
        }

        if (request.getRating() < 1 || request.getRating() > 4) {
            throw new IllegalArgumentException("Rating must be between 1 and 4");
        }

        // TODO: Implement FSRS logic when ReviewService is available
        // ReviewSchedule currReview = reviewService.getReviewById(request.getId());
        // if (currReview == null) {
        //     throw new ResourceNotFoundException("Review not found");
        // }

        // ReviewSchedule updatedReview = reviewService.updateReviewWithRating(currReview, request.getRating());
        // return new UpdateReviewResponseDto(true, updatedReview.getNextReviewAt(), updatedReview.getScheduledDays());

        // Placeholder response
        return new UpdateReviewResponseDto(true, LocalDateTime.now().plusDays(1), 1);
    }

    /**
     * Update or create review for submission
     * POST /api/reviews/update-or-create
     */
    @PostMapping("/update-or-create")
    public UpdateReviewResponseDto updateOrCreateReview(
            @Valid @RequestBody SubmissionDto request) {

        // TODO: Implement when ReviewService is available
        // ReviewSchedule review = reviewService.updateOrCreateReviewForSubmission(request);
        // return new UpdateReviewResponseDto(true, review.getNextReviewAt(), review.getScheduledDays());

        // Placeholder response
        return new UpdateReviewResponseDto(true, LocalDateTime.now().plusDays(1), 1);
    }

    /**
     * Process submission (create submission and review in one operation)
     * POST /api/reviews/process-submission
     */
    @PostMapping("/process-submission")
    public ProcessSubmissionResponseDto processSubmission(
            @Valid @RequestBody ProcessSubmissionRequestDto request) {

        // TODO: Get authenticated user's UUID from JWT context
        // UUID userID = SecurityContextUtils.getUserUUIDFromContext();
        UUID userID = UUID.randomUUID(); // Placeholder

        if (request.getTitleSlug() == null || request.getTitleSlug().trim().isEmpty()) {
            throw new IllegalArgumentException("Problem title slug is required");
        }

        // Generate submission ID
        String submissionID;
        if (request.isInternal()) {
            String shortID = UUID.randomUUID().toString().replace("-", "").substring(0, 12);
            submissionID = "internal-user-" + shortID;
        } else {
            if (request.getLeetcodeSubmissionId() == null || request.getLeetcodeSubmissionId().trim().isEmpty()) {
                throw new IllegalArgumentException("LeetcodeSubmissionID is required when IsInternal is false");
            }
            submissionID = "leetcode-" + request.getLeetcodeSubmissionId();
        }

        // TODO: Implement submission and review creation
        // Check for existing submission and throw BusinessConflictException if exists
        // SubmissionDto submission = submissionService.createSubmission(...);
        // ReviewSchedule review = reviewService.createReviewForSubmission(submission, request.getRating());

        // Placeholder response
        LocalDateTime nextReviewAt = LocalDateTime.now().plusDays(1);
        boolean isDue = LocalDateTime.now().isAfter(nextReviewAt);

        return new ProcessSubmissionResponseDto(
            true,
            submissionID,
            nextReviewAt,
            1,
            isDue,
            request.getTitle(),
            request.getTitleSlug()
        );
    }

    // DTOs
    public static class CreateReviewRequestDto {
        private String submissionId;

        public CreateReviewRequestDto() {}

        public String getSubmissionId() {
            return submissionId;
        }

        public void setSubmissionId(String submissionId) {
            this.submissionId = submissionId;
        }
    }

    public static class UpdateReviewRequestDto {
        private int id;
        private int rating; // 1=Again, 2=Hard, 3=Good, 4=Easy

        public UpdateReviewRequestDto() {}

        public int getId() {
            return id;
        }

        public void setId(int id) {
            this.id = id;
        }

        public int getRating() {
            return rating;
        }

        public void setRating(int rating) {
            this.rating = rating;
        }
    }

    public static class SubmissionDto {
        private String id;
        private UUID userId;
        private String title;
        private String titleSlug;
        private LocalDateTime createdAt;
        private LocalDateTime submittedAt;

        public SubmissionDto() {}

        // Getters and setters
        public String getId() {
            return id;
        }

        public void setId(String id) {
            this.id = id;
        }

        public UUID getUserId() {
            return userId;
        }

        public void setUserId(UUID userId) {
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

    public static class ProcessSubmissionRequestDto {
        private boolean isInternal;
        private String leetcodeSubmissionId;
        private String title;
        private String titleSlug;
        private String submittedAt;
        private int rating;

        public ProcessSubmissionRequestDto() {}

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

        public int getRating() {
            return rating;
        }

        public void setRating(int rating) {
            this.rating = rating;
        }
    }

    // Response DTOs
    public static class CreateReviewResponseDto {
        private int id;

        public CreateReviewResponseDto() {}

        public CreateReviewResponseDto(int id) {
            this.id = id;
        }

        public int getId() {
            return id;
        }

        public void setId(int id) {
            this.id = id;
        }
    }

    public static class ReviewListResponseDto {
        private List<ReviewScheduleDto> data;
        private PaginationMetaDto meta;

        public ReviewListResponseDto() {}

        public ReviewListResponseDto(List<ReviewScheduleDto> data, int total, int page, int perPage) {
            this.data = data;
            this.meta = new PaginationMetaDto(total, page, perPage);
        }

        public List<ReviewScheduleDto> getData() {
            return data;
        }

        public void setData(List<ReviewScheduleDto> data) {
            this.data = data;
        }

        public PaginationMetaDto getMeta() {
            return meta;
        }

        public void setMeta(PaginationMetaDto meta) {
            this.meta = meta;
        }
    }

    public static class PaginationMetaDto {
        private int total;
        private int page;
        private int perPage;

        public PaginationMetaDto() {}

        public PaginationMetaDto(int total, int page, int perPage) {
            this.total = total;
            this.page = page;
            this.perPage = perPage;
        }

        public int getTotal() {
            return total;
        }

        public void setTotal(int total) {
            this.total = total;
        }

        public int getPage() {
            return page;
        }

        public void setPage(int page) {
            this.page = page;
        }

        public int getPerPage() {
            return perPage;
        }

        public void setPerPage(int perPage) {
            this.perPage = perPage;
        }
    }

    public static class ReviewScheduleDto {
        private int id;
        private String submissionId;
        private LocalDateTime nextReviewAt;
        private int scheduledDays;
        private LocalDateTime lastReview;

        public ReviewScheduleDto() {}

        // Getters and setters
        public int getId() {
            return id;
        }

        public void setId(int id) {
            this.id = id;
        }

        public String getSubmissionId() {
            return submissionId;
        }

        public void setSubmissionId(String submissionId) {
            this.submissionId = submissionId;
        }

        public LocalDateTime getNextReviewAt() {
            return nextReviewAt;
        }

        public void setNextReviewAt(LocalDateTime nextReviewAt) {
            this.nextReviewAt = nextReviewAt;
        }

        public int getScheduledDays() {
            return scheduledDays;
        }

        public void setScheduledDays(int scheduledDays) {
            this.scheduledDays = scheduledDays;
        }

        public LocalDateTime getLastReview() {
            return lastReview;
        }

        public void setLastReview(LocalDateTime lastReview) {
            this.lastReview = lastReview;
        }
    }

    public static class UpdateReviewResponseDto {
        private boolean success;
        private LocalDateTime nextReviewAt;
        private int daysUntilReview;

        public UpdateReviewResponseDto() {}

        public UpdateReviewResponseDto(boolean success, LocalDateTime nextReviewAt, int daysUntilReview) {
            this.success = success;
            this.nextReviewAt = nextReviewAt;
            this.daysUntilReview = daysUntilReview;
        }

        public boolean isSuccess() {
            return success;
        }

        public void setSuccess(boolean success) {
            this.success = success;
        }

        public LocalDateTime getNextReviewAt() {
            return nextReviewAt;
        }

        public void setNextReviewAt(LocalDateTime nextReviewAt) {
            this.nextReviewAt = nextReviewAt;
        }

        public int getDaysUntilReview() {
            return daysUntilReview;
        }

        public void setDaysUntilReview(int daysUntilReview) {
            this.daysUntilReview = daysUntilReview;
        }
    }

    public static class ProcessSubmissionResponseDto {
        private boolean success;
        private String submissionId;
        private LocalDateTime nextReviewAt;
        private int daysUntilReview;
        private boolean isDue;
        private String title;
        private String titleSlug;

        public ProcessSubmissionResponseDto() {}

        public ProcessSubmissionResponseDto(boolean success, String submissionId, LocalDateTime nextReviewAt,
                                          int daysUntilReview, boolean isDue, String title, String titleSlug) {
            this.success = success;
            this.submissionId = submissionId;
            this.nextReviewAt = nextReviewAt;
            this.daysUntilReview = daysUntilReview;
            this.isDue = isDue;
            this.title = title;
            this.titleSlug = titleSlug;
        }

        // Getters and setters
        public boolean isSuccess() {
            return success;
        }

        public void setSuccess(boolean success) {
            this.success = success;
        }

        public String getSubmissionId() {
            return submissionId;
        }

        public void setSubmissionId(String submissionId) {
            this.submissionId = submissionId;
        }

        public LocalDateTime getNextReviewAt() {
            return nextReviewAt;
        }

        public void setNextReviewAt(LocalDateTime nextReviewAt) {
            this.nextReviewAt = nextReviewAt;
        }

        public int getDaysUntilReview() {
            return daysUntilReview;
        }

        public void setDaysUntilReview(int daysUntilReview) {
            this.daysUntilReview = daysUntilReview;
        }

        public boolean isDue() {
            return isDue;
        }

        public void setDue(boolean due) {
            isDue = due;
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
    }
}