package com.ls.security.apikey;

import com.ls.dto.UserApiKeyDto;
import com.ls.dto.UserDto;
import java.util.Collection;
import java.util.List;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.util.StringUtils;

public class ApiKeyUserDetails implements UserDetails {

    private final UserDto user;
    private final UserApiKeyDto apiKey;
    private final List<GrantedAuthority> authorities;

    public ApiKeyUserDetails(UserDto user, UserApiKeyDto apiKey) {
        this.user = user;
        this.apiKey = apiKey;
        this.authorities = List.of(new SimpleGrantedAuthority("ROLE_USER"));
    }

    public UserDto getUser() {
        return user;
    }

    public UserApiKeyDto getApiKey() {
        return apiKey;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return null;
    }

    @Override
    public String getUsername() {
        if (StringUtils.hasText(user.leetstackUsername())) {
            return user.leetstackUsername();
        }
        return user.email();
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return !apiKey.revoked();
    }
}
