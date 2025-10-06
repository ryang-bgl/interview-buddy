package com.litdeck.backend.repository;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.litdeck.backend.dto.ProblemFilterDto;
import com.litdeck.backend.dto.SimilarQuestionDto;
import com.litdeck.backend.dto.TopicTagDto;
import com.litdeck.backend.entity.ProblemEntity;
import com.litdeck.backend.jooq.tables.records.ProblemsRecord;
import org.jooq.*;
import org.jooq.exception.DataAccessException;
import org.jooq.impl.DSL;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static com.litdeck.backend.jooq.Tables.*;

@Repository
public class ProblemRepository {

    private final DSLContext dsl;
    private final ObjectMapper objectMapper;

    @Autowired
    public ProblemRepository(DSLContext dsl, ObjectMapper objectMapper) {
        this.dsl = dsl;
        this.objectMapper = objectMapper;
    }

    /**
     * Get problem by slug
     */
    public Optional<ProblemEntity> getProblemBySlug(String titleSlug) {
        ProblemsRecord record = dsl.selectFrom(PROBLEMS)
                .where(PROBLEMS.TITLE_SLUG.eq(titleSlug))
                .fetchOne();

        return record != null ? Optional.of(mapRecordToEntity(record)) : Optional.empty();
    }

    /**
     * Get problem by ID
     */
    public Optional<ProblemEntity> getProblemById(Integer id) {
        ProblemsRecord record = dsl.selectFrom(PROBLEMS)
                .where(PROBLEMS.ID.eq(id))
                .fetchOne();

        return record != null ? Optional.of(mapRecordToEntity(record)) : Optional.empty();
    }

    /**
     * Get problem by frontend ID
     */
    public Optional<ProblemEntity> getProblemByFrontendId(Integer frontendId) {
        ProblemsRecord record = dsl.selectFrom(PROBLEMS)
                .where(PROBLEMS.FRONTEND_ID.eq(frontendId))
                .fetchOne();

        return record != null ? Optional.of(mapRecordToEntity(record)) : Optional.empty();
    }

    /**
     * List problems with filtering and pagination
     */
    public List<ProblemEntity> listProblems(ProblemFilterDto filter, int limit, int offset, String orderBy, String orderDir) {
        SelectWhereStep<ProblemsRecord> query = dsl.selectFrom(PROBLEMS);

        // Apply filters
        List<Condition> conditions = new ArrayList<>();

        if (filter.getDifficulty() != null && !filter.getDifficulty().isEmpty()) {
            conditions.add(PROBLEMS.DIFFICULTY.eq(filter.getDifficulty()));
        }

        if (filter.getPaidOnly() != null) {
            conditions.add(PROBLEMS.IS_PAID_ONLY.eq(filter.getPaidOnly() ? (byte) 1 : (byte) 0));
        }

        if (filter.getSearchKeyword() != null && !filter.getSearchKeyword().isEmpty()) {
            conditions.add(PROBLEMS.TITLE.containsIgnoreCase(filter.getSearchKeyword()));
        }

        // For tags filtering, we need to join with problems_topic table
        if (filter.getTags() != null && !filter.getTags().isEmpty()) {
            // This is a simplified approach - for proper tag filtering, you might need to use EXISTS or IN subquery
            SelectConditionStep<Record1<Integer>> problemIds = dsl.select(PROBLEMS_TOPIC.PROBLEM_ID)
                    .from(PROBLEMS_TOPIC)
                    .where(PROBLEMS_TOPIC.TOPIC_SLUG.in(filter.getTags()));

            conditions.add(PROBLEMS.ID.in(problemIds));
        }

        SelectConditionStep<ProblemsRecord> conditionQuery = query.where(conditions);

        // Apply ordering
        SelectLimitStep<ProblemsRecord> orderedQuery = applyOrdering(conditionQuery, orderBy, orderDir);

        // Apply pagination
        return orderedQuery.limit(limit).offset(offset)
                .fetch()
                .map(this::mapRecordToEntity);
    }

    /**
     * Count problems with filter
     */
    public int countProblems(ProblemFilterDto filter) {
        SelectWhereStep<Record1<Integer>> query = dsl.selectCount().from(PROBLEMS);

        List<Condition> conditions = new ArrayList<>();

        if (filter.getDifficulty() != null && !filter.getDifficulty().isEmpty()) {
            conditions.add(PROBLEMS.DIFFICULTY.eq(filter.getDifficulty()));
        }

        if (filter.getPaidOnly() != null) {
            conditions.add(PROBLEMS.IS_PAID_ONLY.eq(filter.getPaidOnly() ? (byte) 1 : (byte) 0));
        }

        if (filter.getSearchKeyword() != null && !filter.getSearchKeyword().isEmpty()) {
            conditions.add(PROBLEMS.TITLE.containsIgnoreCase(filter.getSearchKeyword()));
        }

        if (filter.getTags() != null && !filter.getTags().isEmpty()) {
            SelectConditionStep<Record1<Integer>> problemIds = dsl.select(PROBLEMS_TOPIC.PROBLEM_ID)
                    .from(PROBLEMS_TOPIC)
                    .where(PROBLEMS_TOPIC.TOPIC_SLUG.in(filter.getTags()));

            conditions.add(PROBLEMS.ID.in(problemIds));
        }

        Record1<Integer> result = query.where(conditions).fetchOne();
        return result != null ? result.value1() : 0;
    }

    /**
     * Apply ordering to query
     */
    private SelectLimitStep<ProblemsRecord> applyOrdering(SelectConditionStep<ProblemsRecord> query, String orderBy, String orderDir) {
        boolean desc = "desc".equalsIgnoreCase(orderDir);

        if ("difficulty".equalsIgnoreCase(orderBy)) {
            // Custom ordering for difficulty: Easy=1, Medium=2, Hard=3
            Field<Integer> difficultyCase = DSL.case_(DSL.lower(PROBLEMS.DIFFICULTY))
                    .when("easy", 1)
                    .when("medium", 2)
                    .when("hard", 3)
                    .else_(0);

            return desc ? query.orderBy(difficultyCase.desc()) : query.orderBy(difficultyCase.asc());
        } else if ("title".equalsIgnoreCase(orderBy)) {
            return desc ? query.orderBy(PROBLEMS.TITLE.desc()) : query.orderBy(PROBLEMS.TITLE.asc());
        } else if ("frontend_id".equalsIgnoreCase(orderBy)) {
            return desc ? query.orderBy(PROBLEMS.FRONTEND_ID.desc()) : query.orderBy(PROBLEMS.FRONTEND_ID.asc());
        } else if ("created_at".equalsIgnoreCase(orderBy)) {
            return desc ? query.orderBy(PROBLEMS.CREATED_AT.desc()) : query.orderBy(PROBLEMS.CREATED_AT.asc());
        } else {
            // Default ordering by frontend_id ASC
            return query.orderBy(PROBLEMS.FRONTEND_ID.asc());
        }
    }

    /**
     * Map jOOQ record to entity
     */
    private ProblemEntity mapRecordToEntity(ProblemsRecord record) {
        return new ProblemEntity(
                record.getId(),
                record.getFrontendId(),
                record.getTitle(),
                record.getTitleSlug(),
                record.getDifficulty(),
                record.getIsPaidOnly() != null ? record.getIsPaidOnly() == 1 : false,
                record.getContent(),
                record.getTopicTags() != null ? record.getTopicTags().toString() : null,
                record.getExampleTestcases(),
                record.getSimilarQuestions() != null ? record.getSimilarQuestions().toString() : null,
                record.getCreatedAt(),
                null  // solution_approach field may not exist in current schema
        );
    }
}