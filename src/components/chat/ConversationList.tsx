import type { ChatConversation } from "../../hooks/useChat";

function formatTime(value?: string): string {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

export default function ConversationList({
    conversations,
    activeConversationId,
    onSelect,
}: {
    conversations: ChatConversation[];
    activeConversationId: string | null;
    onSelect: (conversationId: string) => void;
}) {
    if (conversations.length === 0) {
        return <p className="text-sm text-slate px-3 py-4">Aucune conversation disponible.</p>;
    }

    return (
        <ul className="space-y-1 p-2">
            {conversations.map((conversation) => {
                const isActive = conversation.id === activeConversationId;
                return (
                    <li key={conversation.id}>
                        <button
                            type="button"
                            onClick={() => onSelect(conversation.id)}
                            className={`w-full text-left rounded-xl px-3 py-2.5 border transition-colors ${
                                isActive
                                    ? "border-teal/30 bg-teal/10"
                                    : "border-transparent hover:bg-ice"
                            }`}
                        >
                            <div className="flex items-center justify-between gap-2">
                                <p className="text-sm font-semibold text-navy truncate">{conversation.name}</p>
                                <span className="text-[11px] text-slate">{formatTime(conversation.lastMessageAt)}</span>
                            </div>
                            <p className="text-xs text-slate mt-0.5 truncate">{conversation.lastMessage}</p>
                            <div className="flex items-center justify-between mt-1.5">
                                <span className="text-[10px] text-slate uppercase tracking-wide">{conversation.role || "Utilisateur"}</span>
                                {conversation.unreadCount > 0 && (
                                    <span className="min-w-5 h-5 px-1.5 rounded-full bg-coral text-white text-[10px] font-bold inline-flex items-center justify-center">
                                        {conversation.unreadCount}
                                    </span>
                                )}
                            </div>
                        </button>
                    </li>
                );
            })}
        </ul>
    );
}
