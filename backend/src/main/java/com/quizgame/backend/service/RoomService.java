package com.quizgame.backend.service;

import com.quizgame.backend.dto.GameEvent;
import com.quizgame.backend.dto.PlayerDTO;
import com.quizgame.backend.dto.PlayerJoinedPayload;
import com.quizgame.backend.dto.RoomCreateRequest;
import com.quizgame.backend.dto.RoomCreateResponse;
import com.quizgame.backend.dto.RoomDetailsResponse;
import com.quizgame.backend.dto.RoomJoinRequest;
import com.quizgame.backend.dto.RoomJoinResponse;
import com.quizgame.backend.exception.BadRequestException;
import com.quizgame.backend.exception.NotFoundException;
import com.quizgame.backend.model.Quiz;
import com.quizgame.backend.model.Room;
import com.quizgame.backend.model.RoomPlayer;
import com.quizgame.backend.model.RoomStatus;
import com.quizgame.backend.model.User;
import com.quizgame.backend.repository.QuizRepository;
import com.quizgame.backend.repository.RoomPlayerRepository;
import com.quizgame.backend.repository.RoomRepository;
import com.quizgame.backend.repository.UserRepository;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class RoomService {

    private static final String ROOM_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final int ROOM_CODE_LENGTH = 6;
    private static final int ROOM_CODE_ATTEMPTS = 10;

    private final RoomRepository roomRepository;
    private final QuizRepository quizRepository;
    private final UserRepository userRepository;
    private final RoomPlayerRepository roomPlayerRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final SecureRandom random = new SecureRandom();

    public RoomService(
            RoomRepository roomRepository,
            QuizRepository quizRepository,
            UserRepository userRepository,
            RoomPlayerRepository roomPlayerRepository,
            SimpMessagingTemplate messagingTemplate
    ) {
        this.roomRepository = roomRepository;
        this.quizRepository = quizRepository;
        this.userRepository = userRepository;
        this.roomPlayerRepository = roomPlayerRepository;
        this.messagingTemplate = messagingTemplate;
    }

    @Transactional
    public RoomCreateResponse createRoom(RoomCreateRequest request) {
        if (request.getHostId() == null && (request.getHostName() == null || request.getHostName().isBlank())) {
            throw new BadRequestException("hostId or hostName is required");
        }

        User host;
        if (request.getHostId() != null) {
            host = userRepository.findById(request.getHostId())
                    .orElseThrow(() -> new NotFoundException("Host not found"));
        } else {
            User newHost = new User();
            newHost.setName(request.getHostName().trim());
            host = userRepository.save(newHost);
        }

        Quiz quiz;
        if (request.getQuizId() != null) {
            quiz = quizRepository.findById(request.getQuizId())
                    .orElseThrow(() -> new NotFoundException("Quiz not found"));
        } else {
            quiz = quizRepository.findTopByOrderByIdDesc()
                    .orElseThrow(() -> new NotFoundException("No quiz available"));
        }

        Room room = new Room();
        room.setRoomCode(generateRoomCode());
        room.setHost(host);
        room.setQuiz(quiz);
        room.setStatus(RoomStatus.LOBBY);

        Room savedRoom = roomRepository.save(room);

        RoomPlayer hostPlayer = new RoomPlayer();
        hostPlayer.setRoom(savedRoom);
        hostPlayer.setNickname(host.getName() != null && !host.getName().isBlank() ? host.getName() : "Host");
        hostPlayer.setHost(true);
        hostPlayer.setUser(host);
        hostPlayer.setScore(0);
        roomPlayerRepository.save(hostPlayer);

        return new RoomCreateResponse(savedRoom.getRoomCode(), "/join/" + savedRoom.getRoomCode());
    }

    @Transactional
    public RoomJoinResponse joinRoom(RoomJoinRequest request) {
        if (request.getRoomCode() == null || request.getRoomCode().isBlank()) {
            throw new BadRequestException("Room code is required");
        }
        if (request.getNickname() == null || request.getNickname().isBlank()) {
            throw new BadRequestException("Nickname is required");
        }

        Room room = getRoom(request.getRoomCode());
        if (room.getStatus() == RoomStatus.FINISHED) {
            throw new BadRequestException("Room is finished");
        }
        if (room.getStatus() == RoomStatus.IN_PROGRESS) {
            throw new BadRequestException("Game has already started");
        }
        if (roomPlayerRepository.existsByRoomIdAndNicknameIgnoreCase(room.getId(), request.getNickname())) {
            throw new BadRequestException("Nickname already taken");
        }

        RoomPlayer player = new RoomPlayer();
        player.setRoom(room);
        player.setNickname(request.getNickname());
        player.setHost(false);
        player.setScore(0);

        if (request.getUserId() != null) {
            User user = userRepository.findById(request.getUserId())
                    .orElseThrow(() -> new NotFoundException("User not found"));
            player.setUser(user);
        }

        RoomPlayer savedPlayer = roomPlayerRepository.save(player);
        List<PlayerDTO> players = getPlayerDTOs(room.getId());

        RoomJoinResponse response = new RoomJoinResponse(
                room.getRoomCode(),
                savedPlayer.getId(),
                savedPlayer.getNickname(),
                room.getStatus().name(),
                players
        );

        broadcastPlayerJoined(room.getRoomCode(), savedPlayer.getId());
        return response;
    }

    public RoomDetailsResponse getRoomByCode(String roomCode) {
        Room room = getRoom(roomCode);
        return new RoomDetailsResponse(
                room.getRoomCode(),
                room.getStatus().name(),
                room.getHost() != null ? room.getHost().getId() : null,
                room.getQuiz() != null ? room.getQuiz().getId() : null,
                getPlayerDTOs(room.getId())
        );
    }

    public void broadcastPlayerJoined(String roomCode, Long playerId) {
        Room room = getRoom(roomCode);
        RoomPlayer player = roomPlayerRepository.findById(playerId)
                .orElseThrow(() -> new NotFoundException("Player not found"));

        if (!player.getRoom().getId().equals(room.getId())) {
            throw new BadRequestException("Player does not belong to room");
        }

        PlayerJoinedPayload payload = new PlayerJoinedPayload(
                toPlayerDTO(player),
                getPlayerDTOs(room.getId())
        );

        messagingTemplate.convertAndSend(
                "/topic/room/" + roomCode,
                new GameEvent("PLAYER_JOINED", payload)
        );
    }

    public List<PlayerDTO> getPlayers(String roomCode) {
        Room room = getRoom(roomCode);
        return getPlayerDTOs(room.getId());
    }

    private Room getRoom(String roomCode) {
        return roomRepository.findByRoomCode(roomCode)
                .orElseThrow(() -> new NotFoundException("Room not found"));
    }

    private List<PlayerDTO> getPlayerDTOs(Long roomId) {
        return roomPlayerRepository.findByRoomIdOrderByJoinedAtAsc(roomId)
                .stream()
                .map(this::toPlayerDTO)
                .collect(Collectors.toList());
    }

    private PlayerDTO toPlayerDTO(RoomPlayer player) {
        Integer score = player.getScore() != null ? player.getScore() : 0;
        Boolean host = player.getHost() != null ? player.getHost() : false;
        return new PlayerDTO(player.getId(), player.getNickname(), score, host);
    }

    private String generateRoomCode() {
        for (int attempt = 0; attempt < ROOM_CODE_ATTEMPTS; attempt++) {
            String code = randomCode();
            if (!roomRepository.existsByRoomCode(code)) {
                return code;
            }
        }
        throw new IllegalStateException("Unable to generate room code");
    }

    private String randomCode() {
        StringBuilder builder = new StringBuilder(ROOM_CODE_LENGTH);
        for (int i = 0; i < ROOM_CODE_LENGTH; i++) {
            int index = random.nextInt(ROOM_CODE_CHARS.length());
            builder.append(ROOM_CODE_CHARS.charAt(index));
        }
        return builder.toString();
    }
}
