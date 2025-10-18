package com.ls.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;


import com.ls.dto.CreateUserApiKeyRequestDto;
import com.ls.dto.CreateUserApiKeyResponseDto;
import com.ls.jooq.tables.pojos.User;
import com.ls.repository.UserApiKeyRepository;
import com.ls.security.apikey.ApiKeyHashService;
import com.ls.support.TestUserFactory;
import org.jooq.DSLContext;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class UserApiKeyServiceTest {

  @Autowired
  private DSLContext dsl;

  @Autowired
  private UserApiKeyService service;

  @Autowired
  private UserApiKeyRepository userApiKeyRepository;

  @Autowired
  private ApiKeyHashService hashService;

  private String userId;

  @BeforeEach
  void setUp() {
    userId = TestUserFactory.createUser(dsl, "ryang@leetstack.app").getId();
  }

  @Test
  void createApiKeyReturnsRawKeyAndPersistsHash() {
    CreateUserApiKeyRequestDto request = new CreateUserApiKeyRequestDto(userId, "Primary");

    CreateUserApiKeyResponseDto response = service.createApiKey(request);

    assertThat(response.rawApiKey()).isNotBlank();
    assertThat(response.apiKey().userId()).isEqualTo(userId);
    assertThat(response.apiKey().label()).isEqualTo("Primary");

    String expectedHash = hashService.hash(response.rawApiKey());
    assertThat(response.apiKey().keyHash()).isEqualTo(expectedHash);
    assertThat(response.apiKey().revoked()).isFalse();
  }

  @Test
  void createApiKeyFailsWhenUserMissing() {
    CreateUserApiKeyRequestDto request = new CreateUserApiKeyRequestDto("missing-user", null);

    assertThatThrownBy(() -> service.createApiKey(request))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessageContaining("User not found");
  }

  @Test
  void setupUser() {
    String u = "ryang@leetstack.app";
    User user = TestUserFactory.createUser(dsl, u);
    CreateUserApiKeyResponseDto dto = TestUserFactory.recreateApiKey(dsl, userApiKeyRepository, u);
    System.out.println("=== api key ===: " + dto.rawApiKey() );
  }
}
