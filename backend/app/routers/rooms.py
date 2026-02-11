"""Room management endpoints."""

from __future__ import annotations

import random
import string

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.game_manager import game_manager
from app.models import GameRoom, LeaderboardStats, Player, User
from app.schemas import CreateRoomRequest, JoinRoomRequest, JoinRoomResponse, RoomResponse

router = APIRouter(prefix="/rooms", tags=["rooms"])


def _generate_room_code(length: int = 6) -> str:
    return "".join(random.choices(string.ascii_uppercase + string.digits, k=length))


@router.post("", response_model=JoinRoomResponse)
async def create_room(req: CreateRoomRequest, db: AsyncSession = Depends(get_db)):
    """Create a new game room and auto-join the creator as Team A."""
    # Find or create user
    user = await _get_or_create_user(db, req.username)

    # Create room
    room_code = _generate_room_code()
    room = GameRoom(
        room_code=room_code,
        difficulty=req.difficulty,
        max_players_per_team=req.max_players_per_team,
        win_threshold=req.win_threshold,
        round_duration=req.round_duration,
    )
    db.add(room)
    await db.flush()

    # Add creator as Team A player
    player = Player(user_id=user.id, room_id=room.id, team="A")
    db.add(player)
    await db.commit()

    # Create in-memory game
    game_manager.create_game(
        room_id=room.id,
        room_code=room_code,
        difficulty=req.difficulty,
        win_threshold=req.win_threshold,
        round_duration=req.round_duration,
    )

    return JoinRoomResponse(
        room_id=room.id,
        room_code=room_code,
        player_id=player.id,
        user_id=user.id,
        team="A",
        status="waiting",
    )


@router.get("/{room_code}", response_model=RoomResponse)
async def get_room(room_code: str, db: AsyncSession = Depends(get_db)):
    """Get room details by room code."""
    result = await db.execute(
        select(GameRoom)
        .where(GameRoom.room_code == room_code)
        .options(selectinload(GameRoom.players))
    )
    room = result.scalar_one_or_none()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    team_a = sum(1 for p in room.players if p.team == "A")
    team_b = sum(1 for p in room.players if p.team == "B")

    return RoomResponse(
        room_id=room.id,
        room_code=room.room_code,
        status=room.status,
        difficulty=room.difficulty,
        max_players_per_team=room.max_players_per_team,
        win_threshold=room.win_threshold,
        round_duration=room.round_duration,
        team_a_count=team_a,
        team_b_count=team_b,
    )


@router.post("/{room_code}/join", response_model=JoinRoomResponse)
async def join_room(room_code: str, req: JoinRoomRequest, db: AsyncSession = Depends(get_db)):
    """Join an existing game room."""
    result = await db.execute(
        select(GameRoom)
        .where(GameRoom.room_code == room_code)
        .options(selectinload(GameRoom.players))
    )
    room = result.scalar_one_or_none()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    if room.status != "waiting":
        raise HTTPException(status_code=400, detail="Game already started or finished")

    # Count teams
    team_a = [p for p in room.players if p.team == "A"]
    team_b = [p for p in room.players if p.team == "B"]

    # Auto-assign to smaller team, or use requested team
    if req.team:
        team = req.team.upper()
        if team == "A" and len(team_a) >= room.max_players_per_team:
            raise HTTPException(status_code=400, detail="Team A is full")
        if team == "B" and len(team_b) >= room.max_players_per_team:
            raise HTTPException(status_code=400, detail="Team B is full")
    else:
        if len(team_a) <= len(team_b):
            team = "A"
        else:
            team = "B"

    if (team == "A" and len(team_a) >= room.max_players_per_team) or (
        team == "B" and len(team_b) >= room.max_players_per_team
    ):
        raise HTTPException(status_code=400, detail="Selected team is full")

    user = await _get_or_create_user(db, req.username)

    # Check if user already in room
    existing = next((p for p in room.players if p.user_id == user.id), None)
    if existing:
        return JoinRoomResponse(
            room_id=room.id,
            room_code=room.room_code,
            player_id=existing.id,
            user_id=user.id,
            team=existing.team,
            status=room.status,
        )

    player = Player(user_id=user.id, room_id=room.id, team=team)
    db.add(player)
    await db.commit()

    return JoinRoomResponse(
        room_id=room.id,
        room_code=room.room_code,
        player_id=player.id,
        user_id=user.id,
        team=team,
        status=room.status,
    )


async def _get_or_create_user(db: AsyncSession, username: str) -> User:
    result = await db.execute(select(User).where(User.username == username))
    user = result.scalar_one_or_none()
    if not user:
        user = User(username=username)
        db.add(user)
        await db.flush()

        # Create leaderboard entry
        stats = LeaderboardStats(user_id=user.id)
        db.add(stats)
        await db.flush()

    return user
