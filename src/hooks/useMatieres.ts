import { useEffect, useState } from "react";
import matiereService from "../services/user/matiereService";
import type { Matiere } from "../services/user/matiereService";

export function useMatieres(refreshKey?: number) {
    const [matieres, setMatieres] = useState<Matiere[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchMatieres = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await matiereService.getAllMatieres();
            setMatieres(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Une erreur est survenue");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMatieres();
    }, [refreshKey]);

    return { matieres, loading, error, refresh: fetchMatieres };
}
