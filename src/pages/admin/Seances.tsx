import React, { useState } from "react";
import Layout from "../../components/layout/Layout";
import StatCard from "../../components/layout/StatCard";
import SeanceList from "../../components/seances/SeanceList";
import { useSeances, useEmploiByClasse, useEmploiByEnseignant } from "../../hooks/useSeances";
import { useClasses } from "../../hooks/useClasses";
import { useEnseignents } from "../../hooks/useEnseignents";
import { useMatieres } from "../../hooks/useMatieres";
import seanceService from "../../services/user/seanceService";
import type { Seance, SeanceCreatePayload, JourSemaine } from "../../services/user/seanceService";

const JOURS: { value: JourSemaine; label: string }[] = [
    { value: "MONDAY", label: "Lundi" },
    { value: "TUESDAY", label: "Mardi" },
    { value: "WEDNESDAY", label: "Mercredi" },
    { value: "THURSDAY", label: "Jeudi" },
    { value: "FRIDAY", label: "Vendredi" },
    { value: "SATURDAY", label: "Samedi" },
    { value: "SUNDAY", label: "Dimanche" },
];

const JOURS_FR: Record<string, string> = {
    MONDAY: "Lundi", TUESDAY: "Mardi", WEDNESDAY: "Mercredi",
    THURSDAY: "Jeudi", FRIDAY: "Vendredi", SATURDAY: "Samedi", SUNDAY: "Dimanche",
};

type ViewMode = "list" | "emploi-classe" | "emploi-enseignant";

