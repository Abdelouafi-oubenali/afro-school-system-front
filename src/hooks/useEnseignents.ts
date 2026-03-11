import { useEffect, useState } from "react";
import enseignentService from "../services/user/enseignentService";
import type { Enseignent } from "../services/user/enseignentService";

export function useEnseignents(refreshKey?: number) {
    const [enseignents, setEnseignents] = useState<Enseignent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchEnseignents = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await enseignentService.getAllEnseignents();
            setEnseignents(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Une erreur est survenue");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEnseignents();
    }, [refreshKey]);

    return { enseignents, loading, error, refresh: fetchEnseignents };
}
