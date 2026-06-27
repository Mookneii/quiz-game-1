package com.quizgame.backend.dto;

public class AnswerResultDTO {

    private Long playerId;
    private Boolean correct;
    private Integer points;
    private Integer totalScore;
    private Integer streak;
    private Integer questionIndex;
    private Integer totalQuestions;
    private String questionText;
    private String selectedAnswer;
    private Boolean isCorrect;

    public AnswerResultDTO() {}

    public AnswerResultDTO(Long playerId, Boolean correct, Integer points, Integer totalScore, Integer streak, Integer questionIndex, Integer totalQuestions) {
        this.playerId = playerId;
        this.correct = correct;
        this.points = points;
        this.totalScore = totalScore;
        this.streak = streak;
        this.questionIndex = questionIndex;
        this.totalQuestions = totalQuestions;
    }

    public AnswerResultDTO(String questionText, String selectedAnswer, Boolean isCorrect) {
        this.questionText = questionText;
        this.selectedAnswer = selectedAnswer;
        this.isCorrect = isCorrect;
    }

    public Long getPlayerId() {
        return playerId;
    }

    public Boolean getCorrect() {
        return correct;
    }

    public Integer getPoints() {
        return points;
    }

    public Integer getTotalScore() {
        return totalScore;
    }

    public Integer getStreak() {
        return streak;
    }

    public Integer getQuestionIndex() {
        return questionIndex;
    }

    public Integer getTotalQuestions() {
        return totalQuestions;
    }

    public void setPlayerId(Long playerId) {
        this.playerId = playerId;
    }

    public void setCorrect(Boolean correct) {
        this.correct = correct;
    }

    public void setPoints(Integer points) {
        this.points = points;
    }

    public void setTotalScore(Integer totalScore) {
        this.totalScore = totalScore;
    }

    public void setStreak(Integer streak) {
        this.streak = streak;
    }

    public void setQuestionIndex(Integer questionIndex) {
        this.questionIndex = questionIndex;
    }

    public void setTotalQuestions(Integer totalQuestions) {
        this.totalQuestions = totalQuestions;
    }

    public String getQuestionText() {
        return questionText;
    }

    public void setQuestionText(String questionText) {
        this.questionText = questionText;
    }

    public String getSelectedAnswer() {
        return selectedAnswer;
    }

    public void setSelectedAnswer(String selectedAnswer) {
        this.selectedAnswer = selectedAnswer;
    }

    public Boolean getIsCorrect() {
        return isCorrect;
    }

    public void setIsCorrect(Boolean isCorrect) {
        this.isCorrect = isCorrect;
    }
}
