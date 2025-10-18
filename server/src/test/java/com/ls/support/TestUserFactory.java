package com.ls.support;

import static com.ls.jooq.tables.User.USER;

import com.ls.dto.CreateUserApiKeyResponseDto;
import com.ls.jooq.tables.pojos.User;
import com.ls.repository.UserApiKeyRepository;
import java.time.LocalDateTime;
import java.util.UUID;
import org.jooq.DSLContext;
import org.jooq.impl.DSL;

public final class TestUserFactory {

    public static User createUser(DSLContext dsl, String email) {

      com.ls.jooq.tables.pojos.User user = dsl.selectFrom(USER)
            .where(USER.EMAIL.eq(email))
            .fetchOneInto(User.class);

        if (user != null) {
            return user;
        }

        LocalDateTime now = LocalDateTime.now();
        String userId = UUID.randomUUID().toString();

        dsl.insertInto(USER)
            .set(USER.ID, userId)
            .set(USER.EMAIL, email)
            .set(USER.FIRST_NAME, "Test")
            .set(USER.LAST_NAME, "User")
            .set(USER.LEETSTACK_USERNAME, "user_" + UUID.randomUUID())
            .set(USER.CREATED_DATE, now)
            .set(USER.LAST_UPDATED_DATE, now)
            .execute();

      User user2 = dsl.selectFrom(USER).fetchOneInto(User.class);

      return user2;
    }

    public static void deleteAllUsers(DSLContext dsl) {
        dsl.deleteFrom(DSL.table("user_api_key")).execute();
        dsl.deleteFrom(DSL.table("users")).execute();
    }

    public static CreateUserApiKeyResponseDto recreateApiKey(
        DSLContext dsl,
        UserApiKeyRepository repository,
        String email
    ) {
        User user = createUser(dsl, email);
        repository.deleteAllForUser(user.getId());
        return repository.create(user.getId(), "Test key");
    }
}
