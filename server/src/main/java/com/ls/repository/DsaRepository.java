package com.ls.repository;

import com.ls.dto.CreateUserDsaQuestionDto;
import com.ls.dto.UserDsaQuestionDto;
import org.jooq.DSLContext;
import org.jooq.Field;
import org.jooq.Table;
import org.jooq.impl.DSL;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;


import static com.ls.jooq.Tables.USER_DSA;

@Repository
public class DsaRepository {

    private final DSLContext dsl;

    @Autowired
    public DsaRepository(DSLContext dsl) {
        this.dsl = dsl;
    }

    public UserDsaQuestionDto saveUserQuestion(CreateUserDsaQuestionDto request) {
        Long id = dsl.insertInto(USER_DSA)
            .set(USER_DSA.USER_ID, request.userId())
            .set(USER_DSA.TITLE, request.title())
            .set(USER_DSA.TITLE_SLUG, request.titleSlug())
            .set(USER_DSA.DIFFICULTY, request.difficulty())
            .set(USER_DSA.IS_PAID_ONLY, (byte) (request.paidOnly() ? 1 : 0))
            .set(USER_DSA.DESCRIPTION, request.description())
            .set(USER_DSA.SOLUTION, request.solution())
            .set(USER_DSA.NOTE, request.note())
            .returningResult(USER_DSA.ID)
            .fetchOneInto(Long.class);

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
