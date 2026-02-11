"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { getLeaderboard, LeaderboardEntry } from "@/lib/api";

export default function Leaderboard() {
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getLeaderboard()
            .then(setEntries)
            .catch(() => setEntries([]))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="w-full max-w-2xl mx-auto">
            <h2 className="text-3xl font-black text-white text-center mb-6">
                🏆 Leaderboard
            </h2>

            {loading ? (
                <div className="text-center text-white/50 py-12">Loading...</div>
            ) : entries.length === 0 ? (
                <div className="text-center py-12">
                    <div className="text-5xl mb-4">🎮</div>
                    <p className="text-white/50 text-lg">No games played yet!</p>
                    <p className="text-white/30 text-sm">Be the first to compete.</p>
                </div>
            ) : (
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
                    {/* Header */}
                    <div className="grid grid-cols-6 gap-2 px-5 py-3 bg-white/5 text-white/40 text-xs font-bold uppercase tracking-wider">
                        <div>#</div>
                        <div className="col-span-2">Player</div>
                        <div className="text-center">Wins</div>
                        <div className="text-center">Accuracy</div>
                        <div className="text-center">Avg Time</div>
                    </div>

                    {/* Rows */}
                    {entries.map((entry, i) => (
                        <motion.div
                            key={entry.username}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className={`grid grid-cols-6 gap-2 px-5 py-3.5 items-center border-t border-white/5 hover:bg-white/5 transition-colors ${i === 0
                                    ? "bg-yellow-500/5"
                                    : i === 1
                                        ? "bg-gray-400/5"
                                        : i === 2
                                            ? "bg-amber-700/5"
                                            : ""
                                }`}
                        >
                            <div className="text-lg font-bold">
                                {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : (
                                    <span className="text-white/30 text-sm">{entry.rank}</span>
                                )}
                            </div>
                            <div className="col-span-2 font-semibold text-white truncate">
                                {entry.username}
                            </div>
                            <div className="text-center text-green-400 font-bold">
                                {entry.wins}
                            </div>
                            <div className="text-center text-white/70">
                                {entry.accuracy.toFixed(1)}%
                            </div>
                            <div className="text-center text-white/50 text-sm">
                                {(entry.avg_response_time_ms / 1000).toFixed(1)}s
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
