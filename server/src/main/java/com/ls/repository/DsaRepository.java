package com.ls.repository;

import com.ls.dto.CreateUserDsaQuestionDto;
import com.ls.dto.UserDsaQuestionDto;
import com.ls.jooq.tables.records.UserDsaRecord;
import org.jooq.DSLContext;
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

    public UserDsaQuestionDto saveOrUpdateUserQuestion(CreateUserDsaQuestionDto request) {
        dsl.insertInto(USER_DSA)
            .set(USER_DSA.USER_ID, request.userId())
            .set(USER_DSA.TITLE, request.title())
            .set(USER_DSA.TITLE_SLUG, request.titleSlug())
            .set(USER_DSA.DIFFICULTY, request.difficulty())
            .set(USER_DSA.IS_PAID_ONLY, (byte) (request.paidOnly() ? 1 : 0))
            .set(USER_DSA.DESCRIPTION, request.description())
            .set(USER_DSA.SOLUTION, request.solution())
            .set(USER_DSA.IDEAL_SOLUTION_CODE, request.idealSolutionCode())
            .set(USER_DSA.NOTE, request.note())
            .set(USER_DSA.EXAMPLE_TESTCASES, request.exampleTestcases())
            .onDuplicateKeyUpdate()
            .set(USER_DSA.TITLE, request.title())
            .set(USER_DSA.DIFFICULTY, request.difficulty())
            .set(USER_DSA.IS_PAID_ONLY, (byte) (request.paidOnly() ? 1 : 0))
            .set(USER_DSA.DESCRIPTION, request.description())
            .set(USER_DSA.SOLUTION, request.solution())
            .set(USER_DSA.IDEAL_SOLUTION_CODE, request.idealSolutionCode())
            .set(USER_DSA.NOTE, request.note())
            .set(USER_DSA.EXAMPLE_TESTCASES, request.exampleTestcases())
            .execute();

        return dsl
            .selectFrom(USER_DSA)
            .where(USER_DSA.USER_ID.eq(request.userId()))
            .and(USER_DSA.TITLE_SLUG.eq(request.titleSlug()))
            .fetchOptional(this::mapRecord)
            .orElseThrow(() -> new IllegalStateException("Failed to load user_dsa question"));
    }

    private UserDsaQuestionDto mapRecord(UserDsaRecord record) {
        if (record == null) {
            throw new IllegalStateException("Record cannot be null");
        }

        Byte paidOnlyFlag = record.getIsPaidOnly();

        return new UserDsaQuestionDto(
            record.getId() != null ? record.getId().longValue() : null,
            record.getUserId(),
            record.getTitle(),
            record.getTitleSlug(),
            record.getDifficulty(),
            paidOnlyFlag != null && paidOnlyFlag == 1,
            record.getDescription(),
            record.getSolution(),
            record.getIdealSolutionCode(),
            record.getNote(),
            record.getExampleTestcases()
        );
    }
}
