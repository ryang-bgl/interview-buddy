package com.litdeck.backend.controller;

import com.litdeck.backend.controller.GlobalExceptionHandler.*;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/decks")
public class DeckController {

    // TODO: Add DeckService, ProblemService, and FlashcardReviewService when implemented

    @GetMapping
    public AllDecksResponseDto getAllDecks() {
        // TODO: Get authenticated user's UUID from JWT context
        UUID userID = UUID.randomUUID(); // Placeholder

        // TODO: Implement when DeckService is available
        // List<DeckDto> publicDecks = deckService.getAllPublicDecks();
        // List<DeckDto> userDecks = deckService.getUserDecks(userID);
        // return new AllDecksResponseDto(publicDecks, userDecks);

        return new AllDecksResponseDto(List.of(), List.of());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public DeckResponseDto createDeck(@Valid @RequestBody DeckRequestDto request) {
        // TODO: Get authenticated user's UUID from JWT context
        UUID userID = UUID.randomUUID(); // Placeholder

        // TODO: Implement when DeckService is available
        // return deckService.createDeck(userID, request);

        return new DeckResponseDto(1, userID.toString(), request.getName(),
            request.getDescription(), request.getIsPublic(), LocalDateTime.now());
    }

    @PutMapping("/{id}")
    public DeckResponseDto updateDeck(@PathVariable int id, @Valid @RequestBody DeckRequestDto request) {
        // TODO: Get authenticated user's UUID from JWT context
        UUID userID = UUID.randomUUID(); // Placeholder

        // TODO: Implement when DeckService is available
        // Check ownership and update
        // if (!deckService.isOwner(id, userID)) {
        //     throw new ForbiddenException("You don't have permission to update this deck");
        // }
        // return deckService.updateDeck(id, request);

        return new DeckResponseDto(id, userID.toString(), request.getName(),
            request.getDescription(), request.getIsPublic(), LocalDateTime.now());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteDeck(@PathVariable int id) {
        // TODO: Get authenticated user's UUID from JWT context
        UUID userID = UUID.randomUUID(); // Placeholder

        // TODO: Implement when DeckService is available
        // Check ownership and delete
        // if (!deckService.isOwner(id, userID)) {
        //     throw new ForbiddenException("You don't have permission to delete this deck");
        // }
        // deckService.deleteDeck(id, userID);
    }

    @GetMapping("/{id}/problems")
    public List<ProblemDto> getDeckProblems(
            @PathVariable int id,
            @RequestParam(defaultValue = "20") int limit,
            @RequestParam(defaultValue = "0") int offset) {

        // Validate pagination
        if (limit <= 0) limit = 20;
        if (offset < 0) offset = 0;

        // TODO: Implement when DeckService is available
        // return deckService.getProblemsInDeck(id, limit, offset);

        return List.of();
    }

    @PostMapping("/{id}/problems")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public void addProblemToDeckAndCreateFlashcard(
            @PathVariable int id,
            @Valid @RequestBody AddProblemRequestDto request) {

        // TODO: Get authenticated user's UUID from JWT context
        UUID userID = UUID.randomUUID(); // Placeholder

        // TODO: Implement when services are available
        // Check ownership, add problem, create flashcard
        // if (!deckService.isOwner(id, userID)) {
        //     throw new ForbiddenException("You don't have permission to modify this deck");
        // }
        // deckService.addProblemToDeck(id, request.getProblemId());
        // flashcardReviewService.createFlashcardReview(request.getProblemId(), userID.toString(), id);
    }

    @DeleteMapping("/{id}/problems/{problemId}")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public void removeProblemFromDeck(@PathVariable int id, @PathVariable int problemId) {
        // TODO: Get authenticated user's UUID from JWT context
        UUID userID = UUID.randomUUID(); // Placeholder

        // TODO: Implement when services are available
        // Check ownership and remove
        // if (!deckService.isOwner(id, userID)) {
        //     throw new ForbiddenException("You don't have permission to modify this deck");
        // }
        // deckService.removeProblemFromDeck(id, problemId, userID);
    }

    @PostMapping("/{id}/start-practice")
    public StartPracticeResponseDto startPracticePublicDeck(@PathVariable int id) {
        // TODO: Get authenticated user's UUID from JWT context
        UUID userID = UUID.randomUUID(); // Placeholder

        // TODO: Implement when services are available
        // Check if deck is public and add to user's flashcards
        // DeckDto deck = deckService.getDeckById(id);
        // if (deck == null) {
        //     throw new ResourceNotFoundException("Deck not found");
        // }
        // if (!deck.getIsPublic()) {
        //     throw new ForbiddenException("Cannot start practice on a private deck you don't own");
        // }
        // flashcardReviewService.addDeckToUserFlashcards(userID, id);

        return new StartPracticeResponseDto("Deck prepared for practice successfully");
    }

    // DTOs
    public static class DeckRequestDto {
        private String name;
        private String description;
        private Boolean isPublic;

        public DeckRequestDto() {}

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public Boolean getIsPublic() { return isPublic; }
        public void setIsPublic(Boolean isPublic) { this.isPublic = isPublic; }
    }

    public static class DeckResponseDto {
        private int id;
        private String userId;
        private String name;
        private String description;
        private Boolean isPublic;
        private LocalDateTime createdAt;

        public DeckResponseDto() {}

        public DeckResponseDto(int id, String userId, String name, String description, Boolean isPublic, LocalDateTime createdAt) {
            this.id = id;
            this.userId = userId;
            this.name = name;
            this.description = description;
            this.isPublic = isPublic;
            this.createdAt = createdAt;
        }

        // Getters and setters
        public int getId() { return id; }
        public void setId(int id) { this.id = id; }
        public String getUserId() { return userId; }
        public void setUserId(String userId) { this.userId = userId; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public Boolean getIsPublic() { return isPublic; }
        public void setIsPublic(Boolean isPublic) { this.isPublic = isPublic; }
        public LocalDateTime getCreatedAt() { return createdAt; }
        public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    }

    public static class AllDecksResponseDto {
        private List<DeckResponseDto> publicDecks;
        private List<DeckResponseDto> userDecks;

        public AllDecksResponseDto() {}

        public AllDecksResponseDto(List<DeckResponseDto> publicDecks, List<DeckResponseDto> userDecks) {
            this.publicDecks = publicDecks;
            this.userDecks = userDecks;
        }

        public List<DeckResponseDto> getPublicDecks() { return publicDecks; }
        public void setPublicDecks(List<DeckResponseDto> publicDecks) { this.publicDecks = publicDecks; }
        public List<DeckResponseDto> getUserDecks() { return userDecks; }
        public void setUserDecks(List<DeckResponseDto> userDecks) { this.userDecks = userDecks; }
    }

    public static class AddProblemRequestDto {
        private int problemId;

        public AddProblemRequestDto() {}

        public int getProblemId() { return problemId; }
        public void setProblemId(int problemId) { this.problemId = problemId; }
    }

    public static class ProblemDto {
        private int id;
        private String title;
        private String difficulty;

        public ProblemDto() {}

        public int getId() { return id; }
        public void setId(int id) { this.id = id; }
        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        public String getDifficulty() { return difficulty; }
        public void setDifficulty(String difficulty) { this.difficulty = difficulty; }
    }

    public static class StartPracticeResponseDto {
        private String message;

        public StartPracticeResponseDto() {}

        public StartPracticeResponseDto(String message) {
            this.message = message;
        }

        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
    }
}