export default function Seances() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [listRefreshKey, setListRefreshKey] = useState(0);
    const [selectedSeance, setSelectedSeance] = useState<Seance | null>(null);
    const [viewMode, setViewMode] = useState<ViewMode>("list");
    const [filterClasseId, setFilterClasseId] = useState("");
    const [filterEnseignantId, setFilterEnseignantId] = useState("");

    const { seances } = useSeances(listRefreshKey);
    const { classes } = useClasses();
    const { enseignents } = useEnseignents();
    const { matieres } = useMatieres();

    const { emploi: emploiClasse, loading: loadingEmploiClasse } = useEmploiByClasse(
        viewMode === "emploi-classe" && filterClasseId ? filterClasseId : null
    );
    const { emploi: emploiEnseignant, loading: loadingEmploiEnseignant } = useEmploiByEnseignant(
        viewMode === "emploi-enseignant" && filterEnseignantId ? filterEnseignantId : null
    );

    const [formData, setFormData] = useState<SeanceCreatePayload>({
        classeId: "",
        matiereId: "",
        enseignantId: "",
        jour: "MONDAY",
        heureDebut: "",
        heureFin: "",
    });

    const updateField = <K extends keyof SeanceCreatePayload>(field: K, value: SeanceCreatePayload[K]) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const resetForm = () => {
        setFormData({ classeId: "", matiereId: "", enseignantId: "", jour: "MONDAY", heureDebut: "", heureFin: "" });
        setFormError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setFormError(null);
        try {
            await seanceService.createSeance(formData);
            setIsModalOpen(false);
            resetForm();
            setListRefreshKey((k) => k + 1);
        } catch (error) {
            setFormError(error instanceof Error ? error.message : "Erreur lors de la creation de la seance");
        } finally {
            setIsSubmitting(false);
        }
    };

    const totalSeances = seances.length;
    const seancesParJour = JOURS.reduce<Record<string, number>>((acc, j) => {
        acc[j.value] = seances.filter((s) => s.jour === j.value).length;
        return acc;
    }, {});
    const jourMax = Object.entries(seancesParJour).sort((a, b) => b[1] - a[1])[0];

    const emploiData = viewMode === "emploi-classe" ? emploiClasse : emploiEnseignant;
    const loadingEmploi = viewMode === "emploi-classe" ? loadingEmploiClasse : loadingEmploiEnseignant;

    return (
        <Layout>
            {selectedSeance ? (
                <div className="bg-white rounded-2xl p-6 shadow-card animate-fadeUp">
                    <div className="flex items-start justify-between gap-3 flex-wrap mb-5">
                        <div>
                            <h2 className="font-display text-[22px] text-navy leading-tight">Detail de la seance</h2>
                            <p className="text-slate text-[13px] mt-0.5">Consultation des informations</p>
                        </div>
                        <button type="button" onClick={() => setSelectedSeance(null)} className="px-4 py-2.5 rounded-xl border border-navy/10 text-navy text-sm font-medium hover:bg-ice transition-colors">
                            Retour a la liste
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-3 rounded-xl bg-ice/60 border border-navy/10 md:col-span-2">
                            <p className="text-[11px] uppercase tracking-wide text-slate">ID</p>
                            <p className="text-sm font-medium text-navy break-all">{selectedSeance.id}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-ice/60 border border-navy/10">
                            <p className="text-[11px] uppercase tracking-wide text-slate">Jour</p>
                            <span className="inline-flex text-[11px] font-semibold px-2.5 py-1 rounded-full bg-teal/10 text-teal">
                                {JOURS_FR[selectedSeance.jour] ?? selectedSeance.jour}
                            </span>
                        </div>
                        <div className="p-3 rounded-xl bg-ice/60 border border-navy/10">
                            <p className="text-[11px] uppercase tracking-wide text-slate">Horaire</p>
                            <p className="text-sm font-medium text-navy">
                                {selectedSeance.heureDebut.slice(0, 5)} – {selectedSeance.heureFin.slice(0, 5)}
                            </p>
                        </div>
                        <div className="p-3 rounded-xl bg-ice/60 border border-navy/10">
                            <p className="text-[11px] uppercase tracking-wide text-slate">Matiere</p>
                            <p className="text-sm font-medium text-navy">{selectedSeance.matiereNom || selectedSeance.matiereId}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-ice/60 border border-navy/10">
                            <p className="text-[11px] uppercase tracking-wide text-slate">Enseignant</p>
                            <p className="text-sm font-medium text-navy">{selectedSeance.enseignantNom || selectedSeance.enseignantId}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-ice/60 border border-navy/10">
                            <p className="text-[11px] uppercase tracking-wide text-slate">Classe</p>
                            <p className="text-sm font-medium text-navy">{selectedSeance.classeNom || selectedSeance.classeId}</p>
                        </div>
                    </div>
                </div>
            ) : (
                <>
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div>
                            <h2 className="font-display text-[22px] text-navy leading-tight">Gestion des seances</h2>
                            <p className="text-slate text-[13px] mt-0.5">Planification et suivi des seances de cours</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-5">
                        <StatCard
                            title="Total seances"
                            value={totalSeances}
                            icon={(<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>)}
                            trendValue="Emploi du temps"
                            trendIcon={(<svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><polyline points="18 15 12 9 6 15" /></svg>)}
                            colorTheme={{ gradient: "linear-gradient(90deg,#0E9E8E,#16BCA8)", iconBg: "rgba(14,158,142,.1)", iconColor: "#0E9E8E", trendBg: "rgba(91,173,139,.15)", trendColor: "#5BAD8B" }}
                            delay="0.05s"
                        />
                        <StatCard
                            title="Seances cette semaine"
                            value={seances.length}
                            icon={(<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>)}
                            trendValue="Semaine courante"
                            trendIcon={(<svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><polyline points="18 15 12 9 6 15" /></svg>)}
                            colorTheme={{ gradient: "linear-gradient(90deg,#E8A020,#F5B84C)", iconBg: "rgba(232,160,32,.1)", iconColor: "#E8A020", trendBg: "rgba(232,160,32,.15)", trendColor: "#E8A020" }}
                            delay="0.1s"
                        />
                        <StatCard
                            title="Jour le plus chargé"
                            value={jourMax ? JOURS_FR[jourMax[0]] : "-"}
                            icon={(<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 3v18h18" /><path d="M7 14l3-3 3 2 4-5" /></svg>)}
                            trendValue={jourMax ? `${jourMax[1]} seance${jourMax[1] > 1 ? "s" : ""}` : "Aucune"}
                            trendIcon={(<svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><polyline points="18 15 12 9 6 15" /></svg>)}
                            colorTheme={{ gradient: "linear-gradient(90deg,#E05C5C,#f08080)", iconBg: "rgba(224,92,92,.1)", iconColor: "#E05C5C", trendBg: "rgba(224,92,92,.12)", trendColor: "#E05C5C" }}
                            delay="0.15s"
                        />
                    </div>

                    {/* View tabs */}
                    <div className="flex items-center gap-2 flex-wrap">
                        {(["list", "emploi-classe", "emploi-enseignant"] as ViewMode[]).map((mode) => (
                            <button
                                key={mode}
                                type="button"
                                onClick={() => setViewMode(mode)}
                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${viewMode === mode ? "nav-active text-white shadow-teal" : "border border-navy/10 text-navy hover:bg-ice"}`}
                            >
                                {mode === "list" ? "Toutes les seances" : mode === "emploi-classe" ? "Emploi par classe" : "Emploi par enseignant"}
                            </button>
                        ))}
                    </div>

                    {/* Filter bar */}
                    {viewMode === "list" && (
                        <div className="flex items-center gap-3 flex-wrap">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-64 rounded-xl border border-navy/10 bg-white px-3 py-2.5 text-sm text-navy outline-none focus:border-teal"
                                placeholder="Rechercher: jour, matiere, classe..."
                            />
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(true)}
                                className="nav-active text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-teal hover:opacity-95 transition-opacity"
                            >
                                + Nouvelle seance
                            </button>
                        </div>
                    )}

                    {viewMode === "emploi-classe" && (
                        <div className="flex items-center gap-3 flex-wrap">
                            <select
                                value={filterClasseId}
                                onChange={(e) => setFilterClasseId(e.target.value)}
                                className="w-72 rounded-xl border border-navy/10 bg-white px-3 py-2.5 text-sm text-navy outline-none focus:border-teal"
                            >
                                <option value="">-- Choisir une classe --</option>
                                {classes.map((c) => (
                                    <option key={c.id} value={c.id}>{c.name} ({c.levelClasse})</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {viewMode === "emploi-enseignant" && (
                        <div className="flex items-center gap-3 flex-wrap">
                            <select
                                value={filterEnseignantId}
                                onChange={(e) => setFilterEnseignantId(e.target.value)}
                                className="w-72 rounded-xl border border-navy/10 bg-white px-3 py-2.5 text-sm text-navy outline-none focus:border-teal"
                            >
                                <option value="">-- Choisir un enseignant --</option>
                                {enseignents.map((e) => (
                                    <option key={e.id} value={e.id}>{e.prenom} {e.nom}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Content */}
                    {viewMode === "list" && (
                        <SeanceList refreshKey={listRefreshKey} onView={setSelectedSeance} searchTerm={searchTerm} />
                    )}

                    {(viewMode === "emploi-classe" || viewMode === "emploi-enseignant") && (
                        <EmploiTable
                            data={emploiData}
                            loading={loadingEmploi}
                            hasFilter={viewMode === "emploi-classe" ? !!filterClasseId : !!filterEnseignantId}
                        />
                    )}

                    {/* Create modal */}
                    {isModalOpen && (
                        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                            <div className="absolute inset-0 bg-navy/40" onClick={() => setIsModalOpen(false)} />
                            <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-hover p-6 animate-fadeUp">
                                <div className="flex items-center justify-between mb-5">
                                    <h3 className="font-display text-[20px] text-navy">Nouvelle seance</h3>
                                    <button type="button" className="w-9 h-9 rounded-lg border border-navy/10 text-slate hover:text-navy hover:bg-ice transition-colors" onClick={() => setIsModalOpen(false)} title="Fermer">x</button>
                                </div>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    {formError && <div className="p-3 rounded-xl bg-coral/10 border border-coral/20 text-coral text-sm">{formError}</div>}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[12px] font-semibold text-slate mb-1.5">Classe</label>
                                            <select
                                                required
                                                value={formData.classeId}
                                                onChange={(e) => updateField("classeId", e.target.value)}
                                                className="w-full rounded-xl border border-navy/10 bg-white px-3 py-2.5 text-sm text-navy outline-none focus:border-teal"
                                            >
                                                <option value="">-- Choisir --</option>
                                                {classes.map((c) => (
                                                    <option key={c.id} value={c.id}>{c.name} ({c.levelClasse})</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[12px] font-semibold text-slate mb-1.5">Matiere</label>
                                            <select
                                                required
                                                value={formData.matiereId}
                                                onChange={(e) => updateField("matiereId", e.target.value)}
                                                className="w-full rounded-xl border border-navy/10 bg-white px-3 py-2.5 text-sm text-navy outline-none focus:border-teal"
                                            >
                                                <option value="">-- Choisir --</option>
                                                {matieres.map((m) => (
                                                    <option key={m.id} value={m.id}>{m.nom}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[12px] font-semibold text-slate mb-1.5">Enseignant</label>
                                            <select
                                                required
                                                value={formData.enseignantId}
                                                onChange={(e) => updateField("enseignantId", e.target.value)}
                                                className="w-full rounded-xl border border-navy/10 bg-white px-3 py-2.5 text-sm text-navy outline-none focus:border-teal"
                                            >
                                                <option value="">-- Choisir --</option>
                                                {enseignents.map((e) => (
                                                    <option key={e.id} value={e.id}>{e.prenom} {e.nom}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[12px] font-semibold text-slate mb-1.5">Jour</label>
                                            <select
                                                value={formData.jour}
                                                onChange={(e) => updateField("jour", e.target.value as JourSemaine)}
                                                className="w-full rounded-xl border border-navy/10 bg-white px-3 py-2.5 text-sm text-navy outline-none focus:border-teal"
                                            >
                                                {JOURS.map((j) => (
                                                    <option key={j.value} value={j.value}>{j.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[12px] font-semibold text-slate mb-1.5">Heure debut</label>
                                            <input
                                                type="time"
                                                required
                                                value={formData.heureDebut}
                                                onChange={(e) => updateField("heureDebut", e.target.value)}
                                                className="w-full rounded-xl border border-navy/10 bg-white px-3 py-2.5 text-sm text-navy outline-none focus:border-teal"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[12px] font-semibold text-slate mb-1.5">Heure fin</label>
                                            <input
                                                type="time"
                                                required
                                                value={formData.heureFin}
                                                onChange={(e) => updateField("heureFin", e.target.value)}
                                                className="w-full rounded-xl border border-navy/10 bg-white px-3 py-2.5 text-sm text-navy outline-none focus:border-teal"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-end gap-3 pt-2">
                                        <button type="button" onClick={() => { setIsModalOpen(false); resetForm(); }} className="px-4 py-2.5 rounded-xl border border-navy/10 text-navy text-sm font-medium hover:bg-ice transition-colors">
                                            Annuler
                                        </button>
                                        <button type="submit" disabled={isSubmitting} className="px-4 py-2.5 rounded-xl nav-active text-white text-sm font-semibold shadow-teal disabled:opacity-60">
                                            {isSubmitting ? "Creation..." : "Creer seance"}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </>
            )}
        </Layout>
    );
}

const JOURS_ORDER: JourSemaine[] = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];
const JOURS_FR_MAP: Record<string, string> = {
    MONDAY: "Lundi", TUESDAY: "Mardi", WEDNESDAY: "Mercredi",
    THURSDAY: "Jeudi", FRIDAY: "Vendredi", SATURDAY: "Samedi", SUNDAY: "Dimanche",
};

function EmploiTable({ data, loading, hasFilter }: { data: import("../../services/user/seanceService").EmploiEntry[]; loading: boolean; hasFilter: boolean }) {
    if (!hasFilter) {
        return (
            <div className="bg-white rounded-2xl p-8 shadow-card text-center">
                <p className="text-slate text-sm">Veuillez selectionner une option pour afficher l'emploi du temps.</p>
            </div>
        );
    }
    if (loading) {
        return (
            <div className="bg-white rounded-2xl p-6 shadow-card">
                <p className="text-slate text-sm">Chargement de l'emploi du temps...</p>
            </div>
        );
    }
    if (data.length === 0) {
        return (
            <div className="bg-white rounded-2xl p-6 shadow-card text-center">
                <p className="text-slate text-sm">Aucune seance trouvee pour cette selection.</p>
            </div>
        );
    }

    const byDay = JOURS_ORDER.reduce<Record<string, typeof data>>((acc, j) => {
        acc[j] = data.filter((s) => s.jour === j).sort((a, b) => a.heureDebut.localeCompare(b.heureDebut));
        return acc;
    }, {} as Record<string, typeof data>);

    return (
        <div className="space-y-4">
            {JOURS_ORDER.filter((j) => byDay[j].length > 0).map((jour) => (
                <div key={jour} className="bg-white rounded-2xl shadow-card overflow-hidden">
                    <div className="px-5 py-3 border-b border-navy/8 flex items-center gap-2">
                        <span className="inline-flex text-[11px] font-semibold px-2.5 py-1 rounded-full bg-teal/10 text-teal">
                            {JOURS_FR_MAP[jour]}
                        </span>
                        <span className="text-[12px] text-slate">{byDay[jour].length} seance{byDay[jour].length > 1 ? "s" : ""}</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-navy/5">
                                    <th className="text-left px-5 py-2.5 text-[11px] font-semibold text-slate uppercase tracking-wide">Horaire</th>
                                    <th className="text-left px-5 py-2.5 text-[11px] font-semibold text-slate uppercase tracking-wide">Matiere</th>
                                    <th className="text-left px-5 py-2.5 text-[11px] font-semibold text-slate uppercase tracking-wide">Enseignant</th>
                                    <th className="text-left px-5 py-2.5 text-[11px] font-semibold text-slate uppercase tracking-wide">Classe</th>
                                </tr>
                            </thead>
                            <tbody>
                                {byDay[jour].map((s, idx) => (
                                    <tr key={s.id} className={`border-b border-navy/5 ${idx % 2 === 0 ? "" : "bg-ice/20"}`}>
                                        <td className="px-5 py-3 font-medium text-navy">
                                            {s.heureDebut.slice(0, 5)} – {s.heureFin.slice(0, 5)}
                                        </td>
                                        <td className="px-5 py-3 text-navy">{s.matiereNom || <span className="text-slate text-xs">{s.matiereId.slice(0, 8)}…</span>}</td>
                                        <td className="px-5 py-3 text-navy">{s.enseignantNom || <span className="text-slate text-xs">{s.enseignantId.slice(0, 8)}…</span>}</td>
                                        <td className="px-5 py-3 text-navy">{s.classeNom || <span className="text-slate text-xs">{s.classeId.slice(0, 8)}…</span>}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ))}
        </div>
    );
}
