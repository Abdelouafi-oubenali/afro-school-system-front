import axios from "axios";

const API_URL = import.meta.env.VITE_CLASS_API_URL || "/class-service/api/classes";

export interface ClassEleve {
    id: string;
    nom: string;
    prenom: string;
    email: string;
    phone?: string;
    dateNaissance?: string;
    role?: string;
    classe?: string | null;
}

export interface ClassEnseignant {
    id: string;
    nom: string;
    prenom: string;
    email: string;
    phone?: string;
    dateNaissance?: string;
    role?: string;
    specialite?: string | null;
    dateEmbauche?: string | null;
    matiere?: string | null;
}

export interface ClassRoom {
    id: string;
    name: string;
    levelClasse: string;
    niveauScolaire?: string | null;
    enseignantPrincipal: string;
    anneeScolaire: string;
    capaciteMax?: number | null;
    salleAttribuee?: string | null;
    eleves?: ClassEleve[];
    enseignants?: ClassEnseignant[];
}

export interface ClassCreatePayload {
    name: string;
    levelClasse: string;
    enseignantPrincipal: string;
    anneeScolaire: string;
}

export interface ClassUpdatePayload {
    id?: string;
    name: string;
    levelClasse: string;
    enseignantPrincipal: string;
    anneeScolaire: string;
}

class ClassService {
    private getAuthHeaders() {
        const rawToken = localStorage.getItem("token");
        const token = rawToken && rawToken !== "undefined" ? rawToken : null;
        return token ? { Authorization: `Bearer ${token}` } : undefined;
    }

    private normalizeClassesResponse(raw: unknown): ClassRoom[] {
        if (Array.isArray(raw)) return raw as ClassRoom[];

        if (raw && typeof raw === "object") {
            const obj = raw as Record<string, unknown>;
            if (Array.isArray(obj.data)) return obj.data as ClassRoom[];
            if (Array.isArray(obj.content)) return obj.content as ClassRoom[];
            if (obj.result && typeof obj.result === "object") {
                const result = obj.result as Record<string, unknown>;
                if (Array.isArray(result.data)) return result.data as ClassRoom[];
                if (Array.isArray(result.content)) return result.content as ClassRoom[];
            }
        }

        return [];
    }

    private normalizeSingleClassResponse(raw: unknown): ClassRoom | null {
        if (!raw || typeof raw !== "object") return null;

        const obj = raw as Record<string, unknown>;

        if (obj.data && typeof obj.data === "object" && !Array.isArray(obj.data)) {
            return obj.data as ClassRoom;
        }

        if (obj.result && typeof obj.result === "object" && !Array.isArray(obj.result)) {
            return obj.result as ClassRoom;
        }

        return obj as unknown as ClassRoom;
    }

