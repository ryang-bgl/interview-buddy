package com.ls.security.apikey;

import com.ls.dto.UserApiKeyAuthenticationResultDto;
import com.ls.repository.UserApiKeyRepository;
import com.ls.repository.UserRepository;
import java.util.Optional;
import org.springframework.stereotype.Service;

@Service
public class ApiKeyAuthenticationService {

    private final ApiKeyHashService apiKeyHashService;
    private final UserApiKeyRepository userApiKeyRepository;
    private final UserRepository userRepository;

    public ApiKeyAuthenticationService(
        ApiKeyHashService apiKeyHashService,
        UserApiKeyRepository userApiKeyRepository,
        UserRepository userRepository
    ) {
        this.apiKeyHashService = apiKeyHashService;
        this.userApiKeyRepository = userApiKeyRepository;
        this.userRepository = userRepository;
    }

    public Optional<UserApiKeyAuthenticationResultDto> authenticate(String rawApiKey) {
        if (rawApiKey == null || rawApiKey.isBlank()) {
            return Optional.empty();
        }

        String normalizedKey = rawApiKey.trim();
        String hashedKey = apiKeyHashService.hash(normalizedKey);

        return userApiKeyRepository.findActiveByHash(hashedKey)
            .flatMap(apiKeyDto ->
                userRepository.findById(apiKeyDto.userId())
                    .map(userDto -> {
                        userApiKeyRepository.touchLastUsed(apiKeyDto.id());
                        return new UserApiKeyAuthenticationResultDto(userDto, apiKeyDto);
                    })
            );
    }
}
