import { useCallback, useEffect, useRef, useState } from "react";
import { Client, type IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client/dist/sockjs";
import notificationService, { type AppNotification } from "../services/user/notificationService";
import eleveService from "../services/user/eleveService";

const CHAT_WS_BASE_URL = import.meta.env.VITE_CHAT_WS_BASE_URL || "/message-notification-service";
const UUID_REGEX = /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi;

function replaceEleveIdsWithNames(text: string, eleveNameById: Record<string, string>): string {
    if (!text) return text;
    return text.replace(UUID_REGEX, (id) => eleveNameById[id.toLowerCase()] || id);
}

function normalizeNotification(
    raw: Record<string, unknown>,
    fallbackUserId: string,
    eleveNameById: Record<string, string>
): AppNotification {
    const title = String(raw.title ?? "Notification");
    const content = String(raw.content ?? "");

    return {
        id: String(raw.id ?? `tmp-${Date.now()}`),
        userId: String(raw.userId ?? fallbackUserId),
        title: replaceEleveIdsWithNames(title, eleveNameById),
        content: replaceEleveIdsWithNames(content, eleveNameById),
        type: (raw.type as AppNotification["type"]) ?? "INFO",
        read: Boolean(raw.read ?? false),
        createdAt: String(raw.createdAt ?? new Date().toISOString()),
    };
}

export function useNotifications(userId: string | null) {
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [loading, setLoading] = useState(false);
    const [eleveNameById, setEleveNameById] = useState<Record<string, string>>({});
    const mountedRef = useRef(true);

    useEffect(() => {
        if (!userId) {
            setEleveNameById({});
            return;
        }

        let cancelled = false;

        eleveService
            .getAllEleves()
            .then((eleves) => {
                if (cancelled) return;
                const next: Record<string, string> = {};
                for (const eleve of eleves) {
                    const id = String(eleve.id || "").toLowerCase();
                    if (!id) continue;
                    const fullName = `${eleve.prenom || ""} ${eleve.nom || ""}`.trim();
                    next[id] = fullName || String(eleve.id);
                }
                setEleveNameById(next);
            })
            .catch(() => {
                if (!cancelled) setEleveNameById({});
            });

        return () => {
            cancelled = true;
        };
    }, [userId]);

    // Load history from REST on mount / userId change
    useEffect(() => {
        mountedRef.current = true;
        if (!userId) {
            setNotifications([]);
            return;
        }

        setLoading(true);
        notificationService
            .getByUserId(userId)
            .then((data) => {
                if (!mountedRef.current) return;
                const hydrated = data.map((notif) =>
                    normalizeNotification(notif as unknown as Record<string, unknown>, userId, eleveNameById)
                );
                // Sort newest first
                const sorted = [...hydrated].sort(
                    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                );
                setNotifications(sorted);
            })
            .finally(() => {
                if (mountedRef.current) setLoading(false);
            });

        return () => {
            mountedRef.current = false;
        };
    }, [userId, eleveNameById]);

    useEffect(() => {
        if (Object.keys(eleveNameById).length === 0) return;
        setNotifications((prev) =>
            prev.map((notif) => ({
                ...notif,
                title: replaceEleveIdsWithNames(notif.title, eleveNameById),
                content: replaceEleveIdsWithNames(notif.content, eleveNameById),
            }))
        );
    }, [eleveNameById]);

  
    useEffect(() => {
        if (!userId) return;
        const rawToken = localStorage.getItem("token") || localStorage.getItem("accessToken");
        const token = rawToken && rawToken !== "undefined" ? rawToken.trim() : "";
        const tokenType = (localStorage.getItem("tokenType") || "Bearer").trim();
        const hasPrefix = /^(Bearer|JWT)\s+/i.test(token);

        const socketUrl = `${CHAT_WS_BASE_URL}/ws-chat?userId=${encodeURIComponent(userId)}`;

        const client = new Client({
            webSocketFactory: () => new SockJS(socketUrl),
            reconnectDelay: 5000,
            connectHeaders: token
                ? { Authorization: hasPrefix ? token : `${tokenType} ${token}` }
                : undefined,
            debug: () => undefined,
            onConnect: () => {
                client.subscribe("/user/queue/notifications", (frame: IMessage) => {
                    try {
                        const raw = JSON.parse(frame.body) as Record<string, unknown>;
                        const notif = normalizeNotification(raw, userId, eleveNameById);

                        setNotifications((prev) => {
                            const alreadyExists = prev.some((n) => n.id === notif.id);
                            if (alreadyExists) return prev;
                            return [notif, ...prev];
                        });
                    } catch {
                        // ignore malformed frames
                    }
                });
            },
        });

        client.activate();

        return () => {
            void client.deactivate();
        };
    }, [userId, eleveNameById]);

    const markAsRead = useCallback(async (id: string) => {
        // Optimistic update
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
        await notificationService.markAsRead(id);
    }, []);

    const unreadCount = notifications.filter((n) => !n.read).length;

    return { notifications, unreadCount, markAsRead, loading };
}
