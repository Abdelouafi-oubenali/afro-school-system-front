import { useCallback, useEffect, useState } from "react";
import seanceService from "../services/user/seanceService";
import type { Seance, EmploiEntry } from "../services/user/seanceService";

export function useSeances(refreshKey?: number) {
    const [seances, setSeances] = useState<Seance[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchSeances = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await seanceService.getAllSeances();
            setSeances(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Une erreur est survenue");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSeances();
    }, [refreshKey, fetchSeances]);

    return { seances, loading, error, refresh: fetchSeances };
}

export function useEmploiByClasse(classeId: string | null) {
    const [emploi, setEmploi] = useState<EmploiEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchEmploi = useCallback(async (id: string) => {
        try {
            setLoading(true);
            setError(null);
            const data = await seanceService.getEmploiByClasse(id);
            setEmploi(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Une erreur est survenue");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (classeId) fetchEmploi(classeId);
        else setEmploi([]);
    }, [classeId, fetchEmploi]);

    return { emploi, loading, error, refresh: () => classeId && fetchEmploi(classeId) };
}

export function useEmploiByEnseignant(enseignantId: string | null) {
    const [emploi, setEmploi] = useState<EmploiEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchEmploi = useCallback(async (id: string) => {
        try {
            setLoading(true);
            setError(null);
            const data = await seanceService.getEmploiByEnseignant(id);
            setEmploi(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Une erreur est survenue");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (enseignantId) fetchEmploi(enseignantId);
        else setEmploi([]);
    }, [enseignantId, fetchEmploi]);

    return { emploi, loading, error, refresh: () => enseignantId && fetchEmploi(enseignantId) };
}
