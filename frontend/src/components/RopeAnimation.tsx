"use client";

import { motion } from "framer-motion";
import { useGameStore } from "@/store/gameStore";

export default function RopeAnimation() {
    const ropePosition = useGameStore((s) => s.ropePosition);
    const teamAScore = useGameStore((s) => s.teamAScore);
    const teamBScore = useGameStore((s) => s.teamBScore);
    const status = useGameStore((s) => s.status);
    const lastCorrectTeam = useGameStore((s) => s.lastCorrectTeam);

    // Map rope_position to translateX percentage (-10 to +10 → -100% to +100%)
    const maxPos = 10;
    const translatePct = (ropePosition / maxPos) * 45;

    return (
        <div className="w-full py-6">
            {/* Score display */}
            <div className="flex justify-between items-center mb-4 px-4">
                <motion.div
                    className="text-center"
                    animate={{ scale: lastCorrectTeam === "A" ? [1, 1.3, 1] : 1 }}
                    transition={{ duration: 0.3 }}
                >
                    <div className="text-3xl font-black text-blue-400">{teamAScore}</div>
                    <div className="text-xs text-blue-300/60 font-medium uppercase tracking-wider">Team A</div>
                </motion.div>
                <div className="text-white/20 text-sm font-medium">VS</div>
                <motion.div
                    className="text-center"
                    animate={{ scale: lastCorrectTeam === "B" ? [1, 1.3, 1] : 1 }}
                    transition={{ duration: 0.3 }}
                >
                    <div className="text-3xl font-black text-orange-400">{teamBScore}</div>
                    <div className="text-xs text-orange-300/60 font-medium uppercase tracking-wider">Team B</div>
                </motion.div>
            </div>

            {/* Rope track */}
            <div className="relative h-20 bg-white/5 rounded-2xl border border-white/10 overflow-hidden mx-2">
                {/* Team A zone (left) */}
                <div className="absolute left-0 top-0 bottom-0 w-1/2 bg-gradient-to-r from-blue-500/10 to-transparent" />
                {/* Team B zone (right) */}
                <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-gradient-to-l from-orange-500/10 to-transparent" />

                {/* Center line */}
                <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white/20 -translate-x-1/2 z-10">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-white/30 rounded-full" />
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-3 h-3 bg-white/30 rounded-full" />
                </div>

                {/* Win zone markers */}
                <div className="absolute left-2 top-1/2 -translate-y-1/2 text-blue-400/30 text-xs font-bold">
                    WIN ←
                </div>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 text-orange-400/30 text-xs font-bold">
                    → WIN
                </div>

                {/* Rope */}
                <motion.div
                    className="absolute top-1/2 left-0 right-0 h-3 -translate-y-1/2 z-20"
                    animate={{ x: `${translatePct}%` }}
                    transition={{ type: "spring", stiffness: 150, damping: 15 }}
                >
                    {/* Rope segments */}
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full h-2.5 relative">
                            {/* Rope texture */}
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-amber-600 to-orange-400 rounded-full shadow-lg" />
                            <div
                                className="absolute inset-0 rounded-full opacity-30"
                                style={{
                                    backgroundImage: `repeating-linear-gradient(90deg, transparent, transparent 8px, rgba(0,0,0,0.2) 8px, rgba(0,0,0,0.2) 10px)`,
                                }}
                            />
                        </div>
                    </div>

                    {/* Team A puller (left) */}
                    <motion.div
                        className="absolute left-2 top-1/2 -translate-y-1/2"
                        animate={{ rotate: status === "in_progress" ? [-5, 5, -5] : 0 }}
                        transition={{ duration: 0.5, repeat: Infinity }}
                    >
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-xl shadow-lg shadow-blue-500/30 border-2 border-blue-300/50">
                            💪
                        </div>
                    </motion.div>

                    {/* Team B puller (right) */}
                    <motion.div
                        className="absolute right-2 top-1/2 -translate-y-1/2"
                        animate={{ rotate: status === "in_progress" ? [5, -5, 5] : 0 }}
                        transition={{ duration: 0.5, repeat: Infinity }}
                    >
                        <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-xl shadow-lg shadow-orange-500/30 border-2 border-orange-300/50">
                            💪
                        </div>
                    </motion.div>

                    {/* Center knot */}
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 bg-amber-700 rounded-full border-2 border-amber-500 shadow-md z-30" />
                </motion.div>

                {/* Position indicator */}
                {status === "in_progress" && (
                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[10px] text-white/30 tabular-nums">
                        {ropePosition > 0 ? `+${ropePosition}` : ropePosition}
                    </div>
                )}
            </div>

            {/* Position dots */}
            <div className="flex justify-center gap-1.5 mt-3">
                {Array.from({ length: 21 }, (_, i) => i - 10).map((pos) => (
                    <div
                        key={pos}
                        className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${pos === 0
                                ? "bg-white/40 w-2 h-2"
                                : pos === ropePosition
                                    ? pos > 0
                                        ? "bg-blue-400 w-2.5 h-2.5 shadow-sm shadow-blue-400/50"
                                        : "bg-orange-400 w-2.5 h-2.5 shadow-sm shadow-orange-400/50"
                                    : pos > 0
                                        ? "bg-blue-500/15"
                                        : "bg-orange-500/15"
                            }`}
                    />
                ))}
            </div>
        </div>
    );
}
