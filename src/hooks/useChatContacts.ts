import { useEffect, useState } from "react";
import contactsService from "../services/chat/contactsService";
import type { ChatContact } from "../services/chat/mockContacts";

export function useChatContacts(currentUserId: string | null) {
    const [contacts, setContacts] = useState<ChatContact[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            try {
                setLoading(true);
                setError(null);
                const all = await contactsService.getAllContacts();
                if (!cancelled) {
                    setContacts(
                        currentUserId
                            ? all.filter((c) => c.id !== currentUserId)
                            : all
                    );
                }
            } catch (err) {
                if (!cancelled) {
                    setError(err instanceof Error ? err.message : "Erreur de chargement des contacts");
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        void load();
        return () => { cancelled = true; };
    }, [currentUserId]);

    return { contacts, loading, error };
}
