"use client";

import { useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { useGameStore } from "@/store/gameStore";
import { useWebSocket } from "@/hooks/useWebSocket";
import TeamPanel from "./TeamPanel";
import RopeAnimation from "./RopeAnimation";
import Timer from "./Timer";
import VictoryOverlay from "./VictoryOverlay";
import { useRouter } from "next/navigation";

export default function GameScreen() {
    const {
        roomCode,
        team,
        status,
        timer,
        winner,
        teamAScore,
        teamBScore,
        currentQuestion,
        teamACount,
        teamBCount,
        reset,
    } = useGameStore();

    const { connect, disconnect, sendMessage } = useWebSocket();
    const router = useRouter();

    useEffect(() => {
        connect();
        return () => disconnect();
    }, [connect, disconnect]);

    const handleStartGame = useCallback(() => {
        sendMessage("start_game");
    }, [sendMessage]);

    const handleSubmitAnswer = useCallback(
        (answer: string) => {
            if (!currentQuestion) return;
            sendMessage("answer", {
                question_id: currentQuestion.id,
                answer: parseFloat(answer),
            });
        },
        [sendMessage, currentQuestion]
    );

    const handlePlayAgain = useCallback(() => {
        reset();
        router.push("/");
    }, [reset, router]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 flex flex-col">
            {/* Top Bar */}
            <header className="flex items-center justify-between px-4 py-3 bg-black/20 border-b border-white/5">
                <div className="flex items-center gap-3">
                    <span className="text-xl">🧮</span>
                    <h1 className="text-lg font-bold bg-gradient-to-r from-blue-400 to-orange-400 bg-clip-text text-transparent">
                        Math Rumble
                    </h1>
                </div>
                <div className="flex items-center gap-3">
                    <div className="px-3 py-1.5 bg-white/10 rounded-lg border border-white/10 font-mono text-white/70 text-sm tracking-widest">
                        {roomCode}
                    </div>
                    <div className="flex gap-1.5 text-xs">
                        <span className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded-md border border-blue-500/20">
                            🔵 {teamACount}
                        </span>
                        <span className="bg-orange-500/20 text-orange-300 px-2 py-1 rounded-md border border-orange-500/20">
                            🟠 {teamBCount}
                        </span>
                    </div>
                </div>
            </header>

            {/* Waiting State */}
            {status === "waiting" && (
                <div className="flex-1 flex items-center justify-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center max-w-md mx-auto p-8"
                    >
                        <motion.div
                            animate={{ rotate: [0, 10, -10, 0] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="text-6xl mb-6"
                        >
                            ⏳
                        </motion.div>
                        <h2 className="text-2xl font-bold text-white mb-2">
                            Waiting for players...
                        </h2>
                        <p className="text-white/50 mb-2">
                            Share the room code with your friends:
                        </p>
                        <div className="bg-white/10 border border-white/20 rounded-xl px-6 py-4 mb-6">
                            <span className="text-3xl font-mono font-black text-white tracking-[0.3em]">
                                {roomCode}
                            </span>
                        </div>
                        <p className="text-white/40 text-sm mb-6">
                            You are on{" "}
                            <span className={team === "A" ? "text-blue-400 font-bold" : "text-orange-400 font-bold"}>
                                Team {team === "A" ? "Alpha" : "Beta"}
                            </span>
                        </p>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleStartGame}
                            className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold text-lg rounded-xl shadow-lg shadow-green-500/25 transition-all"
                        >
                            🚀 Start Game
                        </motion.button>
                    </motion.div>
                </div>
            )}

            {/* Game Playing / Finished */}
            {(status === "in_progress" || status === "finished") && (
                <div className="flex-1 flex flex-col lg:flex-row gap-3 p-3 overflow-hidden">
                    {/* Team A Panel */}
                    <div className="lg:w-1/3 min-h-0">
                        <TeamPanel
                            team="A"
                            onSubmitAnswer={handleSubmitAnswer}
                            isMyTeam={team === "A"}
                        />
                    </div>

                    {/* Center Panel */}
                    <div className="lg:w-1/3 flex flex-col items-center justify-center gap-2 min-h-0">
                        {/* Timer */}
                        <Timer time={timer} maxTime={120} />

                        {/* Rope Animation */}
                        <RopeAnimation />

                        {/* Difficulty Badge */}
                        {currentQuestion && (
                            <div className="flex items-center gap-2">
                                <span
                                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${currentQuestion.difficulty === "easy"
                                            ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                            : currentQuestion.difficulty === "medium"
                                                ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                                                : currentQuestion.difficulty === "hard"
                                                    ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                                    : "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                                        }`}
                                >
                                    {currentQuestion.difficulty}
                                </span>
                            </div>
                        )}

                        {/* Status text */}
                        <div className="text-white/30 text-xs text-center mt-1">
                            {status === "in_progress"
                                ? "Solve faster to pull the rope!"
                                : "Game Over"}
                        </div>
                    </div>

                    {/* Team B Panel */}
                    <div className="lg:w-1/3 min-h-0">
                        <TeamPanel
                            team="B"
                            onSubmitAnswer={handleSubmitAnswer}
                            isMyTeam={team === "B"}
                        />
                    </div>
                </div>
            )}

            {/* Victory Overlay */}
            {status === "finished" && (
                <VictoryOverlay
                    winner={winner}
                    teamAScore={teamAScore}
                    teamBScore={teamBScore}
                    myTeam={team}
                    onPlayAgain={handlePlayAgain}
                />
            )}
        </div>
    );
}
