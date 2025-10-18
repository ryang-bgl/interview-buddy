package com.ls.repository;

import com.ls.dto.UserDto;
import com.ls.jooq.Tables;
import com.ls.jooq.tables.User;
import java.util.Optional;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;

@Repository
public class UserRepository {

    private static final User USER = Tables.USER;

    private final DSLContext dsl;

    public UserRepository(DSLContext dsl) {
        this.dsl = dsl;
    }

    public Optional<UserDto> findById(String id) {
        return dsl
            .select(USER.ID, USER.EMAIL, USER.FIRST_NAME, USER.LAST_NAME, USER.LEETSTACK_USERNAME, USER.CREATED_DATE, USER.LAST_UPDATED_DATE)
            .from(USER)
            .where(USER.ID.eq(id))
            .fetchOptional(record ->
                new UserDto(
                    record.get(USER.ID),
                    record.get(USER.EMAIL),
                    record.get(USER.FIRST_NAME),
                    record.get(USER.LAST_NAME),
                    record.get(USER.LEETSTACK_USERNAME),
                    record.get(USER.CREATED_DATE),
                    record.get(USER.LAST_UPDATED_DATE)
                )
            );
    }
}
