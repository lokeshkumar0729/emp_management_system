package com.lokesh.ems.service;

import com.lokesh.ems.dto.AuthResponse;
import com.lokesh.ems.dto.LoginRequest;
import com.lokesh.ems.dto.UserDto;
import com.lokesh.ems.exception.ApiException;
import com.lokesh.ems.model.User;
import com.lokesh.ems.repository.UserRepository;
import com.lokesh.ems.security.JwtService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final JwtService jwt;
    /** Compared against when the email is unknown so response time does not reveal which emails exist. */
    private final String dummyHash;

    public AuthService(UserRepository users, PasswordEncoder encoder, JwtService jwt) {
        this.users = users;
        this.encoder = encoder;
        this.jwt = jwt;
        this.dummyHash = encoder.encode("not-a-real-password");
    }

    public AuthResponse login(LoginRequest request) {
        User user = users.findByEmailIgnoreCase(request.email().trim()).orElse(null);
        String hash = user != null ? user.getPasswordHash() : dummyHash;
        boolean matches = encoder.matches(request.password(), hash);
        if (user == null || !matches) {
            throw ApiException.unauthorized("Invalid email or password");
        }
        return new AuthResponse(jwt.generateToken(user.getEmail(), user.getRole()), UserDto.from(user));
    }

    public UserDto currentUser(String email) {
        return users.findByEmailIgnoreCase(email)
                .map(UserDto::from)
                .orElseThrow(() -> ApiException.unauthorized("Account no longer exists"));
    }
}
