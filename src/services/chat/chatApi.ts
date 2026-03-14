import axios from "axios";

const CHAT_API_BASE_URL = import.meta.env.VITE_MESSAGE_API_URL || "/message-notification-service";

export interface ChatMessage {
    id?: string;
    senderId: string;
    receiverId: string;
    content: string;
    createdAt?: string;
}

export interface ChatSendPayload {
    senderId: string;
    receiverId: string;
    content: string;
}

class ChatApiService {
    private getAuthHeaders() {
        const rawToken = localStorage.getItem("token") || localStorage.getItem("accessToken");
        const token = rawToken && rawToken !== "undefined" ? rawToken.trim() : null;
        if (!token) return undefined;
        const tokenType = (localStorage.getItem("tokenType") || "Bearer").trim();
        const hasPrefix = /^(Bearer|JWT)\s+/i.test(token);
        return { Authorization: hasPrefix ? token : `${tokenType} ${token}` };
    }

    private normalizeMessage(raw: unknown): ChatMessage | null {
        if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
        const obj = raw as Record<string, unknown>;

        const senderId = typeof obj.senderId === "string" ? obj.senderId : "";
        const receiverId = typeof obj.receiverId === "string" ? obj.receiverId : "";
        const content = typeof obj.content === "string" ? obj.content : "";

        if (!senderId || !receiverId || !content) return null;

        return {
            id: typeof obj.id === "string" ? obj.id : undefined,
            senderId,
            receiverId,
            content,
            createdAt: typeof obj.createdAt === "string" ? obj.createdAt : undefined,
        };
    }

    private normalizeMessageList(raw: unknown): ChatMessage[] {
        if (Array.isArray(raw)) {
            return raw
                .map((item) => this.normalizeMessage(item))
                .filter((item): item is ChatMessage => item !== null);
        }

        if (raw && typeof raw === "object" && !Array.isArray(raw)) {
            const obj = raw as Record<string, unknown>;
            for (const key of ["data", "content", "items", "messages", "result"]) {
                if (Array.isArray(obj[key])) {
                    return this.normalizeMessageList(obj[key]);
                }
            }
        }

        return [];
    }

    private buildError(label: string, error: unknown): Error {
        if (axios.isAxiosError(error)) {
            const status = error.response?.status;
            const url = error.config?.url || "";
            const raw = error.response?.data as { message?: string; error?: string } | string | undefined;
            const msg = typeof raw === "string" ? raw : raw?.message || raw?.error;
            return new Error(
                [label, `HTTP: ${status ?? "inconnu"}`, `Route: ${url}`, msg ? `Backend: ${msg}` : null]
                    .filter(Boolean)
                    .join(" | ")
            );
        }

        return error instanceof Error ? error : new Error(label);
    }

    private isNotFound(error: unknown): boolean {
        return axios.isAxiosError(error) && error.response?.status === 404;
    }

    async getMessagesBySender(senderId: string): Promise<ChatMessage[]> {
        try {
            const response = await axios.get(`${CHAT_API_BASE_URL}/api/messages/sender/${senderId}`, {
                headers: this.getAuthHeaders(),
            });
            return this.normalizeMessageList(response.data);
        } catch (error) {
            if (this.isNotFound(error)) {
                return [];
            }
            throw this.buildError("Echec de chargement des messages envoyes", error);
        }
    }

    async getMessagesByReceiver(receiverId: string): Promise<ChatMessage[]> {
        try {
            const response = await axios.get(`${CHAT_API_BASE_URL}/api/messages/receiver/${receiverId}`, {
                headers: this.getAuthHeaders(),
            });
            return this.normalizeMessageList(response.data);
        } catch (error) {
            if (this.isNotFound(error)) {
                return [];
            }
            throw this.buildError("Echec de chargement des messages recus", error);
        }
    }

    async createMessage(payload: ChatSendPayload): Promise<ChatMessage> {
        try {
            const response = await axios.post(`${CHAT_API_BASE_URL}/api/messages`, payload, {
                headers: this.getAuthHeaders(),
            });
            const message = this.normalizeMessage(response.data);
            if (!message) {
                return {
                    senderId: payload.senderId,
                    receiverId: payload.receiverId,
                    content: payload.content,
                    createdAt: new Date().toISOString(),
                };
            }
            return message;
        } catch (error) {
            throw this.buildError("Echec d'envoi du message", error);
        }
    }
}

const chatApi = new ChatApiService();
export default chatApi;
