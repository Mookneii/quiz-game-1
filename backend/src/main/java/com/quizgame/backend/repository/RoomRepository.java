package com.quizgame.backend.repository;

import com.quizgame.backend.model.Room;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RoomRepository extends JpaRepository<Room, Long> {
    Optional<Room> findByRoomCode(String roomCode);
    boolean existsByRoomCode(String roomCode);
    List<Room> findByQuizId(Long quizId);
    
    @Query("SELECT new com.quizgame.backend.dto.RoomHistoryDTO(r.roomCode, r.quiz.title, r.status, r.createdAt, r.endedAt, count(CASE WHEN p.host = false THEN 1 END)) " +
           "FROM Room r LEFT JOIN r.players p " +
           "WHERE r.host.id = :hostId " +
           "GROUP BY r.id, r.quiz.title " +
           "ORDER BY r.createdAt DESC")
    List<com.quizgame.backend.dto.RoomHistoryDTO> findRoomHistoryByHostId(@Param("hostId") Long hostId);
}
