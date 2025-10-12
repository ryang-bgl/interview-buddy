package com.ls.controller;

import com.ls.dto.UserDto;
import com.ls.security.apikey.ApiKeyUserDetails;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.server.ResponseStatusException;

@Controller
@RequestMapping("/api")
public class AuthController {

    @PostMapping("/auth-by-api-key")
    @ResponseBody
    public UserDto authenticate(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof ApiKeyUserDetails userDetails)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid API key");
        }

        return userDetails.getUser();
    }

    @GetMapping("/current-principal")
    @ResponseBody
    public UserDto currentPrincipal(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof ApiKeyUserDetails userDetails)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "No authenticated principal available");
        }

        return userDetails.getUser();
    }
}
