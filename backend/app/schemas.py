"""Pydantic schemas for request/response validation."""

from typing import Dict, List, Optional

from pydantic import BaseModel


# ── Room Schemas ──────────────────────────────────────────────────────

class CreateRoomRequest(BaseModel):
    username: str
    difficulty: str = "easy"
    max_players_per_team: int = 5
    win_threshold: int = 10
    round_duration: int = 120


class JoinRoomRequest(BaseModel):
    username: str
    room_code: str
    team: Optional[str] = None  # Auto-assign if None


class RoomResponse(BaseModel):
    room_id: str
    room_code: str
    status: str
    difficulty: str
    max_players_per_team: int
    win_threshold: int
    round_duration: int
    team_a_count: int = 0
    team_b_count: int = 0


class JoinRoomResponse(BaseModel):
    room_id: str
    room_code: str
    player_id: str
    user_id: str
    team: str
    status: str


# ── Question Schemas ──────────────────────────────────────────────────

class QuestionResponse(BaseModel):
    id: str
    question: str
    difficulty: str
    time_limit: int


class AnswerSubmission(BaseModel):
    question_id: str
    answer: float
    player_id: str


# ── Game State Schema ─────────────────────────────────────────────────

class GameStateResponse(BaseModel):
    team_a_score: int = 0
    team_b_score: int = 0
    rope_position: int = 0  # +ve = Team A, -ve = Team B
    timer: int = 0
    current_question: Optional[QuestionResponse] = None
    status: str = "waiting"  # waiting, in_progress, finished
    winner: Optional[str] = None


# ── Leaderboard Schemas ──────────────────────────────────────────────

class LeaderboardEntry(BaseModel):
    rank: int
    username: str
    wins: int
    losses: int
    accuracy: float
    avg_response_time_ms: float


class PlayerStatsResponse(BaseModel):
    username: str
    wins: int
    losses: int
    total_answers: int
    correct_answers: int
    accuracy: float
    avg_response_time_ms: float


# ── Admin Schemas ─────────────────────────────────────────────────────

class AdminQuestionCreate(BaseModel):
    question_text: str
    answer: float
    difficulty: str = "easy"
    time_limit: int = 10


class AdminSettingsUpdate(BaseModel):
    difficulty: Optional[str] = None
    round_duration: Optional[int] = None
    win_threshold: Optional[int] = None


# ── WebSocket Message Schemas ─────────────────────────────────────────

class WSMessage(BaseModel):
    type: str  # "answer", "start_game", "player_joined", etc.
    data: Dict = {}
