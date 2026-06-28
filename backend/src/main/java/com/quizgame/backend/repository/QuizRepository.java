package com.quizgame.backend.repository;

import com.quizgame.backend.model.Quiz;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface QuizRepository extends JpaRepository<Quiz, Long> {
	Optional<Quiz> findTopByOrderByIdDesc();

	@EntityGraph(attributePaths = {"questions"})
	@Query("SELECT q FROM Quiz q")
	List<Quiz> findAllWithQuestions();
}