import { useEffect, useState } from "react";
import parentService from "../services/parentService";
import type { Parent } from "../services/parentService";

export function useParents(refreshKey?: number) {
    const [parents, setParents] = useState<Parent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchParents = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await parentService.getAllParents();
            setParents(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Une erreur est survenue");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchParents();
    }, [refreshKey]);

    return { parents, loading, error, refresh: fetchParents };
}
