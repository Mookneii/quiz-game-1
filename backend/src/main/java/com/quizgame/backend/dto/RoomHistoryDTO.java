package com.quizgame.backend.dto;

import java.time.LocalDateTime;

public class RoomHistoryDTO {

    private String roomCode;
    private String quizTitle;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime endedAt;
    private Integer totalPlayers;

    public RoomHistoryDTO() {}

    public RoomHistoryDTO(String roomCode, String quizTitle, String status, LocalDateTime createdAt, LocalDateTime endedAt, Integer totalPlayers) {
        this.roomCode = roomCode;
        this.quizTitle = quizTitle;
        this.status = status;
        this.createdAt = createdAt;
        this.endedAt = endedAt;
        this.totalPlayers = totalPlayers;
    }

    public RoomHistoryDTO(String roomCode, String quizTitle, com.quizgame.backend.model.RoomStatus status, LocalDateTime createdAt, LocalDateTime endedAt, Long totalPlayers) {
        this.roomCode = roomCode;
        this.quizTitle = quizTitle != null ? quizTitle : "Unknown Quiz";
        this.status = status != null ? status.name() : null;
        this.createdAt = createdAt;
        this.endedAt = endedAt;
        this.totalPlayers = totalPlayers != null ? totalPlayers.intValue() : 0;
    }

    public String getRoomCode() {
        return roomCode;
    }

    public void setRoomCode(String roomCode) {
        this.roomCode = roomCode;
    }

    public String getQuizTitle() {
        return quizTitle;
    }

    public void setQuizTitle(String quizTitle) {
        this.quizTitle = quizTitle;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getEndedAt() {
        return endedAt;
    }

    public void setEndedAt(LocalDateTime endedAt) {
        this.endedAt = endedAt;
    }

    public Integer getTotalPlayers() {
        return totalPlayers;
    }

    public void setTotalPlayers(Integer totalPlayers) {
        this.totalPlayers = totalPlayers;
    }
}
