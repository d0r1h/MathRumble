/**
 * Zustand store for game state management.
 */
import { create } from "zustand";

export interface Question {
    id: string;
    question: string;
    difficulty: string;
    time_limit: number;
}

export interface GameState {
    // Connection info
    roomId: string;
    roomCode: string;
    playerId: string;
    userId: string;
    username: string;
    team: "A" | "B";

    // Game state
    status: "idle" | "waiting" | "in_progress" | "finished";
    teamAScore: number;
    teamBScore: number;
    ropePosition: number;
    timer: number;
    currentQuestion: Question | null;
    winner: string | null;
    teamACount: number;
    teamBCount: number;

    // UI state
    lastCorrectTeam: string | null;
    lastWrongTeam: string | null;
    answerFeedback: "correct" | "wrong" | null;

    // Actions
    setConnectionInfo: (info: {
        roomId: string;
        roomCode: string;
        playerId: string;
        userId: string;
        username: string;
        team: "A" | "B";
    }) => void;
    updateGameState: (state: Partial<GameState>) => void;
    setQuestion: (q: Question | null) => void;
    setTimer: (t: number) => void;
    setAnswerFeedback: (f: "correct" | "wrong" | null) => void;
    reset: () => void;
}

const initialState = {
    roomId: "",
    roomCode: "",
    playerId: "",
    userId: "",
    username: "",
    team: "A" as const,
    status: "idle" as const,
    teamAScore: 0,
    teamBScore: 0,
    ropePosition: 0,
    timer: 0,
    currentQuestion: null,
    winner: null,
    teamACount: 0,
    teamBCount: 0,
    lastCorrectTeam: null,
    lastWrongTeam: null,
    answerFeedback: null,
};

export const useGameStore = create<GameState>((set) => ({
    ...initialState,

    setConnectionInfo: (info) => set({ ...info, status: "waiting" }),

    updateGameState: (state) => set(state),

    setQuestion: (q) => set({ currentQuestion: q }),

    setTimer: (t) => set({ timer: t }),

    setAnswerFeedback: (f) => {
        set({ answerFeedback: f });
        if (f) {
            setTimeout(() => set({ answerFeedback: null }), 1200);
        }
    },

    reset: () => set(initialState),
}));
