package com.quizgame.backend.service;

import com.quizgame.backend.model.User;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;

@Service
public class JwtService {

        private static final String SECRET = "mySecretKeyForQuizGameJwtTokenGeneration123456789";

        private final SecretKey key = Keys.hmacShaKeyFor(
                        SECRET.getBytes(StandardCharsets.UTF_8));

        public String generateToken(User user) {

                return Jwts.builder()
                                .subject(user.getEmail())
                                .claim("id", user.getId())
                                .claim("name", user.getName())
                                .issuedAt(new Date())
                                .expiration(
                                                new Date(
                                                                System.currentTimeMillis()
                                                                                + 1000 * 30))
                                .signWith(key)
                                .compact();
        }

        private Claims extractAllClaims(String token) {

                return Jwts.parser()
                                .verifyWith(key)
                                .build()
                                .parseSignedClaims(token)
                                .getPayload();
        }

        public String extractEmail(String token) {

                return extractAllClaims(token)
                                .getSubject();
        }

        public boolean isTokenExpired(String token) {

                return extractAllClaims(token)
                                .getExpiration()
                                .before(new Date());
        }

        public boolean isTokenValid(String token) {
                try {
                        return !isTokenExpired(token);
                } catch (Exception e) {
                        e.printStackTrace();
                        return false;
                }
        }
}