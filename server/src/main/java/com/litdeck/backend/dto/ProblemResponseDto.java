package com.litdeck.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.LocalDateTime;
import java.util.List;

public class ProblemResponseDto {

    private Integer id;

    @JsonProperty("frontend_id")
    private Integer frontendId;

    private String title;

    @JsonProperty("title_slug")
    private String titleSlug;

    private String difficulty;

    @JsonProperty("is_paid_only")
    private Boolean isPaidOnly;

    private String content;

    @JsonProperty("topic_tags")
    private List<TopicTagDto> topicTags;

    @JsonProperty("example_testcases")
    private String exampleTestcases;

    @JsonProperty("similar_questions")
    private List<SimilarQuestionDto> similarQuestions;

    @JsonProperty("created_at")
    private LocalDateTime createdAt;

    @JsonProperty("solution_approach")
    private String solutionApproach;

    public ProblemResponseDto() {}

    // Getters and Setters
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

    public Boolean getIsPaidOnly() {
        return isPaidOnly;
    }

    public void setIsPaidOnly(Boolean isPaidOnly) {
        this.isPaidOnly = isPaidOnly;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public List<TopicTagDto> getTopicTags() {
        return topicTags;
    }

    public void setTopicTags(List<TopicTagDto> topicTags) {
        this.topicTags = topicTags;
    }

    public String getExampleTestcases() {
        return exampleTestcases;
    }

    public void setExampleTestcases(String exampleTestcases) {
        this.exampleTestcases = exampleTestcases;
    }

    public List<SimilarQuestionDto> getSimilarQuestions() {
        return similarQuestions;
    }

    public void setSimilarQuestions(List<SimilarQuestionDto> similarQuestions) {
        this.similarQuestions = similarQuestions;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public String getSolutionApproach() {
        return solutionApproach;
    }

    public void setSolutionApproach(String solutionApproach) {
        this.solutionApproach = solutionApproach;
    }
}