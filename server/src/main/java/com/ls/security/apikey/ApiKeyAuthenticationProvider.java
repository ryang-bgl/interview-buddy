package com.ls.security.apikey;

import com.ls.dto.UserApiKeyAuthenticationResultDto;
import java.util.Optional;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
public class ApiKeyAuthenticationProvider implements AuthenticationProvider {

    private final ApiKeyAuthenticationService apiKeyAuthenticationService;

    public ApiKeyAuthenticationProvider(ApiKeyAuthenticationService apiKeyAuthenticationService) {
        this.apiKeyAuthenticationService = apiKeyAuthenticationService;
    }

    @Override
    public Authentication authenticate(Authentication authentication) throws AuthenticationException {
        if (!(authentication instanceof ApiKeyAuthenticationToken token)) {
            return null;
        }

        Object credentials = token.getCredentials();
        if (!(credentials instanceof String apiKey) || !StringUtils.hasText(apiKey)) {
            throw new BadCredentialsException("API key credentials are missing");
        }

        Optional<UserApiKeyAuthenticationResultDto> result = apiKeyAuthenticationService.authenticate(apiKey);
        return result
            .map(dto -> {
                ApiKeyUserDetails userDetails = new ApiKeyUserDetails(dto.user(), dto.apiKey());
                ApiKeyAuthenticationToken authenticated = ApiKeyAuthenticationToken.authenticated(userDetails);
                authenticated.setDetails(token.getDetails());
                return authenticated;
            })
            .orElseThrow(() -> new BadCredentialsException("Invalid API key"));
    }

    @Override
    public boolean supports(Class<?> authentication) {
        return ApiKeyAuthenticationToken.class.isAssignableFrom(authentication);
    }
}
