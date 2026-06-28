package com.quizgame.backend.controller;

import com.quizgame.backend.dto.RoomCreateRequest;
import com.quizgame.backend.dto.RoomCreateResponse;
import com.quizgame.backend.dto.RoomDetailsResponse;
import com.quizgame.backend.dto.RoomJoinRequest;
import com.quizgame.backend.dto.RoomJoinResponse;
import com.quizgame.backend.dto.RoomHistoryDTO;
import com.quizgame.backend.service.RoomService;
import com.quizgame.backend.service.JwtService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/rooms")
@CrossOrigin(origins = "*")
public class RoomController {

    // Layered flow: Controller -> Service -> Repository -> Database
    // This controller delegates all business logic to RoomService.

    private final RoomService roomService;
    private final JwtService jwtService;

    public RoomController(RoomService roomService, JwtService jwtService) {
        this.roomService = roomService;
        this.jwtService = jwtService;
    }

    @PostMapping
    public RoomCreateResponse createRoom(@RequestBody RoomCreateRequest request) {
        return roomService.createRoom(request);
    }

    @PostMapping("/join")
    public RoomJoinResponse joinRoom(@RequestBody RoomJoinRequest request) {
        return roomService.joinRoom(request);
    }

    @GetMapping("/{roomCode}")
    public RoomDetailsResponse getRoom(@PathVariable String roomCode) {
        return roomService.getRoomByCode(roomCode);
    }

    @GetMapping("/history")
    public List<RoomHistoryDTO> getRoomHistory(@RequestHeader("Authorization") String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Missing or invalid token");
        }
        
        String token = authHeader.substring(7);
        if (!jwtService.isTokenValid(token)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Token expired or invalid");
        }

        Long userId = jwtService.extractUserId(token);
        return roomService.getRoomHistory(userId);
    }
}
