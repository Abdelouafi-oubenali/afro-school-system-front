import axios from "axios";

const BASE = import.meta.env.VITE_MESSAGE_API_URL || "/message-notification-service";

export type NotificationType = "INFO" | "ALERT" | "MESSAGE";

export interface AppNotification {
    id: string;
    userId: string;
    title: string;
    content: string;
    type: NotificationType;
    read: boolean;
    createdAt: string;
}

class NotificationService {
    private getAuthHeaders() {
        const rawToken = localStorage.getItem("token") || localStorage.getItem("accessToken");
        const token = rawToken && rawToken !== "undefined" ? rawToken.trim() : null;
        if (!token) return undefined;
        const tokenType = (localStorage.getItem("tokenType") || "Bearer").trim();
        const hasPrefix = /^(Bearer|JWT)\s+/i.test(token);
        return { Authorization: hasPrefix ? token : `${tokenType} ${token}` };
    }

    private normalizeList(raw: unknown): AppNotification[] {
        if (Array.isArray(raw)) return raw as AppNotification[];
        if (raw && typeof raw === "object") {
            const obj = raw as Record<string, unknown>;
            for (const key of ["data", "content", "items", "notifications", "result"]) {
                if (Array.isArray(obj[key])) return obj[key] as AppNotification[];
            }
        }
        return [];
    }

    async getByUserId(userId: string): Promise<AppNotification[]> {
        try {
            const response = await axios.get(
                `${BASE}/api/notifications/user/${userId}`,
                { headers: this.getAuthHeaders() }
            );
            return this.normalizeList(response.data);
        } catch (error) {
            if (axios.isAxiosError(error) && (error.response?.status === 404 || error.response?.status === 204)) {
                return [];
            }
            console.warn("[notificationService] getByUserId failed:", error);
            return [];
        }
    }

    async markAsRead(id: string): Promise<void> {
        try {
            await axios.patch(
                `${BASE}/api/notifications/${id}/read`,
                {},
                { headers: this.getAuthHeaders() }
            );
        } catch (error) {
            console.warn("[notificationService] markAsRead failed:", error);
        }
    }
}

const notificationService = new NotificationService();
export default notificationService;
