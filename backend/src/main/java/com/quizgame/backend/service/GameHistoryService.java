package com.quizgame.backend.service;

import com.quizgame.backend.dto.AnswerResultDTO;
import com.quizgame.backend.dto.GameHistoryDTO;
import com.quizgame.backend.dto.GameHistoryDetailDTO;
import com.quizgame.backend.exception.NotFoundException;
import com.quizgame.backend.model.Answer;
import com.quizgame.backend.model.GameResult;
import com.quizgame.backend.repository.GameResultRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class GameHistoryService {

    private final GameResultRepository gameResultRepository;

    public GameHistoryService(GameResultRepository gameResultRepository) {
        this.gameResultRepository = gameResultRepository;
    }

    public List<GameHistoryDTO> getUserGameHistory(Long userId) {
        List<GameResult> results = gameResultRepository.findByUserId(userId);
        
        return results.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public GameHistoryDetailDTO getGameHistoryDetail(Long userId, Long gameResultId) {
        GameResult result = gameResultRepository.findByUserIdAndGameResultId(userId, gameResultId);
        
        if (result == null) {
            throw new NotFoundException("Game result not found");
        }

        List<AnswerResultDTO> answers = result.getPlayer().getAnswers()
                .stream()
                .map(this::convertAnswerToDTO)
                .collect(Collectors.toList());

        return new GameHistoryDetailDTO(
                result.getId(),
                result.getRoom().getId(),
                result.getRoom().getQuiz().getTitle(),
                result.getTotalScore(),
                result.getCorrectCount(),
                result.getRoom().getQuiz().getQuestions().size(),
                result.getFinishedAt(),
                result.getRoom().getRoomCode(),
                answers
        );
    }

    public void deleteGameHistory(Long userId, Long gameResultId) {
        GameResult result = gameResultRepository.findByUserIdAndGameResultId(userId, gameResultId);
        
        if (result == null) {
            throw new NotFoundException("Game result not found");
        }

        gameResultRepository.delete(result);
    }

    public void deleteAllGameHistory(Long userId) {
        List<GameResult> results = gameResultRepository.findByUserId(userId);
        gameResultRepository.deleteAll(results);
    }

    private GameHistoryDTO convertToDTO(GameResult result) {
        return new GameHistoryDTO(
                result.getId(),
                result.getRoom().getId(),
                result.getRoom().getQuiz().getTitle(),
                result.getTotalScore(),
                result.getCorrectCount(),
                result.getRoom().getQuiz().getQuestions().size(),
                result.getFinishedAt(),
                result.getRoom().getRoomCode()
        );
    }

    private AnswerResultDTO convertAnswerToDTO(Answer answer) {
        return new AnswerResultDTO(
                answer.getQuestion().getQuestionText(),
                answer.getChoice() != null ? answer.getChoice().getChoiceText() : "Not Answered",
                answer.getChoice() != null ? answer.getChoice().getIsCorrect() : false
        );
    }
}
