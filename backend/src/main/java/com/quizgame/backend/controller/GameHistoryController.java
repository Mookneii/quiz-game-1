package com.quizgame.backend.controller;

import com.quizgame.backend.dto.GameHistoryDTO;
import com.quizgame.backend.dto.GameHistoryDetailDTO;
import com.quizgame.backend.service.GameHistoryService;
import com.quizgame.backend.service.JwtService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/game-history")
@CrossOrigin(origins = "*")
public class GameHistoryController {

    private final GameHistoryService gameHistoryService;
    private final JwtService jwtService;

    public GameHistoryController(
            GameHistoryService gameHistoryService,
            JwtService jwtService) {
        this.gameHistoryService = gameHistoryService;
        this.jwtService = jwtService;
    }

    @GetMapping
    public List<GameHistoryDTO> getUserGameHistory(
            @RequestHeader("Authorization") String authHeader) {

        String token = authHeader.substring(7);

        if (!jwtService.isTokenValid(token)) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Token expired or invalid");
        }

        Long userId = jwtService.extractUserId(token);
        return gameHistoryService.getUserGameHistory(userId);
    }

    @GetMapping("/{gameResultId}")
    public GameHistoryDetailDTO getGameHistoryDetail(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long gameResultId) {

        String token = authHeader.substring(7);

        if (!jwtService.isTokenValid(token)) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Token expired or invalid");
        }

        Long userId = jwtService.extractUserId(token);
        return gameHistoryService.getGameHistoryDetail(userId, gameResultId);
    }

    @DeleteMapping("/{gameResultId}")
    public void deleteGameHistory(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long gameResultId) {

        String token = authHeader.substring(7);

        if (!jwtService.isTokenValid(token)) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Token expired or invalid");
        }

        Long userId = jwtService.extractUserId(token);
        gameHistoryService.deleteGameHistory(userId, gameResultId);
    }

    @DeleteMapping
    public void deleteAllGameHistory(
            @RequestHeader("Authorization") String authHeader) {

        String token = authHeader.substring(7);

        if (!jwtService.isTokenValid(token)) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Token expired or invalid");
        }

        Long userId = jwtService.extractUserId(token);
        gameHistoryService.deleteAllGameHistory(userId);
    }
}
