import axios from "axios";

const API_URL = "http://localhost:8081/api";

export interface Eleve {
    id: number;
    nom: string;
    prenom: string;
    email: string;
    password: string;
    phone: string;
    dateNaissance: string;
}

export interface EleveCreatePayload {
    nom: string;
    prenom: string;
    email: string;
    password: string;
    phone: string;
    dateNaissance: string;
}

class EleveService {
    private getAuthHeaders() {
        const rawToken = localStorage.getItem("token");
        const token = rawToken && rawToken !== "undefined" ? rawToken : null;
        return token ? { Authorization: `Bearer ${token}` } : undefined;
    }

    async getAllEleves(): Promise<Eleve[]> {
        const candidateRoutes = ["/users/eleve", "/users/eleves", "/eleve", "/eleves"];
        let lastError: unknown = null;

        for (const route of candidateRoutes) {
            try {
                const response = await axios.get(`${API_URL}${route}`, {
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
            const method = lastError.config?.method?.toUpperCase() || "GET";
            const url = lastError.config?.url || `${API_URL}/eleve`;
            const data = lastError.response?.data as
                | { message?: string; error?: string; details?: string }
                | string
                | undefined;

            const backendMessage =
                typeof data === "string"
                    ? data
                    : data?.message || data?.error || data?.details;

            const detailedMessage = [
                "Echec de chargement des eleves",
                `HTTP: ${status ?? "inconnu"}`,
                `Route: ${method} ${url}`,
                backendMessage ? `Backend: ${backendMessage}` : null,
                `Routes testees: ${candidateRoutes.join(", ")}`,
            ]
                .filter(Boolean)
                .join(" | ");

            console.error("Erreur API eleves detaillee:", {
                status,
                method,
                url,
                backendMessage,
                responseData: data,
                candidateRoutes,
            });

            throw new Error(detailedMessage);
        }

        console.error("Erreur inconnue lors de la récupération des élèves:", lastError);
        throw new Error("Echec de chargement des eleves: erreur inattendue");
    }

    async createEleve(payload: EleveCreatePayload): Promise<Eleve> {
        const candidateRoutes = ["/users/eleve", "/users/eleves", "/eleve", "/eleves"];
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
            const url = lastError.config?.url || `${API_URL}/users/eleve`;
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
                    "Echec de creation eleve",
                    `HTTP: ${status ?? "inconnu"}`,
                    `Route: ${method} ${url}`,
                    backendMessage ? `Backend: ${backendMessage}` : null,
                ]
                    .filter(Boolean)
                    .join(" | ")
            );
        }

        throw new Error("Echec de creation eleve: erreur inattendue");
    }
}

const eleveService = new EleveService();

export default eleveService;
