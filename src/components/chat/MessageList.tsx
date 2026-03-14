import { useEffect, useRef } from "react";
import type { ChatUiMessage } from "../../hooks/useChat";

function formatTimestamp(value?: string): string {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export default function MessageList({ messages }: { messages: ChatUiMessage[] }) {
    const endRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, [messages]);

    if (messages.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center text-slate text-sm">
                Aucun message pour le moment.
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 bg-ice/35">
            {messages.map((msg) => (
                <div
                    key={msg.localId}
                    className={`max-w-[85%] rounded-2xl px-3 py-2 border ${
                        msg.direction === "out"
                            ? "ml-auto bg-teal text-white border-teal/40"
                            : "mr-auto bg-white text-navy border-navy/10"
                    }`}
                >
                    <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                    <div className={`text-[10px] mt-1 flex items-center gap-2 ${msg.direction === "out" ? "text-white/80" : "text-slate"}`}>
                        <span>{formatTimestamp(msg.createdAt)}</span>
                        {msg.pending && <span>Envoi...</span>}
                        {msg.failed && <span className="text-coral">Échec</span>}
                    </div>
                </div>
            ))}
            <div ref={endRef} />
        </div>
    );
}
