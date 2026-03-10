import axios from "axios";

const API_URL = "http://localhost:8081/api";

export interface Parent {
    id: string;
    nom: string;
    prenom: string;
    email: string;
    phone: string;
    dateNaissance: string;
    role?: string;
    childIds?: string[];
    children?: unknown[] | null;
}

export interface ParentCreatePayload {
    nom: string;
    prenom: string;
    email: string;
    password: string;
    phone: string;
    dateNaissance: string;
    childIds: string[];
}

export interface ParentUpdatePayload {
    id?: string;
    nom: string;
    prenom: string;
    email: string;
    password: string;
    phone: string;
    dateNaissance: string;
    childIds: string[];
}

class ParentService {
    private getAuthHeaders() {
        const rawToken = localStorage.getItem("token");
        const token = rawToken && rawToken !== "undefined" ? rawToken : null;
        return token ? { Authorization: `Bearer ${token}` } : undefined;
    }

    private normalizeParentsResponse(raw: unknown): Parent[] {
        if (Array.isArray(raw)) return raw as Parent[];

        if (raw && typeof raw === "object") {
            const obj = raw as Record<string, unknown>;
            if (Array.isArray(obj.data)) return obj.data as Parent[];
            if (Array.isArray(obj.content)) return obj.content as Parent[];
            if (obj.result && typeof obj.result === "object") {
                const result = obj.result as Record<string, unknown>;
                if (Array.isArray(result.data)) return result.data as Parent[];
                if (Array.isArray(result.content)) return result.content as Parent[];
            }
        }

        return [];
    }

    async getAllParents(): Promise<Parent[]> {
        const candidateRoutes = ["/users/parent", "/users/parents", "/parent", "/parents"];
        let lastError: unknown = null;

        for (const route of candidateRoutes) {
            try {
                const response = await axios.get(`${API_URL}${route}`, {
                    headers: this.getAuthHeaders(),
                });
                return this.normalizeParentsResponse(response.data);
            } catch (error) {
                lastError = error;

                if (!axios.isAxiosError(error)) continue;

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

                if (!isMissingRoute) break;
            }
        }

        if (axios.isAxiosError(lastError)) {
            const status = lastError.response?.status;
            const method = lastError.config?.method?.toUpperCase() || "GET";
            const url = lastError.config?.url || `${API_URL}/users/parent`;
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
                    "Echec de chargement des parents",
                    `HTTP: ${status ?? "inconnu"}`,
                    `Route: ${method} ${url}`,
                    backendMessage ? `Backend: ${backendMessage}` : null,
                    `Routes testees: ${candidateRoutes.join(", ")}`,
                ]
                    .filter(Boolean)
                    .join(" | ")
            );
        }

        throw new Error("Echec de chargement des parents: erreur inattendue");
    }

    async createParent(payload: ParentCreatePayload): Promise<Parent> {
        const candidateRoutes = ["/users/parent", "/users/parents", "/parent", "/parents"];
        let lastError: unknown = null;

        for (const route of candidateRoutes) {
            try {
                const response = await axios.post(`${API_URL}${route}`, payload, {
                    headers: this.getAuthHeaders(),
                });
                return response.data;
            } catch (error) {
                lastError = error;

                if (!axios.isAxiosError(error)) continue;

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

                if (!isMissingRoute) break;
            }
        }

        if (axios.isAxiosError(lastError)) {
            const status = lastError.response?.status;
            const method = lastError.config?.method?.toUpperCase() || "POST";
            const url = lastError.config?.url || `${API_URL}/users/parent`;
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
                    "Echec de creation parent",
                    `HTTP: ${status ?? "inconnu"}`,
                    `Route: ${method} ${url}`,
                    backendMessage ? `Backend: ${backendMessage}` : null,
                ]
                    .filter(Boolean)
                    .join(" | ")
            );
        }

        throw new Error("Echec de creation parent: erreur inattendue");
    }

    async updateParent(id: string, payload: ParentUpdatePayload): Promise<Parent> {
        try {
            const response = await axios.put(`${API_URL}/users/parent/${id}`, payload, {
                headers: this.getAuthHeaders(),
            });
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const status = error.response?.status;
                const method = error.config?.method?.toUpperCase() || "PUT";
                const url = error.config?.url || `${API_URL}/users/parent/${id}`;
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
                        "Echec de modification parent",
                        `HTTP: ${status ?? "inconnu"}`,
                        `Route: ${method} ${url}`,
                        backendMessage ? `Backend: ${backendMessage}` : null,
                    ]
                        .filter(Boolean)
                        .join(" | ")
                );
            }

            throw new Error("Echec de modification parent: erreur inattendue");
        }
    }

    async deleteParent(id: string): Promise<void> {
        try {
            await axios.delete(`${API_URL}/users/parent/${id}`, {
                headers: this.getAuthHeaders(),
            });
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const status = error.response?.status;
                const method = error.config?.method?.toUpperCase() || "DELETE";
                const url = error.config?.url || `${API_URL}/users/parent/${id}`;
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
                        "Echec de suppression parent",
                        `HTTP: ${status ?? "inconnu"}`,
                        `Route: ${method} ${url}`,
                        backendMessage ? `Backend: ${backendMessage}` : null,
                    ]
                        .filter(Boolean)
                        .join(" | ")
                );
            }

            throw new Error("Echec de suppression parent: erreur inattendue");
        }
    }
}

const parentService = new ParentService();

export default parentService;
