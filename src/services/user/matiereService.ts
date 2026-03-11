import axios from "axios";

const API_URL = import.meta.env.VITE_MATIERE_API_URL || "/class-service/api/matieres";

export interface Matiere {
    id: string;
    nom: string;
    description?: string | null;
    coefficient: number;
    estActif: boolean;
}

export interface MatiereCreatePayload {
    nom: string;
    description?: string;
    coefficient: number;
    estActif: boolean;
}

export interface MatiereUpdatePayload {
    id?: string;
    nom: string;
    description?: string;
    coefficient: number;
    estActif: boolean;
}

class MatiereService {
    private getAuthHeaders() {
        const rawToken = localStorage.getItem("token") || localStorage.getItem("accessToken");
        const token = rawToken && rawToken !== "undefined" ? rawToken.trim() : null;
        if (!token) return undefined;

        const tokenType = (localStorage.getItem("tokenType") || "Bearer").trim();
        const hasPrefix = /^(Bearer|JWT)\s+/i.test(token);

        return {
            Authorization: hasPrefix ? token : `${tokenType} ${token}`,
        };
    }

    private normalizeMany(raw: unknown): Matiere[] {
        if (Array.isArray(raw)) return raw as Matiere[];

        if (raw && typeof raw === "object") {
            const obj = raw as Record<string, unknown>;
            if (Array.isArray(obj.data)) return obj.data as Matiere[];
            if (Array.isArray(obj.content)) return obj.content as Matiere[];
            if (obj.result && typeof obj.result === "object") {
                const result = obj.result as Record<string, unknown>;
                if (Array.isArray(result.data)) return result.data as Matiere[];
                if (Array.isArray(result.content)) return result.content as Matiere[];
            }
        }

        return [];
    }

    private normalizeOne(raw: unknown): Matiere | null {
        if (!raw || typeof raw !== "object") return null;
        const obj = raw as Record<string, unknown>;

        if (obj.data && typeof obj.data === "object" && !Array.isArray(obj.data)) {
            return obj.data as Matiere;
        }

        if (obj.result && typeof obj.result === "object" && !Array.isArray(obj.result)) {
            return obj.result as Matiere;
        }

        return obj as unknown as Matiere;
    }

    async getAllMatieres(): Promise<Matiere[]> {
        try {
            const response = await axios.get(API_URL, { headers: this.getAuthHeaders() });
            return this.normalizeMany(response.data);
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const status = error.response?.status;
                const method = error.config?.method?.toUpperCase() || "GET";
                const url = error.config?.url || API_URL;
                const data = error.response?.data as
                    | { message?: string; error?: string; details?: string }
                    | string
                    | undefined;
                const backendMessage =
                    typeof data === "string" ? data : data?.message || data?.error || data?.details;

                throw new Error(
                    [
                        "Echec de chargement des matieres",
                        `HTTP: ${status ?? "inconnu"}`,
                        `Route: ${method} ${url}`,
                        backendMessage ? `Backend: ${backendMessage}` : null,
                    ]
                        .filter(Boolean)
                        .join(" | ")
                );
            }

            throw new Error("Echec de chargement des matieres: erreur inattendue");
        }
    }

    async createMatiere(payload: MatiereCreatePayload): Promise<Matiere> {
        try {
            const response = await axios.post(API_URL, payload, { headers: this.getAuthHeaders() });
            const normalized = this.normalizeOne(response.data);
            if (normalized) return normalized;
            throw new Error("Reponse backend invalide apres creation de matiere");
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const status = error.response?.status;
                const method = error.config?.method?.toUpperCase() || "POST";
                const url = error.config?.url || API_URL;
                const data = error.response?.data as
                    | { message?: string; error?: string; details?: string }
                    | string
                    | undefined;
                const backendMessage =
                    typeof data === "string" ? data : data?.message || data?.error || data?.details;

                throw new Error(
                    [
                        "Echec de creation matiere",
                        `HTTP: ${status ?? "inconnu"}`,
                        `Route: ${method} ${url}`,
                        backendMessage ? `Backend: ${backendMessage}` : null,
                    ]
                        .filter(Boolean)
                        .join(" | ")
                );
            }

            throw error instanceof Error ? error : new Error("Echec de creation matiere: erreur inattendue");
        }
    }

    async updateMatiere(id: string, payload: MatiereUpdatePayload): Promise<Matiere> {
        try {
            const response = await axios.put(`${API_URL}/${id}`, payload, { headers: this.getAuthHeaders() });
            const normalized = this.normalizeOne(response.data);
            if (normalized) return normalized;
            throw new Error("Reponse backend invalide apres modification de matiere");
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const status = error.response?.status;
                const method = error.config?.method?.toUpperCase() || "PUT";
                const url = error.config?.url || `${API_URL}/${id}`;
                const data = error.response?.data as
                    | { message?: string; error?: string; details?: string }
                    | string
                    | undefined;
                const backendMessage =
                    typeof data === "string" ? data : data?.message || data?.error || data?.details;

                throw new Error(
                    [
                        "Echec de modification matiere",
                        `HTTP: ${status ?? "inconnu"}`,
                        `Route: ${method} ${url}`,
                        backendMessage ? `Backend: ${backendMessage}` : null,
                    ]
                        .filter(Boolean)
                        .join(" | ")
                );
            }

            throw error instanceof Error ? error : new Error("Echec de modification matiere: erreur inattendue");
        }
    }

    async deleteMatiere(id: string): Promise<void> {
        try {
            await axios.delete(`${API_URL}/${id}`, { headers: this.getAuthHeaders() });
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const status = error.response?.status;
                const method = error.config?.method?.toUpperCase() || "DELETE";
                const url = error.config?.url || `${API_URL}/${id}`;
                const data = error.response?.data as
                    | { message?: string; error?: string; details?: string }
                    | string
                    | undefined;
                const backendMessage =
                    typeof data === "string" ? data : data?.message || data?.error || data?.details;

                throw new Error(
                    [
                        "Echec de suppression matiere",
                        `HTTP: ${status ?? "inconnu"}`,
                        `Route: ${method} ${url}`,
                        backendMessage ? `Backend: ${backendMessage}` : null,
                    ]
                        .filter(Boolean)
                        .join(" | ")
                );
            }

            throw new Error("Echec de suppression matiere: erreur inattendue");
        }
    }
}

const matiereService = new MatiereService();

export default matiereService;
