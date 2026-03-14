import axios from "axios";
import type { ChatContact } from "./mockContacts";

const API_URL = import.meta.env.VITE_API_URL || "/users-service/api";

function getAuthHeaders() {
    const rawToken = localStorage.getItem("token") || localStorage.getItem("accessToken");
    const token = rawToken && rawToken !== "undefined" ? rawToken.trim() : null;
    if (!token) return undefined;
    return { Authorization: `Bearer ${token}` };
}

function normalizeList(raw: unknown): Array<{ id: string; nom?: string; prenom?: string; [key: string]: unknown }> {
    if (Array.isArray(raw)) return raw as never[];
    if (raw && typeof raw === "object") {
        const obj = raw as Record<string, unknown>;
        for (const key of ["data", "content", "items", "result"]) {
            if (Array.isArray(obj[key])) return obj[key] as never[];
        }
    }
    return [];
}

async function fetchGroup(endpoint: string, role: string): Promise<ChatContact[]> {
    try {
        const response = await axios.get(`${API_URL}${endpoint}`, {
            headers: getAuthHeaders(),
        });
        const list = normalizeList(response.data);
        return list
            .filter((u) => u && typeof u.id === "string" && u.id)
            .map((u) => ({
                id: u.id,
                name: [u.prenom, u.nom].filter(Boolean).join(" ") || u.id,
                role,
            }));
    } catch {
        // Si un endpoint échoue, on retourne vide pour ne pas bloquer les autres
        return [];
    }
}

const contactsService = {
    async getAllContacts(): Promise<ChatContact[]> {
        const [admins, enseignants, eleves, parents] = await Promise.all([
            fetchGroup("/users/admins", "ADMIN"),
            fetchGroup("/users/enseignent", "ENSEIGNANT"),
            fetchGroup("/users/eleve", "ELEVE"),
            fetchGroup("/users/parent", "PARENT"),
        ]);

        return [...admins, ...enseignants, ...eleves, ...parents];
    },
};

export default contactsService;
