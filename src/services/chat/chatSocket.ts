import { Client, type IMessage, type StompSubscription } from "@stomp/stompjs";
import SockJS from "sockjs-client/dist/sockjs";
import type { ChatMessage, ChatSendPayload } from "./chatApi";

export type ChatConnectionStatus = "disconnected" | "connecting" | "connected" | "reconnecting";

type MessageHandler = (message: ChatMessage) => void;
type StatusHandler = (status: ChatConnectionStatus) => void;

const CHAT_WS_BASE_URL = import.meta.env.VITE_CHAT_WS_BASE_URL || "/message-notification-service";

class ChatSocketService {
    private client: Client | null = null;
    private subscription: StompSubscription | null = null;

    private parseIncomingMessage(frame: IMessage): ChatMessage | null {
        try {
            const parsed = JSON.parse(frame.body) as Partial<ChatMessage>;
            if (!parsed.senderId || !parsed.receiverId || !parsed.content) return null;
            return {
                id: parsed.id,
                senderId: parsed.senderId,
                receiverId: parsed.receiverId,
                content: parsed.content,
                createdAt: parsed.createdAt,
            };
        } catch {
            return null;
        }
    }

    get isConnected(): boolean {
        return Boolean(this.client?.connected);
    }

    connect(userId: string, onMessage: MessageHandler, onStatus: StatusHandler): void {
        this.disconnect();

        onStatus("connecting");

        const socketUrl = `${CHAT_WS_BASE_URL}/ws-chat?userId=${encodeURIComponent(userId)}`;
        const rawToken = localStorage.getItem("token") || localStorage.getItem("accessToken");
        const token = rawToken && rawToken !== "undefined" ? rawToken.trim() : "";
        const tokenType = (localStorage.getItem("tokenType") || "Bearer").trim();
        const hasPrefix = /^(Bearer|JWT)\s+/i.test(token);

        this.client = new Client({
            webSocketFactory: () => new SockJS(socketUrl),
            reconnectDelay: 5000,
            connectHeaders: token
                ? { Authorization: hasPrefix ? token : `${tokenType} ${token}` }
                : undefined,
            debug: () => undefined,
            onConnect: () => {
                onStatus("connected");
                this.subscription = this.client?.subscribe("/user/queue/messages", (frame: IMessage) => {
                    const incoming = this.parseIncomingMessage(frame);
                    if (incoming) onMessage(incoming);
                }) || null;
            },
            onStompError: () => {
                onStatus("disconnected");
            },
            onWebSocketClose: () => {
                onStatus(this.client?.active ? "reconnecting" : "disconnected");
            },
            onWebSocketError: () => {
                onStatus("disconnected");
            },
        });

        this.client.activate();
    }

    sendMessage(payload: ChatSendPayload): void {
        if (!this.client || !this.client.connected) {
            throw new Error("WebSocket non connecté");
        }

        this.client.publish({
            destination: "/app/chat.send",
            body: JSON.stringify(payload),
        });
    }

    disconnect(): void {
        if (this.subscription) {
            this.subscription.unsubscribe();
            this.subscription = null;
        }

        if (this.client) {
            this.client.deactivate();
            this.client = null;
        }
    }
}

const chatSocket = new ChatSocketService();
export default chatSocket;
