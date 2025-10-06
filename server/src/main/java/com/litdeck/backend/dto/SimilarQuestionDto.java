package com.litdeck.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;

public class SimilarQuestionDto {

    @NotBlank(message = "Title cannot be blank")
    private String title;

    @NotBlank(message = "Title slug cannot be blank")
    @JsonProperty("titleSlug")
    private String titleSlug;

    @NotBlank(message = "Difficulty cannot be blank")
    private String difficulty;

    @JsonProperty("translatedTitle")
    private String translatedTitle;

    public SimilarQuestionDto() {}

    public SimilarQuestionDto(String title, String titleSlug, String difficulty, String translatedTitle) {
        this.title = title;
        this.titleSlug = titleSlug;
        this.difficulty = difficulty;
        this.translatedTitle = translatedTitle;
    }

    // Getters and Setters
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

    public String getTranslatedTitle() {
        return translatedTitle;
    }

    public void setTranslatedTitle(String translatedTitle) {
        this.translatedTitle = translatedTitle;
    }
}