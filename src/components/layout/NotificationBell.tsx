import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../hooks/useNotifications";
import type { AppNotification } from "../../services/user/notificationService";

function relativeTime(isoDate: string): string {
    const diff = Date.now() - new Date(isoDate).getTime();
    if (isNaN(diff) || diff < 0) return "";
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return "À l'instant";
    if (mins < 60) return `${mins} min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} h`;
    const days = Math.floor(hrs / 24);
    return `${days} j`;
}

const TYPE_STYLES: Record<AppNotification["type"], { dot: string; border: string; badge: string }> = {
    ALERT: {
        dot: "bg-red-500",
        border: "border-l-red-400",
        badge: "bg-red-100 text-red-700",
    },
    MESSAGE: {
        dot: "bg-blue-500",
        border: "border-l-blue-400",
        badge: "bg-blue-100 text-blue-700",
    },
    INFO: {
        dot: "bg-teal-500",
        border: "border-l-teal-400",
        badge: "bg-teal-100 text-teal-700",
    },
};

export default function NotificationBell() {
    const { user } = useAuth();
    const { notifications, unreadCount, markAsRead, loading } = useNotifications(user?.id ?? null);
    const [open, setOpen] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);

    // Close dropdown on outside click
    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [open]);

    const handleItemClick = async (notif: AppNotification) => {
        if (!notif.read) await markAsRead(notif.id);
    };

    return (
        <div className="relative" ref={panelRef}>
            {/* Bell button */}
            <button
                id="notification-bell-btn"
                aria-label="Notifications"
                onClick={() => setOpen((v) => !v)}
                className="relative p-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all border border-transparent hover:border-indigo-100"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1 border-2 border-white shadow-sm animate-pulse">
                        {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {open && (
                <div
                    id="notification-dropdown"
                    className="absolute right-0 mt-3 w-[340px] bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50"
                    style={{ animation: "fadeInDown 0.15s ease" }}
                >
                    {/* Header */}
                    <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-bold text-slate-800">Notifications</h3>
                            {unreadCount > 0 && (
                                <p className="text-xs text-slate-400 mt-0.5">{unreadCount} non lue{unreadCount > 1 ? "s" : ""}</p>
                            )}
                        </div>
                        {loading && (
                            <svg className="animate-spin w-4 h-4 text-slate-300" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                        )}
                    </div>

                    {/* List */}
                    <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-50">
                        {notifications.length === 0 && !loading ? (
                            <div className="py-12 text-center">
                                <svg className="w-10 h-10 text-slate-200 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                </svg>
                                <p className="text-sm text-slate-400 font-medium">Aucune notification</p>
                            </div>
                        ) : (
                            notifications.map((notif) => {
                                const styles = TYPE_STYLES[notif.type] ?? TYPE_STYLES.INFO;
                                return (
                                    <button
                                        key={notif.id}
                                        onClick={() => void handleItemClick(notif)}
                                        className={`w-full text-left px-5 py-3.5 flex gap-3 items-start transition-colors border-l-4 ${notif.read
                                                ? "bg-white hover:bg-slate-50 border-l-transparent"
                                                : `bg-slate-50/70 hover:bg-slate-100/70 ${styles.border}`
                                            }`}
                                    >
                                        {/* Dot */}
                                        <span className="mt-1.5 flex-shrink-0">
                                            <span
                                                className={`block w-2 h-2 rounded-full ${notif.read ? "bg-slate-200" : styles.dot
                                                    }`}
                                            />
                                        </span>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2 mb-0.5">
                                                <p className={`text-sm font-semibold leading-tight truncate ${notif.read ? "text-slate-600" : "text-slate-800"}`}>
                                                    {notif.title}
                                                </p>
                                                <span className="flex-shrink-0 text-[10px] text-slate-400 font-medium mt-0.5">
                                                    {relativeTime(notif.createdAt)}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                                                {notif.content}
                                            </p>
                                            <span className={`inline-flex items-center mt-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${styles.badge}`}>
                                                {notif.type}
                                            </span>
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            )}

            <style>{`
                @keyframes fadeInDown {
                    from { opacity: 0; transform: translateY(-8px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
