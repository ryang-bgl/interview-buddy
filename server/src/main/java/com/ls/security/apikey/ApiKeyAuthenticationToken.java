package com.ls.security.apikey;

import java.util.Collection;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;

public class ApiKeyAuthenticationToken extends AbstractAuthenticationToken {

    private Object principal;
    private Object credentials;

    private ApiKeyAuthenticationToken(Object principal, Object credentials, Collection<? extends GrantedAuthority> authorities, boolean authenticated) {
        super(authorities);
        this.principal = principal;
        this.credentials = credentials;
        super.setAuthenticated(authenticated);
    }

    public static ApiKeyAuthenticationToken unauthenticated(String apiKey) {
        return new ApiKeyAuthenticationToken(null, apiKey, null, false);
    }

    public static ApiKeyAuthenticationToken authenticated(ApiKeyUserDetails principal) {
        return new ApiKeyAuthenticationToken(principal, null, principal.getAuthorities(), true);
    }

    @Override
    public Object getCredentials() {
        return credentials;
    }

    @Override
    public Object getPrincipal() {
        return principal;
    }

    @Override
    public void setAuthenticated(boolean isAuthenticated) {
        if (isAuthenticated) {
            throw new IllegalArgumentException("Use the authenticated factory method instead");
        }
        super.setAuthenticated(false);
    }

    @Override
    public void eraseCredentials() {
        super.eraseCredentials();
        this.credentials = null;
    }
}
