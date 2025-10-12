package com.ls.security.apikey;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import jakarta.servlet.ServletException;
import java.io.IOException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

@ExtendWith(MockitoExtension.class)
class ApiKeyAuthenticationFilterTest {

    @Mock
    private ApiKeyAuthenticationProvider authenticationProvider;

    @Mock
    private Authentication authentication;

    private ApiKeyAuthenticationFilter filter;

    @BeforeEach
    void setUp() {
        filter = new ApiKeyAuthenticationFilter(authenticationProvider);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void nonLoginRequestsBypassAuthentication() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/dsa/questions");
        request.setServletPath("/api/dsa/questions");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, new MockFilterChain());

        assertThat(response.getStatus()).isEqualTo(200);
        verifyNoInteractions(authenticationProvider);
    }

    @Test
    void missingApiKeyHeaderReturnsUnauthorized() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/auth-by-api-key");
        request.setServletPath("/api/auth-by-api-key");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, new MockFilterChain());

        assertThat(response.getStatus()).isEqualTo(401);
        verifyNoInteractions(authenticationProvider);
    }

    @Test
    void successfulAuthenticationSetsSecurityContext() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/auth-by-api-key");
        request.setServletPath("/api/auth-by-api-key");
        request.addHeader(ApiKeyAuthenticationFilter.API_KEY_HEADER, "test-key");
        MockHttpServletResponse response = new MockHttpServletResponse();

        when(authentication.isAuthenticated()).thenReturn(true);
        when(authenticationProvider.authenticate(any())).thenReturn(authentication);

        filter.doFilter(request, response, new MockFilterChain());

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isEqualTo(authentication);
        assertThat(response.getStatus()).isEqualTo(200);
        verify(authenticationProvider).authenticate(any());
    }

    @Test
    void failedAuthenticationReturnsUnauthorized() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/auth-by-api-key");
        request.setServletPath("/api/auth-by-api-key");
        request.addHeader(ApiKeyAuthenticationFilter.API_KEY_HEADER, "bad-key");
        MockHttpServletResponse response = new MockHttpServletResponse();

        when(authenticationProvider.authenticate(any())).thenThrow(new BadCredentialsException("Invalid"));

        filter.doFilter(request, response, new MockFilterChain());

        assertThat(response.getStatus()).isEqualTo(401);
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(authenticationProvider).authenticate(any());
    }
}
