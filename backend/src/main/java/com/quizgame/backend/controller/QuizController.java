package com.quizgame.backend.controller;

import com.quizgame.backend.dto.QuizRequestDTO;
import com.quizgame.backend.dto.QuizResponseDTO;
import com.quizgame.backend.service.JwtService;
import com.quizgame.backend.service.QuizService;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/quizzes")
@CrossOrigin(origins = "*")
public class QuizController {

    private final QuizService quizService;
    private final JwtService jwtService;

    public QuizController(QuizService quizService, JwtService jwtService) {
        this.quizService = quizService;
        this.jwtService = jwtService;
    }

    @PostMapping
    public QuizResponseDTO createQuiz(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody QuizRequestDTO request) {

        String token = authHeader.substring(7);

        if (!jwtService.isTokenValid(token)) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Token expired or invalid");
        }

        return quizService.createQuiz(request);
    }

    @GetMapping
    public List<QuizResponseDTO> getAllQuizzes() {
        return quizService.getAllQuizzes();
    }

    @GetMapping("/{id}")
    public QuizResponseDTO getQuizById(
            @PathVariable Long id) {
        return quizService.getQuizById(id);
    }

    @PutMapping("/{id}")
    public QuizResponseDTO updateQuiz(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long id,
            @RequestBody QuizRequestDTO request) {

        String token = authHeader.substring(7);

        if (!jwtService.isTokenValid(token)) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Token expired or invalid");
        }

        return quizService.updateQuiz(id, request);
    }

    @DeleteMapping("/{id}")
    public void deleteQuiz(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long id) {

        String token = authHeader.substring(7);

        if (!jwtService.isTokenValid(token)) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Token expired or invalid");
        }

        quizService.deleteQuiz(id);
    }
}