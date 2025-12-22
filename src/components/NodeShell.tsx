import React, { useState, useRef, useEffect } from "react";
import { queryNode } from "../api/client";

interface NodeShellProps {
    endpoint: string;
    onClose: () => void;
    isDark: boolean;
}

const COMMANDS = [
    { cmd: "help", desc: "Show available commands" },
    { cmd: "query-node <get-stats|get-pods|get-pods-with-stats|get-version>", desc: "Query the node with a specific argument" },
    { cmd: "clear", desc: "Clear the shell output" },
    { cmd: "exit", desc: "Terminate session" }
];

const ALLOWED_ARGS = [
    "get-stats",
    "get-pods",
    "get-pods-with-stats",
    "get-version"
];
type ShellLine = string | { type: "json", value: string };

export const NodeShell: React.FC<NodeShellProps> = ({ endpoint, onClose, isDark }) => {
    const [lines, setLines] = useState<ShellLine[]>([
        `Connected to ${endpoint}`,
        `Type 'help' for available commands.`
    ]);
    const [input, setInput] = useState("");
    const [history, setHistory] = useState<string[]>([]);
    const [, setHistoryIndex] = useState<number | null>(null);
    const shellRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        shellRef.current?.scrollTo(0, shellRef.current.scrollHeight);
    }, [lines]);

    const handleCommand = async (cmd: string) => {
        if (cmd === "help") {
            setLines((prev) => [
                ...prev,
                ...COMMANDS.map(c => `${c.cmd} - ${c.desc}`)
            ]);
        } else if (cmd.startsWith("query-node")) {
            const arg = cmd.slice("query-node".length).trim();
            if (!arg) {
                setLines((prev) => [
                    ...prev,
                    `Error: query-node requires one of: ${ALLOWED_ARGS.join(", ")}`
                ]);
                return;
            }
            if (!ALLOWED_ARGS.includes(arg)) {
                setLines((prev) => [
                    ...prev,
                    `Error: Invalid argument "${arg}". Allowed: ${ALLOWED_ARGS.join(", ")}`
                ]);
                return;
            }
            setLines((prev) => [
                ...prev,
                `Querying node: "${arg}" ...`
            ]);
            try {
                const data = await queryNode(arg, endpoint);
                const formatted = JSON.stringify(data, null, 2);
                setLines((prev) => [
                    ...prev,
                    { type: "json", value: formatted }
                ]);
            } catch (err: any) {
                setLines((prev) => [
                    ...prev,
                    err.message
                ]);
            }
        } else if (cmd === "clear") {
            setLines([]);
        } else if (cmd === "exit") {
            setLines((prev) => [
                ...prev,
                "Exiting shell. Connection closed."
            ]);
            setTimeout(() => {
                onClose();
            }, 800);
        } else {
            setLines((prev) => [
                ...prev,
                `Unknown command: ${cmd}`
            ]);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim()) {
            setLines((prev) => [...prev, `> ${input}`]);
            handleCommand(input.trim());
            // Update history (max 20)
            setHistory(prev => {
                const newHistory = [input.trim(), ...prev.filter(h => h !== input.trim())];
                return newHistory.slice(0, 20);
            });
            setHistoryIndex(null);
            setInput("");
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "ArrowUp") {
            if (history.length === 0) return;
            setHistoryIndex(prev => {
                const nextIndex = prev === null ? 0 : Math.min(prev + 1, history.length - 1);
                setInput(history[nextIndex]);
                return nextIndex;
            });
            e.preventDefault();
        } else if (e.key === "ArrowDown") {
            setHistoryIndex(prev => {
                if (prev === null) return null;
                const nextIndex = prev - 1;
                if (nextIndex >= 0) {
                    setInput(history[nextIndex]);
                    return nextIndex;
                } else {
                    setInput("");
                    return null;
                }
            });
            e.preventDefault();
        } else if ((e.ctrlKey || e.metaKey) && (e.key === "l" || e.key === "L")) {
            // Ctrl+L clears the console
            setLines([]);
            e.preventDefault();
        }
    };

    return (
        <div className={`fixed right-0 top-0 h-full w-[420px] z-50 bg-gradient-to-b ${isDark ? "from-gray-900/95 to-gray-950/95" : "from-white/95 to-gray-50/95"} shadow-2xl border-l ${isDark ? "border-gray-800/80" : "border-gray-200/80"} flex flex-col animate-slide-in`}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700/30">
                <div className="flex items-center gap-2">
                    <span className="text-green-400 font-bold">Node Shell</span>
                    <span className="text-xs text-gray-400">({endpoint})</span>
                </div>
                <button
                    className="text-gray-400 hover:text-red-400 transition"
                    onClick={onClose}
                    title="Close shell"
                >
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
            <div ref={shellRef} className={`flex-1 px-6 py-4 overflow-y-auto font-mono text-xs ${isDark ? "text-gray-200" : "text-gray-800"}`}>
                {lines.map((line, idx) =>
                    typeof line === "string" ? (
                        <div key={idx}>{line}</div>
                    ) : (
                        <pre key={idx} style={{ margin: 0, whiteSpace: "pre-wrap" }}>{line.value}</pre>
                    )
                )}
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-4 border-t border-gray-700/30 flex items-center gap-2">
                <span className="text-green-400">$</span>
                <input
                    className={`flex-1 bg-transparent outline-none ${isDark ? "text-white" : "text-gray-900"} px-2`}
                    value={input}
                    onChange={e => {
                        setInput(e.target.value);
                        setHistoryIndex(null);
                    }}
                    autoFocus
                    spellCheck={false}
                    placeholder="Type a command..."
                    onKeyDown={handleKeyDown}
                />
                <button
                    type="submit"
                    className="px-3 py-1 rounded bg-green-500 text-white text-xs font-semibold hover:bg-green-600 transition"
                >
                    Run
                </button>
            </form>
        </div>
    );
};

export default NodeShell;