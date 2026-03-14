export interface ChatContact {
    id: string;
    name: string;
    role?: string;
}

export const DEFAULT_CHAT_CONTACTS: ChatContact[] = [
    { id: "1d872e8b-1222-4426-a712-a4f0f18aa0cc", name: "Abde Enseignant", role: "ENSEIGNANT" },
    { id: "4aec410c-ef47-41c4-b64b-cf4034f98be8", name: "Rami Eleve", role: "ELEVE" },
    { id: "38c71111-f5be-492f-801d-71e83538f849", name: "Kizaru Eleve", role: "ELEVE" },
    { id: "admin-0001", name: "Admin Principal", role: "ADMIN" },
];
