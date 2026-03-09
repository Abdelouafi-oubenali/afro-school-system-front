import React from "react";
import { useEleves } from "../../hooks/useEleves";


const EleveList: React.FC = () => {
    const { eleves, loading, error } = useEleves();
    if (loading) {
        return (
            <div className="bg-white rounded-2xl p-6 shadow-card">
                <p className="text-slate text-sm">Chargement des eleves...</p>
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
          <h3 className="font-display text-[16px] font-semibold text-navy">Liste des eleves</h3>
          <p className="text-slate text-[12px] mt-0.5">Suivi des comptes et contacts</p>
        </div>
        <span className="bg-teal/10 text-teal text-[11px] font-bold px-2.5 py-1 rounded-full">{eleves.length}</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-ice">
              <th className="text-left text-[11px] font-semibold tracking-wider uppercase text-slate pb-3 pl-2">Eleve</th>
              <th className="text-left text-[11px] font-semibold tracking-wider uppercase text-slate pb-3 px-2">ID</th>
              <th className="text-left text-[11px] font-semibold tracking-wider uppercase text-slate pb-3 px-2">Email</th>
              <th className="text-right text-[11px] font-semibold tracking-wider uppercase text-slate pb-3 pr-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {eleves.map((eleve, index) => {
              const initials = `${eleve.prenom?.[0] ?? ""}${eleve.nom?.[0] ?? ""}`.toUpperCase();

              return (
                <tr key={eleve.id} className={`hover:bg-ice transition-colors ${index !== eleves.length - 1 ? "border-b border-navy/5" : ""}`}>
                  <td className="py-3 pl-2 pr-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-teal bg-teal/10 flex-shrink-0">
                        {initials || "EL"}
                      </div>
                      <span className="text-[13px] font-medium text-navy">{eleve.prenom} {eleve.nom}</span>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-[13px] text-navy">#{eleve.id}</td>
                  <td className="py-3 px-2 text-[13px] text-slate">{eleve.email}</td>
                  <td className="py-3 px-2">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        title="Voir detail"
                        className="w-8 h-8 rounded-lg border border-navy/10 text-slate hover:text-teal hover:border-teal/40 hover:bg-teal/5 transition-colors flex items-center justify-center"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        title="Modifier"
                        className="w-8 h-8 rounded-lg border border-navy/10 text-slate hover:text-gold hover:border-gold/40 hover:bg-gold/5 transition-colors flex items-center justify-center"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M12 20h9" />
                          <path d="M16.5 3.5a2.1 2.1 0 113 3L7 19l-4 1 1-4 12.5-12.5z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        title="Supprimer"
                        className="w-8 h-8 rounded-lg border border-navy/10 text-slate hover:text-coral hover:border-coral/40 hover:bg-coral/5 transition-colors flex items-center justify-center"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14H6L5 6" />
                          <path d="M10 11v6M14 11v6" />
                          <path d="M9 6V4h6v2" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EleveList;