package com.ls.service;

import com.ls.dto.CreateUserApiKeyRequestDto;
import com.ls.dto.CreateUserApiKeyResponseDto;
import com.ls.repository.UserApiKeyRepository;
import com.ls.repository.UserRepository;
import java.util.Objects;
import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
public class UserApiKeyService {

    private final UserApiKeyRepository userApiKeyRepository;
    private final UserRepository userRepository;

    public UserApiKeyService(
        UserApiKeyRepository userApiKeyRepository,
        UserRepository userRepository
    ) {
        this.userApiKeyRepository = userApiKeyRepository;
        this.userRepository = userRepository;
    }

    public CreateUserApiKeyResponseDto createApiKey(CreateUserApiKeyRequestDto request) {
        Objects.requireNonNull(request, "request must not be null");
        if (!StringUtils.hasText(request.userId())) {
            throw new IllegalArgumentException("userId must not be blank");
        }

        userRepository
            .findById(request.userId())
            .orElseThrow(() -> new IllegalArgumentException("User not found for id=" + request.userId()));

        String label = Optional.ofNullable(request.label())
            .map(String::trim)
            .filter(StringUtils::hasText)
            .orElse(null);

        return userApiKeyRepository.create(request.userId(), label);
    }
}
