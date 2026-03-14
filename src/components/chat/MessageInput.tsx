import { useState } from "react";

export default function MessageInput({
    disabled,
    onSend,
}: {
    disabled?: boolean;
    onSend: (content: string) => Promise<void> | void;
}) {
    const [content, setContent] = useState("");

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = content.trim();
        if (!trimmed || disabled) return;
        await onSend(trimmed);
        setContent("");
    };

    return (
        <form onSubmit={submit} className="border-t border-navy/10 bg-white p-3 flex items-end gap-2">
            <label htmlFor="chat-message-input" className="sr-only">Message</label>
            <textarea
                id="chat-message-input"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={2}
                placeholder="Écrire un message..."
                className="flex-1 resize-none rounded-xl border border-navy/10 bg-ice/35 px-3 py-2 text-sm text-navy outline-none focus:border-teal"
                disabled={disabled}
            />
            <button
                type="submit"
                disabled={disabled || !content.trim()}
                className="px-4 py-2.5 rounded-xl nav-active text-white text-sm font-semibold disabled:opacity-60"
            >
                Envoyer
            </button>
        </form>
    );
}
