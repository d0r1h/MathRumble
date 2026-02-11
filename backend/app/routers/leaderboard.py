"""Leaderboard endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models import LeaderboardStats, User
from app.schemas import LeaderboardEntry, PlayerStatsResponse

router = APIRouter(tags=["leaderboard"])


@router.get("/leaderboard", response_model=list[LeaderboardEntry])
async def get_leaderboard(limit: int = 20, db: AsyncSession = Depends(get_db)):
    """Get top players ranked by wins."""
    result = await db.execute(
        select(LeaderboardStats)
        .options(selectinload(LeaderboardStats.user))
        .order_by(LeaderboardStats.wins.desc())
        .limit(limit)
    )
    stats_list = result.scalars().all()

    return [
        LeaderboardEntry(
            rank=i + 1,
            username=s.user.username,
            wins=s.wins,
            losses=s.losses,
            accuracy=s.accuracy,
            avg_response_time_ms=s.avg_response_time_ms,
        )
        for i, s in enumerate(stats_list)
    ]


@router.get("/player/{user_id}", response_model=PlayerStatsResponse)
async def get_player_stats(user_id: str, db: AsyncSession = Depends(get_db)):
    """Get individual player statistics."""
    result = await db.execute(
        select(LeaderboardStats)
        .where(LeaderboardStats.user_id == user_id)
        .options(selectinload(LeaderboardStats.user))
    )
    stats = result.scalar_one_or_none()
    if not stats:
        raise HTTPException(status_code=404, detail="Player not found")

    return PlayerStatsResponse(
        username=stats.user.username,
        wins=stats.wins,
        losses=stats.losses,
        total_answers=stats.total_answers,
        correct_answers=stats.correct_answers,
        accuracy=stats.accuracy,
        avg_response_time_ms=stats.avg_response_time_ms,
    )
