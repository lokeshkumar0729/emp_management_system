package com.lokesh.ems.controller;

import com.lokesh.ems.dto.AuthResponse;
import com.lokesh.ems.dto.LoginRequest;
import com.lokesh.ems.dto.UserDto;
import com.lokesh.ems.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @GetMapping("/me")
    public UserDto me(Authentication authentication) {
        return authService.currentUser(authentication.getName());
    }
}