    async getAllClasses(): Promise<ClassRoom[]> {
        try {
            const response = await axios.get(API_URL, {
                headers: this.getAuthHeaders(),
            });
            return this.normalizeClassesResponse(response.data);
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
                    typeof data === "string"
                        ? data
                        : data?.message || data?.error || data?.details;

                throw new Error(
                    [
                        "Echec de chargement des classes",
                        `HTTP: ${status ?? "inconnu"}`,
                        `Route: ${method} ${url}`,
                        backendMessage ? `Backend: ${backendMessage}` : null,
                    ]
                        .filter(Boolean)
                        .join(" | ")
                );
            }

            throw new Error("Echec de chargement des classes: erreur inattendue");
        }
    }

    async getClassById(id: string): Promise<ClassRoom | null> {
        try {
            const response = await axios.get(`${API_URL}/${id}`, {
                headers: this.getAuthHeaders(),
            });
            return this.normalizeSingleClassResponse(response.data);
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 404) return null;
            throw error;
        }
    }

    async getClassesByEnseignant(enseignantId: string): Promise<ClassRoom[]> {
        try {
            const response = await axios.get(`${API_URL}/enseignant/${enseignantId}`, {
                headers: this.getAuthHeaders(),
            });
            return this.normalizeClassesResponse(response.data);
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const status = error.response?.status;
                const method = error.config?.method?.toUpperCase() || "GET";
                const url = error.config?.url || `${API_URL}/enseignant/${enseignantId}`;
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
                        "Echec de chargement des classes de l'enseignant",
                        `HTTP: ${status ?? "inconnu"}`,
                        `Route: ${method} ${url}`,
                        backendMessage ? `Backend: ${backendMessage}` : null,
                    ]
                        .filter(Boolean)
                        .join(" | ")
                );
            }

            throw new Error("Echec de chargement des classes de l'enseignant: erreur inattendue");
        }
    }

    async createClass(payload: ClassCreatePayload): Promise<ClassRoom> {
        try {
            const response = await axios.post(API_URL, payload, {
                headers: this.getAuthHeaders(),
            });
            return response.data;
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
                    typeof data === "string"
                        ? data
                        : data?.message || data?.error || data?.details;

                throw new Error(
                    [
                        "Echec de creation classe",
                        `HTTP: ${status ?? "inconnu"}`,
                        `Route: ${method} ${url}`,
                        backendMessage ? `Backend: ${backendMessage}` : null,
                    ]
                        .filter(Boolean)
                        .join(" | ")
                );
            }

            throw new Error("Echec de creation classe: erreur inattendue");
        }
    }

    async updateClass(id: string, payload: ClassUpdatePayload): Promise<ClassRoom> {
        try {
            const response = await axios.put(`${API_URL}/${id}`, payload, {
                headers: this.getAuthHeaders(),
            });
            return response.data;
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
                    typeof data === "string"
                        ? data
                        : data?.message || data?.error || data?.details;

                throw new Error(
                    [
                        "Echec de modification classe",
                        `HTTP: ${status ?? "inconnu"}`,
                        `Route: ${method} ${url}`,
                        backendMessage ? `Backend: ${backendMessage}` : null,
                    ]
                        .filter(Boolean)
                        .join(" | ")
                );
            }

            throw new Error("Echec de modification classe: erreur inattendue");
        }
    }

    async deleteClass(id: string): Promise<void> {
        try {
            await axios.delete(`${API_URL}/${id}`, {
                headers: this.getAuthHeaders(),
            });
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
                    typeof data === "string"
                        ? data
                        : data?.message || data?.error || data?.details;

                throw new Error(
                    [
                        "Echec de suppression classe",
                        `HTTP: ${status ?? "inconnu"}`,
                        `Route: ${method} ${url}`,
                        backendMessage ? `Backend: ${backendMessage}` : null,
                    ]
                        .filter(Boolean)
                        .join(" | ")
                );
            }

            throw new Error("Echec de suppression classe: erreur inattendue");
        }
    }

    async assignStudents(id: string, studentIds: string[]): Promise<ClassRoom> {
        try {
            const response = await axios.put(`${API_URL}/${id}/assign-students`, studentIds, {
                headers: this.getAuthHeaders(),
            });

            const normalized = this.normalizeSingleClassResponse(response.data);
            if (normalized) return normalized;

            // Backend returned success but no body (e.g. 204 No Content) — refetch
            const all = await this.getAllClasses();
            const found = all.find((c) => c.id === id);
            if (found) return found;

            throw new Error("Assignation reussie mais impossible de recuperer les donnees de la classe");
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const status = error.response?.status;
                const method = error.config?.method?.toUpperCase() || "PUT";
                const url = error.config?.url || `${API_URL}/${id}/assign-students`;
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
                        "Echec d'assignation des eleves",
                        `HTTP: ${status ?? "inconnu"}`,
                        `Route: ${method} ${url}`,
                        backendMessage ? `Backend: ${backendMessage}` : null,
                    ]
                        .filter(Boolean)
                        .join(" | ")
                );
            }

            // Re-throw non-axios errors as-is (don't hide them under "erreur inattendue")
            throw error instanceof Error ? error : new Error("Echec d'assignation des eleves: erreur inattendue");
        }
    }

    async getClassEnseignants(id: string): Promise<ClassEnseignant[]> {
        try {
            const response = await axios.get(`${API_URL}/${id}/enseignants`, {
                headers: this.getAuthHeaders(),
            });

            if (Array.isArray(response.data)) return response.data as ClassEnseignant[];

            const obj = response.data as Record<string, unknown>;
            if (Array.isArray(obj.data)) return obj.data as ClassEnseignant[];
            if (Array.isArray(obj.content)) return obj.content as ClassEnseignant[];
            if (Array.isArray(obj.enseignants)) return obj.enseignants as ClassEnseignant[];

            return [];
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const status = error.response?.status;
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
                        "Echec de chargement des enseignants",
                        `HTTP: ${status ?? "inconnu"}`,
                        backendMessage ? `Backend: ${backendMessage}` : null,
                    ]
                        .filter(Boolean)
                        .join(" | ")
                );
            }

            throw error instanceof Error ? error : new Error("Echec de chargement des enseignants: erreur inattendue");
        }
    }

    async assignEnseignant(classId: string, enseignantId: string): Promise<ClassRoom> {
        try {
            const response = await axios.put(
                `${API_URL}/${classId}/assign-enseignant/${enseignantId}`,
                {},
                { headers: this.getAuthHeaders() }
            );

            const normalized = this.normalizeSingleClassResponse(response.data);
            if (normalized) return normalized;

            // Backend returned success but no body (e.g. 204 No Content) — refetch
            const all = await this.getAllClasses();
            const found = all.find((c) => c.id === classId);
            if (found) return found;

            throw new Error("Assignation de l'enseignant reussie mais impossible de recuperer les donnees de la classe");
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const status = error.response?.status;
                const method = error.config?.method?.toUpperCase() || "PUT";
                const url = error.config?.url || `${API_URL}/${classId}/assign-enseignant/${enseignantId}`;
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
                        "Echec d'assignation de l'enseignant",
                        `HTTP: ${status ?? "inconnu"}`,
                        `Route: ${method} ${url}`,
                        backendMessage ? `Backend: ${backendMessage}` : null,
                    ]
                        .filter(Boolean)
                        .join(" | ")
                );
            }

            throw error instanceof Error ? error : new Error("Echec d'assignation de l'enseignant: erreur inattendue");
        }
    }
}

const classService = new ClassService();

export default classService;
