import { useEffect, useMemo, useState } from "react";
import Layout from "../../components/layout/Layout";
import StatCard from "../../components/layout/StatCard";
import { useClasses } from "../../hooks/useClasses";
import { useEleves } from "../../hooks/useEleves";
import { useEnseignents } from "../../hooks/useEnseignents";
import seanceService from "../../services/user/seanceService";
import type { Seance } from "../../services/user/seanceService";
import absenceService from "../../services/user/absenceService";
import type { Absence, AbsenceBulkPayload, AbsenceType } from "../../services/user/absenceService";

export default function Absences() {
    const { classes } = useClasses();
    const { eleves } = useEleves();
    const { enseignents } = useEnseignents();

    const [seances, setSeances] = useState<Seance[]>([]);
    const [absences, setAbsences] = useState<Absence[]>([]);
    const [loadingAbsences, setLoadingAbsences] = useState(false);
    const [absencesError, setAbsencesError] = useState<string | null>(null);
    const [absencesRefreshKey, setAbsencesRefreshKey] = useState(0);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
    const [formError, setFormError] = useState<string | null>(null);

    const [selectedClasseId, setSelectedClasseId] = useState("");
    const [selectedSeanceId, setSelectedSeanceId] = useState("");
    const [selectedEleveIds, setSelectedEleveIds] = useState<string[]>([]);
    const [formData, setFormData] = useState<Omit<AbsenceBulkPayload, "eleveIds" | "classeId" | "seanceId">>({
        enseignantId: "",
        date: new Date().toISOString().slice(0, 10),
        heureDebut: "",
        heureFin: "",
        type: "ABSENCE",
        motif: "",
    });

    useEffect(() => {
        seanceService.getAllSeances()
            .then(setSeances)
            .catch(() => setSeances([]));
    }, []);

    useEffect(() => {
        setLoadingAbsences(true);
        setAbsencesError(null);
        absenceService.getAllAbsences()
            .then((data) => { setAbsences(data); setLoadingAbsences(false); })
            .catch((err) => {
                setAbsencesError(err instanceof Error ? err.message : "Erreur de chargement");
                setAbsences([]);
                setLoadingAbsences(false);
            });
    }, [absencesRefreshKey]);

    const classEleves = useMemo(() =>
        selectedClasseId ? eleves.filter((e) => e.classeId === selectedClasseId || e.classe === selectedClasseId) : [],
        [eleves, selectedClasseId]
    );

    const classSeances = useMemo(() =>
        selectedClasseId ? seances.filter((s) => s.classeId === selectedClasseId) : seances,
        [seances, selectedClasseId]
    );

    const handleClasseChange = (classeId: string) => {
        setSelectedClasseId(classeId);
        setSelectedEleveIds([]);
        setSelectedSeanceId("");
        setFormData((prev) => ({ ...prev, enseignantId: "", heureDebut: "", heureFin: "" }));
    };

    const handleSeanceChange = (seanceId: string) => {
        setSelectedSeanceId(seanceId);
        const seance = seances.find((s) => s.id === seanceId);
        if (seance) {
            setFormData((prev) => ({
                ...prev,
                enseignantId: seance.enseignantId || prev.enseignantId,
                heureDebut: seance.heureDebut || prev.heureDebut,
                heureFin: seance.heureFin || prev.heureFin,
            }));
        }
    };

    const toggleEleve = (id: string) => {
        setSelectedEleveIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    const toggleAll = () => {
        if (selectedEleveIds.length === classEleves.length && classEleves.length > 0) {
            setSelectedEleveIds([]);
        } else {
            setSelectedEleveIds(classEleves.map((e) => e.id));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);
        setSubmitSuccess(null);

        if (selectedEleveIds.length === 0) {
            setFormError("Sélectionnez au moins un élève.");
            return;
        }
        if (!selectedClasseId) {
            setFormError("Sélectionnez une classe.");
            return;
        }
        if (!formData.enseignantId) {
            setFormError("Sélectionnez un enseignant.");
            return;
        }
        if (!formData.date || !formData.heureDebut || !formData.heureFin) {
            setFormError("Remplissez la date et les heures.");
            return;
        }

        const payload: AbsenceBulkPayload = {
            eleveIds: selectedEleveIds,
            classeId: selectedClasseId,
            seanceId: selectedSeanceId || undefined,
            enseignantId: formData.enseignantId,
            date: formData.date,
            heureDebut: formData.heureDebut,
            heureFin: formData.heureFin,
            type: formData.type,
            motif: formData.motif || undefined,
        };

        try {
            setIsSubmitting(true);
            await absenceService.createBulk(payload);
            setSubmitSuccess(`${selectedEleveIds.length} absence(s) enregistrée(s) avec succès.`);
            setSelectedEleveIds([]);
            setSelectedSeanceId("");
            setFormData((prev) => ({ ...prev, motif: "" }));
            setAbsencesRefreshKey((k) => k + 1);
        } catch (err) {
            setFormError(err instanceof Error ? err.message : "Erreur lors de l'enregistrement.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const totalAbsences = absences.filter((a) => a.type === "ABSENCE").length;
    const totalRetards = absences.filter((a) => a.type === "RETARD").length;
    const withMotif = absences.filter((a) => a.motif).length;

    return (
        <Layout>
            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-navy">Absences & Retards</h2>
                        <p className="text-sm text-slate mt-0.5">Enregistrement et suivi des absences</p>
                    </div>
                </div>

                {/* Stat cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <StatCard
                        title="Total absences"
                        value={String(totalAbsences)}
                        icon={
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                                <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                            </svg>
                        }
                        trendValue="Type ABSENCE"
                        trendIcon={<svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9" /></svg>}
                        colorTheme={{ gradient: "linear-gradient(90deg,#E05C5C,#f08080)", iconBg: "rgba(224,92,92,.1)", iconColor: "#E05C5C", trendBg: "rgba(224,92,92,.12)", trendColor: "#E05C5C" }}
                    />
                    <StatCard
                        title="Retards"
                        value={String(totalRetards)}
                        icon={
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                            </svg>
                        }
                        trendValue="Type RETARD"
                        trendIcon={<svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9" /></svg>}
                        colorTheme={{ gradient: "linear-gradient(90deg,#E8A020,#F5B84C)", iconBg: "rgba(232,160,32,.1)", iconColor: "#E8A020", trendBg: "rgba(232,160,32,.12)", trendColor: "#E8A020" }}
                    />
                    <StatCard
                        title="Avec motif"
                        value={String(withMotif)}
                        icon={
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" />
                                <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
                            </svg>
                        }
                        trendValue="Absences justifiées"
                        trendIcon={<svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><polyline points="18 15 12 9 6 15" /></svg>}
                        colorTheme={{ gradient: "linear-gradient(90deg,#0E9E8E,#16BCA8)", iconBg: "rgba(14,158,142,.1)", iconColor: "#0E9E8E", trendBg: "rgba(14,158,142,.12)", trendColor: "#0E9E8E" }}
                    />
                </div>

                {/* Form */}
                <div className="bg-white rounded-2xl shadow-sm border border-ice p-6">
                    <h3 className="font-semibold text-navy text-base mb-4">Enregistrer des absences</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">

                        {/* Row 1: Classe + Séance */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate mb-1 uppercase tracking-wide">Classe</label>
                                <select
                                    value={selectedClasseId}
                                    onChange={(e) => handleClasseChange(e.target.value)}
                                    className="w-full border border-ice rounded-xl px-3 py-2 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-teal/40"
                                >
                                    <option value="">-- Sélectionner une classe --</option>
                                    {classes.map((c) => (
                                        <option key={c.id} value={c.id}>{c.name || c.id}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate mb-1 uppercase tracking-wide">Séance (optionnel)</label>
                                <select
                                    value={selectedSeanceId}
                                    onChange={(e) => handleSeanceChange(e.target.value)}
                                    className="w-full border border-ice rounded-xl px-3 py-2 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-teal/40"
                                >
                                    <option value="">-- Sélectionner une séance --</option>
                                    {classSeances.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.matiereNom || s.matiereId} — {s.jour} {s.heureDebut}–{s.heureFin}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Students checkboxes */}
                        {selectedClasseId && (
                            <div>
                                <label className="block text-xs font-semibold text-slate mb-2 uppercase tracking-wide">
                                    Élèves de la classe
                                    {classEleves.length > 0 && (
                                        <span className="ml-2 text-teal normal-case font-normal">({classEleves.length} élèves)</span>
                                    )}
                                </label>
                                {classEleves.length === 0 ? (
                                    <p className="text-xs text-slate italic">Aucun élève trouvé pour cette classe.</p>
                                ) : (
                                    <div className="border border-ice rounded-xl p-3 max-h-48 overflow-y-auto space-y-1">
                                        <label className="flex items-center gap-2 cursor-pointer py-1 border-b border-ice/60 mb-1">
                                            <input
                                                type="checkbox"
                                                checked={selectedEleveIds.length === classEleves.length}
                                                onChange={toggleAll}
                                                className="accent-teal w-4 h-4"
                                            />
                                            <span className="text-sm font-semibold text-navy">Sélectionner tous</span>
                                        </label>
                                        {classEleves.map((eleve) => (
                                            <label key={eleve.id} className="flex items-center gap-2 cursor-pointer py-1 rounded hover:bg-ice/40 px-1">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedEleveIds.includes(eleve.id)}
                                                    onChange={() => toggleEleve(eleve.id)}
                                                    className="accent-teal w-4 h-4"
                                                />
                                                <span className="text-sm text-navy">{eleve.prenom} {eleve.nom}</span>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Row 2: Date + heures */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate mb-1 uppercase tracking-wide">Date</label>
                                <input
                                    type="date"
                                    value={formData.date}
                                    onChange={(e) => setFormData((p) => ({ ...p, date: e.target.value }))}
                                    required
                                    className="w-full border border-ice rounded-xl px-3 py-2 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-teal/40"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate mb-1 uppercase tracking-wide">Heure début</label>
                                <input
                                    type="time"
                                    value={formData.heureDebut}
                                    onChange={(e) => setFormData((p) => ({ ...p, heureDebut: e.target.value }))}
                                    required
                                    className="w-full border border-ice rounded-xl px-3 py-2 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-teal/40"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate mb-1 uppercase tracking-wide">Heure fin</label>
                                <input
                                    type="time"
                                    value={formData.heureFin}
                                    onChange={(e) => setFormData((p) => ({ ...p, heureFin: e.target.value }))}
                                    required
                                    className="w-full border border-ice rounded-xl px-3 py-2 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-teal/40"
                                />
                            </div>
                        </div>

                        {/* Row 3: Enseignant + Type + Motif */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate mb-1 uppercase tracking-wide">Enseignant</label>
                                <select
                                    value={formData.enseignantId}
                                    onChange={(e) => setFormData((p) => ({ ...p, enseignantId: e.target.value }))}
                                    required
                                    className="w-full border border-ice rounded-xl px-3 py-2 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-teal/40"
                                >
                                    <option value="">-- Enseignant --</option>
                                    {enseignents.map((en) => (
                                        <option key={en.id} value={en.id}>{en.prenom} {en.nom}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate mb-1 uppercase tracking-wide">Type</label>
                                <div className="flex gap-4 mt-2">
                                    {(["ABSENCE", "RETARD"] as AbsenceType[]).map((t) => (
                                        <label key={t} className="flex items-center gap-1.5 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="absenceType"
                                                value={t}
                                                checked={formData.type === t}
                                                onChange={() => setFormData((p) => ({ ...p, type: t }))}
                                                className="accent-teal"
                                            />
                                            <span className={`text-sm font-medium ${t === "ABSENCE" ? "text-coral" : "text-gold"}`}>{t}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate mb-1 uppercase tracking-wide">Motif</label>
                                <input
                                    type="text"
                                    value={formData.motif}
                                    onChange={(e) => setFormData((p) => ({ ...p, motif: e.target.value }))}
                                    placeholder="Ex: Absence justifiée"
                                    className="w-full border border-ice rounded-xl px-3 py-2 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-teal/40"
                                />
                            </div>
                        </div>

                        {/* Error / success */}
                        {formError && (
                            <div className="bg-coral/10 border border-coral/30 text-coral text-sm rounded-xl px-4 py-2">
                                {formError}
                            </div>
                        )}
                        {submitSuccess && (
                            <div className="bg-teal/10 border border-teal/30 text-teal text-sm rounded-xl px-4 py-2">
                                {submitSuccess}
                            </div>
                        )}

                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="px-6 py-2 rounded-xl text-sm font-semibold text-white transition"
                                style={{ background: isSubmitting ? "#aaa" : "linear-gradient(135deg,#0E9E8E,#16BCA8)" }}
                            >
                                {isSubmitting ? "Enregistrement…" : `Enregistrer (${selectedEleveIds.length} élève${selectedEleveIds.length !== 1 ? "s" : ""})`}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Absences list */}
                <div className="bg-white rounded-2xl shadow-sm border border-ice">
                    <div className="px-6 py-4 border-b border-ice flex items-center justify-between">
                        <h3 className="font-semibold text-navy text-base">Historique des absences</h3>
                        <button
                            onClick={() => setAbsencesRefreshKey((k) => k + 1)}
                            className="text-xs text-teal font-semibold hover:underline"
                        >
                            Actualiser
                        </button>
                    </div>

                    {loadingAbsences ? (
                        <div className="p-8 text-center text-slate text-sm">Chargement…</div>
                    ) : absencesError ? (
                        <div className="p-8 text-center text-coral text-sm">{absencesError}</div>
                    ) : absences.length === 0 ? (
                        <div className="p-8 text-center text-slate text-sm italic">Aucune absence enregistrée.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-ice/60 text-slate text-xs uppercase tracking-wide">
                                        <th className="px-4 py-3 text-left">Élève</th>
                                        <th className="px-4 py-3 text-left">Classe</th>
                                        <th className="px-4 py-3 text-left">Date</th>
                                        <th className="px-4 py-3 text-left">Heure</th>
                                        <th className="px-4 py-3 text-left">Type</th>
                                        <th className="px-4 py-3 text-left">Motif</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-ice">
                                    {absences.map((absence) => (
                                        <tr key={absence.id} className="hover:bg-ice/30 transition-colors">
                                            <td className="px-4 py-3 text-navy font-medium">
                                                {absence.elevePrenom || absence.eleveNom
                                                    ? `${absence.elevePrenom ?? ""} ${absence.eleveNom ?? ""}`.trim()
                                                    : absence.eleveId}
                                            </td>
                                            <td className="px-4 py-3 text-slate">{absence.classeNom || absence.classeId}</td>
                                            <td className="px-4 py-3 text-slate">{absence.date}</td>
                                            <td className="px-4 py-3 text-slate">{absence.heureDebut} – {absence.heureFin}</td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${absence.type === "ABSENCE" ? "bg-coral/10 text-coral" : "bg-gold/10 text-gold"}`}>
                                                    {absence.type}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-slate">{absence.motif || <span className="italic text-slate/50">—</span>}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}
