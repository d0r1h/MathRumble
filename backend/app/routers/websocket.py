"""WebSocket endpoint for real-time game communication."""

import json

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.game_manager import game_manager

router = APIRouter(tags=["websocket"])


@router.websocket("/ws/game/{room_id}")
async def game_websocket(websocket: WebSocket, room_id: str):
    """
    WebSocket endpoint for real-time game play.

    Expected query params: player_id, user_id, username, team
    """
    params = websocket.query_params
    player_id = params.get("player_id", "")
    user_id = params.get("user_id", "")
    username = params.get("username", "Player")
    team = params.get("team", "A")

    game = game_manager.get_game(room_id)
    if not game:
        await websocket.close(code=4004, reason="Game not found")
        return

    await game_manager.connect_player(
        room_id=room_id,
        websocket=websocket,
        player_id=player_id,
        user_id=user_id,
        username=username,
        team=team,
    )

    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            msg_type = message.get("type", "")

            if msg_type == "start_game":
                await game_manager.start_game(room_id)

            elif msg_type == "answer":
                answer_data = message.get("data", {})
                result = await game_manager.submit_answer(
                    room_id=room_id,
                    player_id=player_id,
                    question_id=answer_data.get("question_id", ""),
                    answer=float(answer_data.get("answer", 0)),
                )
                # Send result to the submitting player only
                try:
                    await websocket.send_json(
                        {"type": "answer_result", "data": result}
                    )
                except Exception:
                    pass

    except WebSocketDisconnect:
        await game_manager.disconnect_player(room_id, player_id)
    except Exception:
        await game_manager.disconnect_player(room_id, player_id)
