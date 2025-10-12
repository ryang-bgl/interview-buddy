package com.ls.repository;

import com.ls.dto.UserDto;
import java.time.LocalDateTime;
import java.util.Optional;
import org.jooq.DSLContext;
import org.jooq.Field;
import org.jooq.Record;
import org.jooq.Table;
import org.jooq.impl.DSL;
import org.springframework.stereotype.Repository;

@Repository
public class UserRepository {

    private static final Table<Record> USERS = DSL.table("users");
    private static final Field<String> ID = DSL.field("id", String.class);
    private static final Field<String> EMAIL = DSL.field("email", String.class);
    private static final Field<String> FIRST_NAME = DSL.field("first_name", String.class);
    private static final Field<String> LAST_NAME = DSL.field("last_name", String.class);
    private static final Field<String> LEETSTACK_USERNAME = DSL.field("leetstack_username", String.class);
    private static final Field<LocalDateTime> CREATED_DATE = DSL.field("created_date", LocalDateTime.class);
    private static final Field<LocalDateTime> LAST_UPDATED_DATE = DSL.field("last_updated_date", LocalDateTime.class);

    private final DSLContext dsl;

    public UserRepository(DSLContext dsl) {
        this.dsl = dsl;
    }

    public Optional<UserDto> findById(String id) {
        return dsl
            .select(ID, EMAIL, FIRST_NAME, LAST_NAME, LEETSTACK_USERNAME, CREATED_DATE, LAST_UPDATED_DATE)
            .from(USERS)
            .where(ID.eq(id))
            .fetchOptional(record ->
                new UserDto(
                    record.get(ID),
                    record.get(EMAIL),
                    record.get(FIRST_NAME),
                    record.get(LAST_NAME),
                    record.get(LEETSTACK_USERNAME),
                    record.get(CREATED_DATE),
                    record.get(LAST_UPDATED_DATE)
                )
            );
    }
}
