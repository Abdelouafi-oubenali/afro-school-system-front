import axios from "axios";

const API_URL = "http://localhost:8081/api";

export interface Enseignent {
    id: string;
    nom: string;
    prenom: string;
    email: string;
    phone: string;
    dateNaissance: string;
    specialite?: string | null;
    dateEmbauche?: string | null;
    role?: string;
    classe?: string | null;
    classes?: Array<string | number> | null;
    matiere?: string | null;
}

export interface EnseignentCreatePayload {
    nom: string;
    prenom: string;
    email: string;
    password: string;
    phone: string;
    dateNaissance: string;
    specialite: string;
    dateEmbauche: string;
}

export interface EnseignentUpdatePayload {
    id?: string;
    nom: string;
    prenom: string;
    email: string;
    password: string;
    phone: string;
    dateNaissance: string;
    specialite: string;
    dateEmbauche: string;
}

class EnseignentService {
    private getAuthHeaders() {
        const rawToken = localStorage.getItem("token");
        const token = rawToken && rawToken !== "undefined" ? rawToken : null;
        return token ? { Authorization: `Bearer ${token}` } : undefined;
    }

    private normalizeEnseignentsResponse(raw: unknown): Enseignent[] {
        if (Array.isArray(raw)) {
            return raw as Enseignent[];
        }

        if (raw && typeof raw === "object") {
            const obj = raw as Record<string, unknown>;

            if (Array.isArray(obj.data)) {
                return obj.data as Enseignent[];
            }

            if (Array.isArray(obj.content)) {
                return obj.content as Enseignent[];
            }

            if (obj.result && typeof obj.result === "object") {
                const result = obj.result as Record<string, unknown>;
                if (Array.isArray(result.data)) {
                    return result.data as Enseignent[];
                }
                if (Array.isArray(result.content)) {
                    return result.content as Enseignent[];
                }
            }
        }

        return [];
    }

    async getAllEnseignents(): Promise<Enseignent[]> {
        const candidateRoutes = ["/users/enseignent", "/users/enseignents", "/enseignent", "/enseignents"];
        let lastError: unknown = null;

        for (const route of candidateRoutes) {
            try {
                const response = await axios.get(`${API_URL}${route}`, {
                    headers: this.getAuthHeaders(),
                });
                return this.normalizeEnseignentsResponse(response.data);
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
            const url = lastError.config?.url || `${API_URL}/users/enseignent`;
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
                    "Echec de chargement des enseignents",
                    `HTTP: ${status ?? "inconnu"}`,
                    `Route: ${method} ${url}`,
                    backendMessage ? `Backend: ${backendMessage}` : null,
                    `Routes testees: ${candidateRoutes.join(", ")}`,
                ]
                    .filter(Boolean)
                    .join(" | ")
            );
        }

        throw new Error("Echec de chargement des enseignents: erreur inattendue");
    }

    async createEnseignent(payload: EnseignentCreatePayload): Promise<Enseignent> {
        const candidateRoutes = ["/users/enseignent", "/users/enseignents", "/enseignent", "/enseignents"];
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
            const url = lastError.config?.url || `${API_URL}/users/enseignent`;
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
                    "Echec de creation enseignent",
                    `HTTP: ${status ?? "inconnu"}`,
                    `Route: ${method} ${url}`,
                    backendMessage ? `Backend: ${backendMessage}` : null,
                ]
                    .filter(Boolean)
                    .join(" | ")
            );
        }

        throw new Error("Echec de creation enseignent: erreur inattendue");
    }

    async updateEnseignent(id: string, payload: EnseignentUpdatePayload): Promise<Enseignent> {
        try {
            const response = await axios.put(`${API_URL}/users/enseignent/${id}`, payload, {
                headers: this.getAuthHeaders(),
            });
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const status = error.response?.status;
                const method = error.config?.method?.toUpperCase() || "PUT";
                const url = error.config?.url || `${API_URL}/users/enseignent/${id}`;
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
                        "Echec de modification enseignent",
                        `HTTP: ${status ?? "inconnu"}`,
                        `Route: ${method} ${url}`,
                        backendMessage ? `Backend: ${backendMessage}` : null,
                    ]
                        .filter(Boolean)
                        .join(" | ")
                );
            }

            throw new Error("Echec de modification enseignent: erreur inattendue");
        }
    }

    async deleteEnseignent(id: string): Promise<void> {
        try {
            await axios.delete(`${API_URL}/users/enseignent/${id}`, {
                headers: this.getAuthHeaders(),
            });
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const status = error.response?.status;
                const method = error.config?.method?.toUpperCase() || "DELETE";
                const url = error.config?.url || `${API_URL}/users/enseignent/${id}`;
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
                        "Echec de suppression enseignent",
                        `HTTP: ${status ?? "inconnu"}`,
                        `Route: ${method} ${url}`,
                        backendMessage ? `Backend: ${backendMessage}` : null,
                    ]
                        .filter(Boolean)
                        .join(" | ")
                );
            }

            throw new Error("Echec de suppression enseignent: erreur inattendue");
        }
    }
}

const enseignentService = new EnseignentService();

export default enseignentService;
