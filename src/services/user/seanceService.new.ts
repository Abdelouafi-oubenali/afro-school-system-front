import axios from "axios";

const BASE_URL = import.meta.env.VITE_SEANCE_API_URL || "/class-service";
const EMPLOI_BASE_URL = import.meta.env.VITE_EMPLOI_API_URL || "/class-service/api/emploi";

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
    jour: JourSemaine | null;
    heureDebut: string | null;
    heureFin: string | null;
    classeNom?: string;
    matiereNom?: string;
    enseignantNom?: string;
}

export interface EmploiGroup {
    id: string;
    label: string;
    type: "classe" | "enseignant";
    entries: EmploiEntry[];
}

const JOUR_ORDER: Record<string, number> = {
    MONDAY: 1,
    TUESDAY: 2,
    WEDNESDAY: 3,
    THURSDAY: 4,
    FRIDAY: 5,
    SATURDAY: 6,
    SUNDAY: 7,
};

class SeanceService {
    private getAuthHeaders() {
        const rawToken = localStorage.getItem("token") || localStorage.getItem("accessToken");
        const token = rawToken && rawToken !== "undefined" ? rawToken.trim() : null;
        if (!token) return undefined;
        const tokenType = (localStorage.getItem("tokenType") || "Bearer").trim();
        const hasPrefix = /^(Bearer|JWT)\s+/i.test(token);
        return { Authorization: hasPrefix ? token : `${tokenType} ${token}` };
    }

    private asRecord(value: unknown): Record<string, unknown> | null {
        return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
    }

    private toStringValue(value: unknown): string | undefined {
        if (typeof value === "string" && value.trim()) return value.trim();
        if (typeof value === "number") return String(value);
        return undefined;
    }

    private pickString(obj: Record<string, unknown>, keys: string[]): string | undefined {
        for (const key of keys) {
            const value = this.toStringValue(obj[key]);
            if (value) return value;
        }
        return undefined;
    }

    private normalizeMany<T>(raw: unknown): T[] {
        if (Array.isArray(raw)) return raw as T[];
        const obj = this.asRecord(raw);
        if (!obj) return [];
        if (Array.isArray(obj.data)) return obj.data as T[];
        if (Array.isArray(obj.content)) return obj.content as T[];
        if (Array.isArray(obj.items)) return obj.items as T[];
        if (obj.result) return this.normalizeMany<T>(obj.result);
        return [];
    }

    private sortEntries(entries: EmploiEntry[]): EmploiEntry[] {
        return [...entries].sort((a, b) => {
            const dayA = a.jour ? (JOUR_ORDER[a.jour] ?? 99) : 99;
            const dayB = b.jour ? (JOUR_ORDER[b.jour] ?? 99) : 99;
            if (dayA !== dayB) return dayA - dayB;
            return (a.heureDebut || "99:99:99").localeCompare(b.heureDebut || "99:99:99");
        });
    }

    private normalizeEntry(raw: unknown): EmploiEntry | null {
        const obj = this.asRecord(raw);
        if (!obj) return null;

        const classeId = this.pickString(obj, ["classeId", "classId"]);
        const matiereId = this.pickString(obj, ["matiereId", "subjectId"]);
        const enseignantId = this.pickString(obj, ["enseignantId", "teacherId"]);
        const jourRaw = this.pickString(obj, ["jour", "day"]);
        const heureDebut = this.pickString(obj, ["heureDebut", "startTime"]);
        const heureFin = this.pickString(obj, ["heureFin", "endTime"]);

        if (!classeId && !matiereId && !enseignantId && !jourRaw && !heureDebut && !heureFin) {
            return null;
        }

        const prenom = this.pickString(obj, ["enseignantPrenom", "prenom", "firstName"]);
        const nom = this.pickString(obj, ["enseignantNomFamille", "nom", "lastName"]);
        const enseignantNom = this.pickString(obj, ["enseignantNom", "teacherName"]) || [prenom, nom].filter(Boolean).join(" ") || undefined;
        const jour = jourRaw ? (jourRaw.toUpperCase() as JourSemaine) : null;
        const fallbackId = [classeId, enseignantId, matiereId, jour || "jour", heureDebut || "debut"].filter(Boolean).join("-") || "emploi";

        return {
            id: this.pickString(obj, ["id", "seanceId"]) || fallbackId,
            classeId: classeId || "",
            matiereId: matiereId || "",
            enseignantId: enseignantId || "",
            jour,
            heureDebut: heureDebut || null,
            heureFin: heureFin || null,
            classeNom: this.pickString(obj, ["classeNom", "className", "nomClasse", "classe"]),
            matiereNom: this.pickString(obj, ["matiereNom", "subjectName", "nomMatiere", "matiere"]),
            enseignantNom,
        };
    }

    private extractEntries(raw: unknown): EmploiEntry[] {
        if (Array.isArray(raw)) {
            return raw
                .map((item) => this.normalizeEntry(item))
                .filter((item): item is EmploiEntry => item !== null);
        }

        const obj = this.asRecord(raw);
        if (!obj) return [];

        for (const key of ["emploi", "emplois", "emploiDuTemps", "seances", "entries", "schedules", "items", "data", "content", "result"]) {
            const value = obj[key];
            const entries = this.extractEntries(value);
            if (entries.length > 0) return entries;
        }

        const single = this.normalizeEntry(raw);
        return single ? [single] : [];
    }

