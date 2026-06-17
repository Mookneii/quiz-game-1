package com.quizgame.backend.controller;

import com.quizgame.backend.service.JwtService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/test")
public class TestController {

    private final JwtService jwtService;

    public TestController(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @GetMapping("/secure")
    public String secure(
            @RequestHeader("Authorization")
            String authHeader
    ) {

        String token = authHeader.substring(7);

        if (!jwtService.isTokenValid(token)) {
            return "INVALID TOKEN";
        }

        return "VALID TOKEN";
    }
}