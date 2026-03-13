import axios from "axios";

const BASE_URL = import.meta.env.VITE_ABSENCE_API_URL || "/class-service";

export type AbsenceType = "ABSENCE" | "RETARD";

export interface Absence {
    id: string;
    eleveId: string;
    classeId: string;
    enseignantId: string;
    seanceId?: string;
    date: string;
    heureDebut: string;
    heureFin: string;
    type: AbsenceType;
    motif?: string;
    eleveNom?: string;
    elevePrenom?: string;
    classeNom?: string;
    enseignantNom?: string;
}

export interface AbsenceBulkPayload {
    eleveIds: string[];
    classeId: string;
    enseignantId: string;
    seanceId?: string;
    date: string;
    heureDebut: string;
    heureFin: string;
    type: AbsenceType;
    motif?: string;
}

export interface AbsenceFilterParams {
    date?: string;
    classeId?: string;
    heureDebut?: string;
    heureFin?: string;
}

class AbsenceService {
    private getAuthHeaders() {
        const rawToken = localStorage.getItem("token") || localStorage.getItem("accessToken");
        const token = rawToken && rawToken !== "undefined" ? rawToken.trim() : null;
        if (!token) return undefined;
        const tokenType = (localStorage.getItem("tokenType") || "Bearer").trim();
        const hasPrefix = /^(Bearer|JWT)\s+/i.test(token);
        return { Authorization: hasPrefix ? token : `${tokenType} ${token}` };
    }

    private normalizeList(raw: unknown): Absence[] {
        if (Array.isArray(raw)) return raw as Absence[];
        if (raw && typeof raw === "object" && !Array.isArray(raw)) {
            const obj = raw as Record<string, unknown>;
            for (const key of ["data", "content", "items", "absences", "result"]) {
                if (Array.isArray(obj[key])) return obj[key] as Absence[];
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

    async createBulk(payload: AbsenceBulkPayload): Promise<Absence[]> {
        try {
            const response = await axios.post(`${BASE_URL}/api/absences/bulk`, payload, {
                headers: this.getAuthHeaders(),
            });
            return this.normalizeList(response.data);
        } catch (error) {
            throw this.buildError("Echec d'enregistrement des absences", error);
        }
    }

    async getAllAbsences(): Promise<Absence[]> {
        try {
            const response = await axios.get(`${BASE_URL}/api/absences`, {
                headers: this.getAuthHeaders(),
            });
            return this.normalizeList(response.data);
        } catch (error) {
            throw this.buildError("Echec de chargement des absences", error);
        }
    }

    async filterAbsences(params: AbsenceFilterParams): Promise<Absence[]> {
        try {
            const queryParams = new URLSearchParams();

            if (params.date) queryParams.set("date", params.date);
            if (params.classeId) queryParams.set("classeId", params.classeId);
            if (params.heureDebut) queryParams.set("heureDebut", params.heureDebut);
            if (params.heureFin) queryParams.set("heureFin", params.heureFin);

            const suffix = queryParams.toString();
            const response = await axios.get(
                `${BASE_URL}/api/absences/filter${suffix ? `?${suffix}` : ""}`,
                {
                    headers: this.getAuthHeaders(),
                }
            );
            return this.normalizeList(response.data);
        } catch (error) {
            throw this.buildError("Echec de filtrage des absences", error);
        }
    }

    async getAbsencesByClasse(classeId: string): Promise<Absence[]> {
        try {
            const response = await axios.get(`${BASE_URL}/api/absences/classe/${classeId}`, {
                headers: this.getAuthHeaders(),
            });
            return this.normalizeList(response.data);
        } catch (error) {
            throw this.buildError("Echec de chargement des absences de la classe", error);
        }
    }

    async getAbsencesByEleve(eleveId: string): Promise<Absence[]> {
        try {
            const response = await axios.get(`${BASE_URL}/api/absences/eleve/${eleveId}`, {
                headers: this.getAuthHeaders(),
            });
            return this.normalizeList(response.data);
        } catch (error) {
            throw this.buildError("Echec de chargement des absences de l'élève", error);
        }
    }

    async deleteAbsence(id: string): Promise<void> {
        try {
            await axios.delete(`${BASE_URL}/api/absences/${id}`, {
                headers: this.getAuthHeaders(),
            });
        } catch (error) {
            throw this.buildError("Echec de suppression de l'absence", error);
        }
    }
}

const absenceService = new AbsenceService();
export default absenceService;
