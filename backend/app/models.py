"""SQLAlchemy ORM models for the Math Tug-of-War game."""

import uuid
from datetime import datetime
from typing import List, Optional

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


def generate_uuid() -> str:
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    username: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    players: Mapped[List["Player"]] = relationship(back_populates="user")
    leaderboard: Mapped["LeaderboardStats"] = relationship(
        back_populates="user", uselist=False
    )


class GameRoom(Base):
    __tablename__ = "game_rooms"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    room_code: Mapped[str] = mapped_column(String(8), unique=True, nullable=False)
    status: Mapped[str] = mapped_column(
        String(20), default="waiting"
    )  # waiting, in_progress, finished
    difficulty: Mapped[str] = mapped_column(String(20), default="easy")
    max_players_per_team: Mapped[int] = mapped_column(Integer, default=5)
    win_threshold: Mapped[int] = mapped_column(Integer, default=10)
    round_duration: Mapped[int] = mapped_column(Integer, default=120)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    players: Mapped[List["Player"]] = relationship(back_populates="room")
    match: Mapped[Optional["Match"]] = relationship(back_populates="room", uselist=False)


class Player(Base):
    __tablename__ = "players"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    room_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("game_rooms.id"), nullable=False
    )
    team: Mapped[str] = mapped_column(String(1), nullable=False)  # "A" or "B"
    joined_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user: Mapped["User"] = relationship(back_populates="players")
    room: Mapped["GameRoom"] = relationship(back_populates="players")


class Match(Base):
    __tablename__ = "matches"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    room_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("game_rooms.id"), nullable=False
    )
    winner_team: Mapped[Optional[str]] = mapped_column(String(1), nullable=True)
    rope_final_position: Mapped[int] = mapped_column(Integer, default=0)
    duration: Mapped[int] = mapped_column(Integer, default=0)  # seconds
    finished_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    room: Mapped["GameRoom"] = relationship(back_populates="match")


class Question(Base):
    __tablename__ = "questions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    question_text: Mapped[str] = mapped_column(Text, nullable=False)
    answer: Mapped[float] = mapped_column(Float, nullable=False)
    difficulty: Mapped[str] = mapped_column(String(20), nullable=False)
    time_limit: Mapped[int] = mapped_column(Integer, default=10)
    is_custom: Mapped[bool] = mapped_column(Boolean, default=False)


class LeaderboardStats(Base):
    __tablename__ = "leaderboard_stats"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id"), unique=True, nullable=False
    )
    wins: Mapped[int] = mapped_column(Integer, default=0)
    losses: Mapped[int] = mapped_column(Integer, default=0)
    total_answers: Mapped[int] = mapped_column(Integer, default=0)
    correct_answers: Mapped[int] = mapped_column(Integer, default=0)
    total_response_time_ms: Mapped[int] = mapped_column(Integer, default=0)

    user: Mapped["User"] = relationship(back_populates="leaderboard")

    @property
    def accuracy(self) -> float:
        if self.total_answers == 0:
            return 0.0
        return round((self.correct_answers / self.total_answers) * 100, 1)

    @property
    def avg_response_time_ms(self) -> float:
        if self.correct_answers == 0:
            return 0.0
        return round(self.total_response_time_ms / self.correct_answers, 0)
