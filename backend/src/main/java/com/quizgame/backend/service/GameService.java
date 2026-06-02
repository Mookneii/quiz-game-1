package com.quizgame.backend.service;

import com.quizgame.backend.dto.AnswerResultDTO;
import com.quizgame.backend.dto.ChoiceDTO;
import com.quizgame.backend.dto.GameEvent;
import com.quizgame.backend.dto.GameResultDTO;
import com.quizgame.backend.dto.GameStartedPayload;
import com.quizgame.backend.dto.LeaderboardEntryDTO;
import com.quizgame.backend.dto.QuestionDTO;
import com.quizgame.backend.dto.QuestionStartedPayload;
import com.quizgame.backend.dto.SubmitAnswerRequest;
import com.quizgame.backend.exception.BadRequestException;
import com.quizgame.backend.exception.NotFoundException;
import com.quizgame.backend.model.Answer;
import com.quizgame.backend.model.Choice;
import com.quizgame.backend.model.GameResult;
import com.quizgame.backend.model.Question;
import com.quizgame.backend.model.Room;
import com.quizgame.backend.model.RoomPlayer;
import com.quizgame.backend.model.RoomStatus;
import com.quizgame.backend.repository.AnswerRepository;
import com.quizgame.backend.repository.ChoiceRepository;
import com.quizgame.backend.repository.GameResultRepository;
import com.quizgame.backend.repository.QuestionRepository;
import com.quizgame.backend.repository.RoomPlayerRepository;
import com.quizgame.backend.repository.RoomRepository;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class GameService {

    private final RoomRepository roomRepository;
    private final RoomPlayerRepository roomPlayerRepository;
    private final QuestionRepository questionRepository;
    private final ChoiceRepository choiceRepository;
    private final AnswerRepository answerRepository;
    private final GameResultRepository gameResultRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public GameService(
            RoomRepository roomRepository,
            RoomPlayerRepository roomPlayerRepository,
            QuestionRepository questionRepository,
            ChoiceRepository choiceRepository,
            AnswerRepository answerRepository,
            GameResultRepository gameResultRepository,
            SimpMessagingTemplate messagingTemplate
    ) {
        this.roomRepository = roomRepository;
        this.roomPlayerRepository = roomPlayerRepository;
        this.questionRepository = questionRepository;
        this.choiceRepository = choiceRepository;
        this.answerRepository = answerRepository;
        this.gameResultRepository = gameResultRepository;
        this.messagingTemplate = messagingTemplate;
    }

    @Transactional
    public void startGame(String roomCode) {
        Room room = getRoom(roomCode);
        if (room.getStatus() == RoomStatus.IN_PROGRESS) {
            throw new BadRequestException("Game already started");
        }
        room.setStatus(RoomStatus.IN_PROGRESS);
        room.setStartedAt(LocalDateTime.now());
        roomRepository.save(room);

        GameStartedPayload payload = new GameStartedPayload(roomCode, room.getStartedAt());
        messagingTemplate.convertAndSend(
                "/topic/room/" + roomCode,
                new GameEvent("GAME_STARTED", payload)
        );
    }

    @Transactional
    public QuestionDTO nextQuestion(String roomCode, Integer questionIndex) {
        Room room = getRoom(roomCode);
        if (questionIndex == null) {
            throw new BadRequestException("questionIndex is required");
        }

        List<Question> questions = questionRepository.findByQuizIdOrderByIdAsc(room.getQuiz().getId());
        if (questions.isEmpty()) {
            throw new BadRequestException("Quiz has no questions");
        }
        if (questionIndex < 0 || questionIndex >= questions.size()) {
            throw new BadRequestException("Question index out of range");
        }

        Question question = questions.get(questionIndex);
        List<Choice> choices = choiceRepository.findByQuestionIdOrderByIdAsc(question.getId());
        List<ChoiceDTO> choiceDTOs = choices.stream()
                .map(choice -> new ChoiceDTO(choice.getId(), choice.getChoiceText()))
                .collect(Collectors.toList());

        QuestionDTO questionDTO = new QuestionDTO(
                question.getId(),
                question.getQuestionText(),
                question.getTimeLimit(),
                choiceDTOs
        );

        QuestionStartedPayload payload = new QuestionStartedPayload(
                questionDTO,
                questionIndex,
                questions.size()
        );

        messagingTemplate.convertAndSend(
                "/topic/room/" + roomCode,
                new GameEvent("QUESTION_STARTED", payload)
        );

        return questionDTO;
    }

    @Transactional
    public AnswerResultDTO submitAnswer(String roomCode, SubmitAnswerRequest request) {
        if (request == null) {
            throw new BadRequestException("Answer payload is required");
        }
        if (request.getPlayerId() == null || request.getQuestionId() == null || request.getChoiceId() == null) {
            throw new BadRequestException("playerId, questionId, and choiceId are required");
        }

        Room room = getRoom(roomCode);
        if (room.getStatus() != RoomStatus.IN_PROGRESS) {
            throw new BadRequestException("Game is not in progress");
        }

        RoomPlayer player = roomPlayerRepository.findById(request.getPlayerId())
                .orElseThrow(() -> new NotFoundException("Player not found"));

        if (!player.getRoom().getId().equals(room.getId())) {
            throw new BadRequestException("Player does not belong to room");
        }

        Question question = questionRepository.findById(request.getQuestionId())
                .orElseThrow(() -> new NotFoundException("Question not found"));

        if (!question.getQuiz().getId().equals(room.getQuiz().getId())) {
            throw new BadRequestException("Question does not belong to quiz");
        }

        Choice choice = choiceRepository.findById(request.getChoiceId())
                .orElseThrow(() -> new NotFoundException("Choice not found"));

        if (!choice.getQuestion().getId().equals(question.getId())) {
            throw new BadRequestException("Choice does not belong to question");
        }

        boolean correct = Boolean.TRUE.equals(choice.getIsCorrect());
        int points = calculatePoints(correct, question.getTimeLimit(), request.getTimeTakenMs());

        Answer answer = new Answer();
        answer.setRoom(room);
        answer.setPlayer(player);
        answer.setQuestion(question);
        answer.setChoice(choice);
        answer.setCorrect(correct);
        answer.setPoints(points);
        answer.setTimeTakenMs(request.getTimeTakenMs());
        answerRepository.save(answer);

        int updatedScore = safeScore(player) + points;
        player.setScore(updatedScore);
        roomPlayerRepository.save(player);

        List<Question> questions = questionRepository.findByQuizIdOrderByIdAsc(room.getQuiz().getId());
        int questionIndex = questions.indexOf(question);
        int totalQuestions = questions.size();

        List<Answer> playerAnswers = answerRepository.findByRoomIdAndPlayerIdOrderByIdDesc(room.getId(), player.getId());
        int streak = 0;
        for (Answer a : playerAnswers) {
            if (Boolean.TRUE.equals(a.getCorrect())) {
                streak++;
            } else {
                break;
            }
        }

        AnswerResultDTO result = new AnswerResultDTO(player.getId(), correct, points, updatedScore, streak, questionIndex, totalQuestions);
        messagingTemplate.convertAndSend(
                "/topic/room/" + roomCode,
                new GameEvent("ANSWER_RESULT", result)
        );

        messagingTemplate.convertAndSend(
                "/topic/room/" + roomCode,
                new GameEvent("LEADERBOARD_UPDATE", buildLeaderboard(room.getId()))
        );

        return result;
    }

    @Transactional
    public void endGame(String roomCode) {
        Room room = getRoom(roomCode);
        room.setStatus(RoomStatus.FINISHED);
        room.setEndedAt(LocalDateTime.now());
        roomRepository.save(room);

        List<GameResultDTO> results = buildResults(room);
        messagingTemplate.convertAndSend(
                "/topic/room/" + roomCode,
                new GameEvent("GAME_FINISHED", results)
        );
    }

    public List<GameResultDTO> getResults(String roomCode) {
        Room room = getRoom(roomCode);
        return buildResults(room);
    }

    private Room getRoom(String roomCode) {
        if (roomCode == null || roomCode.isBlank()) {
            throw new BadRequestException("Room code is required");
        }
        return roomRepository.findByRoomCode(roomCode)
                .orElseThrow(() -> new NotFoundException("Room not found"));
    }

    private int calculatePoints(boolean correct, Integer timeLimitSeconds, Long timeTakenMs) {
        if (!correct) {
            return 0;
        }
        int maxPoints = 1000;
        int minPoints = 100;
        if (timeLimitSeconds == null || timeLimitSeconds <= 0 || timeTakenMs == null || timeTakenMs < 0) {
            return maxPoints;
        }
        long limitMs = timeLimitSeconds * 1000L;
        double ratio = Math.min(1.0, (double) timeTakenMs / limitMs);
        int penalty = (int) Math.round((maxPoints - minPoints) * ratio);
        return Math.max(minPoints, maxPoints - penalty);
    }

    private List<LeaderboardEntryDTO> buildLeaderboard(Long roomId) {
        List<RoomPlayer> players = roomPlayerRepository.findByRoomIdOrderByJoinedAtAsc(roomId);
        return players.stream()
                .filter(player -> !Boolean.TRUE.equals(player.getHost()))
                .map(player -> new LeaderboardEntryDTO(
                        player.getId(),
                        player.getNickname(),
                        safeScore(player)
                ))
                .sorted(Comparator.comparing(
                        LeaderboardEntryDTO::getScore,
                        Comparator.nullsLast(Integer::compareTo)
                ).reversed())
                .collect(Collectors.toList());
    }

    private List<GameResultDTO> buildResults(Room room) {
        List<GameResult> existing = gameResultRepository.findByRoomId(room.getId());
        if (!existing.isEmpty()) {
            return existing.stream()
                    .filter(result -> !Boolean.TRUE.equals(result.getPlayer().getHost()))
                    .map(result -> new GameResultDTO(
                            result.getPlayer().getId(),
                            result.getPlayer().getNickname(),
                            result.getTotalScore(),
                            result.getCorrectCount()
                    ))
                    .collect(Collectors.toList());
        }

        List<RoomPlayer> players = roomPlayerRepository.findByRoomIdOrderByJoinedAtAsc(room.getId());
        List<GameResultDTO> results = new ArrayList<>();

        for (RoomPlayer player : players) {
            // Skip the host – they are not a game participant
            if (Boolean.TRUE.equals(player.getHost())) {
                continue;
            }

            int totalScore = safeScore(player);
            int correctCount = (int) answerRepository.countByRoomIdAndPlayerIdAndCorrectTrue(room.getId(), player.getId());

            GameResult gameResult = new GameResult();
            gameResult.setRoom(room);
            gameResult.setPlayer(player);
            gameResult.setTotalScore(totalScore);
            gameResult.setCorrectCount(correctCount);
            gameResultRepository.save(gameResult);

            results.add(new GameResultDTO(
                    player.getId(),
                    player.getNickname(),
                    totalScore,
                    correctCount
            ));
        }

        return results;
    }

    private int safeScore(RoomPlayer player) {
        return player.getScore() != null ? player.getScore() : 0;
    }
}
