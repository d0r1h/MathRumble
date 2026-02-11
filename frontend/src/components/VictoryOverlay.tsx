"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";

interface VictoryOverlayProps {
    winner: string | null;
    teamAScore: number;
    teamBScore: number;
    myTeam: string;
    onPlayAgain: () => void;
}

export default function VictoryOverlay({
    winner,
    teamAScore,
    teamBScore,
    myTeam,
    onPlayAgain,
}: VictoryOverlayProps) {
    const isWinner = winner === myTeam;
    const isDraw = winner === null;

    useEffect(() => {
        if (isWinner) {
            // Fire confetti
            const duration = 3000;
            const end = Date.now() + duration;

            const frame = () => {
                confetti({
                    particleCount: 3,
                    angle: 60,
                    spread: 55,
                    origin: { x: 0, y: 0.7 },
                    colors: myTeam === "A" ? ["#3b82f6", "#60a5fa", "#93c5fd"] : ["#f97316", "#fb923c", "#fdba74"],
                });
                confetti({
                    particleCount: 3,
                    angle: 120,
                    spread: 55,
                    origin: { x: 1, y: 0.7 },
                    colors: myTeam === "A" ? ["#3b82f6", "#60a5fa", "#93c5fd"] : ["#f97316", "#fb923c", "#fdba74"],
                });

                if (Date.now() < end) {
                    requestAnimationFrame(frame);
                }
            };
            frame();
        }
    }, [isWinner, myTeam]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4"
        >
            <motion.div
                initial={{ scale: 0.5, y: 50 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                className="bg-gradient-to-b from-slate-800/90 to-slate-900/90 border border-white/10 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl"
            >
                {/* Trophy / Result */}
                <motion.div
                    animate={{
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, -5, 0],
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="text-7xl mb-4"
                >
                    {isDraw ? "🤝" : isWinner ? "🏆" : "😢"}
                </motion.div>

                <h2 className="text-4xl font-black mb-2">
                    {isDraw ? (
                        <span className="text-white">It&apos;s a Draw!</span>
                    ) : isWinner ? (
                        <span className={myTeam === "A" ? "text-blue-400" : "text-orange-400"}>
                            You Win!
                        </span>
                    ) : (
                        <span className="text-white/70">You Lose...</span>
                    )}
                </h2>

                <p className="text-white/50 mb-6">
                    {isDraw
                        ? "Both teams are evenly matched!"
                        : isWinner
                            ? "Your team pulled the rope all the way! 💪"
                            : "The other team was stronger this time."}
                </p>

                {/* Score Breakdown */}
                <div className="flex justify-center gap-8 mb-8">
                    <div className={`text-center ${winner === "A" ? "scale-110" : ""}`}>
                        <div className="text-blue-400/60 text-xs font-bold uppercase tracking-wider mb-1">
                            Team Alpha
                        </div>
                        <div className="text-4xl font-black text-blue-400">{teamAScore}</div>
                        {winner === "A" && <div className="text-green-400 text-xs mt-1">Winner!</div>}
                    </div>
                    <div className="text-white/20 self-center text-2xl">—</div>
                    <div className={`text-center ${winner === "B" ? "scale-110" : ""}`}>
                        <div className="text-orange-400/60 text-xs font-bold uppercase tracking-wider mb-1">
                            Team Beta
                        </div>
                        <div className="text-4xl font-black text-orange-400">{teamBScore}</div>
                        {winner === "B" && <div className="text-green-400 text-xs mt-1">Winner!</div>}
                    </div>
                </div>

                {/* Play Again */}
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onPlayAgain}
                    className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold text-lg rounded-xl shadow-lg shadow-purple-500/25 transition-all"
                >
                    🔄 Play Again
                </motion.button>
            </motion.div>
        </motion.div>
    );
}
