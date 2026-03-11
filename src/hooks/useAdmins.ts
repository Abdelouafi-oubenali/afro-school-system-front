import { useEffect, useState } from "react";
import adminService from "../services/user/adminService";
import type { Admin } from "../services/user/adminService";

export function useAdmins(refreshKey?: number) {
    const [admins, setAdmins] = useState<Admin[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchAdmins = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await adminService.getAllAdmins();
            setAdmins(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Une erreur est survenue");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAdmins();
    }, [refreshKey]);

    return { admins, loading, error, refresh: fetchAdmins };
}
