package com.litdeck.backend.controller;

import com.litdeck.backend.dto.ProblemFilterDto;
import com.litdeck.backend.dto.ProblemListResponseDto;
import com.litdeck.backend.dto.ProblemResponseDto;
import com.litdeck.backend.service.ProblemService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

@RestController
@RequestMapping("/api/problems")
@CrossOrigin(origins = "*")
public class ProblemController {

    private final ProblemService problemService;

    @Autowired
    public ProblemController(ProblemService problemService) {
        this.problemService = problemService;
    }

    /**
     * Get problem by ID, frontend ID, or slug
     * GET /api/problems?id={id}&frontend_id={frontend_id}&slug={slug}
     */
    @GetMapping
    public ProblemResponseDto getProblemByQuery(
            @RequestParam(required = false) Integer id,
            @RequestParam(required = false) Integer frontend_id,
            @RequestParam(required = false) String slug) {

        try {
            if (id != null) {
                return problemService.getProblemById(id)
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Problem not found"));
            }

            if (frontend_id != null) {
                return problemService.getProblemByFrontendId(frontend_id)
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Problem not found"));
            }

            if (slug != null && !slug.trim().isEmpty()) {
                return problemService.getProblemBySlug(slug)
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Problem not found"));
            }

            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Either id, frontend_id, or slug parameter is required");

        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to get problem");
        }
    }

    /**
     * List problems with filtering and pagination
     * GET /api/problems/list
     */
    @GetMapping("/list")
    public ProblemListResponseDto listProblems(
            @RequestParam(defaultValue = "20") int limit,
            @RequestParam(defaultValue = "0") int offset,
            @RequestParam(required = false) String difficulty,
            @RequestParam(required = false) String order_by,
            @RequestParam(required = false) String order_dir,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String tags,
            @RequestParam(required = false) Boolean paid_only) {

        try {
            // Parse tags parameter
            List<String> tagList = Collections.emptyList();
            if (tags != null && !tags.trim().isEmpty()) {
                tagList = Arrays.asList(tags.split(","));
            }

            // Create filter
            ProblemFilterDto filter = new ProblemFilterDto(difficulty, tagList, search, paid_only);

            // Get problems
            return problemService.listProblems(filter, limit, offset, order_by, order_dir);

        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to get problems list");
        }
    }
}