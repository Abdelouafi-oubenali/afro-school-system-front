import React, { useState } from "react";
import { useSeances } from "../../hooks/useSeances";
import seanceService from "../../services/user/seanceService";
import type { Seance } from "../../services/user/seanceService";

const JOURS_FR: Record<string, string> = {
    MONDAY: "Lundi",
    TUESDAY: "Mardi",
    WEDNESDAY: "Mercredi",
    THURSDAY: "Jeudi",
    FRIDAY: "Vendredi",
    SATURDAY: "Samedi",
    SUNDAY: "Dimanche",
};

interface SeanceListProps {
    refreshKey?: number;
    onView?: (seance: Seance) => void;
    searchTerm?: string;
}

const SeanceList: React.FC<SeanceListProps> = ({ refreshKey, onView, searchTerm = "" }) => {
    const { seances, loading, error, refresh } = useSeances(refreshKey);
    const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; label: string } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const normalizedSearch = searchTerm.trim().toLowerCase();
    const filteredSeances = normalizedSearch
        ? seances.filter((s) => {
              const haystack = [
                  s.id,
                  s.classeId,
                  s.matiereId,
                  s.enseignantId,
                  JOURS_FR[s.jour] ?? s.jour,
                  s.heureDebut,
                  s.heureFin,
                  s.classeNom ?? "",
                  s.matiereNom ?? "",
                  s.enseignantNom ?? "",
              ]
                  .join(" ")
                  .toLowerCase();
              return haystack.includes(normalizedSearch);
          })
        : seances;

    const handleConfirmDelete = async () => {
        if (!deleteConfirm) return;
        try {
            setIsDeleting(true);
            await seanceService.deleteSeance(deleteConfirm.id);
            setDeleteConfirm(null);
            await refresh();
        } catch (err) {
            alert(err instanceof Error ? err.message : "Erreur lors de la suppression");
        } finally {
            setIsDeleting(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-2xl p-6 shadow-card">
                <p className="text-slate text-sm">Chargement des seances...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white rounded-2xl p-6 shadow-card">
                <p className="text-coral text-sm">{error}</p>
            </div>
        );
    }

    if (filteredSeances.length === 0) {
        return (
            <div className="bg-white rounded-2xl p-6 shadow-card text-center">
                <p className="text-slate text-sm">{normalizedSearch ? "Aucune seance ne correspond a la recherche." : "Aucune seance enregistree."}</p>
            </div>
        );
    }

    return (
        <>
            <div className="bg-white rounded-2xl shadow-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-navy/8">
                                <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate uppercase tracking-wide">Jour</th>
                                <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate uppercase tracking-wide">Horaire</th>
                                <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate uppercase tracking-wide">Matiere</th>
                                <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate uppercase tracking-wide">Enseignant</th>
                                <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate uppercase tracking-wide">Classe</th>
                                <th className="text-right px-5 py-3 text-[11px] font-semibold text-slate uppercase tracking-wide">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredSeances.map((seance, idx) => (
                                <tr
                                    key={seance.id}
                                    className={`border-b border-navy/5 hover:bg-ice/40 transition-colors ${idx % 2 === 0 ? "" : "bg-ice/20"}`}
                                >
                                    <td className="px-5 py-3.5">
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-teal/10 text-teal">
                                            {JOURS_FR[seance.jour] ?? seance.jour}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <span className="text-navy font-medium">{seance.heureDebut.slice(0, 5)}</span>
                                        <span className="text-slate mx-1">–</span>
                                        <span className="text-navy font-medium">{seance.heureFin.slice(0, 5)}</span>
                                    </td>
                                    <td className="px-5 py-3.5 text-navy font-medium">
                                        {seance.matiereNom || <span className="text-slate text-xs">{seance.matiereId.slice(0, 8)}…</span>}
                                    </td>
                                    <td className="px-5 py-3.5 text-navy">
                                        {seance.enseignantNom || <span className="text-slate text-xs">{seance.enseignantId.slice(0, 8)}…</span>}
                                    </td>
                                    <td className="px-5 py-3.5 text-navy">
                                        {seance.classeNom || <span className="text-slate text-xs">{seance.classeId.slice(0, 8)}…</span>}
                                    </td>
                                    <td className="px-5 py-3.5 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {onView && (
                                                <button
                                                    type="button"
                                                    onClick={() => onView(seance)}
                                                    title="Voir details"
                                                    className="w-8 h-8 rounded-lg border border-navy/10 text-slate hover:text-navy hover:bg-ice transition-colors flex items-center justify-center"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                        <circle cx="12" cy="12" r="3" />
                                                    </svg>
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setDeleteConfirm({
                                                        id: seance.id,
                                                        label: `${JOURS_FR[seance.jour] ?? seance.jour} ${seance.heureDebut.slice(0, 5)}-${seance.heureFin.slice(0, 5)}`,
                                                    })
                                                }
                                                title="Supprimer"
                                                className="w-8 h-8 rounded-lg border border-coral/20 text-coral hover:bg-coral/5 transition-colors flex items-center justify-center"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                    <polyline points="3 6 5 6 21 6" />
                                                    <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                                                    <path d="M10 11v6M14 11v6" />
                                                    <path d="M9 6V4h6v2" />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="px-5 py-3 border-t border-navy/5 text-[12px] text-slate">
                    {filteredSeances.length} seance{filteredSeances.length > 1 ? "s" : ""}
                    {normalizedSearch && seances.length !== filteredSeances.length && ` sur ${seances.length}`}
                </div>
            </div>

            {deleteConfirm && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-navy/40" onClick={() => setDeleteConfirm(null)} />
                    <div className="relative bg-white rounded-2xl shadow-hover p-6 w-full max-w-sm animate-fadeUp">
                        <h3 className="font-display text-[18px] text-navy mb-2">Confirmer la suppression</h3>
                        <p className="text-slate text-sm mb-5">
                            Supprimer la seance{" "}
                            <strong className="text-navy">{deleteConfirm.label}</strong> ? Cette action est irreversible.
                        </p>
                        <div className="flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setDeleteConfirm(null)}
                                className="px-4 py-2.5 rounded-xl border border-navy/10 text-navy text-sm font-medium hover:bg-ice transition-colors"
                            >
                                Annuler
                            </button>
                            <button
                                type="button"
                                disabled={isDeleting}
                                onClick={handleConfirmDelete}
                                className="px-4 py-2.5 rounded-xl bg-coral text-white text-sm font-semibold hover:bg-coral/90 transition-colors disabled:opacity-60"
                            >
                                {isDeleting ? "Suppression..." : "Supprimer"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default SeanceList;
