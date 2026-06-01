package com.quizgame.backend.dto;

import java.util.List;

public class QuizResponseDTO {

    private Long id;
    private String title;
    private String description;
    private Integer questionsCount;
    private List<QuestionRequestDTO> questions;

    public QuizResponseDTO() {}

    public QuizResponseDTO(Long id, String title, String description) {
        this.id = id;
        this.title = title;
        this.description = description;
    }

    public QuizResponseDTO(Long id, String title, String description, Integer questionsCount) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.questionsCount = questionsCount;
    }

    public QuizResponseDTO(Long id, String title, String description, List<QuestionRequestDTO> questions) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.questions = questions;
    }

    public Long getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public String getDescription() {
        return description;
    }

    public List<QuestionRequestDTO> getQuestions() {
        return questions;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Integer getQuestionsCount() {
        return questionsCount;
    }

    public void setQuestionsCount(Integer questionsCount) {
        this.questionsCount = questionsCount;
    }

    public void setQuestions(List<QuestionRequestDTO> questions) {
        this.questions = questions;
    }
}