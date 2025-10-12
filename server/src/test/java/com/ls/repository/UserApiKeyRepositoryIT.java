package com.ls.repository;

import static org.assertj.core.api.Assertions.assertThat;

import com.ls.dto.CreateUserApiKeyResponseDto;
import com.ls.security.apikey.ApiKeyHashService;
import com.ls.support.TestUserFactory;
import org.jooq.DSLContext;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class UserApiKeyRepositoryIT {

  private static final Logger log = LoggerFactory.getLogger(UserApiKeyRepositoryIT.class);
  @Autowired
    private DSLContext dsl;

    @Autowired
    private UserApiKeyRepository repository;

    @Autowired
    private ApiKeyHashService hashService;

    private String userId;

    @BeforeEach
    void setUp() {
        userId = TestUserFactory.createUser(dsl);
    }

    @Test
    void createPersistsHashedKey() {
        String label = "Primary key";

        CreateUserApiKeyResponseDto result = repository.create(userId, label);

        assertThat(result.rawApiKey()).isNotBlank();
        assertThat(result.apiKey().id()).isNotNull();
        assertThat(result.apiKey().userId()).isEqualTo(userId);
        assertThat(result.apiKey().label()).isEqualTo(label);
        assertThat(result.apiKey().revoked()).isFalse();
        assertThat(result.apiKey().lastUsedDate()).isNull();

        String expectedHash = hashService.hash(result.rawApiKey());

      System.out.println("====api-key: " + result.rawApiKey());
        assertThat(result.apiKey().keyHash()).isEqualTo(expectedHash);
    }
}
