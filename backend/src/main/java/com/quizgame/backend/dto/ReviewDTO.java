package com.quizgame.backend.dto;

import java.util.List;
import java.util.Map;

public class ReviewDTO {

    private List<ReviewQuestionDTO> questions;
    private Map<Long, Long> userAnswers;

    public ReviewDTO() {}

    public ReviewDTO(List<ReviewQuestionDTO> questions, Map<Long, Long> userAnswers) {
        this.questions = questions;
        this.userAnswers = userAnswers;
    }

    public List<ReviewQuestionDTO> getQuestions() {
        return questions;
    }

    public void setQuestions(List<ReviewQuestionDTO> questions) {
        this.questions = questions;
    }

    public Map<Long, Long> getUserAnswers() {
        return userAnswers;
    }

    public void setUserAnswers(Map<Long, Long> userAnswers) {
        this.userAnswers = userAnswers;
    }

    public static class ReviewQuestionDTO {
        private Long id;
        private String text;
        private List<ReviewChoiceDTO> choices;

        public ReviewQuestionDTO() {}

        public ReviewQuestionDTO(Long id, String text, List<ReviewChoiceDTO> choices) {
            this.id = id;
            this.text = text;
            this.choices = choices;
        }

        public Long getId() {
            return id;
        }

        public void setId(Long id) {
            this.id = id;
        }

        public String getText() {
            return text;
        }

        public void setText(String text) {
            this.text = text;
        }

        public List<ReviewChoiceDTO> getChoices() {
            return choices;
        }

        public void setChoices(List<ReviewChoiceDTO> choices) {
            this.choices = choices;
        }
    }

    public static class ReviewChoiceDTO {
        private Long id;
        private String text;
        private boolean isCorrect;

        public ReviewChoiceDTO() {}

        public ReviewChoiceDTO(Long id, String text, boolean isCorrect) {
            this.id = id;
            this.text = text;
            this.isCorrect = isCorrect;
        }

        public Long getId() {
            return id;
        }

        public void setId(Long id) {
            this.id = id;
        }

        public String getText() {
            return text;
        }

        public void setText(String text) {
            this.text = text;
        }

        public boolean getIsCorrect() {
            return isCorrect;
        }

        public void setIsCorrect(boolean correct) {
            isCorrect = correct;
        }
    }
}
