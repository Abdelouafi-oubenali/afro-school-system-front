import React, { useState } from "react";
import { useClasses } from "../../hooks/useClasses";
import classService from "../../services/user/classService";
import type { ClassRoom } from "../../services/user/classService";

interface ClassListProps {
    refreshKey?: number;
    onEdit?: (classItem: ClassRoom) => void;
    onView?: (classItem: ClassRoom) => void;
    searchTerm?: string;
}

const ClassList: React.FC<ClassListProps> = ({ refreshKey, onEdit, onView, searchTerm = "" }) => {
    const { classes, loading, error, refresh } = useClasses(refreshKey);
    const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const normalizedSearch = searchTerm.trim().toLowerCase();
    const filteredClasses = normalizedSearch
        ? classes.filter((item) => {
              const haystack = [
                  item.id,
                  item.name,
                  item.levelClasse,
                  item.enseignantPrincipal,
                  item.anneeScolaire,
              ]
                  .join(" ")
                  .toLowerCase();
              return haystack.includes(normalizedSearch);
          })
        : classes;

    const handleConfirmDelete = async () => {
        if (!deleteConfirm) return;

        try {
            setIsDeleting(true);
            await classService.deleteClass(deleteConfirm.id);
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
                <p className="text-slate text-sm">Chargement des classes...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white rounded-2xl p-6 shadow-card border-l-4 border-coral">
                <p className="text-coral text-sm font-medium">Erreur: {error}</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl p-6 shadow-card animate-fadeUp">
            <div className="flex items-start justify-between mb-5">
                <div>
                    <h3 className="font-display text-[16px] font-semibold text-navy">Liste des classes</h3>
                    <p className="text-slate text-[12px] mt-0.5">Gestion des niveaux et enseignants principaux</p>
                </div>
                <span className="bg-teal/10 text-teal text-[11px] font-bold px-2.5 py-1 rounded-full">{filteredClasses.length}</span>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b-2 border-ice">
                            <th className="text-left text-[11px] font-semibold tracking-wider uppercase text-slate pb-3 pl-2">Classe</th>
                            <th className="text-left text-[11px] font-semibold tracking-wider uppercase text-slate pb-3 px-2">Niveau</th>
                            <th className="text-left text-[11px] font-semibold tracking-wider uppercase text-slate pb-3 px-2">Année scolaire</th>
                            <th className="text-left text-[11px] font-semibold tracking-wider uppercase text-slate pb-3 px-2">Prof principal</th>
                            <th className="text-center text-[11px] font-semibold tracking-wider uppercase text-slate pb-3 px-2">Élèves</th>
                            <th className="text-right text-[11px] font-semibold tracking-wider uppercase text-slate pb-3 pr-2">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredClasses.map((item, index) => (
                            <tr key={item.id} className={`hover:bg-ice transition-colors ${index !== filteredClasses.length - 1 ? "border-b border-navy/5" : ""}`}>
                                <td className="py-3 pl-2 pr-2">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-teal bg-teal/10 flex-shrink-0">
                                            {(item.name || "CL").slice(0, 2).toUpperCase()}
                                        </div>
                                        <span className="text-[13px] font-medium text-navy">{item.name}</span>
                                    </div>
                                </td>
                                <td className="py-3 px-2 text-[13px] text-navy">{item.levelClasse}</td>
                                <td className="py-3 px-2 text-[13px] text-slate">{item.anneeScolaire}</td>
                                <td className="py-3 px-2 text-[13px] text-slate break-all">{item.enseignantPrincipal}</td>
                                <td className="py-3 px-2 text-center">
                                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full text-[11px] font-bold bg-teal/10 text-teal">{item.eleves?.length ?? 0}</span>
                                </td>
                                <td className="py-3 px-2">
                                    <div className="flex items-center justify-end gap-2">
                                        <button type="button" title="Voir detail" onClick={() => onView?.(item)} className="w-8 h-8 rounded-lg border border-navy/10 text-slate hover:text-teal hover:border-teal/40 hover:bg-teal/5 transition-colors flex items-center justify-center"><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" /><circle cx="12" cy="12" r="3" /></svg></button>
                                        <button type="button" title="Modifier" onClick={() => onEdit?.(item)} className="w-8 h-8 rounded-lg border border-navy/10 text-slate hover:text-gold hover:border-gold/40 hover:bg-gold/5 transition-colors flex items-center justify-center"><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 113 3L7 19l-4 1 1-4 12.5-12.5z" /></svg></button>
                                        <button type="button" title="Supprimer" onClick={() => setDeleteConfirm({ id: item.id, name: item.name })} className="w-8 h-8 rounded-lg border border-navy/10 text-slate hover:text-coral hover:border-coral/40 hover:bg-coral/5 transition-colors flex items-center justify-center"><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" /></svg></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filteredClasses.length === 0 && (
                            <tr>
                                <td colSpan={5} className="py-8 text-center text-[13px] text-slate">Aucune classe trouvée pour "{searchTerm}".</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {deleteConfirm && (
                <div className="fixed inset-0 bg-navy/60 flex items-center justify-center z-50 animate-fadeIn">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl animate-slideUp">
                        <h3 className="font-display text-lg font-semibold text-navy mb-2">Confirmer la suppression</h3>
                        <p className="text-slate text-sm">Voulez-vous vraiment supprimer la classe <span className="font-semibold text-navy">{deleteConfirm.name}</span> ?</p>
                        <div className="flex gap-3 mt-6">
                            <button type="button" onClick={() => setDeleteConfirm(null)} disabled={isDeleting} className="flex-1 px-4 py-2.5 rounded-xl border border-navy/20 text-navy font-medium hover:bg-navy/5 transition-colors disabled:opacity-50">Annuler</button>
                            <button type="button" onClick={handleConfirmDelete} disabled={isDeleting} className="flex-1 px-4 py-2.5 rounded-xl bg-coral text-white font-medium hover:bg-coral/90 transition-colors disabled:opacity-50">{isDeleting ? "Suppression..." : "Supprimer"}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClassList;
