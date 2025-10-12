package com.ls.repository;

import com.ls.dto.CreateUserDsaQuestionDto;
import com.ls.dto.UserDsaQuestionDto;
import org.jooq.DSLContext;
import org.jooq.Field;
import org.jooq.Table;
import org.jooq.impl.DSL;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

@Repository
public class DsaRepository {

    private static final Table<?> USER_DSA = DSL.table("user_dsa");
    private static final Field<Long> USER_DSA_ID = DSL.field("id", Long.class);
    private static final Field<String> USER_DSA_USER_ID = DSL.field("user_id", String.class);
    private static final Field<String> USER_DSA_TITLE = DSL.field("title", String.class);
    private static final Field<String> USER_DSA_TITLE_SLUG = DSL.field("title_slug", String.class);
    private static final Field<String> USER_DSA_DIFFICULTY = DSL.field("difficulty", String.class);
    private static final Field<Boolean> USER_DSA_IS_PAID_ONLY = DSL.field("is_paid_only", Boolean.class);
    private static final Field<String> USER_DSA_DESCRIPTION = DSL.field("description", String.class);
    private static final Field<String> USER_DSA_SOLUTION = DSL.field("solution", String.class);
    private static final Field<String> USER_DSA_NOTE = DSL.field("note", String.class);
    private static final Field<String> USER_DSA_EXAMPLE_TESTCASES = DSL.field("example_testcases", String.class);

    private final DSLContext dsl;

    @Autowired
    public DsaRepository(DSLContext dsl) {
        this.dsl = dsl;
    }

    public UserDsaQuestionDto saveUserQuestion(CreateUserDsaQuestionDto request) {
        Long id = dsl.insertInto(USER_DSA)
            .set(USER_DSA_USER_ID, request.userId())
            .set(USER_DSA_TITLE, request.title())
            .set(USER_DSA_TITLE_SLUG, request.titleSlug())
            .set(USER_DSA_DIFFICULTY, request.difficulty())
            .set(USER_DSA_IS_PAID_ONLY, request.paidOnly())
            .set(USER_DSA_DESCRIPTION, request.description())
            .set(USER_DSA_SOLUTION, request.solution())
            .set(USER_DSA_NOTE, request.note())
            .set(USER_DSA_EXAMPLE_TESTCASES, request.exampleTestcases())
            .returningResult(USER_DSA_ID)
            .fetchOne(USER_DSA_ID);

        if (id == null) {
            throw new IllegalStateException("Failed to persist user_dsa question");
        }

        return new UserDsaQuestionDto(
            id,
            request.userId(),
            request.title(),
            request.titleSlug(),
            request.difficulty(),
            request.paidOnly(),
            request.description(),
            request.solution(),
            request.note(),
            request.exampleTestcases()
        );
    }
}
