package com.ls.security.apikey;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;
import org.springframework.security.web.util.matcher.RequestMatcher;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

public class ApiKeyAuthenticationFilter extends OncePerRequestFilter {

    public static final String API_KEY_HEADER = "X-API-Key";

    private final ApiKeyAuthenticationProvider authenticationProvider;
    private final RequestMatcher loginRequestMatcher;

    public ApiKeyAuthenticationFilter(ApiKeyAuthenticationProvider authenticationProvider) {
        this(authenticationProvider, new AntPathRequestMatcher("/api/auth-by-api-key", "POST"));
    }

    public ApiKeyAuthenticationFilter(ApiKeyAuthenticationProvider authenticationProvider, RequestMatcher loginRequestMatcher) {
        this.authenticationProvider = authenticationProvider;
        this.loginRequestMatcher = loginRequestMatcher;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
        throws ServletException, IOException {

        if (!loginRequestMatcher.matches(request)) {
            filterChain.doFilter(request, response);
            return;
        }

        String apiKey = request.getHeader(API_KEY_HEADER);
        if (!StringUtils.hasText(apiKey)) {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "API key credentials are missing");
            return;
        }

        ApiKeyAuthenticationToken authenticationRequest = ApiKeyAuthenticationToken.unauthenticated(apiKey);
        authenticationRequest.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

        Authentication authenticationResult;
        try {
            authenticationResult = authenticationProvider.authenticate(authenticationRequest);
        } catch (AuthenticationException e) {
            SecurityContextHolder.clearContext();
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, e.getMessage());
            return;
        }

        if (authenticationResult == null || !authenticationResult.isAuthenticated()) {
            SecurityContextHolder.clearContext();
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Invalid API key");
            return;
        }

        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authenticationResult);
        SecurityContextHolder.setContext(context);
        request.getSession(true);

        filterChain.doFilter(request, response);
    }
}
