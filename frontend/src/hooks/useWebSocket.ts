/**
 * WebSocket hook for real-time game connection.
 */
"use client";

import { useCallback, useEffect, useRef } from "react";
import { useGameStore } from "@/store/gameStore";

const API_WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";

export function useWebSocket() {
    const wsRef = useRef<WebSocket | null>(null);
    const {
        roomId,
        playerId,
        userId,
        username,
        team,
        setQuestion,
        setTimer,
        updateGameState,
        setAnswerFeedback,
    } = useGameStore();

    const connect = useCallback(() => {
        if (!roomId || !playerId) return;

        const params = new URLSearchParams({
            player_id: playerId,
            user_id: userId,
            username: username,
            team: team,
        });

        const ws = new WebSocket(
            `${API_WS_URL}/ws/game/${roomId}?${params.toString()}`
        );

        ws.onopen = () => {
            console.log("WebSocket connected");
        };

        ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            handleMessage(message);
        };

        ws.onclose = () => {
            console.log("WebSocket disconnected");
        };

        ws.onerror = (err) => {
            console.error("WebSocket error:", err);
        };

        wsRef.current = ws;
    }, [roomId, playerId, userId, username, team]);

    const handleMessage = useCallback(
        (message: { type: string; data: Record<string, unknown> }) => {
            switch (message.type) {
                case "state_update":
                    updateGameState({
                        teamAScore: message.data.team_a_score as number,
                        teamBScore: message.data.team_b_score as number,
                        ropePosition: message.data.rope_position as number,
                        timer: message.data.timer as number,
                        status: message.data.status as
                            | "waiting"
                            | "in_progress"
                            | "finished",
                        winner: message.data.winner as string | null,
                    });
                    if (message.data.current_question) {
                        const q = message.data.current_question as {
                            id: string;
                            question: string;
                            difficulty: string;
                            time_limit: number;
                        };
                        setQuestion({
                            id: q.id,
                            question: q.question,
                            difficulty: q.difficulty,
                            time_limit: q.time_limit,
                        });
                    }
                    break;

                case "game_started":
                    updateGameState({ status: "in_progress" });
                    break;

                case "player_joined":
                    updateGameState({
                        teamACount: message.data.team_a_count as number,
                        teamBCount: message.data.team_b_count as number,
                    });
                    break;

                case "player_left":
                    updateGameState({
                        teamACount: message.data.team_a_count as number,
                        teamBCount: message.data.team_b_count as number,
                    });
                    break;

                case "correct_answer":
                    updateGameState({
                        teamAScore: message.data.team_a_score as number,
                        teamBScore: message.data.team_b_score as number,
                        ropePosition: message.data.rope_position as number,
                        lastCorrectTeam: message.data.team as string,
                    });
                    break;

                case "wrong_answer":
                    updateGameState({
                        lastWrongTeam: message.data.team as string,
                    });
                    break;

                case "answer_result":
                    setAnswerFeedback(
                        (message.data as { correct: boolean }).correct ? "correct" : "wrong"
                    );
                    break;

                case "timer_tick":
                    setTimer(message.data.timer as number);
                    break;

                case "game_over":
                    updateGameState({
                        status: "finished",
                        winner: message.data.winner as string | null,
                        teamAScore: message.data.team_a_score as number,
                        teamBScore: message.data.team_b_score as number,
                        ropePosition: message.data.rope_position as number,
                    });
                    break;
            }
        },
        [updateGameState, setQuestion, setTimer, setAnswerFeedback]
    );

    const sendMessage = useCallback(
        (type: string, data: Record<string, unknown> = {}) => {
            if (wsRef.current?.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({ type, data }));
            }
        },
        []
    );

    const disconnect = useCallback(() => {
        wsRef.current?.close();
        wsRef.current = null;
    }, []);

    useEffect(() => {
        return () => {
            wsRef.current?.close();
        };
    }, []);

    return { connect, disconnect, sendMessage };
}
