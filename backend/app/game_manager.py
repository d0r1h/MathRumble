"""In-memory game state manager with WebSocket broadcasting."""

import asyncio
import time
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Set

from fastapi import WebSocket

from app.question_engine import generate_question
from app.schemas import GameStateResponse, QuestionResponse


@dataclass
class PlayerConnection:
    websocket: WebSocket
    player_id: str
    user_id: str
    username: str
    team: str


@dataclass
class ActiveGame:
    room_id: str
    room_code: str
    difficulty: str
    win_threshold: int
    round_duration: int
    team_a_score: int = 0
    team_b_score: int = 0
    rope_position: int = 0  # +ve → Team A side, -ve → Team B side
    timer: int = 0
    status: str = "waiting"
    winner: Optional[str] = None
    current_question: Optional[QuestionResponse] = None
    current_answer: Optional[float] = None
    answered_players: Set[str] = field(default_factory=set)
    connections: List[PlayerConnection] = field(default_factory=list)
    timer_task: Optional[asyncio.Task] = field(default=None, repr=False)
    question_start_time: float = 0.0


class GameManager:
    """Manages all active game rooms in memory."""

    def __init__(self):
        self.games: Dict[str, ActiveGame] = {}

    def create_game(
        self,
        room_id: str,
        room_code: str,
        difficulty: str = "easy",
        win_threshold: int = 10,
        round_duration: int = 120,
    ) -> ActiveGame:
        game = ActiveGame(
            room_id=room_id,
            room_code=room_code,
            difficulty=difficulty,
            win_threshold=win_threshold,
            round_duration=round_duration,
            timer=round_duration,
        )
        self.games[room_id] = game
        return game

    def get_game(self, room_id: str) -> Optional[ActiveGame]:
        return self.games.get(room_id)

    async def connect_player(
        self,
        room_id: str,
        websocket: WebSocket,
        player_id: str,
        user_id: str,
        username: str,
        team: str,
    ):
        game = self.games.get(room_id)
        if not game:
            return

        await websocket.accept()
        conn = PlayerConnection(
            websocket=websocket,
            player_id=player_id,
            user_id=user_id,
            username=username,
            team=team,
        )
        game.connections.append(conn)

        # Notify all players
        await self._broadcast(
            game,
            {
                "type": "player_joined",
                "data": {
                    "username": username,
                    "team": team,
                    "team_a_count": sum(
                        1 for c in game.connections if c.team == "A"
                    ),
                    "team_b_count": sum(
                        1 for c in game.connections if c.team == "B"
                    ),
                },
            },
        )

        # Send current state to the new player
        await self._send_state(game, websocket)

    async def disconnect_player(self, room_id: str, player_id: str):
        game = self.games.get(room_id)
        if not game:
            return

        game.connections = [c for c in game.connections if c.player_id != player_id]

        disconnected_username = "Unknown"
        await self._broadcast(
            game,
            {
                "type": "player_left",
                "data": {
                    "username": disconnected_username,
                    "team_a_count": sum(
                        1 for c in game.connections if c.team == "A"
                    ),
                    "team_b_count": sum(
                        1 for c in game.connections if c.team == "B"
                    ),
                },
            },
        )

        # Clean up empty games
        if not game.connections and game.status != "in_progress":
            self.games.pop(room_id, None)

    async def start_game(self, room_id: str):
        game = self.games.get(room_id)
        if not game or game.status != "waiting":
            return

        game.status = "in_progress"
        game.timer = game.round_duration

        # Generate first question
        self._next_question(game)

        # Start game timer
        game.timer_task = asyncio.create_task(self._run_timer(game))

        await self._broadcast(
            game,
            {"type": "game_started", "data": {}},
        )
        await self._broadcast_state(game)

    async def submit_answer(
        self, room_id: str, player_id: str, question_id: str, answer: float
    ) -> Dict:
        game = self.games.get(room_id)
        if not game or game.status != "in_progress":
            return {"correct": False, "message": "Game not active"}

        if not game.current_question or game.current_question.id != question_id:
            return {"correct": False, "message": "Invalid question"}

        # Anti-cheat: one answer per player per question
        if player_id in game.answered_players:
            return {"correct": False, "message": "Already answered this question"}

        game.answered_players.add(player_id)

        # Find player team
        player_conn = next(
            (c for c in game.connections if c.player_id == player_id), None
        )
        if not player_conn:
            return {"correct": False, "message": "Player not found"}

        # Calculate response time
        response_time_ms = int((time.time() - game.question_start_time) * 1000)

        # Validate answer
        is_correct = abs(answer - game.current_answer) < 0.01

        result = {
            "correct": is_correct,
            "player_id": player_id,
            "team": player_conn.team,
            "response_time_ms": response_time_ms,
        }

        if is_correct:
            # Move rope
            if player_conn.team == "A":
                game.team_a_score += 1
                game.rope_position += 1
            else:
                game.team_b_score += 1
                game.rope_position -= 1

            # Broadcast score update
            await self._broadcast(
                game,
                {
                    "type": "correct_answer",
                    "data": {
                        "team": player_conn.team,
                        "username": player_conn.username,
                        "rope_position": game.rope_position,
                        "team_a_score": game.team_a_score,
                        "team_b_score": game.team_b_score,
                    },
                },
            )

            # Check win condition
            if game.rope_position >= game.win_threshold:
                await self._end_game(game, "A")
                result["game_over"] = True
                result["winner"] = "A"
                return result
            elif game.rope_position <= -game.win_threshold:
                await self._end_game(game, "B")
                result["game_over"] = True
                result["winner"] = "B"
                return result

            # Next question
            self._next_question(game)
            await self._broadcast_state(game)
        else:
            await self._broadcast(
                game,
                {
                    "type": "wrong_answer",
                    "data": {
                        "team": player_conn.team,
                        "username": player_conn.username,
                    },
                },
            )

        return result

    def _next_question(self, game: ActiveGame):
        q, answer = generate_question(game.difficulty)
        game.current_question = q
        game.current_answer = answer
        game.answered_players.clear()
        game.question_start_time = time.time()

    async def _run_timer(self, game: ActiveGame):
        """Countdown timer that ticks every second."""
        try:
            while game.timer > 0 and game.status == "in_progress":
                await asyncio.sleep(1)
                game.timer -= 1

                # Broadcast timer every 5 seconds or when <= 10
                if game.timer % 5 == 0 or game.timer <= 10:
                    await self._broadcast(
                        game,
                        {"type": "timer_tick", "data": {"timer": game.timer}},
                    )

            if game.status == "in_progress":
                # Time's up — determine winner by rope position
                if game.rope_position > 0:
                    await self._end_game(game, "A")
                elif game.rope_position < 0:
                    await self._end_game(game, "B")
                else:
                    await self._end_game(game, None)  # Draw
        except asyncio.CancelledError:
            pass

    async def _end_game(self, game: ActiveGame, winner: Optional[str]):
        game.status = "finished"
        game.winner = winner

        if game.timer_task and not game.timer_task.done():
            game.timer_task.cancel()

        await self._broadcast(
            game,
            {
                "type": "game_over",
                "data": {
                    "winner": winner,
                    "team_a_score": game.team_a_score,
                    "team_b_score": game.team_b_score,
                    "rope_position": game.rope_position,
                },
            },
        )

    async def _broadcast(self, game: ActiveGame, message: Dict):
        """Send a JSON message to all connected players."""
        dead = []
        for conn in game.connections:
            try:
                await conn.websocket.send_json(message)
            except Exception:
                dead.append(conn)

        for conn in dead:
            game.connections.remove(conn)

    async def _broadcast_state(self, game: ActiveGame):
        """Send full game state to all connected players."""
        state = self._get_state(game)
        await self._broadcast(game, {"type": "state_update", "data": state})

    async def _send_state(self, game: ActiveGame, websocket: WebSocket):
        """Send game state to a single player."""
        state = self._get_state(game)
        try:
            await websocket.send_json({"type": "state_update", "data": state})
        except Exception:
            pass

    def _get_state(self, game: ActiveGame) -> Dict:
        state = GameStateResponse(
            team_a_score=game.team_a_score,
            team_b_score=game.team_b_score,
            rope_position=game.rope_position,
            timer=game.timer,
            current_question=game.current_question,
            status=game.status,
            winner=game.winner,
        )
        return state.model_dump()


# Singleton
game_manager = GameManager()
