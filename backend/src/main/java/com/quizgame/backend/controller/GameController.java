package com.quizgame.backend.controller;

import com.quizgame.backend.dto.AnswerResultDTO;
import com.quizgame.backend.dto.GameResultDTO;
import com.quizgame.backend.dto.NextQuestionRequest;
import com.quizgame.backend.dto.QuestionDTO;
import com.quizgame.backend.dto.ReviewDTO;
import com.quizgame.backend.dto.RoomCodeRequest;
import com.quizgame.backend.dto.SubmitAnswerRequest;
import com.quizgame.backend.service.GameService;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import com.quizgame.backend.service.JwtService;

import java.util.List;

@RestController
@RequestMapping("/api/games")
@CrossOrigin(origins = "*")
public class GameController {

    private final GameService gameService;
    private final JwtService jwtService;

    public GameController(
            GameService gameService,
            JwtService jwtService) {

        this.gameService = gameService;
        this.jwtService = jwtService;
    }

    @PostMapping("/start")
    public void startGame(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody RoomCodeRequest request) {

        String token = authHeader.substring(7);

        if (!jwtService.isTokenValid(token)) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Token expired or invalid");
        }

        gameService.startGame(request.getRoomCode());
    }

    @PostMapping("/next")
    public QuestionDTO nextQuestion(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody NextQuestionRequest request) {

        String token = authHeader.substring(7);

        if (!jwtService.isTokenValid(token)) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Token expired or invalid");
        }

        return gameService.nextQuestion(
                request.getRoomCode(),
                request.getQuestionIndex());
    }

    @PostMapping("/answer")
    public AnswerResultDTO submitAnswer(@RequestBody SubmitAnswerRequest request) {
        return gameService.submitAnswer(request.getRoomCode(), request);
    }

    @PostMapping("/end")
    public void endGame(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody RoomCodeRequest request) {

        String token = authHeader.substring(7);

        if (!jwtService.isTokenValid(token)) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Token expired or invalid");
        }

        gameService.endGame(request.getRoomCode());
    }

    @GetMapping("/{roomCode}/results")
    public List<GameResultDTO> getResults(@PathVariable String roomCode) {
        return gameService.getResults(roomCode);
    }

    @GetMapping("/{roomCode}/review")
    public ReviewDTO getReview(
            @PathVariable String roomCode,
            @RequestParam(required = false) Long playerId) {
        return gameService.getReview(roomCode, playerId);
    }
}
