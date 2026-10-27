package com.lokesh.ems.security;

import com.lokesh.ems.model.Role;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JwtServiceTest {

    private static final String SECRET = "unit-test-secret-unit-test-secret-1234";

    @Test
    void validTokenReturnsTheEmailItWasIssuedFor() {
        JwtService jwt = new JwtService(SECRET, 30);
        String token = jwt.generateToken("emp1@example.com", Role.EMPLOYEE);

        assertThat(jwt.validateAndGetEmail(token)).contains("emp1@example.com");
    }

    @Test
    void tamperedTokenIsRejected() {
        JwtService jwt = new JwtService(SECRET, 30);
        String token = jwt.generateToken("emp1@example.com", Role.EMPLOYEE);
        String tampered = token.substring(0, token.length() - 3) + "abc";

        assertThat(jwt.validateAndGetEmail(tampered)).isEmpty();
    }

    @Test
    void tokenSignedWithAnotherSecretIsRejected() {
        String token = new JwtService("another-secret-another-secret-12345678", 30)
                .generateToken("emp1@example.com", Role.EMPLOYEE);

        assertThat(new JwtService(SECRET, 30).validateAndGetEmail(token)).isEmpty();
    }

    @Test
    void expiredTokenIsRejected() {
        JwtService jwt = new JwtService(SECRET, -5);
        String token = jwt.generateToken("emp1@example.com", Role.EMPLOYEE);

        assertThat(jwt.validateAndGetEmail(token)).isEmpty();
    }

    @Test
    void garbageIsRejected() {
        JwtService jwt = new JwtService(SECRET, 30);

        assertThat(jwt.validateAndGetEmail("not-a-jwt")).isEmpty();
        assertThat(jwt.validateAndGetEmail("")).isEmpty();
    }

    @Test
    void shortSecretPreventsStartup() {
        assertThatThrownBy(() -> new JwtService("too-short", 30))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("at least 32");
    }
}
