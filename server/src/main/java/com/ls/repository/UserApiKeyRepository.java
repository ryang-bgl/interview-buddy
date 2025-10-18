package com.ls.repository;

import com.ls.dto.CreateUserApiKeyResponseDto;
import com.ls.dto.UserApiKeyDto;
import com.ls.security.apikey.ApiKeyHashService;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;
import org.jooq.DSLContext;
import org.jooq.Field;
import org.jooq.Record;
import org.jooq.Table;
import org.jooq.impl.DSL;
import org.springframework.stereotype.Repository;

@Repository
public class UserApiKeyRepository {

    private static final Table<Record> USER_API_KEY = DSL.table("user_api_key");
    private static final Field<Long> ID = DSL.field("id", Long.class);
    private static final Field<String> USER_ID = DSL.field("user_id", String.class);
    private static final Field<String> KEY_HASH = DSL.field("key_hash", String.class);
    private static final Field<String> LABEL = DSL.field("label", String.class);
    private static final Field<Boolean> REVOKED = DSL.field("revoked", Boolean.class);
    private static final Field<LocalDateTime> CREATED_DATE = DSL.field("created_date", LocalDateTime.class);
    private static final Field<LocalDateTime> LAST_USED_DATE = DSL.field("last_used_date", LocalDateTime.class);

    private final DSLContext dsl;
    private final ApiKeyHashService apiKeyHashService;

    public UserApiKeyRepository(DSLContext dsl, ApiKeyHashService apiKeyHashService) {
        this.dsl = dsl;
        this.apiKeyHashService = apiKeyHashService;
    }

    public Optional<UserApiKeyDto> findActiveByHash(String keyHash) {
        return dsl
            .select(ID, USER_ID, KEY_HASH, LABEL, REVOKED, CREATED_DATE, LAST_USED_DATE)
            .from(USER_API_KEY)
            .where(KEY_HASH.eq(keyHash))
            .and(REVOKED.eq(false))
            .fetchOptional(this::mapRecord);
    }

    public CreateUserApiKeyResponseDto create(String userId, String label) {
        String rawApiKey = generateRawApiKey();
        String hashedApiKey = apiKeyHashService.hash(rawApiKey);

        int rowsInserted = dsl.insertInto(USER_API_KEY)
            .set(USER_ID, userId)
            .set(KEY_HASH, hashedApiKey)
            .set(LABEL, label)
            .set(REVOKED, false)
            .execute();

        if (rowsInserted != 1) {
            throw new IllegalStateException("Failed to create user API key");
        }

        UserApiKeyDto apiKeyDto = findActiveByHash(hashedApiKey)
            .orElseThrow(() -> new IllegalStateException("Failed to load newly created API key"));

        return new CreateUserApiKeyResponseDto(rawApiKey, apiKeyDto);
    }

    public void touchLastUsed(Long id) {
        dsl.update(USER_API_KEY)
            .set(LAST_USED_DATE, LocalDateTime.now())
            .where(ID.eq(id))
            .execute();
    }

    public void deleteAllForUser(String userId) {
        dsl.deleteFrom(USER_API_KEY)
            .where(USER_ID.eq(userId))
            .execute();
    }

    private UserApiKeyDto mapRecord(Record record) {
        return new UserApiKeyDto(
            record.get(ID),
            record.get(USER_ID),
            record.get(KEY_HASH),
            record.get(LABEL),
            Boolean.TRUE.equals(record.get(REVOKED)),
            record.get(CREATED_DATE),
            record.get(LAST_USED_DATE)
        );
    }

    private String generateRawApiKey() {
        return UUID.randomUUID().toString().replace("-", "")
            + UUID.randomUUID().toString().replace("-", "");
    }
}
