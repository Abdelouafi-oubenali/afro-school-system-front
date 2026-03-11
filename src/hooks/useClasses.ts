import { useEffect, useState } from "react";
import classService from "../services/user/classService";
import type { ClassRoom } from "../services/user/classService";

export function useClasses(refreshKey?: number) {
    const [classes, setClasses] = useState<ClassRoom[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchClasses = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await classService.getAllClasses();
            setClasses(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Une erreur est survenue");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClasses();
    }, [refreshKey]);

    return { classes, loading, error, refresh: fetchClasses };
}
