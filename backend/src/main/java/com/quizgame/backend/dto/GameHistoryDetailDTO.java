package com.quizgame.backend.dto;

import java.time.LocalDateTime;
import java.util.List;

public class GameHistoryDetailDTO {

    private Long gameResultId;
    private Long roomId;
    private String quizTitle;
    private Integer totalScore;
    private Integer correctCount;
    private Integer totalQuestions;
    private LocalDateTime finishedAt;
    private String roomCode;
    private List<AnswerResultDTO> answers;

    public GameHistoryDetailDTO() {}

    public GameHistoryDetailDTO(Long gameResultId, Long roomId, String quizTitle, Integer totalScore,
                                Integer correctCount, Integer totalQuestions, LocalDateTime finishedAt,
                                String roomCode, List<AnswerResultDTO> answers) {
        this.gameResultId = gameResultId;
        this.roomId = roomId;
        this.quizTitle = quizTitle;
        this.totalScore = totalScore;
        this.correctCount = correctCount;
        this.totalQuestions = totalQuestions;
        this.finishedAt = finishedAt;
        this.roomCode = roomCode;
        this.answers = answers;
    }

    // Getters and Setters
    public Long getGameResultId() {
        return gameResultId;
    }

    public void setGameResultId(Long gameResultId) {
        this.gameResultId = gameResultId;
    }

    public Long getRoomId() {
        return roomId;
    }

    public void setRoomId(Long roomId) {
        this.roomId = roomId;
    }

    public String getQuizTitle() {
        return quizTitle;
    }

    public void setQuizTitle(String quizTitle) {
        this.quizTitle = quizTitle;
    }

    public Integer getTotalScore() {
        return totalScore;
    }

    public void setTotalScore(Integer totalScore) {
        this.totalScore = totalScore;
    }

    public Integer getCorrectCount() {
        return correctCount;
    }

    public void setCorrectCount(Integer correctCount) {
        this.correctCount = correctCount;
    }

    public Integer getTotalQuestions() {
        return totalQuestions;
    }

    public void setTotalQuestions(Integer totalQuestions) {
        this.totalQuestions = totalQuestions;
    }

    public LocalDateTime getFinishedAt() {
        return finishedAt;
    }

    public void setFinishedAt(LocalDateTime finishedAt) {
        this.finishedAt = finishedAt;
    }

    public String getRoomCode() {
        return roomCode;
    }

    public void setRoomCode(String roomCode) {
        this.roomCode = roomCode;
    }

    public List<AnswerResultDTO> getAnswers() {
        return answers;
    }

    public void setAnswers(List<AnswerResultDTO> answers) {
        this.answers = answers;
    }
}
