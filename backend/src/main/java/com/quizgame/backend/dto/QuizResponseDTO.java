package com.quizgame.backend.dto;

import java.util.List;

public class QuizResponseDTO {

    private Long id;
    private String title;
    private String description;
    private Integer questionsCount;
    private List<QuestionDTO> questions;

    public QuizResponseDTO() {
    }

    public QuizResponseDTO(Long id, String title, String description, int questionsCount, List<QuestionDTO> questions) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.questionsCount = questionsCount;
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

    public QuizResponseDTO(Long id, String title, String description, Integer questionsCount) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.questionsCount = questionsCount;
    }

    // ── Nested DTOs ──────────────────────────────────────────────────────────

    public static class QuestionDTO {
        private Long id;
        private String question; // mapped from questionText
        private String difficulty;
        private Integer correct; // index of correct choice
        private List<String> answers; // list of choiceText strings

        public QuestionDTO() {
        }

        public Long getId() {
            return id;
        }

        public String getQuestion() {
            return question;
        }

        public String getDifficulty() {
            return difficulty;
        }

        public Integer getCorrect() {
            return correct;
        }

        public List<String> getAnswers() {
            return answers;
        }

        public void setId(Long id) {
            this.id = id;
        }

        public void setQuestion(String question) {
            this.question = question;
        }

        public void setDifficulty(String difficulty) {
            this.difficulty = difficulty;
        }

        public void setCorrect(Integer correct) {
            this.correct = correct;
        }

        public void setAnswers(List<String> answers) {
            this.answers = answers;
        }
    }

    public List<QuestionDTO> getQuestions() {
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

    public void setQuestions(List<QuestionDTO> questions) {
        this.questions = questions;
    }
}