"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import NumericKeypad from "./NumericKeypad";
import { useGameStore } from "@/store/gameStore";

interface TeamPanelProps {
    team: "A" | "B";
    onSubmitAnswer: (answer: string) => void;
    isMyTeam: boolean;
}

export default function TeamPanel({
    team,
    onSubmitAnswer,
    isMyTeam,
}: TeamPanelProps) {
    const [answer, setAnswer] = useState("");
    const currentQuestion = useGameStore((s) => s.currentQuestion);
    const status = useGameStore((s) => s.status);
    const answerFeedback = useGameStore((s) => s.answerFeedback);
    const myTeam = useGameStore((s) => s.team);

    const isBlue = team === "A";
    const teamName = isBlue ? "Team Alpha" : "Team Beta";
    const teamColor = isBlue ? "blue" : "orange";
    const isActive = status === "in_progress" && isMyTeam;

    const handleSubmit = () => {
        if (!answer || !isActive) return;
        onSubmitAnswer(answer);
        setAnswer("");
    };

    // Feedback flash
    const feedbackStyle =
        isMyTeam && answerFeedback === "correct"
            ? "ring-4 ring-green-400/50"
            : isMyTeam && answerFeedback === "wrong"
                ? "ring-4 ring-red-400/50"
                : "";

    return (
        <motion.div
            className={`flex flex-col h-full p-4 rounded-2xl border transition-all ${feedbackStyle} ${isBlue
                    ? "bg-gradient-to-b from-blue-500/10 to-blue-900/20 border-blue-500/20"
                    : "bg-gradient-to-b from-orange-500/10 to-orange-900/20 border-orange-500/20"
                } ${!isMyTeam ? "opacity-60" : ""}`}
            initial={{ opacity: 0, x: isBlue ? -30 : 30 }}
            animate={{ opacity: isMyTeam ? 1 : 0.6, x: 0 }}
            transition={{ duration: 0.4 }}
        >
            {/* Team Header */}
            <div className="text-center mb-4">
                <div
                    className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold ${isBlue
                            ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                            : "bg-orange-500/20 text-orange-300 border border-orange-500/30"
                        }`}
                >
                    <span>{isBlue ? "🔵" : "🟠"}</span>
                    {teamName}
                    {isMyTeam && team === myTeam && (
                        <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full">YOU</span>
                    )}
                </div>
            </div>

            {/* Question Display */}
            <div
                className={`flex-shrink-0 mb-4 p-5 rounded-xl text-center ${isBlue
                        ? "bg-blue-500/10 border border-blue-500/20"
                        : "bg-orange-500/10 border border-orange-500/20"
                    }`}
            >
                {currentQuestion && status === "in_progress" ? (
                    <>
                        <div className="text-white/40 text-xs uppercase tracking-wider mb-2 font-medium">
                            Solve
                        </div>
                        <motion.div
                            key={currentQuestion.id}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className={`text-3xl md:text-4xl font-black ${isBlue ? "text-blue-100" : "text-orange-100"
                                }`}
                        >
                            {currentQuestion.question}
                        </motion.div>
                    </>
                ) : (
                    <div className="text-white/30 text-lg py-2">
                        {status === "waiting" ? "Waiting to start..." : "—"}
                    </div>
                )}
            </div>

            {/* Feedback Banner */}
            {isMyTeam && answerFeedback && (
                <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className={`mb-3 py-2 rounded-xl text-center text-lg font-bold ${answerFeedback === "correct"
                            ? "bg-green-500/20 text-green-400 border border-green-500/30"
                            : "bg-red-500/20 text-red-400 border border-red-500/30"
                        }`}
                >
                    {answerFeedback === "correct" ? "✅ Correct!" : "❌ Wrong!"}
                </motion.div>
            )}

            {/* Keypad */}
            <div className="flex-1 flex flex-col justify-center">
                {isMyTeam ? (
                    <NumericKeypad
                        value={answer}
                        onChange={setAnswer}
                        onSubmit={handleSubmit}
                        disabled={!isActive}
                        teamColor={teamColor}
                    />
                ) : (
                    <div className="text-center text-white/20 text-sm">
                        Opponent&apos;s panel
                    </div>
                )}
            </div>
        </motion.div>
    );
}
