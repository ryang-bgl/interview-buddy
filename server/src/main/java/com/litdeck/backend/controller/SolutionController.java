package com.litdeck.backend.controller;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/solutions")
public class SolutionController {

    // TODO: Add SolutionService when implemented
    // private final SolutionService solutionService;

    // @Autowired
    // public SolutionController(SolutionService solutionService) {
    //     this.solutionService = solutionService;
    // }

    /**
     * Get solutions for a problem
     * GET /api/solutions?id={id}&language={language}
     */
    @GetMapping
    public Map<String, String> getSolutions(
            @RequestParam(required = false) Integer id,
            @RequestParam(required = false) String language) {

        if (id == null) {
            throw new IllegalArgumentException("Problem ID is required");
        }

        // TODO: Implement when SolutionService is available
        if (language != null && !language.trim().isEmpty()) {
            // Get solution for specific language
            // SolutionDto solution = solutionService.getSolutionByProblemAndLanguage(id, language);
            // if (solution == null) {
            //     throw new ResourceNotFoundException("Solution not found");
            // }
            // Map<String, String> solutionMap = new HashMap<>();
            // solutionMap.put(solution.getLanguage(), solution.getSolutionCode());
            // return solutionMap;

            Map<String, String> solutionMap = new HashMap<>();
            solutionMap.put(language, "// Placeholder solution code for " + language);
            return solutionMap;
        } else {
            // Get all solutions for this problem
            // return solutionService.getSolutionsByProblemIdAsMap(id);

            Map<String, String> solutionsMap = new HashMap<>();
            solutionsMap.put("java", "// Placeholder Java solution");
            solutionsMap.put("python", "# Placeholder Python solution");
            solutionsMap.put("javascript", "// Placeholder JavaScript solution");
            return solutionsMap;
        }
    }

    /**
     * Create a new solution
     * POST /api/solutions
     * Note: This endpoint is currently commented out in the Go routes and would be protected by auth
     */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SolutionResponseDto createSolution(@Valid @RequestBody SolutionRequestDto request) {
        if (request.getProblemId() == null || request.getProblemId() <= 0) {
            throw new IllegalArgumentException("Problem ID is required");
        }

        // TODO: Implement when SolutionService is available
        // return solutionService.createSolution(request);

        return new SolutionResponseDto(1, request.getProblemId(), request.getLanguage(),
            request.getSolutionCode(), request.getDescription());
    }

    /**
     * Update an existing solution
     * PUT /api/solutions?id={id}
     * Note: This endpoint is currently commented out in the Go routes and would be protected by auth
     */
    @PutMapping
    public SolutionResponseDto updateSolution(
            @RequestParam Integer id,
            @Valid @RequestBody SolutionRequestDto request) {

        if (id == null) {
            throw new IllegalArgumentException("Solution ID is required");
        }

        // TODO: Implement when SolutionService is available
        // SolutionDto updatedSolution = solutionService.updateSolution(id, request);
        // if (updatedSolution == null) {
        //     throw new ResourceNotFoundException("Solution not found");
        // }
        // return updatedSolution;

        return new SolutionResponseDto(id, request.getProblemId(), request.getLanguage(),
            request.getSolutionCode(), request.getDescription());
    }

    /**
     * Delete a solution
     * DELETE /api/solutions?id={id}
     * Note: This endpoint is currently commented out in the Go routes and would be protected by auth
     */
    @DeleteMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteSolution(@RequestParam Integer id) {
        if (id == null) {
            throw new IllegalArgumentException("Solution ID is required");
        }

        // TODO: Implement when SolutionService is available
        // boolean deleted = solutionService.deleteSolution(id);
        // if (!deleted) {
        //     throw new ResourceNotFoundException("Solution not found");
        // }
    }

    // DTOs
    public static class SolutionRequestDto {
        private Integer problemId;
        private String language;
        private String solutionCode;
        private String description;

        public SolutionRequestDto() {}

        // Getters and setters
        public Integer getProblemId() {
            return problemId;
        }

        public void setProblemId(Integer problemId) {
            this.problemId = problemId;
        }

        public String getLanguage() {
            return language;
        }

        public void setLanguage(String language) {
            this.language = language;
        }

        public String getSolutionCode() {
            return solutionCode;
        }

        public void setSolutionCode(String solutionCode) {
            this.solutionCode = solutionCode;
        }

        public String getDescription() {
            return description;
        }

        public void setDescription(String description) {
            this.description = description;
        }
    }

    public static class SolutionResponseDto {
        private Integer id;
        private Integer problemId;
        private String language;
        private String solutionCode;
        private String description;

        public SolutionResponseDto() {}

        public SolutionResponseDto(Integer id, Integer problemId, String language, String solutionCode, String description) {
            this.id = id;
            this.problemId = problemId;
            this.language = language;
            this.solutionCode = solutionCode;
            this.description = description;
        }

        // Getters and setters
        public Integer getId() {
            return id;
        }

        public void setId(Integer id) {
            this.id = id;
        }

        public Integer getProblemId() {
            return problemId;
        }

        public void setProblemId(Integer problemId) {
            this.problemId = problemId;
        }

        public String getLanguage() {
            return language;
        }

        public void setLanguage(String language) {
            this.language = language;
        }

        public String getSolutionCode() {
            return solutionCode;
        }

        public void setSolutionCode(String solutionCode) {
            this.solutionCode = solutionCode;
        }

        public String getDescription() {
            return description;
        }

        public void setDescription(String description) {
            this.description = description;
        }
    }
}