"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { createRoom, joinRoom } from "@/lib/api";
import { useGameStore } from "@/store/gameStore";
import { useRouter } from "next/navigation";
import Leaderboard from "./Leaderboard";

const DIFFICULTIES = [
    { value: "easy", label: "Easy", desc: "Single-digit +/-", color: "from-green-400 to-emerald-500" },
    { value: "medium", label: "Medium", desc: "Two-digit +/-", color: "from-yellow-400 to-orange-500" },
    { value: "hard", label: "Hard", desc: "Multiply / Divide", color: "from-orange-500 to-red-500" },
    { value: "extreme", label: "Extreme", desc: "Mixed operations", color: "from-red-500 to-purple-600" },
];

export default function HomeScreen() {
    const [username, setUsername] = useState("");
    const [roomCode, setRoomCode] = useState("");
    const [difficulty, setDifficulty] = useState("easy");
    const [view, setView] = useState<"home" | "leaderboard">("home");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const setConnectionInfo = useGameStore((s) => s.setConnectionInfo);
    const router = useRouter();

    const handleCreate = async () => {
        if (!username.trim()) {
            setError("Please enter your name!");
            return;
        }
        setLoading(true);
        setError("");
        try {
            const res = await createRoom({ username: username.trim(), difficulty });
            setConnectionInfo({
                roomId: res.room_id,
                roomCode: res.room_code,
                playerId: res.player_id,
                userId: res.user_id,
                username: username.trim(),
                team: res.team as "A" | "B",
            });
            router.push(`/game/${res.room_id}`);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Failed to create room");
        } finally {
            setLoading(false);
        }
    };

    const handleJoin = async () => {
        if (!username.trim()) {
            setError("Please enter your name!");
            return;
        }
        if (!roomCode.trim()) {
            setError("Please enter a room code!");
            return;
        }
        setLoading(true);
        setError("");
        try {
            const res = await joinRoom(roomCode.trim().toUpperCase(), username.trim());
            setConnectionInfo({
                roomId: res.room_id,
                roomCode: res.room_code,
                playerId: res.player_id,
                userId: res.user_id,
                username: username.trim(),
                team: res.team as "A" | "B",
            });
            router.push(`/game/${res.room_id}`);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Failed to join room");
        } finally {
            setLoading(false);
        }
    };

    if (view === "leaderboard") {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col items-center p-6">
                <button
                    onClick={() => setView("home")}
                    className="self-start mb-4 text-white/70 hover:text-white flex items-center gap-2 text-lg transition-colors"
                >
                    ← Back
                </button>
                <Leaderboard />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4 overflow-hidden">
            {/* Background decorations */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-3xl" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="relative z-10 w-full max-w-lg"
            >
                {/* Title */}
                <div className="text-center mb-10">
                    <motion.h1
                        className="text-5xl md:text-6xl font-black bg-gradient-to-r from-blue-400 via-purple-400 to-orange-400 bg-clip-text text-transparent mb-3"
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200 }}
                    >
                        Math Rumble
                    </motion.h1>
                    <p className="text-white/50 text-lg">Tug-of-War Edition</p>
                    <div className="mt-3 flex justify-center gap-3">
                        <span className="text-3xl">🧮</span>
                        <span className="text-3xl">⚡</span>
                        <span className="text-3xl">🏆</span>
                    </div>
                </div>

                {/* Main Card */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
                    {/* Username */}
                    <div className="mb-6">
                        <label className="block text-white/70 text-sm font-medium mb-2">
                            Your Name
                        </label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Enter your name..."
                            className="w-full px-5 py-3.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/30 text-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                        />
                    </div>

                    {/* Difficulty Selector */}
                    <div className="mb-6">
                        <label className="block text-white/70 text-sm font-medium mb-3">
                            Difficulty
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {DIFFICULTIES.map((d) => (
                                <motion.button
                                    key={d.value}
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={() => setDifficulty(d.value)}
                                    className={`relative px-4 py-3 rounded-xl text-left transition-all overflow-hidden ${difficulty === d.value
                                            ? "ring-2 ring-white/40 shadow-lg"
                                            : "opacity-60 hover:opacity-80"
                                        }`}
                                >
                                    <div className={`absolute inset-0 bg-gradient-to-r ${d.color} opacity-${difficulty === d.value ? "100" : "40"}`} />
                                    <div className="relative z-10">
                                        <div className="font-bold text-white text-sm">{d.label}</div>
                                        <div className="text-white/70 text-xs">{d.desc}</div>
                                    </div>
                                </motion.button>
                            ))}
                        </div>
                    </div>

                    {/* Create Game */}
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleCreate}
                        disabled={loading}
                        className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold text-lg rounded-xl shadow-lg shadow-purple-500/25 transition-all mb-4 disabled:opacity-50"
                    >
                        {loading ? "Creating..." : "⚡ Create Game"}
                    </motion.button>

                    {/* Divider */}
                    <div className="flex items-center gap-4 mb-4">
                        <div className="flex-1 h-px bg-white/10" />
                        <span className="text-white/30 text-sm font-medium">OR JOIN</span>
                        <div className="flex-1 h-px bg-white/10" />
                    </div>

                    {/* Join Game */}
                    <div className="flex gap-3">
                        <input
                            type="text"
                            value={roomCode}
                            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                            placeholder="Room Code"
                            maxLength={6}
                            className="flex-1 px-5 py-3.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/30 text-lg tracking-widest text-center font-mono focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all"
                        />
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleJoin}
                            disabled={loading}
                            className="px-6 py-3.5 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold rounded-xl shadow-lg shadow-orange-500/25 transition-all disabled:opacity-50"
                        >
                            Join
                        </motion.button>
                    </div>

                    {/* Error */}
                    {error && (
                        <motion.p
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-4 text-red-400 text-center text-sm bg-red-500/10 py-2 px-4 rounded-lg"
                        >
                            {error}
                        </motion.p>
                    )}
                </div>

                {/* Leaderboard link */}
                <motion.button
                    onClick={() => setView("leaderboard")}
                    whileHover={{ scale: 1.02 }}
                    className="mt-6 w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white rounded-xl transition-all text-center font-medium"
                >
                    🏆 View Leaderboard
                </motion.button>
            </motion.div>
        </div>
    );
}
