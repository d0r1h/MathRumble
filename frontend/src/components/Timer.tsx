"use client";

import { motion } from "framer-motion";

interface TimerProps {
    time: number;
    maxTime: number;
}

export default function Timer({ time, maxTime }: TimerProps) {
    const percentage = (time / maxTime) * 100;
    const radius = 45;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    // Color based on time remaining
    const getColor = () => {
        if (percentage > 60) return { stroke: "#22c55e", glow: "0 0 20px rgba(34, 197, 94, 0.4)" };
        if (percentage > 30) return { stroke: "#eab308", glow: "0 0 20px rgba(234, 179, 8, 0.4)" };
        return { stroke: "#ef4444", glow: "0 0 20px rgba(239, 68, 68, 0.5)" };
    };

    const color = getColor();

    return (
        <div className="relative w-28 h-28 mx-auto">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                {/* Background circle */}
                <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    fill="none"
                    stroke="rgba(255,255,255,0.08)"
                    strokeWidth="6"
                />
                {/* Progress circle */}
                <motion.circle
                    cx="50"
                    cy="50"
                    r={radius}
                    fill="none"
                    stroke={color.stroke}
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                    style={{ filter: color.glow }}
                />
            </svg>
            {/* Time text */}
            <div className="absolute inset-0 flex items-center justify-center">
                <motion.span
                    key={time}
                    initial={{ scale: 1.1 }}
                    animate={{ scale: 1 }}
                    className={`text-3xl font-bold tabular-nums ${percentage > 60
                            ? "text-green-400"
                            : percentage > 30
                                ? "text-yellow-400"
                                : "text-red-400"
                        }`}
                >
                    {time}
                </motion.span>
            </div>
            {/* Pulse ring when low */}
            {time <= 10 && time > 0 && (
                <motion.div
                    className="absolute inset-0 rounded-full border-2 border-red-500"
                    animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0, 0.6] }}
                    transition={{ duration: 1, repeat: Infinity }}
                />
            )}
        </div>
    );
}
