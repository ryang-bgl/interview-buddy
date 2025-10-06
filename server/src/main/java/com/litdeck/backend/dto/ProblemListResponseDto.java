package com.litdeck.backend.dto;

import java.util.List;

public class ProblemListResponseDto {

    private List<ProblemResponseDto> problems;
    private int total;
    private int page;
    private int limit;

    public ProblemListResponseDto() {}

    public ProblemListResponseDto(List<ProblemResponseDto> problems, int total, int page, int limit) {
        this.problems = problems;
        this.total = total;
        this.page = page;
        this.limit = limit;
    }

    // Getters and Setters
    public List<ProblemResponseDto> getProblems() {
        return problems;
    }

    public void setProblems(List<ProblemResponseDto> problems) {
        this.problems = problems;
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

    public int getLimit() {
        return limit;
    }

    public void setLimit(int limit) {
        this.limit = limit;
    }
}