package com.ls.repository;

import com.ls.dto.CreateUserApiKeyResponseDto;
import com.ls.dto.UserApiKeyDto;
import com.ls.jooq.Tables;
import com.ls.jooq.tables.UserApiKey;
import com.ls.security.apikey.ApiKeyHashService;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;
import org.jooq.DSLContext;
import org.jooq.Record;
import org.springframework.stereotype.Repository;

@Repository
public class UserApiKeyRepository {

    private static final UserApiKey USER_API_KEY = Tables.USER_API_KEY;

    private final DSLContext dsl;
    private final ApiKeyHashService apiKeyHashService;

    public UserApiKeyRepository(DSLContext dsl, ApiKeyHashService apiKeyHashService) {
        this.dsl = dsl;
        this.apiKeyHashService = apiKeyHashService;
    }

    public Optional<UserApiKeyDto> findActiveByHash(String keyHash) {
        return dsl
            .select(
                USER_API_KEY.ID,
                USER_API_KEY.USER_ID,
                USER_API_KEY.KEY_HASH,
                USER_API_KEY.LABEL,
                USER_API_KEY.REVOKED,
                USER_API_KEY.CREATED_DATE,
                USER_API_KEY.LAST_USED_DATE
            )
            .from(USER_API_KEY)
            .where(USER_API_KEY.KEY_HASH.eq(keyHash))
            .and(USER_API_KEY.REVOKED.eq((byte) 0))
            .fetchOptional(this::mapRecord);
    }

    public CreateUserApiKeyResponseDto create(String userId, String label) {
        String rawApiKey = generateRawApiKey();
        String hashedApiKey = apiKeyHashService.hash(rawApiKey);

        int rowsInserted = dsl.insertInto(USER_API_KEY)
            .set(USER_API_KEY.USER_ID, userId)
            .set(USER_API_KEY.KEY_HASH, hashedApiKey)
            .set(USER_API_KEY.LABEL, label)
            .set(USER_API_KEY.REVOKED, (byte) 0)
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
            .set(USER_API_KEY.LAST_USED_DATE, LocalDateTime.now())
            .where(USER_API_KEY.ID.eq(id))
            .execute();
    }

    public void deleteAllForUser(String userId) {
        dsl.deleteFrom(USER_API_KEY)
            .where(USER_API_KEY.USER_ID.eq(userId))
            .execute();
    }

    private UserApiKeyDto mapRecord(Record record) {
        return new UserApiKeyDto(
            Long.valueOf(record.get(USER_API_KEY.ID)),
            record.get(USER_API_KEY.USER_ID),
            record.get(USER_API_KEY.KEY_HASH),
            record.get(USER_API_KEY.LABEL),
            Boolean.TRUE.equals(record.get(USER_API_KEY.REVOKED)),
            record.get(USER_API_KEY.CREATED_DATE),
            record.get(USER_API_KEY.LAST_USED_DATE)
        );
    }

    private String generateRawApiKey() {
        return UUID.randomUUID().toString().replace("-", "")
            + UUID.randomUUID().toString().replace("-", "");
    }
}
