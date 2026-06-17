package com.quizgame.backend.service;

import com.quizgame.backend.dto.ChoiceRequestDTO;
import com.quizgame.backend.dto.QuestionRequestDTO;
import com.quizgame.backend.dto.QuizRequestDTO;
import com.quizgame.backend.dto.QuizResponseDTO;
import com.quizgame.backend.model.Choice;
import com.quizgame.backend.model.Question;
import com.quizgame.backend.model.Quiz;
import com.quizgame.backend.model.User;
import com.quizgame.backend.repository.QuizRepository;
import com.quizgame.backend.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional; // <-- Use Spring's transaction manager

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@Service
public class QuizService {

    private final QuizRepository quizRepository;
    private final UserRepository userRepository;

    public QuizService(QuizRepository quizRepository, UserRepository userRepository) {
        this.quizRepository = quizRepository;
        this.userRepository = userRepository;
    }

    @Transactional // ⚡ CRITICAL FIX: Bundles all nested question/choice inserts into ONE database
                   // write operation
    public QuizResponseDTO createQuiz(QuizRequestDTO request) {
        if (request.getCreatorId() == null) {
            throw new RuntimeException("CreatorId is required");
        }

        User creator = userRepository.findById(request.getCreatorId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        Quiz quiz = new Quiz();
        quiz.setTitle(request.getTitle());
        quiz.setDescription(request.getDescription());
        quiz.setCreator(creator);
        quiz.setQuestions(mapQuestions(request, quiz));

        Quiz savedQuiz = quizRepository.save(quiz);
        return toDTO(savedQuiz);
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public List<QuizResponseDTO> getAllQuizzes() {
        return quizRepository.findAll()
                .stream()
                .map(quiz -> new QuizResponseDTO(
                        quiz.getId(),
                        quiz.getTitle(),
                        quiz.getDescription(),
                        quiz.getQuestions() != null ? quiz.getQuestions().size() : 0))
                .collect(Collectors.toList());
    }

    @Transactional
    public QuizResponseDTO getQuizById(Long id) {
        Quiz quiz = quizRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Quiz not found"));

        return toDTO(quiz);
    }

    public QuizResponseDTO updateQuiz(Long id, QuizRequestDTO request) {
        Quiz quiz = quizRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Quiz not found"));

        if (request.getTitle() != null) {
            quiz.setTitle(request.getTitle());
        }
        if (request.getDescription() != null) {
            quiz.setDescription(request.getDescription());
        }
        if (request.getQuestions() != null) {
            if (quiz.getQuestions() != null) {
                quiz.getQuestions().clear();
                quiz.getQuestions().addAll(mapQuestions(request, quiz));
            } else {
                quiz.setQuestions(mapQuestions(request, quiz));
            }
        }

        Quiz savedQuiz = quizRepository.save(quiz);

        return toDTO(savedQuiz);
    }

    public void deleteQuiz(Long id) {
        quizRepository.deleteById(id);
    }

    // ── Mapping helpers ───────────────────────────────────────────────────────

    private QuizResponseDTO toDTO(Quiz quiz) {
        List<Question> questions = quiz.getQuestions();
        List<QuizResponseDTO.QuestionDTO> questionDTOs = new ArrayList<>();

        if (questions != null) {
            for (Question q : questions) {
                QuizResponseDTO.QuestionDTO dto = new QuizResponseDTO.QuestionDTO();
                dto.setId(q.getId());
                dto.setQuestion(q.getQuestionText());
                dto.setDifficulty(q.getDifficulty());

                List<Choice> choices = q.getChoices();
                if (choices != null && !choices.isEmpty()) {
                    List<String> answers = choices.stream()
                            .map(Choice::getChoiceText)
                            .collect(Collectors.toList());
                    dto.setAnswers(answers);

                    int correctIdx = IntStream.range(0, choices.size())
                            .filter(i -> Boolean.TRUE.equals(choices.get(i).getIsCorrect()))
                            .findFirst()
                            .orElse(0);
                    dto.setCorrect(correctIdx);
                }

                questionDTOs.add(dto);
            }
        }

        return new QuizResponseDTO(
                quiz.getId(),
                quiz.getTitle(),
                quiz.getDescription(),
                questionDTOs.size(),
                questionDTOs);
    }

    private List<Question> mapQuestions(QuizRequestDTO request, Quiz quiz) {
        List<QuestionRequestDTO> questionRequests = request.getQuestions();
        if (questionRequests == null || questionRequests.isEmpty())
            return new ArrayList<>();

        List<Question> questions = new ArrayList<>();
        for (QuestionRequestDTO qr : questionRequests) {
            Question question = new Question();
            question.setQuestionText(qr.getQuestionText());
            question.setTimeLimit(qr.getTimeLimit());
            question.setDifficulty(qr.getDifficulty());
            question.setQuiz(quiz);
            question.setChoices(mapChoices(qr, question));
            questions.add(question);
        }
        return questions;
    }

    private List<Choice> mapChoices(QuestionRequestDTO questionRequest, Question question) {
        List<ChoiceRequestDTO> choiceRequests = questionRequest.getChoices();
        if (choiceRequests == null || choiceRequests.isEmpty())
            return new ArrayList<>();

        int correctChoiceIndex = resolveCorrectChoiceIndex(questionRequest);
        if (correctChoiceIndex == -1) {
            throw new IllegalArgumentException("No correct answer selected for question: '"
                    + questionRequest.getQuestionText() + "'");
        }

        List<Choice> choices = new ArrayList<>();
        for (int i = 0; i < choiceRequests.size(); i++) {
            Choice choice = new Choice();
            choice.setChoiceText(choiceRequests.get(i).getChoiceText());
            choice.setIsCorrect(i == correctChoiceIndex);
            choice.setQuestion(question);
            choices.add(choice);
        }
        return choices;
    }

    private int resolveCorrectChoiceIndex(QuestionRequestDTO questionRequest) {
        List<ChoiceRequestDTO> choiceRequests = questionRequest.getChoices();
        if (choiceRequests == null || choiceRequests.isEmpty()) {
            return -1;
        }

        // Prefer an explicit index provided by the client (user selection).
        Integer selectedIndex = questionRequest.getCorrectChoiceIndex();
        if (selectedIndex != null && selectedIndex >= 0 && selectedIndex < choiceRequests.size()) {
            return selectedIndex;
        }

        // Check if any choice has isCorrect = true
        for (int i = 0; i < choiceRequests.size(); i++) {
            if (Boolean.TRUE.equals(choiceRequests.get(i).getIsCorrect())) {
                return i;
            }
        }

        // Otherwise, attempt to resolve from the AI-provided correctAnswer text on the
        // server.
        String correctAnswer = normalize(questionRequest.getCorrectAnswer());
        if (correctAnswer.isEmpty()) {
            return choiceRequests.size() == 1 ? 0 : -1;
        }

        // handle letter aliases like 'a', 'b', ...
        if (correctAnswer.length() == 1 && correctAnswer.charAt(0) >= 'a' && correctAnswer.charAt(0) <= 'z') {
            int aliasIndex = correctAnswer.charAt(0) - 'a';
            if (aliasIndex >= 0 && aliasIndex < choiceRequests.size()) {
                return aliasIndex;
            }
        }

        if (correctAnswer.startsWith("answer") && correctAnswer.length() > 6) {
            try {
                int idx = Integer.parseInt(correctAnswer.substring(6)) - 1;
                if (idx >= 0 && idx < choiceRequests.size())
                    return idx;
            } catch (NumberFormatException ignored) {
            }
        }

        for (int i = 0; i < choiceRequests.size(); i++) {
            if (normalize(choiceRequests.get(i).getChoiceText()).equals(correctAnswer))
                return i;
        }

        return choiceRequests.size() == 1 ? 0 : -1;
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    }
}