import axios from "axios";

const BASE_URL = import.meta.env.VITE_NOTE_API_URL || "/note-service";

export type NoteType = "DEVOIR" | "EXAMEN";

export interface Note {
    id: string;
    eleveId: string;
    matiereId: string;
    enseignantId: string;
    classeId: string;
    numeroExamen: number;
    valeur: number;
    type_note?: NoteType;
    typeNote?: NoteType;
    commentaire?: string;
    eleveNom?: string;
    elevePrenom?: string;
    matiereNom?: string;
    enseignantNom?: string;
    classeNom?: string;
}

export interface NoteCreatePayload {
    eleveId: string;
    matiereId: string;
    enseignantId: string;
    classeId: string;
    numeroExamen: number;
    valeur: number;
    type_note: NoteType;
    commentaire?: string;
}

export interface NoteUpdatePayload {
    eleveId: string;
    matiereId: string;
    enseignantId: string;
    classeId: string;
    numeroExamen: number;
    valeur: number;
    type_note: NoteType;
    commentaire?: string;
}

class NoteService {
    private getAuthHeaders() {
        const rawToken = localStorage.getItem("token") || localStorage.getItem("accessToken");
        const token = rawToken && rawToken !== "undefined" ? rawToken.trim() : null;
        if (!token) return undefined;
        const tokenType = (localStorage.getItem("tokenType") || "Bearer").trim();
        const hasPrefix = /^(Bearer|JWT)\s+/i.test(token);
        return { Authorization: hasPrefix ? token : `${tokenType} ${token}` };
    }

    private normalizeType(value: unknown): NoteType | undefined {
        if (value === "DEVOIR" || value === "EXAMEN") return value;
        return undefined;
    }

    private normalizeNote(raw: unknown): Note | null {
        if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
        const obj = raw as Record<string, unknown>;
        const type = this.normalizeType(obj.type_note) || this.normalizeType(obj.typeNote);

        return {
            ...(obj as unknown as Note),
            type_note: type,
            typeNote: type,
        };
    }

    private normalizeList(raw: unknown): Note[] {
        if (Array.isArray(raw)) {
            return raw
                .map((item) => this.normalizeNote(item))
                .filter((item): item is Note => item !== null);
        }

        if (raw && typeof raw === "object" && !Array.isArray(raw)) {
            const obj = raw as Record<string, unknown>;
            for (const key of ["data", "content", "items", "notes", "result"]) {
                if (Array.isArray(obj[key])) {
                    return obj[key]
                        .map((item) => this.normalizeNote(item))
                        .filter((item): item is Note => item !== null);
                }
            }
            if (obj.result && typeof obj.result === "object" && !Array.isArray(obj.result)) {
                const nested = obj.result as Record<string, unknown>;
                for (const key of ["data", "content", "items", "notes"]) {
                    if (Array.isArray(nested[key])) {
                        return nested[key]
                            .map((item) => this.normalizeNote(item))
                            .filter((item): item is Note => item !== null);
                    }
                }
            }
        }

        return [];
    }

    private normalizeOne(raw: unknown): Note | null {
        if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
        const obj = raw as Record<string, unknown>;

        if (obj.data && typeof obj.data === "object" && !Array.isArray(obj.data)) {
            return this.normalizeNote(obj.data);
        }

        if (obj.result && typeof obj.result === "object" && !Array.isArray(obj.result)) {
            return this.normalizeNote(obj.result);
        }

        return this.normalizeNote(obj);
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

    async createNote(payload: NoteCreatePayload): Promise<Note> {
        try {
            const body = {
                ...payload,
                type_note: payload.type_note,
                typeNote: payload.type_note,
            };

            const response = await axios.post(`${BASE_URL}/api/notes`, body, {
                headers: this.getAuthHeaders(),
            });
            const note = this.normalizeOne(response.data);
            if (!note) throw new Error("Reponse invalide lors de la creation de la note");
            return note;
        } catch (error) {
            throw this.buildError("Echec de creation de la note", error);
        }
    }

    async getAllNotes(): Promise<Note[]> {
        try {
            const response = await axios.get(`${BASE_URL}/api/notes`, {
                headers: this.getAuthHeaders(),
            });
            return this.normalizeList(response.data);
        } catch (error) {
            throw this.buildError("Echec de chargement des notes", error);
        }
    }

    async getNotesByEleve(eleveId: string): Promise<Note[]> {
        try {
            const response = await axios.get(`${BASE_URL}/api/notes/eleve/${eleveId}`, {
                headers: this.getAuthHeaders(),
            });
            return this.normalizeList(response.data);
        } catch (error) {
            throw this.buildError("Echec de chargement des notes de l'eleve", error);
        }
    }

    async getNotesByClasse(classeId: string): Promise<Note[]> {
        try {
            const response = await axios.get(`${BASE_URL}/api/notes/classe/${classeId}`, {
                headers: this.getAuthHeaders(),
            });
            return this.normalizeList(response.data);
        } catch (error) {
            throw this.buildError("Echec de chargement des notes de la classe", error);
        }
    }

    async getNotesByEleveAndMatiere(eleveId: string, matiereId: string): Promise<Note[]> {
        try {
            const response = await axios.get(`${BASE_URL}/api/notes/eleve/${eleveId}/matiere/${matiereId}`, {
                headers: this.getAuthHeaders(),
            });
            return this.normalizeList(response.data);
        } catch (error) {
            throw this.buildError("Echec de chargement des notes par eleve et matiere", error);
        }
    }

    async updateNote(id: string, payload: NoteUpdatePayload): Promise<Note> {
        try {
            const body = {
                ...payload,
                type_note: payload.type_note,
                typeNote: payload.type_note,
            };

            const response = await axios.put(`${BASE_URL}/api/notes/${id}`, body, {
                headers: this.getAuthHeaders(),
            });
            const note = this.normalizeOne(response.data);
            if (!note) throw new Error("Reponse invalide lors de la modification de la note");
            return note;
        } catch (error) {
            throw this.buildError("Echec de modification de la note", error);
        }
    }
}

const noteService = new NoteService();
export default noteService;
