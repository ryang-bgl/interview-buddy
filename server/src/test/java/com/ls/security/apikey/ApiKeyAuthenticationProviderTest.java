package com.ls.security.apikey;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

import com.ls.dto.UserApiKeyAuthenticationResultDto;
import com.ls.dto.UserApiKeyDto;
import com.ls.dto.UserDto;
import java.time.LocalDateTime;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.Authentication;

@ExtendWith(MockitoExtension.class)
class ApiKeyAuthenticationProviderTest {

    @Mock
    private ApiKeyAuthenticationService apiKeyAuthenticationService;

    private ApiKeyAuthenticationProvider provider;

    @BeforeEach
    void setUp() {
        provider = new ApiKeyAuthenticationProvider(apiKeyAuthenticationService);
    }

    @Test
    void authenticateReturnsAuthenticatedTokenWhenApiKeyValid() {
        UserApiKeyDto apiKeyDto = new UserApiKeyDto(1L, "user-123", "hash", "primary", false, LocalDateTime.now(), null);
        UserDto userDto = new UserDto("user-123", "user@example.com", "First", "Last", "leetuser", LocalDateTime.now(), LocalDateTime.now());
        when(apiKeyAuthenticationService.authenticate("valid-key"))
            .thenReturn(Optional.of(new UserApiKeyAuthenticationResultDto(userDto, apiKeyDto)));

        ApiKeyAuthenticationToken authenticationRequest = ApiKeyAuthenticationToken.unauthenticated("valid-key");
        Authentication authentication = provider.authenticate(authenticationRequest);

        assertThat(authentication).isInstanceOf(ApiKeyAuthenticationToken.class);
        assertThat(authentication.isAuthenticated()).isTrue();
        assertThat(authentication.getPrincipal()).isInstanceOf(ApiKeyUserDetails.class);
    }

    @Test
    void authenticateThrowsWhenServiceReturnsEmpty() {
        when(apiKeyAuthenticationService.authenticate("invalid"))
            .thenReturn(Optional.empty());

        ApiKeyAuthenticationToken authenticationRequest = ApiKeyAuthenticationToken.unauthenticated("invalid");
        assertThrows(BadCredentialsException.class, () -> provider.authenticate(authenticationRequest));
    }

    @Test
    void authenticateThrowsWhenCredentialsMissing() {
        ApiKeyAuthenticationToken authenticationRequest = ApiKeyAuthenticationToken.unauthenticated(null);
        assertThrows(BadCredentialsException.class, () -> provider.authenticate(authenticationRequest));
    }
}
