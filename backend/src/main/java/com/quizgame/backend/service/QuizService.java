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

    @Transactional // ⚡ CRITICAL FIX: Bundles all nested question/choice inserts into ONE database write operation
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

    @Transactional
    public List<QuizResponseDTO> getAllQuizzes() {
        List<Quiz> quizzes = quizRepository.findAll();
        Collections.reverse(quizzes); 
        return quizzes.stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional
    public QuizResponseDTO getQuizById(Long id) {
        Quiz quiz = quizRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Quiz not found"));
        return toDTO(quiz);
    }

    @Transactional // ⚡ CRITICAL FIX: Clears old data and saves new sets inside a single, fast transaction block
    public QuizResponseDTO updateQuiz(Long id, QuizRequestDTO request) {
        Quiz quiz = quizRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Quiz not found"));

        if (request.getTitle() != null) quiz.setTitle(request.getTitle());
        if (request.getDescription() != null) quiz.setDescription(request.getDescription());

        // Replace all questions safely
        if (request.getQuestions() != null) {
            quiz.getQuestions().clear();
            
            // Avoid intermediate flushes if possible; clear paired with orphaning handles cleanup on commit.
            List<Question> newQuestions = mapQuestions(request, quiz);
            quiz.getQuestions().addAll(newQuestions);
        }

        return toDTO(quizRepository.save(quiz));
    }

    @Transactional // Good practice to wrap deletes too
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
                questionDTOs
        );
    }

    private List<Question> mapQuestions(QuizRequestDTO request, Quiz quiz) {
        List<QuestionRequestDTO> questionRequests = request.getQuestions();
        if (questionRequests == null || questionRequests.isEmpty()) return new ArrayList<>();

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
        if (choiceRequests == null || choiceRequests.isEmpty()) return new ArrayList<>();

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

    private int resolveCorrectChoiceIndex(QuestionRequestDTO qr) {
        List<ChoiceRequestDTO> choices = qr.getChoices();
        if (choices == null || choices.isEmpty()) return -1;

        Integer selected = qr.getCorrectChoiceIndex();
        if (selected != null && selected >= 0 && selected < choices.size()) return selected;

        String correct = normalize(qr.getCorrectAnswer());
        if (correct.isEmpty()) return choices.size() == 1 ? 0 : -1;

        if (correct.length() == 1 && correct.charAt(0) >= 'a') {
            int idx = correct.charAt(0) - 'a';
            if (idx >= 0 && idx < choices.size()) return idx;
        }

        if (correct.startsWith("answer") && correct.length() > 6) {
            try {
                int idx = Integer.parseInt(correct.substring(6)) - 1;
                if (idx >= 0 && idx < choices.size()) return idx;
            } catch (NumberFormatException ignored) {}
        }

        for (int i = 0; i < choices.size(); i++) {
            if (normalize(choices.get(i).getChoiceText()).equals(correct)) return i;
        }

        return choices.size() == 1 ? 0 : -1;
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    }
}