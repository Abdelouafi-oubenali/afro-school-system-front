import type { ChatConnectionStatus } from "../../services/chat/chatSocket";

const STATUS_STYLE: Record<ChatConnectionStatus, { label: string; className: string }> = {
    disconnected: { label: "Déconnecté", className: "bg-coral/12 text-coral border-coral/20" },
    connecting: { label: "Connexion...", className: "bg-gold/12 text-gold border-gold/25" },
    connected: { label: "Connecté", className: "bg-teal/12 text-teal border-teal/20" },
    reconnecting: { label: "Reconnexion...", className: "bg-gold/12 text-gold border-gold/25" },
};

export default function ConnectionBadge({ status }: { status: ChatConnectionStatus }) {
    const style = STATUS_STYLE[status];

    return (
        <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${style.className}`}>
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {style.label}
        </span>
    );
}
