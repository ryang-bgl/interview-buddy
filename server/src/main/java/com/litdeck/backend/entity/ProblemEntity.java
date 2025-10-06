package com.litdeck.backend.entity;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Entity class representing a Problem in the database
 * This class works with jOOQ generated classes
 */
public class ProblemEntity {

    private Integer id;
    private Integer frontendId;
    private String title;
    private String titleSlug;
    private String difficulty;
    private Boolean isPaidOnly;
    private String content;
    private String topicTagsJson; // JSON string for topic tags
    private String exampleTestcases;
    private String similarQuestionsJson; // JSON string for similar questions
    private LocalDateTime createdAt;
    private String solutionApproach;

    public ProblemEntity() {}

    public ProblemEntity(Integer id, Integer frontendId, String title, String titleSlug,
                        String difficulty, Boolean isPaidOnly, String content,
                        String topicTagsJson, String exampleTestcases,
                        String similarQuestionsJson, LocalDateTime createdAt,
                        String solutionApproach) {
        this.id = id;
        this.frontendId = frontendId;
        this.title = title;
        this.titleSlug = titleSlug;
        this.difficulty = difficulty;
        this.isPaidOnly = isPaidOnly;
        this.content = content;
        this.topicTagsJson = topicTagsJson;
        this.exampleTestcases = exampleTestcases;
        this.similarQuestionsJson = similarQuestionsJson;
        this.createdAt = createdAt;
        this.solutionApproach = solutionApproach;
    }

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

    public String getTopicTagsJson() {
        return topicTagsJson;
    }

    public void setTopicTagsJson(String topicTagsJson) {
        this.topicTagsJson = topicTagsJson;
    }

    public String getExampleTestcases() {
        return exampleTestcases;
    }

    public void setExampleTestcases(String exampleTestcases) {
        this.exampleTestcases = exampleTestcases;
    }

    public String getSimilarQuestionsJson() {
        return similarQuestionsJson;
    }

    public void setSimilarQuestionsJson(String similarQuestionsJson) {
        this.similarQuestionsJson = similarQuestionsJson;
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

    @Override
    public String toString() {
        return "ProblemEntity{" +
                "id=" + id +
                ", frontendId=" + frontendId +
                ", title='" + title + '\'' +
                ", titleSlug='" + titleSlug + '\'' +
                ", difficulty='" + difficulty + '\'' +
                ", isPaidOnly=" + isPaidOnly +
                ", createdAt=" + createdAt +
                '}';
    }
}