import axios from "axios";

const BASE_URL = import.meta.env.VITE_SEANCE_API_URL || "/class-service";

export type JourSemaine = "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY";

export interface Seance {
    id: string;
    classeId: string;
    matiereId: string;
    enseignantId: string;
    jour: JourSemaine;
    heureDebut: string;
    heureFin: string;
    classeNom?: string;
    matiereNom?: string;
    enseignantNom?: string;
}

export interface SeanceCreatePayload {
    classeId: string;
    matiereId: string;
    enseignantId: string;
    jour: JourSemaine;
    heureDebut: string;
    heureFin: string;
}

export interface EmploiEntry {
    id: string;
    classeId: string;
    matiereId: string;
    enseignantId: string;
    jour: JourSemaine;
    heureDebut: string;
    heureFin: string;
    classeNom?: string;
    matiereNom?: string;
    enseignantNom?: string;
}

class SeanceService {
    private getAuthHeaders() {
        const rawToken = localStorage.getItem("token") || localStorage.getItem("accessToken");
        const token = rawToken && rawToken !== "undefined" ? rawToken.trim() : null;
        if (!token) return undefined;
        const tokenType = (localStorage.getItem("tokenType") || "Bearer").trim();
        const hasPrefix = /^(Bearer|JWT)\s+/i.test(token);
        return { Authorization: hasPrefix ? token : `${tokenType} ${token}` };
    }

    private normalizeMany<T>(raw: unknown): T[] {
        if (Array.isArray(raw)) return raw as T[];
        if (raw && typeof raw === "object") {
            const obj = raw as Record<string, unknown>;
            if (Array.isArray(obj.data)) return obj.data as T[];
            if (Array.isArray(obj.content)) return obj.content as T[];
            if (obj.result && typeof obj.result === "object") {
                const result = obj.result as Record<string, unknown>;
                if (Array.isArray(result.data)) return result.data as T[];
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

    async createSeance(payload: SeanceCreatePayload): Promise<Seance> {
        try {
            const response = await axios.post(`${BASE_URL}/api/seances`, payload, {
                headers: this.getAuthHeaders(),
            });
            const data = response.data;
            if (data && typeof data === "object" && !Array.isArray(data)) {
                const obj = data as Record<string, unknown>;
                if (obj.data) return obj.data as Seance;
                if (obj.result) return obj.result as Seance;
            }
            return data as Seance;
        } catch (error) {
            throw this.buildError("Echec de creation de la seance", error);
        }
    }

    async deleteSeance(id: string): Promise<void> {
        try {
            await axios.delete(`${BASE_URL}/api/seances/${id}`, { headers: this.getAuthHeaders() });
        } catch (error) {
            throw this.buildError("Echec de suppression de la seance", error);
        }
    }

    async getAllSeances(): Promise<Seance[]> {
        try {
            const response = await axios.get(`${BASE_URL}/api/seances`, { headers: this.getAuthHeaders() });
            return this.normalizeMany<Seance>(response.data);
        } catch (error) {
            throw this.buildError("Echec de chargement des seances", error);
        }
    }

    async getEmploiByClasse(classeId: string): Promise<EmploiEntry[]> {
        try {
            const response = await axios.get(`${BASE_URL}/api/emploi/classe/${classeId}`, {
                headers: this.getAuthHeaders(),
            });
            return this.normalizeMany<EmploiEntry>(response.data);
        } catch (error) {
            throw this.buildError("Echec de chargement de l'emploi du temps de la classe", error);
        }
    }

    async getEmploiByEnseignant(enseignantId: string): Promise<EmploiEntry[]> {
        try {
            const response = await axios.get(`${BASE_URL}/api/emploi/enseignant/${enseignantId}`, {
                headers: this.getAuthHeaders(),
            });
            return this.normalizeMany<EmploiEntry>(response.data);
        } catch (error) {
            throw this.buildError("Echec de chargement de l'emploi du temps de l'enseignant", error);
        }
    }
}

const seanceService = new SeanceService();
export default seanceService;
