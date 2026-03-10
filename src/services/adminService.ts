import axios from "axios";

const API_URL = "http://localhost:8081/api";

export interface Admin {
    id: string;
    nom: string;
    prenom: string;
    email: string;
    phone: string;
    dateNaissance: string;
    role?: string;
}

export interface AdminCreatePayload {
    nom: string;
    prenom: string;
    email: string;
    password: string;
    phone: string;
    dateNaissance: string;
}

export interface AdminUpdatePayload {
    id?: string;
    nom: string;
    prenom: string;
    email: string;
    password: string;
    phone: string;
    dateNaissance: string;
}

class AdminService {
    private getAuthHeaders() {
        const rawToken = localStorage.getItem("token");
        const token = rawToken && rawToken !== "undefined" ? rawToken : null;
        return token ? { Authorization: `Bearer ${token}` } : undefined;
    }

    private normalizeAdminsResponse(raw: unknown): Admin[] {
        if (Array.isArray(raw)) {
            return raw as Admin[];
        }

        if (raw && typeof raw === "object") {
            const obj = raw as Record<string, unknown>;

            if (Array.isArray(obj.data)) {
                return obj.data as Admin[];
            }

            if (Array.isArray(obj.content)) {
                return obj.content as Admin[];
            }

            if (obj.result && typeof obj.result === "object") {
                const result = obj.result as Record<string, unknown>;
                if (Array.isArray(result.data)) {
                    return result.data as Admin[];
                }
                if (Array.isArray(result.content)) {
                    return result.content as Admin[];
                }
            }
        }

        return [];
    }

    async getAllAdmins(): Promise<Admin[]> {
        const candidateRoutes = ["/users/admins", "/users/admin"];
        let lastError: unknown = null;

        for (const route of candidateRoutes) {
            try {
                const response = await axios.get(`${API_URL}${route}`, {
                    headers: this.getAuthHeaders(),
                });
                return this.normalizeAdminsResponse(response.data);
            } catch (error) {
                lastError = error;

                if (!axios.isAxiosError(error)) {
                    continue;
                }

                const data = error.response?.data as
                    | { message?: string; error?: string; details?: string }
                    | string
                    | undefined;

                const backendMessage =
                    typeof data === "string"
                        ? data
                        : data?.message || data?.error || data?.details;

                const isMissingRoute =
                    error.response?.status === 404 ||
                    (typeof backendMessage === "string" && backendMessage.includes("No static resource"));

                if (!isMissingRoute) {
                    break;
                }
            }
        }

        if (axios.isAxiosError(lastError)) {
            const status = lastError.response?.status;
            const method = lastError.config?.method?.toUpperCase() || "GET";
            const url = lastError.config?.url || `${API_URL}/users/admins`;
            const data = lastError.response?.data as
                | { message?: string; error?: string; details?: string }
                | string
                | undefined;

            const backendMessage =
                typeof data === "string"
                    ? data
                    : data?.message || data?.error || data?.details;

            throw new Error(
                [
                    "Echec de chargement des admins",
                    `HTTP: ${status ?? "inconnu"}`,
                    `Route: ${method} ${url}`,
                    backendMessage ? `Backend: ${backendMessage}` : null,
                    `Routes testees: ${candidateRoutes.join(", ")}`,
                ]
                    .filter(Boolean)
                    .join(" | ")
            );
        }

        throw new Error("Echec de chargement des admins: erreur inattendue");
    }

    async createAdmin(payload: AdminCreatePayload): Promise<Admin> {
        const candidateRoutes = ["/users/admins", "/users/admin"];
        let lastError: unknown = null;

        for (const route of candidateRoutes) {
            try {
                const response = await axios.post(`${API_URL}${route}`, payload, {
                    headers: this.getAuthHeaders(),
                });
                return response.data;
            } catch (error) {
                lastError = error;

                if (!axios.isAxiosError(error)) {
                    continue;
                }

                const data = error.response?.data as
                    | { message?: string; error?: string; details?: string }
                    | string
                    | undefined;

                const backendMessage =
                    typeof data === "string"
                        ? data
                        : data?.message || data?.error || data?.details;

                const isMissingRoute =
                    error.response?.status === 404 ||
                    (typeof backendMessage === "string" && backendMessage.includes("No static resource"));

                if (!isMissingRoute) {
                    break;
                }
            }
        }

        if (axios.isAxiosError(lastError)) {
            const status = lastError.response?.status;
            const method = lastError.config?.method?.toUpperCase() || "POST";
            const url = lastError.config?.url || `${API_URL}/users/admins`;
            const data = lastError.response?.data as
                | { message?: string; error?: string; details?: string }
                | string
                | undefined;

            const backendMessage =
                typeof data === "string"
                    ? data
                    : data?.message || data?.error || data?.details;

            throw new Error(
                [
                    "Echec de creation admin",
                    `HTTP: ${status ?? "inconnu"}`,
                    `Route: ${method} ${url}`,
                    backendMessage ? `Backend: ${backendMessage}` : null,
                ]
                    .filter(Boolean)
                    .join(" | ")
            );
        }

        throw new Error("Echec de creation admin: erreur inattendue");
    }

    async updateAdmin(id: string, payload: AdminUpdatePayload): Promise<Admin> {
        try {
            const response = await axios.put(`${API_URL}/users/admins/${id}`, payload, {
                headers: this.getAuthHeaders(),
            });
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const status = error.response?.status;
                const method = error.config?.method?.toUpperCase() || "PUT";
                const url = error.config?.url || `${API_URL}/users/admins/${id}`;
                const data = error.response?.data as
                    | { message?: string; error?: string; details?: string }
                    | string
                    | undefined;

                const backendMessage =
                    typeof data === "string"
                        ? data
                        : data?.message || data?.error || data?.details;

                throw new Error(
                    [
                        "Echec de modification admin",
                        `HTTP: ${status ?? "inconnu"}`,
                        `Route: ${method} ${url}`,
                        backendMessage ? `Backend: ${backendMessage}` : null,
                    ]
                        .filter(Boolean)
                        .join(" | ")
                );
            }

            throw new Error("Echec de modification admin: erreur inattendue");
        }
    }

    async deleteAdmin(id: string): Promise<void> {
        try {
            await axios.delete(`${API_URL}/users/admins/${id}`, {
                headers: this.getAuthHeaders(),
            });
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const status = error.response?.status;
                const method = error.config?.method?.toUpperCase() || "DELETE";
                const url = error.config?.url || `${API_URL}/users/admins/${id}`;
                const data = error.response?.data as
                    | { message?: string; error?: string; details?: string }
                    | string
                    | undefined;

                const backendMessage =
                    typeof data === "string"
                        ? data
                        : data?.message || data?.error || data?.details;

                throw new Error(
                    [
                        "Echec de suppression admin",
                        `HTTP: ${status ?? "inconnu"}`,
                        `Route: ${method} ${url}`,
                        backendMessage ? `Backend: ${backendMessage}` : null,
                    ]
                        .filter(Boolean)
                        .join(" | ")
                );
            }

            throw new Error("Echec de suppression admin: erreur inattendue");
        }
    }
}

const adminService = new AdminService();

export default adminService;
