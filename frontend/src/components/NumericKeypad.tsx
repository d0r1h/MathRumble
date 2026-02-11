"use client";

import { motion } from "framer-motion";

interface NumericKeypadProps {
    value: string;
    onChange: (value: string) => void;
    onSubmit: () => void;
    disabled?: boolean;
    teamColor: string;
}

export default function NumericKeypad({
    value,
    onChange,
    onSubmit,
    disabled = false,
    teamColor,
}: NumericKeypadProps) {
    const handleKey = (key: string) => {
        if (disabled) return;
        if (key === "⌫") {
            onChange(value.slice(0, -1));
        } else if (key === "±") {
            if (value.startsWith("-")) {
                onChange(value.slice(1));
            } else {
                onChange("-" + value);
            }
        } else if (key === ".") {
            if (!value.includes(".")) {
                onChange(value + ".");
            }
        } else {
            onChange(value + key);
        }
    };

    const keys = [
        ["7", "8", "9"],
        ["4", "5", "6"],
        ["1", "2", "3"],
        ["±", "0", "."],
    ];

    const isBlue = teamColor === "blue";

    return (
        <div className="w-full max-w-[280px] mx-auto">
            {/* Display */}
            <div
                className={`mb-3 px-4 py-3 rounded-xl text-center text-2xl font-mono font-bold
        ${isBlue ? "bg-blue-500/20 text-blue-100 border border-blue-500/30" : "bg-orange-500/20 text-orange-100 border border-orange-500/30"}
        min-h-[52px] flex items-center justify-center`}
            >
                {value || <span className="text-white/20">?</span>}
            </div>

            {/* Keys */}
            <div className="grid grid-cols-3 gap-2 mb-3">
                {keys.flat().map((key) => (
                    <motion.button
                        key={key}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleKey(key)}
                        disabled={disabled}
                        className={`py-3 rounded-xl text-xl font-bold transition-all
              ${isBlue
                                ? "bg-blue-500/20 hover:bg-blue-500/30 text-blue-100 border border-blue-500/20"
                                : "bg-orange-500/20 hover:bg-orange-500/30 text-orange-100 border border-orange-500/20"
                            }
              disabled:opacity-30 disabled:cursor-not-allowed
              active:scale-95`}
                    >
                        {key}
                    </motion.button>
                ))}
            </div>

            {/* Action Row */}
            <div className="grid grid-cols-2 gap-2">
                <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleKey("⌫")}
                    disabled={disabled}
                    className="py-3 rounded-xl text-lg font-bold bg-white/10 hover:bg-white/20 text-white/70 border border-white/10 transition-all disabled:opacity-30"
                >
                    ⌫
                </motion.button>
                <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={onSubmit}
                    disabled={disabled || !value}
                    className={`py-3 rounded-xl text-lg font-bold transition-all shadow-lg
            ${isBlue
                            ? "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-blue-500/25"
                            : "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-orange-500/25"
                        }
            text-white disabled:opacity-30 disabled:cursor-not-allowed`}
                >
                    Submit ✓
                </motion.button>
            </div>
        </div>
    );
}
