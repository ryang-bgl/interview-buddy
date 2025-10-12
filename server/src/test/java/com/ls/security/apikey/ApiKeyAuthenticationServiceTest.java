package com.ls.security.apikey;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.ls.dto.UserApiKeyAuthenticationResultDto;
import com.ls.dto.UserApiKeyDto;
import com.ls.dto.UserDto;
import com.ls.repository.UserApiKeyRepository;
import com.ls.repository.UserRepository;
import java.time.LocalDateTime;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ApiKeyAuthenticationServiceTest {

    @Mock
    private ApiKeyHashService hashService;

    @Mock
    private UserApiKeyRepository userApiKeyRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private ApiKeyAuthenticationService apiKeyAuthenticationService;

    private static final String RAW_API_KEY = "test-api-key";
    private static final String HASHED_API_KEY = "hashed";

    private UserApiKeyDto apiKeyDto;
    private UserDto userDto;

    @BeforeEach
    void setUp() {
        apiKeyDto = new UserApiKeyDto(1L, "user-123", HASHED_API_KEY, "primary", false, LocalDateTime.now(), null);
        userDto = new UserDto("user-123", "user@example.com", "First", "Last", "leetuser", LocalDateTime.now(), LocalDateTime.now());
    }

    @Test
    void authenticateReturnsEmptyWhenKeyIsBlank() {
        Optional<UserApiKeyAuthenticationResultDto> result = apiKeyAuthenticationService.authenticate("   ");
        assertThat(result).isEmpty();
    }

    @Test
    void authenticateReturnsEmptyWhenNoMatchingKey() {
        when(hashService.hash(RAW_API_KEY)).thenReturn(HASHED_API_KEY);
        when(userApiKeyRepository.findActiveByHash(HASHED_API_KEY)).thenReturn(Optional.empty());

        Optional<UserApiKeyAuthenticationResultDto> result = apiKeyAuthenticationService.authenticate(RAW_API_KEY);

        assertThat(result).isEmpty();
        verify(userApiKeyRepository, never()).touchLastUsed(1L);
    }

    @Test
    void authenticateReturnsUserWhenKeyMatches() {
        when(hashService.hash(RAW_API_KEY)).thenReturn(HASHED_API_KEY);
        when(userApiKeyRepository.findActiveByHash(HASHED_API_KEY)).thenReturn(Optional.of(apiKeyDto));
        when(userRepository.findById("user-123")).thenReturn(Optional.of(userDto));

        Optional<UserApiKeyAuthenticationResultDto> result = apiKeyAuthenticationService.authenticate(RAW_API_KEY);

        assertThat(result).isPresent();
        assertThat(result.get().user()).isSameAs(userDto);
        assertThat(result.get().apiKey()).isSameAs(apiKeyDto);
        verify(userApiKeyRepository).touchLastUsed(1L);
    }

    @Test
    void authenticateReturnsEmptyWhenUserMissing() {
        when(hashService.hash(RAW_API_KEY)).thenReturn(HASHED_API_KEY);
        when(userApiKeyRepository.findActiveByHash(HASHED_API_KEY)).thenReturn(Optional.of(apiKeyDto));
        when(userRepository.findById("user-123")).thenReturn(Optional.empty());

        Optional<UserApiKeyAuthenticationResultDto> result = apiKeyAuthenticationService.authenticate(RAW_API_KEY);

        assertThat(result).isEmpty();
        verify(userApiKeyRepository, never()).touchLastUsed(1L);
    }
}
