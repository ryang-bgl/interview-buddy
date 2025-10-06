package com.litdeck.backend.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.litdeck.backend.dto.*;
import com.litdeck.backend.entity.ProblemEntity;
import com.litdeck.backend.repository.ProblemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ProblemService {

    private final ProblemRepository problemRepository;
    private final ObjectMapper objectMapper;

    @Autowired
    public ProblemService(ProblemRepository problemRepository, ObjectMapper objectMapper) {
        this.problemRepository = problemRepository;
        this.objectMapper = objectMapper;
    }

    /**
     * Get problem by slug
     */
    public Optional<ProblemResponseDto> getProblemBySlug(String titleSlug) {
        return problemRepository.getProblemBySlug(titleSlug)
                .map(this::mapEntityToResponseDto);
    }

    /**
     * Get problem by ID
     */
    public Optional<ProblemResponseDto> getProblemById(Integer id) {
        return problemRepository.getProblemById(id)
                .map(this::mapEntityToResponseDto);
    }

    /**
     * Get problem by frontend ID
     */
    public Optional<ProblemResponseDto> getProblemByFrontendId(Integer frontendId) {
        return problemRepository.getProblemByFrontendId(frontendId)
                .map(this::mapEntityToResponseDto);
    }

    /**
     * List problems with filtering and pagination
     */
    public ProblemListResponseDto listProblems(ProblemFilterDto filter, int limit, int offset, String orderBy, String orderDir) {
        // Validate and set defaults
        if (limit <= 0 || limit > 100) {
            limit = 20;
        }
        if (offset < 0) {
            offset = 0;
        }

        List<ProblemEntity> problemEntities = problemRepository.listProblems(filter, limit, offset, orderBy, orderDir);
        int total = problemRepository.countProblems(filter);

        List<ProblemResponseDto> problems = problemEntities.stream()
                .map(this::mapEntityToResponseDto)
                .collect(Collectors.toList());

        // Calculate page number from offset and limit
        int page = (offset / limit) + 1;

        return new ProblemListResponseDto(problems, total, page, limit);
    }

    /**
     * Map entity to response DTO
     */
    private ProblemResponseDto mapEntityToResponseDto(ProblemEntity entity) {
        ProblemResponseDto dto = new ProblemResponseDto();
        dto.setId(entity.getId());
        dto.setFrontendId(entity.getFrontendId());
        dto.setTitle(entity.getTitle());
        dto.setTitleSlug(entity.getTitleSlug());
        dto.setDifficulty(entity.getDifficulty());
        dto.setIsPaidOnly(entity.getIsPaidOnly());
        dto.setContent(entity.getContent());
        dto.setExampleTestcases(entity.getExampleTestcases());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setSolutionApproach(entity.getSolutionApproach());

        // Parse JSON strings to DTOs
        dto.setTopicTags(parseTopicTags(entity.getTopicTagsJson()));
        dto.setSimilarQuestions(parseSimilarQuestions(entity.getSimilarQuestionsJson()));

        return dto;
    }

    /**
     * Parse topic tags JSON string to list of DTOs
     */
    private List<TopicTagDto> parseTopicTags(String topicTagsJson) {
        if (topicTagsJson == null || topicTagsJson.trim().isEmpty()) {
            return Collections.emptyList();
        }

        try {
            return objectMapper.readValue(topicTagsJson, new TypeReference<List<TopicTagDto>>() {});
        } catch (JsonProcessingException e) {
            // Log error and return empty list
            return Collections.emptyList();
        }
    }

    /**
     * Parse similar questions JSON string to list of DTOs
     */
    private List<SimilarQuestionDto> parseSimilarQuestions(String similarQuestionsJson) {
        if (similarQuestionsJson == null || similarQuestionsJson.trim().isEmpty()) {
            return Collections.emptyList();
        }

        try {
            return objectMapper.readValue(similarQuestionsJson, new TypeReference<List<SimilarQuestionDto>>() {});
        } catch (JsonProcessingException e) {
            // Log error and return empty list
            return Collections.emptyList();
        }
    }
}