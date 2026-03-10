import { useEffect, useState } from "react";
import eleveService from "../services/eleveService";
import type { Eleve } from "../services/eleveService";

export function useEleves(refreshKey?: number) {
    const [eleves, setEleves] = useState<Eleve[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);


    const fetchEleves = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await eleveService.getAllEleves();
            setEleves(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Une erreur est survenue");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEleves();
    }, [refreshKey]);

    return { eleves, loading, error, refresh: fetchEleves };
}