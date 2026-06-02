package com.quizgame.backend.repository;

import com.quizgame.backend.model.Answer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AnswerRepository extends JpaRepository<Answer, Long> {
    List<Answer> findByRoomId(Long roomId);
    long countByRoomIdAndPlayerIdAndCorrectTrue(Long roomId, Long playerId);
    List<Answer> findByRoomIdAndPlayerIdOrderByIdDesc(Long roomId, Long playerId);
}
