package com.quizgame.backend.repository;

import com.quizgame.backend.model.GameResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface GameResultRepository extends JpaRepository<GameResult, Long> {
    List<GameResult> findByRoomId(Long roomId);
    
    @Query("SELECT gr FROM GameResult gr WHERE gr.player.user.id = :userId ORDER BY gr.finishedAt DESC")
    List<GameResult> findByUserId(@Param("userId") Long userId);
    
    @Query("SELECT gr FROM GameResult gr WHERE gr.player.user.id = :userId AND gr.id = :gameResultId")
    GameResult findByUserIdAndGameResultId(@Param("userId") Long userId, @Param("gameResultId") Long gameResultId);
}
