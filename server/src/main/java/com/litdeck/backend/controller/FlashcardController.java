package com.litdeck.backend.controller;

import com.litdeck.backend.controller.GlobalExceptionHandler.*;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/flashcards")
public class FlashcardController {

    @GetMapping("/reviews")
    public FlashcardReviewListResponseDto getFlashcardReviews(
            @RequestParam(required = false) Integer deck_id,
            @RequestParam(defaultValue = "10") int limit,
            @RequestParam(defaultValue = "0") int offset) {

        // TODO: Get authenticated user's UUID from JWT context
        UUID userID = UUID.randomUUID(); // Placeholder

        if (limit <= 0) limit = 10;
        if (offset < 0) offset = 0;

        int deckId = (deck_id != null) ? deck_id : 0;

        // TODO: Implement when FlashcardReviewService is available
        // return flashcardReviewService.getDueFlashcardReviews(userID, deckId, limit, offset);

        return new FlashcardReviewListResponseDto(List.of(), 0);
    }

    @PostMapping("/reviews")
    public SubmitFlashcardReviewResponseDto submitFlashcardReview(
            @Valid @RequestBody SubmitReviewRequestDto request) {

        // TODO: Get authenticated user's UUID from JWT context
        UUID userID = UUID.randomUUID(); // Placeholder

        if (request.getRating() < 1 || request.getRating() > 4) {
            throw new IllegalArgumentException("Rating must be between 1 and 4");
        }

        // TODO: Implement when FlashcardReviewService is available
        // Check ownership and process FSRS
        // FlashcardReview review = flashcardReviewService.getReviewById(request.getReviewId());
        // if (!review.getUserId().equals(userID.toString())) {
        //     throw new ForbiddenException("You don't have permission to review this flashcard");
        // }
        // return flashcardReviewService.updateFlashcardReview(review, request.getRating());

        return new SubmitFlashcardReviewResponseDto(true, LocalDateTime.now().plusDays(1), 1);
    }

    @PostMapping("/decks/{deck_id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void addDeckToFlashcards(@PathVariable int deck_id) {
        // TODO: Get authenticated user's UUID from JWT context
        UUID userID = UUID.randomUUID(); // Placeholder

        // TODO: Implement when services are available
        // Verify deck access and add to user's flashcards
        // DeckDto deck = deckService.getDeckById(deck_id);
        // if (deck == null) {
        //     throw new ResourceNotFoundException("Deck not found");
        // }
        // if (!deck.getIsPublic() && !deck.getUserId().equals(userID.toString())) {
        //     throw new ForbiddenException("You don't have access to this deck");
        // }
        // flashcardReviewService.addDeckToUserFlashcards(userID, deck_id);
    }

    // DTOs
    public static class SubmitReviewRequestDto {
        private int reviewId;
        private int rating;

        public SubmitReviewRequestDto() {}

        public int getReviewId() { return reviewId; }
        public void setReviewId(int reviewId) { this.reviewId = reviewId; }
        public int getRating() { return rating; }
        public void setRating(int rating) { this.rating = rating; }
    }

    public static class FlashcardReviewListResponseDto {
        private List<FlashcardReviewWithProblemDto> reviews;
        private int total;

        public FlashcardReviewListResponseDto() {}

        public FlashcardReviewListResponseDto(List<FlashcardReviewWithProblemDto> reviews, int total) {
            this.reviews = reviews;
            this.total = total;
        }

        public List<FlashcardReviewWithProblemDto> getReviews() { return reviews; }
        public void setReviews(List<FlashcardReviewWithProblemDto> reviews) { this.reviews = reviews; }
        public int getTotal() { return total; }
        public void setTotal(int total) { this.total = total; }
    }

    public static class FlashcardReviewWithProblemDto {
        private int id;
        private int problemId;
        private String userId;
        private int deckId;
        private LocalDateTime dueDate;
        private String problemTitle;
        private String problemSlug;
        private String problemDifficulty;

        public FlashcardReviewWithProblemDto() {}

        // Getters and setters
        public int getId() { return id; }
        public void setId(int id) { this.id = id; }
        public int getProblemId() { return problemId; }
        public void setProblemId(int problemId) { this.problemId = problemId; }
        public String getUserId() { return userId; }
        public void setUserId(String userId) { this.userId = userId; }
        public int getDeckId() { return deckId; }
        public void setDeckId(int deckId) { this.deckId = deckId; }
        public LocalDateTime getDueDate() { return dueDate; }
        public void setDueDate(LocalDateTime dueDate) { this.dueDate = dueDate; }
        public String getProblemTitle() { return problemTitle; }
        public void setProblemTitle(String problemTitle) { this.problemTitle = problemTitle; }
        public String getProblemSlug() { return problemSlug; }
        public void setProblemSlug(String problemSlug) { this.problemSlug = problemSlug; }
        public String getProblemDifficulty() { return problemDifficulty; }
        public void setProblemDifficulty(String problemDifficulty) { this.problemDifficulty = problemDifficulty; }
    }

    public static class SubmitFlashcardReviewResponseDto {
        private boolean success;
        private LocalDateTime nextReviewAt;
        private int daysUntilReview;

        public SubmitFlashcardReviewResponseDto() {}

        public SubmitFlashcardReviewResponseDto(boolean success, LocalDateTime nextReviewAt, int daysUntilReview) {
            this.success = success;
            this.nextReviewAt = nextReviewAt;
            this.daysUntilReview = daysUntilReview;
        }

        public boolean isSuccess() { return success; }
        public void setSuccess(boolean success) { this.success = success; }
        public LocalDateTime getNextReviewAt() { return nextReviewAt; }
        public void setNextReviewAt(LocalDateTime nextReviewAt) { this.nextReviewAt = nextReviewAt; }
        public int getDaysUntilReview() { return daysUntilReview; }
        public void setDaysUntilReview(int daysUntilReview) { this.daysUntilReview = daysUntilReview; }
    }
}