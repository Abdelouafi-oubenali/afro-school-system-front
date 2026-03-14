import ConnectionBadge from "./ConnectionBadge";
import type { ChatConnectionStatus } from "../../services/chat/chatSocket";
import type { ChatConversation } from "../../hooks/useChat";

export default function ChatHeader({
    activeConversation,
    status,
    onRefresh,
    onBack,
}: {
    activeConversation: ChatConversation | null;
    status: ChatConnectionStatus;
    onRefresh: () => void;
    onBack?: () => void;
}) {
    return (
        <header className="border-b border-navy/10 px-4 py-3 flex items-center justify-between gap-3 bg-white">
            <div className="flex items-center gap-2 min-w-0">
                {onBack && (
                    <button
                        type="button"
                        onClick={onBack}
                        className="md:hidden w-8 h-8 rounded-lg border border-navy/15 text-navy hover:bg-ice"
                        aria-label="Retour aux conversations"
                    >
                        ←
                    </button>
                )}
                <div className="min-w-0">
                    <p className="text-sm font-semibold text-navy truncate">{activeConversation?.name || "Sélectionnez une conversation"}</p>
                    <p className="text-xs text-slate truncate">{activeConversation?.role || "Chat interne"}</p>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <ConnectionBadge status={status} />
                <button
                    type="button"
                    onClick={onRefresh}
                    className="px-3 py-1.5 rounded-lg border border-navy/15 text-xs font-semibold text-navy hover:bg-ice"
                >
                    Actualiser
                </button>
            </div>
        </header>
    );
}
