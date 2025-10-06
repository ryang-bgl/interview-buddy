package com.litdeck.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

public class ProblemFilterDto {

    private String difficulty;

    private List<String> tags;

    @JsonProperty("search_keyword")
    private String searchKeyword;

    @JsonProperty("paid_only")
    private Boolean paidOnly;

    public ProblemFilterDto() {}

    public ProblemFilterDto(String difficulty, List<String> tags, String searchKeyword, Boolean paidOnly) {
        this.difficulty = difficulty;
        this.tags = tags;
        this.searchKeyword = searchKeyword;
        this.paidOnly = paidOnly;
    }

    // Getters and Setters
    public String getDifficulty() {
        return difficulty;
    }

    public void setDifficulty(String difficulty) {
        this.difficulty = difficulty;
    }

    public List<String> getTags() {
        return tags;
    }

    public void setTags(List<String> tags) {
        this.tags = tags;
    }

    public String getSearchKeyword() {
        return searchKeyword;
    }

    public void setSearchKeyword(String searchKeyword) {
        this.searchKeyword = searchKeyword;
    }

    public Boolean getPaidOnly() {
        return paidOnly;
    }

    public void setPaidOnly(Boolean paidOnly) {
        this.paidOnly = paidOnly;
    }
}