    private normalizeGroup(raw: unknown, type: "classe" | "enseignant"): EmploiGroup | null {
        const obj = this.asRecord(raw);
        if (!obj) return null;

        const entries = this.extractEntries(raw);
        const directEntry = this.normalizeEntry(raw);
        if (entries.length === 0 || directEntry) return null;

        const inheritedId = type === "classe"
            ? this.pickString(obj, ["classeId", "id", "classId"])
            : this.pickString(obj, ["enseignantId", "id", "teacherId"]);

        const inheritedLabel = type === "classe"
            ? this.pickString(obj, ["classeNom", "nomClasse", "label", "name", "nom", "className"]) || inheritedId
            : this.pickString(obj, ["enseignantNom", "label", "name", "teacherName"]) || [
                this.pickString(obj, ["prenom", "firstName"]),
                this.pickString(obj, ["nom", "lastName"]),
            ].filter(Boolean).join(" ") || inheritedId;

        const normalizedEntries = this.sortEntries(
            entries.map((entry) => ({
                ...entry,
                classeId: type === "classe" ? (entry.classeId || inheritedId || "") : entry.classeId,
                classeNom: type === "classe" ? (entry.classeNom || inheritedLabel || undefined) : entry.classeNom,
                enseignantId: type === "enseignant" ? (entry.enseignantId || inheritedId || "") : entry.enseignantId,
                enseignantNom: type === "enseignant" ? (entry.enseignantNom || inheritedLabel || undefined) : entry.enseignantNom,
            }))
        );

        const firstEntry = normalizedEntries[0];
        const id = inheritedId || (type === "classe" ? firstEntry.classeId : firstEntry.enseignantId) || firstEntry.id;
        const label = inheritedLabel || (type === "classe" ? firstEntry.classeNom || firstEntry.classeId : firstEntry.enseignantNom || firstEntry.enseignantId) || id;

        return {
            id,
            label,
            type,
            entries: normalizedEntries,
        };
    }

    private groupFlatEntries(entries: EmploiEntry[], type: "classe" | "enseignant"): EmploiGroup[] {
        const groups = new Map<string, EmploiGroup>();

        for (const entry of entries) {
            const id = type === "classe" ? entry.classeId : entry.enseignantId;
            const label = type === "classe" ? (entry.classeNom || entry.classeId) : (entry.enseignantNom || entry.enseignantId);
            const key = id || label || entry.id;
            const existing = groups.get(key);

            if (existing) {
                existing.entries.push(entry);
                continue;
            }

            groups.set(key, {
                id: key,
                label: label || key,
                type,
                entries: [entry],
            });
        }

        return Array.from(groups.values()).map((group) => ({
            ...group,
            entries: this.sortEntries(group.entries),
        }));
    }

    private normalizeGroups(raw: unknown, type: "classe" | "enseignant"): EmploiGroup[] {
        const rawArray = this.normalizeMany<unknown>(raw);
        const nestedGroups = rawArray
            .map((item) => this.normalizeGroup(item, type))
            .filter((item): item is EmploiGroup => item !== null);

        if (nestedGroups.length > 0) return nestedGroups;

        const flatEntries = this.extractEntries(raw);
        if (flatEntries.length > 0) return this.groupFlatEntries(flatEntries, type);

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
            const response = await axios.get(`${EMPLOI_BASE_URL}/classe/${classeId}`, {
                headers: this.getAuthHeaders(),
            });
            return this.extractEntries(response.data);
        } catch (error) {
            throw this.buildError("Echec de chargement de l'emploi du temps de la classe", error);
        }
    }

    async getEmploiByEnseignant(enseignantId: string): Promise<EmploiEntry[]> {
        try {
            const response = await axios.get(`${EMPLOI_BASE_URL}/enseignant/${enseignantId}`, {
                headers: this.getAuthHeaders(),
            });
            return this.extractEntries(response.data);
        } catch (error) {
            throw this.buildError("Echec de chargement de l'emploi du temps de l'enseignant", error);
        }
    }

    async getAllEmploisClasses(): Promise<EmploiGroup[]> {
        try {
            const response = await axios.get(`${EMPLOI_BASE_URL}/classes`, {
                headers: this.getAuthHeaders(),
            });
            return this.normalizeGroups(response.data, "classe");
        } catch (error) {
            throw this.buildError("Echec de chargement des emplois des classes", error);
        }
    }

    async getAllEmploisEnseignants(): Promise<EmploiGroup[]> {
        try {
            const response = await axios.get(`${EMPLOI_BASE_URL}/enseignants`, {
                headers: this.getAuthHeaders(),
            });
            return this.normalizeGroups(response.data, "enseignant");
        } catch (error) {
            throw this.buildError("Echec de chargement des emplois des enseignants", error);
        }
    }
}

const seanceService = new SeanceService();
export default seanceService;
