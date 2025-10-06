package com.litdeck.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;

public class TopicTagDto {

    @NotBlank(message = "Name cannot be blank")
    private String name;

    @NotBlank(message = "Slug cannot be blank")
    private String slug;

    @JsonProperty("translatedName")
    private String translatedName;

    public TopicTagDto() {}

    public TopicTagDto(String name, String slug, String translatedName) {
        this.name = name;
        this.slug = slug;
        this.translatedName = translatedName;
    }

    // Getters and Setters
    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getSlug() {
        return slug;
    }

    public void setSlug(String slug) {
        this.slug = slug;
    }

    public String getTranslatedName() {
        return translatedName;
    }

    public void setTranslatedName(String translatedName) {
        this.translatedName = translatedName;
    }
}