import React, { useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Layout from "../../components/layout/Layout";
import StatCard from "../../components/layout/StatCard";
import { useClasses } from "../../hooks/useClasses";
import { useEnseignents } from "../../hooks/useEnseignents";
import { useMatieres } from "../../hooks/useMatieres";
import seanceService from "../../services/user/seanceService";
import type { EmploiEntry, EmploiGroup, JourSemaine, SeanceCreatePayload } from "../../services/user/seanceService";

const JOURS: { value: JourSemaine; label: string }[] = [
    { value: "MONDAY", label: "Lundi" },
    { value: "TUESDAY", label: "Mardi" },
    { value: "WEDNESDAY", label: "Mercredi" },
    { value: "THURSDAY", label: "Jeudi" },
    { value: "FRIDAY", label: "Vendredi" },
    { value: "SATURDAY", label: "Samedi" },
    { value: "SUNDAY", label: "Dimanche" },
];

const WEEK_DAYS = [
    { key: "MONDAY", label: "Lundi" },
    { key: "TUESDAY", label: "Mardi" },
    { key: "WEDNESDAY", label: "Mercredi" },
    { key: "THURSDAY", label: "Jeudi" },
    { key: "FRIDAY", label: "Vendredi" },
] as const;

const WEEK_DAY_SET: Set<string> = new Set(WEEK_DAYS.map((day) => day.key));

const TIME_SLOTS = Array.from({ length: 10 }, (_, index) => {
    const hour = 8 + index;
    const nextHour = hour + 1;
    return {
        key: `${String(hour).padStart(2, "0")}:00`,
        label: `${String(hour).padStart(2, "0")}:00 - ${String(nextHour).padStart(2, "0")}:00`,
    };
});

type ViewMode = "classes" | "enseignants";

export default function Seances() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [listRefreshKey, setListRefreshKey] = useState(0);
    const [viewMode, setViewMode] = useState<ViewMode>("classes");
    const [emploiClasses, setEmploiClasses] = useState<EmploiGroup[]>([]);
    const [emploiEnseignants, setEmploiEnseignants] = useState<EmploiGroup[]>([]);
    const [loadingClasses, setLoadingClasses] = useState(false);
    const [loadingEnseignants, setLoadingEnseignants] = useState(false);
    const [classesError, setClassesError] = useState<string | null>(null);
    const [enseignantsError, setEnseignantsError] = useState<string | null>(null);

    const { classes } = useClasses();
    const { enseignents } = useEnseignents();
    const { matieres } = useMatieres();

    const [formData, setFormData] = useState<SeanceCreatePayload>({
        classeId: "",
        matiereId: "",
        enseignantId: "",
        jour: "MONDAY",
        heureDebut: "",
        heureFin: "",
    });

    useEffect(() => {
        const loadOverviews = async () => {
            setLoadingClasses(true);
            setLoadingEnseignants(true);
            setClassesError(null);
            setEnseignantsError(null);

            const [classesResult, enseignantsResult] = await Promise.allSettled([
                seanceService.getAllEmploisClasses(),
                seanceService.getAllEmploisEnseignants(),
            ]);

            if (classesResult.status === "fulfilled") {
                setEmploiClasses(classesResult.value);
            } else {
                setClassesError(classesResult.reason instanceof Error ? classesResult.reason.message : "Erreur chargement emplois des classes");
                setEmploiClasses([]);
            }

            if (enseignantsResult.status === "fulfilled") {
                setEmploiEnseignants(enseignantsResult.value);
            } else {
                setEnseignantsError(enseignantsResult.reason instanceof Error ? enseignantsResult.reason.message : "Erreur chargement emplois des enseignants");
                setEmploiEnseignants([]);
            }

            setLoadingClasses(false);
            setLoadingEnseignants(false);
        };

        void loadOverviews();
    }, [listRefreshKey]);

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
            setListRefreshKey((key) => key + 1);
        } catch (error) {
            setFormError(error instanceof Error ? error.message : "Erreur lors de la creation de la seance");
        } finally {
            setIsSubmitting(false);
        }
    };

    const currentGroups = useMemo(() => {
        const source = viewMode === "classes" ? emploiClasses : emploiEnseignants;
        const normalizedSearch = searchTerm.trim().toLowerCase();

        if (!normalizedSearch) return source;

        return source.filter((group) => {
            const haystack = [
                group.label,
                ...group.entries.flatMap((entry) => [
                    entry.matiereNom ?? entry.matiereId,
                    entry.enseignantNom ?? entry.enseignantId,
                    entry.classeNom ?? entry.classeId,
                ]),
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            return haystack.includes(normalizedSearch);
        });
    }, [emploiClasses, emploiEnseignants, searchTerm, viewMode]);

    const totalClasses = emploiClasses.length;
    const totalEnseignants = emploiEnseignants.length;
    const totalEntries = emploiClasses.reduce((sum, group) => sum + group.entries.length, 0);
    const currentLoading = viewMode === "classes" ? loadingClasses : loadingEnseignants;
    const currentError = viewMode === "classes" ? classesError : enseignantsError;

    return (
        <Layout>
            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                    <h2 className="font-display text-[22px] text-navy leading-tight">Emploi du temps</h2>
                    <p className="text-slate text-[13px] mt-0.5">Vue globale des emplois des classes et des enseignants</p>
                </div>
                <button
                    type="button"
                    onClick={() => setIsModalOpen(true)}
                    className="nav-active text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-teal hover:opacity-95 transition-opacity"
                >
                    + Nouvelle seance
                </button>
            </div>

            <div className="grid grid-cols-3 gap-5">
                <StatCard
                    title="Emplois des classes"
                    value={totalClasses}
                    icon={(<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>)}
                    trendValue="Classes planifiees"
                    trendIcon={(<svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><polyline points="18 15 12 9 6 15" /></svg>)}
                    colorTheme={{ gradient: "linear-gradient(90deg,#0E9E8E,#16BCA8)", iconBg: "rgba(14,158,142,.1)", iconColor: "#0E9E8E", trendBg: "rgba(91,173,139,.15)", trendColor: "#5BAD8B" }}
                    delay="0.05s"
                />
                <StatCard
                    title="Emplois des enseignants"
                    value={totalEnseignants}
                    icon={(<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>)}
                    trendValue="Enseignants planifies"
                    trendIcon={(<svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><polyline points="18 15 12 9 6 15" /></svg>)}
                    colorTheme={{ gradient: "linear-gradient(90deg,#E8A020,#F5B84C)", iconBg: "rgba(232,160,32,.1)", iconColor: "#E8A020", trendBg: "rgba(232,160,32,.15)", trendColor: "#E8A020" }}
                    delay="0.1s"
                />
                <StatCard
                    title="Seances planifiees"
                    value={totalEntries}
                    icon={(<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>)}
                    trendValue="Toutes categories"
                    trendIcon={(<svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><polyline points="18 15 12 9 6 15" /></svg>)}
                    colorTheme={{ gradient: "linear-gradient(90deg,#E05C5C,#f08080)", iconBg: "rgba(224,92,92,.1)", iconColor: "#E05C5C", trendBg: "rgba(224,92,92,.12)", trendColor: "#E05C5C" }}
                    delay="0.15s"
                />
            </div>

            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                    <button
                        type="button"
                        onClick={() => setViewMode("classes")}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${viewMode === "classes" ? "nav-active text-white shadow-teal" : "border border-navy/10 text-navy hover:bg-ice"}`}
                    >
                        Emplois des classes
                    </button>
                    <button
                        type="button"
                        onClick={() => setViewMode("enseignants")}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${viewMode === "enseignants" ? "nav-active text-white shadow-teal" : "border border-navy/10 text-navy hover:bg-ice"}`}
                    >
                        Emplois des enseignants
                    </button>
                </div>

                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-72 rounded-xl border border-navy/10 bg-white px-3 py-2.5 text-sm text-navy outline-none focus:border-teal"
                    placeholder={viewMode === "classes" ? "Rechercher une classe, matiere, enseignant..." : "Rechercher un enseignant, classe, matiere..."}
                />
            </div>

            {currentLoading ? (
                <div className="bg-white rounded-2xl p-6 shadow-card">
                    <p className="text-slate text-sm">Chargement des emplois du temps...</p>
                </div>
            ) : currentError ? (
                <div className="bg-white rounded-2xl p-6 shadow-card">
                    <p className="text-coral text-sm">{currentError}</p>
                </div>
            ) : currentGroups.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 shadow-card text-center">
                    <p className="text-slate text-sm">Aucun emploi du temps trouve pour cette vue.</p>
                </div>
            ) : (
                <div className="space-y-5">
                    {currentGroups.map((group) => (
                        <EmploiCard
                            key={`${group.type}-${group.id}`}
                            group={group}
                            viewMode={viewMode}
                            onDownloadPdf={() => downloadEmploiPdf(group, viewMode)}
                        />
                    ))}
                </div>
            )}

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
                                        {classes.map((classe) => (
                                            <option key={classe.id} value={classe.id}>{classe.name} ({classe.levelClasse})</option>
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
                                        {matieres.map((matiere) => (
                                            <option key={matiere.id} value={matiere.id}>{matiere.nom}</option>
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
                                        {enseignents.map((enseignant) => (
                                            <option key={enseignant.id} value={enseignant.id}>{enseignant.prenom} {enseignant.nom}</option>
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
                                        {JOURS.map((jour) => (
                                            <option key={jour.value} value={jour.value}>{jour.label}</option>
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
        </Layout>
    );
}

function EmploiCard({ group, viewMode, onDownloadPdf }: { group: EmploiGroup; viewMode: ViewMode; onDownloadPdf: () => void }) {
    const { weeklyCells, invalidEntries } = useMemo(() => buildWeeklyCells(group.entries), [group.entries]);

    return (
        <div className="bg-white rounded-2xl shadow-card overflow-hidden">
            <div className="px-5 py-4 border-b border-navy/8 flex items-center justify-between gap-3 flex-wrap">
                <div>
                    <h3 className="font-display text-[18px] text-navy leading-tight">{group.label}</h3>
                    <p className="text-[12px] text-slate mt-1">
                        {group.entries.length} seance{group.entries.length > 1 ? "s" : ""} | {viewMode === "classes" ? "Vue classe" : "Vue enseignant"}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={onDownloadPdf}
                    className="px-4 py-2 rounded-xl border border-gold/30 text-gold text-sm font-medium hover:bg-gold/5 transition-colors"
                >
                    Telecharger PDF
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full min-w-[920px] text-sm">
                    <thead>
                        <tr className="border-b border-navy/8">
                            <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate uppercase tracking-wide">Heure</th>
                            {WEEK_DAYS.map((day) => (
                                <th key={day.key} className="text-left px-5 py-3 text-[11px] font-semibold text-slate uppercase tracking-wide">{day.label}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {TIME_SLOTS.map((slot, rowIndex) => (
                            <tr key={slot.key} className={`${rowIndex % 2 === 0 ? "" : "bg-ice/10"} border-b border-navy/5`}>
                                <td className="px-5 py-3 font-medium text-navy whitespace-nowrap">{slot.label}</td>
                                {WEEK_DAYS.map((day) => {
                                    const entries = weeklyCells.get(`${day.key}-${slot.key}`) ?? [];
                                    return (
                                        <td key={`${day.key}-${slot.key}`} className="px-5 py-3 align-top min-w-[170px]">
                                            {entries.length === 0 ? (
                                                <span className="text-[12px] text-slate">-</span>
                                            ) : (
                                                <div className="space-y-2">
                                                    {entries.map((entry) => (
                                                        <div key={entry.id} className="rounded-xl border border-teal/20 bg-teal/5 px-3 py-2">
                                                            <p className="text-[12px] font-semibold text-navy leading-tight">{entry.matiereNom || entry.matiereId}</p>
                                                            <p className="text-[11px] text-slate leading-tight mt-1">
                                                                {viewMode === "classes" ? (entry.enseignantNom || entry.enseignantId) : (entry.classeNom || entry.classeId)}
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {invalidEntries.length > 0 && (
                <div className="m-5 p-3 rounded-xl bg-coral/10 border border-coral/20">
                    <p className="text-coral text-sm font-semibold mb-2">Donnees invalides detectees</p>
                    <div className="space-y-1">
                        {invalidEntries.map((entry) => (
                            <p key={entry.id} className="text-coral text-xs break-all">
                                {entry.matiereNom || entry.matiereId} | {entry.jour || "Jour manquant"} | {entry.heureDebut || "Heure debut manquante"} - {entry.heureFin || "Heure fin manquante"}
                            </p>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function buildWeeklyCells(entries: EmploiEntry[]) {
    const weeklyCells = new Map<string, EmploiEntry[]>();
    const invalidEntries: EmploiEntry[] = [];

    for (const entry of entries) {
        if (!entry.jour || !entry.heureDebut || !entry.heureFin || !WEEK_DAY_SET.has(entry.jour)) {
            invalidEntries.push(entry);
            continue;
        }

        const startHour = Number.parseInt(entry.heureDebut.slice(0, 2), 10);
        const endHour = Number.parseInt(entry.heureFin.slice(0, 2), 10);

        if (Number.isNaN(startHour) || Number.isNaN(endHour) || endHour <= startHour) {
            invalidEntries.push(entry);
            continue;
        }

        let placed = false;

        for (let hour = startHour; hour < endHour; hour += 1) {
            if (hour < 8 || hour >= 18) continue;
            const slotKey = `${String(hour).padStart(2, "0")}:00`;
            const cellKey = `${entry.jour}-${slotKey}`;
            const cellEntries = weeklyCells.get(cellKey) ?? [];
            cellEntries.push(entry);
            weeklyCells.set(cellKey, cellEntries);
            placed = true;
        }

        if (!placed) invalidEntries.push(entry);
    }

    return { weeklyCells, invalidEntries };
}

function downloadEmploiPdf(group: EmploiGroup, viewMode: ViewMode) {
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const { weeklyCells, invalidEntries } = buildWeeklyCells(group.entries);

    doc.setFontSize(16);
    doc.text(`Emploi du temps - ${group.label}`, 14, 14);
    doc.setFontSize(10);
    doc.text(viewMode === "classes" ? "Vue classe" : "Vue enseignant", 14, 20);

    autoTable(doc, {
        head: [["Heure", ...WEEK_DAYS.map((day) => day.label)]],
        body: TIME_SLOTS.map((slot) => [
            slot.label,
            ...WEEK_DAYS.map((day) => {
                const entries = weeklyCells.get(`${day.key}-${slot.key}`) ?? [];
                if (entries.length === 0) return "-";
                return entries
                    .map((entry) => `${entry.matiereNom || entry.matiereId}\n${viewMode === "classes" ? (entry.enseignantNom || entry.enseignantId) : (entry.classeNom || entry.classeId)}`)
                    .join("\n\n");
            }),
        ]),
        startY: 26,
        styles: { fontSize: 8, cellPadding: 2, overflow: "linebreak" },
        headStyles: { fillColor: [14, 158, 142] },
        theme: "grid",
    });

    const finalY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 26;

    if (invalidEntries.length > 0) {
        autoTable(doc, {
            head: [["Entrees invalides"]],
            body: invalidEntries.map((entry) => [
                `${entry.matiereNom || entry.matiereId} | ${entry.jour || "Jour manquant"} | ${entry.heureDebut || "Heure debut manquante"} - ${entry.heureFin || "Heure fin manquante"}`,
            ]),
            startY: finalY + 8,
            styles: { fontSize: 8, textColor: [192, 59, 59] },
            headStyles: { fillColor: [224, 92, 92] },
            theme: "grid",
        });
    }

    doc.save(`${slugify(group.label)}-emploi.pdf`);
}

function slugify(value: string) {
    return value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || "emploi";
}
