package com.ls.support;

import java.time.LocalDateTime;
import java.util.UUID;
import org.jooq.DSLContext;
import org.jooq.impl.DSL;

public final class TestUserFactory {

    private TestUserFactory() {
    }

    public static String createUser(DSLContext dsl) {
        LocalDateTime now = LocalDateTime.now();
        String userId = UUID.randomUUID().toString();

        dsl.insertInto(DSL.table("users"))
            .set(DSL.field("id", String.class), userId)
            .set(DSL.field("email", String.class), userId + "@example.com")
            .set(DSL.field("first_name", String.class), "Test")
            .set(DSL.field("last_name", String.class), "User")
            .set(DSL.field("leetstack_username", String.class), "user_" + UUID.randomUUID())
            .set(DSL.field("created_date", LocalDateTime.class), now)
            .set(DSL.field("last_updated_date", LocalDateTime.class), now)
            .execute();

        return userId;
    }

    public static void deleteAllUsers(DSLContext dsl) {
        dsl.deleteFrom(DSL.table("user_api_key")).execute();
        dsl.deleteFrom(DSL.table("users")).execute();
    }
}
