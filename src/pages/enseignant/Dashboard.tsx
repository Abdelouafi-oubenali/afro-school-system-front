import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useAuth } from "../../context/AuthContext";
import { useSeances, useEmploiByEnseignant } from "../../hooks/useSeances";
import { useEleves } from "../../hooks/useEleves";
import absenceService, { type AbsenceType } from "../../services/user/absenceService";
import type { Seance, JourSemaine } from "../../services/user/seanceService";

const DAY_LABELS: Record<JourSemaine, string> = {
    MONDAY: "Lundi",
    TUESDAY: "Mardi",
    WEDNESDAY: "Mercredi",
    THURSDAY: "Jeudi",
    FRIDAY: "Vendredi",
    SATURDAY: "Samedi",
    SUNDAY: "Dimanche",
};

const dayOrder: Record<JourSemaine, number> = {
    MONDAY: 1,
    TUESDAY: 2,
    WEDNESDAY: 3,
    THURSDAY: 4,
    FRIDAY: 5,
    SATURDAY: 6,
    SUNDAY: 7,
};

const CALENDAR_DAYS: JourSemaine[] = [
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
    "SUNDAY",
];

const TIME_SLOTS = Array.from({ length: 10 }, (_, index) => {
    const startHour = 8 + index;
    const endHour = startHour + 1;
    const start = `${String(startHour).padStart(2, "0")}:00`;
    const end = `${String(endHour).padStart(2, "0")}:00`;
    return {
        key: start,
        label: `${start} - ${end}`,
        start,
        end,
    };
});

function normalizeTime(value?: string | null): string {
    if (!value) return "";
    return value.length >= 5 ? value.slice(0, 5) : value;
}

function isTeacherRole(role?: string): boolean {
    return (role || "").toLowerCase().includes("enseign");
}

function isUuid(value?: string | null): boolean {
    if (!value) return false;
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function timeToMinutes(value?: string | null): number {
    if (!value) return -1;
    const normalized = value.length >= 5 ? value.slice(0, 5) : value;
    const [h, m] = normalized.split(":").map(Number);
    if (Number.isNaN(h) || Number.isNaN(m)) return -1;
    return h * 60 + m;
}

function isSessionInSlot(start?: string | null, end?: string | null, slotStart?: string, slotEnd?: string): boolean {
    const s = timeToMinutes(start);
    const e = timeToMinutes(end);
    const slotS = timeToMinutes(slotStart || null);
    const slotE = timeToMinutes(slotEnd || null);
    if (s < 0 || e < 0 || slotS < 0 || slotE < 0) return false;
    return s < slotE && e > slotS;
}

export default function EnseignantDashboard() {
    const { user, logout } = useAuth();
    const teacherId = user?.id || null;
    const teacherUuid = isUuid(teacherId) ? teacherId : null;
    const [activeView, setActiveView] = useState<"emploi" | "absences">("emploi");
    const [isDownloadingEmploi, setIsDownloadingEmploi] = useState(false);

    useEffect(() => {
        console.log("[EnseignantDashboard] debug teacher id", {
            teacherId,
            teacherUuid,
            role: user?.role,
            email: user?.email,
        });
    }, [teacherId, teacherUuid, user?.role, user?.email]);

    const { seances, loading: loadingSeances, error: seancesError } = useSeances();
    const { emploi, loading: loadingEmploi, error: emploiError } = useEmploiByEnseignant(teacherUuid);
    const { eleves, loading: loadingEleves } = useEleves();

    const [selectedSeanceId, setSelectedSeanceId] = useState("");
    const [selectedEleveIds, setSelectedEleveIds] = useState<string[]>([]);
    const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
    const [type, setType] = useState<AbsenceType>("ABSENCE");
    const [motif, setMotif] = useState("");
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const teacherSeances = useMemo(
        () => seances
            .filter((s) => s.enseignantId === teacherUuid)
            .sort((a, b) => {
                const dayA = dayOrder[a.jour] ?? 99;
                const dayB = dayOrder[b.jour] ?? 99;
                if (dayA !== dayB) return dayA - dayB;
                return (a.heureDebut || "99:99:99").localeCompare(b.heureDebut || "99:99:99");
            }),
        [seances, teacherUuid]
    );

    const selectedSeance = useMemo<Seance | null>(
        () => teacherSeances.find((s) => s.id === selectedSeanceId) || null,
        [teacherSeances, selectedSeanceId]
    );

    const classeEleves = useMemo(() => {
        if (!selectedSeance?.classeId) return [];
        return eleves.filter((eleve) => {
            const byClasseId = eleve.classeId && eleve.classeId === selectedSeance.classeId;
            const byClasse = eleve.classe && eleve.classe === selectedSeance.classeId;
            return Boolean(byClasseId || byClasse);
        });
    }, [eleves, selectedSeance]);

    const emploiByDay = useMemo(() => {
        const map = new Map<JourSemaine, typeof emploi>();
        for (const entry of emploi) {
            if (!entry.jour) continue;
            const list = map.get(entry.jour) || [];
            list.push(entry);
            map.set(entry.jour, list);
        }

        return Array.from(map.entries())
            .sort((a, b) => (dayOrder[a[0]] ?? 99) - (dayOrder[b[0]] ?? 99))
            .map(([jour, entries]) => ({
                jour,
                entries: entries.sort((a, b) => (a.heureDebut || "99:99:99").localeCompare(b.heureDebut || "99:99:99")),
            }));
    }, [emploi]);

    const emploiFlat = useMemo(
        () => emploiByDay.flatMap((group) =>
            group.entries.map((entry) => ({
                jour: DAY_LABELS[group.jour],
                heureDebut: normalizeTime(entry.heureDebut),
                heureFin: normalizeTime(entry.heureFin),
                matiere: entry.matiereNom || entry.matiereId || "-",
                classe: entry.classeNom || entry.classeId || "-",
            }))
        ),
        [emploiByDay]
    );

    const emploiStats = useMemo(() => {
        const classes = new Set<string>();
        const matieres = new Set<string>();

        emploi.forEach((entry) => {
            if (entry.classeNom || entry.classeId) {
                classes.add(entry.classeNom || entry.classeId || "");
            }
            if (entry.matiereNom || entry.matiereId) {
                matieres.add(entry.matiereNom || entry.matiereId || "");
            }
        });

        return {
            totalSeances: emploi.length,
            totalClasses: classes.size,
            totalMatieres: matieres.size,
        };
    }, [emploi]);

    const handleDownloadEmploiPdf = async () => {
        if (emploiFlat.length === 0) return;

        try {
            setIsDownloadingEmploi(true);
            const doc = new jsPDF({ unit: "pt", format: "a4" });
            doc.setFontSize(16);
            doc.text("Emploi du temps enseignant", 40, 48);
            doc.setFontSize(10);
            doc.text(`Enseignant: ${user?.name || "-"}`, 40, 66);
            doc.text(`Date export: ${new Date().toLocaleDateString("fr-FR")}`, 40, 82);

            autoTable(doc, {
                startY: 96,
                head: [["Jour", "Horaire", "Matiere", "Classe"]],
                body: emploiFlat.map((item) => [
                    item.jour,
                    `${item.heureDebut} - ${item.heureFin}`,
                    item.matiere,
                    item.classe,
                ]),
                headStyles: { fillColor: [26, 43, 74] },
                styles: { fontSize: 10, cellPadding: 6 },
            });

            doc.save(`emploi-enseignant-${(user?.name || "export").replace(/\s+/g, "-").toLowerCase()}.pdf`);
        } finally {
            setIsDownloadingEmploi(false);
        }
    };

    const toggleEleve = (eleveId: string) => {
        setSelectedEleveIds((prev) =>
            prev.includes(eleveId) ? prev.filter((id) => id !== eleveId) : [...prev, eleveId]
        );
    };

    const toggleAllEleves = () => {
        if (classeEleves.length === 0) return;
        if (selectedEleveIds.length === classeEleves.length) {
            setSelectedEleveIds([]);
            return;
        }
        setSelectedEleveIds(classeEleves.map((e) => e.id));
    };

    const handleSeanceChange = (id: string) => {
        setSelectedSeanceId(id);
        setSelectedEleveIds([]);
        setSubmitError(null);
        setSubmitSuccess(null);
    };

    const handleSubmitAbsence = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitError(null);
        setSubmitSuccess(null);

        if (!user) {
            setSubmitError("Session expirée. Reconnectez-vous.");
            return;
        }

        if (!selectedSeance) {
            setSubmitError("Veuillez choisir une séance.");
            return;
        }

        if (!teacherUuid) {
            setSubmitError("Identifiant enseignant invalide. Reconnectez-vous pour recharger un ID UUID.");
            return;
        }

        if (selectedEleveIds.length === 0) {
            setSubmitError("Veuillez sélectionner au moins un élève.");
            return;
        }

        if (!date) {
            setSubmitError("Veuillez renseigner la date.");
            return;
        }

        try {
            setIsSubmitting(true);
            await absenceService.createBulk({
                eleveIds: selectedEleveIds,
                classeId: selectedSeance.classeId,
                enseignantId: teacherUuid,
                seanceId: selectedSeance.id,
                date,
                heureDebut: selectedSeance.heureDebut,
                heureFin: selectedSeance.heureFin,
                type,
                motif: motif.trim() ? motif.trim() : undefined,
            });

            setSubmitSuccess(`${selectedEleveIds.length} absence(s) enregistrée(s).`);
            setSelectedEleveIds([]);
            setMotif("");
        } catch (error) {
            setSubmitError(error instanceof Error ? error.message : "Erreur lors de l'enregistrement des absences.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (!isTeacherRole(user.role)) {
        return <Navigate to="/dashboard" replace />;
    }

    return (
        <div className="min-h-screen bg-ice">
            <header className="sticky top-0 z-20 bg-white border-b border-navy/10">
                <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between gap-4">
                    <div>
                        <h1 className="font-display text-[24px] text-navy">Espace Enseignant</h1>
                        <p className="text-sm text-slate">Bienvenue {user.name}</p>
                        <div className="mt-3 flex items-center gap-2 flex-wrap">
                            <button
                                type="button"
                                onClick={() => setActiveView("emploi")}
                                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                                    activeView === "emploi"
                                        ? "nav-active text-white shadow-teal"
                                        : "border border-navy/15 text-navy hover:bg-ice"
                                }`}
                            >
                                Voir emploi
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveView("absences")}
                                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                                    activeView === "absences"
                                        ? "nav-active text-white shadow-teal"
                                        : "border border-navy/15 text-navy hover:bg-ice"
                                }`}
                            >
                                Voir absences
                            </button>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={logout}
                        className="px-4 py-2 rounded-xl border border-navy/20 text-navy text-sm font-semibold hover:bg-navy hover:text-white transition-colors"
                    >
                        Déconnexion
                    </button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6">
                {activeView === "emploi" && (
                <section className="bg-white rounded-2xl shadow-card border border-navy/10 p-5 md:p-6 animate-fadeUp">
                    <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
                        <h2 className="text-lg font-semibold text-navy">Mon emploi du temps</h2>
                        <div className="flex items-center gap-2">
                            {loadingEmploi && <span className="text-sm text-slate">Chargement...</span>}
                            <button
                                type="button"
                                disabled={isDownloadingEmploi || emploiFlat.length === 0}
                                onClick={handleDownloadEmploiPdf}
                                className="px-4 py-2 rounded-xl text-sm font-semibold nav-active text-white shadow-teal hover:opacity-95 transition-opacity disabled:opacity-60"
                            >
                                {isDownloadingEmploi ? "Téléchargement..." : "Télécharger emploi"}
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
                        <div className="rounded-xl border border-navy/10 bg-ice/40 p-3">
                            <p className="text-[11px] uppercase tracking-wide text-slate">Total séances</p>
                            <p className="text-2xl font-display text-navy mt-1">{emploiStats.totalSeances}</p>
                        </div>
                        <div className="rounded-xl border border-navy/10 bg-ice/40 p-3">
                            <p className="text-[11px] uppercase tracking-wide text-slate">Classes</p>
                            <p className="text-2xl font-display text-navy mt-1">{emploiStats.totalClasses}</p>
                        </div>
                        <div className="rounded-xl border border-navy/10 bg-ice/40 p-3">
                            <p className="text-[11px] uppercase tracking-wide text-slate">Matières</p>
                            <p className="text-2xl font-display text-navy mt-1">{emploiStats.totalMatieres}</p>
                        </div>
                    </div>

                    {!teacherUuid && (
                        <div className="mb-4 rounded-xl border border-coral/20 bg-coral/10 text-coral text-sm px-3 py-2">
                            Identifiant enseignant invalide ({teacherId || "absent"}). L'API emploi exige un UUID. Reconnectez-vous.
                        </div>
                    )}

                    {emploiError && (
                        <div className="mb-4 rounded-xl border border-coral/20 bg-coral/10 text-coral text-sm px-3 py-2">
                            {emploiError}
                        </div>
                    )}

                    {!loadingEmploi && emploiByDay.length === 0 ? (
                        <p className="text-sm text-slate">Aucune séance trouvée pour votre profil.</p>
                    ) : (
                        <div className="overflow-x-auto rounded-xl border border-navy/10">
                            <table className="min-w-[980px] w-full text-sm border-collapse">
                                <thead>
                                    <tr className="bg-ice/70 text-slate text-[11px] uppercase tracking-wide">
                                        <th className="px-3 py-2 text-left w-[120px] border-r border-navy/10">Heure</th>
                                        {CALENDAR_DAYS.map((day) => (
                                            <th key={day} className="px-3 py-2 text-left border-r last:border-r-0 border-navy/10">{DAY_LABELS[day]}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-navy/10">
                                    {TIME_SLOTS.map((slot) => (
                                        <tr key={slot.key} className="hover:bg-ice/30 transition-colors align-top">
                                            <td className="px-3 py-2 text-navy font-semibold border-r border-navy/10 bg-ice/40">{slot.label}</td>
                                            {CALENDAR_DAYS.map((day) => {
                                                const dayEntries = emploi
                                                    .filter((entry) => entry.jour === day)
                                                    .filter((entry) => isSessionInSlot(entry.heureDebut, entry.heureFin, slot.start, slot.end));

                                                return (
                                                    <td key={`${slot.key}-${day}`} className="px-2 py-2 border-r last:border-r-0 border-navy/10 min-w-[130px]">
                                                        {dayEntries.length === 0 ? (
                                                            <div className="h-8 rounded-lg border border-dashed border-navy/10 bg-ice/20" />
                                                        ) : (
                                                            <div className="space-y-1">
                                                                {dayEntries.map((entry, idx) => (
                                                                    <div key={`${entry.id}-${idx}`} className="rounded-lg border border-teal/20 bg-teal/8 px-2 py-1.5">
                                                                        <p className="text-[11px] font-semibold text-navy leading-tight">{entry.matiereNom || entry.matiereId || "Matière"}</p>
                                                                        <p className="text-[10px] text-slate leading-tight mt-0.5">{entry.classeNom || entry.classeId || "-"}</p>
                                                                        <p className="text-[10px] text-teal font-semibold mt-0.5">{normalizeTime(entry.heureDebut)} - {normalizeTime(entry.heureFin)}</p>
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
                    )}
                </section>
                )}

                {activeView === "absences" && (
                <section className="bg-white rounded-2xl shadow-card border border-navy/10 p-5 md:p-6 animate-fadeUp">
                    <h2 className="text-lg font-semibold text-navy mb-4">Déclaration des absences (mes séances uniquement)</h2>

                    {seancesError && (
                        <div className="mb-4 rounded-xl border border-coral/20 bg-coral/10 text-coral text-sm px-3 py-2">
                            {seancesError}
                        </div>
                    )}

                    <form onSubmit={handleSubmitAbsence} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-[12px] font-semibold text-slate mb-1">Séance</label>
                                <select
                                    value={selectedSeanceId}
                                    onChange={(e) => handleSeanceChange(e.target.value)}
                                    className="w-full rounded-xl border border-navy/10 bg-white px-3 py-2.5 text-sm text-navy outline-none focus:border-teal"
                                >
                                    <option value="">Choisir une séance</option>
                                    {teacherSeances.map((seance) => (
                                        <option key={seance.id} value={seance.id}>
                                            {DAY_LABELS[seance.jour]} {normalizeTime(seance.heureDebut)}-{normalizeTime(seance.heureFin)} | {seance.matiereNom || seance.matiereId}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-[12px] font-semibold text-slate mb-1">Date</label>
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="w-full rounded-xl border border-navy/10 bg-white px-3 py-2.5 text-sm text-navy outline-none focus:border-teal"
                                />
                            </div>

                            <div>
                                <label className="block text-[12px] font-semibold text-slate mb-1">Type</label>
                                <select
                                    value={type}
                                    onChange={(e) => setType(e.target.value as AbsenceType)}
                                    className="w-full rounded-xl border border-navy/10 bg-white px-3 py-2.5 text-sm text-navy outline-none focus:border-teal"
                                >
                                    <option value="ABSENCE">ABSENCE</option>
                                    <option value="RETARD">RETARD</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-[12px] font-semibold text-slate mb-1">Motif (optionnel)</label>
                                <input
                                    type="text"
                                    value={motif}
                                    onChange={(e) => setMotif(e.target.value)}
                                    placeholder="Ex: Maladie"
                                    className="w-full rounded-xl border border-navy/10 bg-white px-3 py-2.5 text-sm text-navy outline-none focus:border-teal"
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-[12px] font-semibold text-slate">Élèves de la séance</label>
                                <button
                                    type="button"
                                    onClick={toggleAllEleves}
                                    className="text-xs font-semibold text-teal hover:underline"
                                >
                                    {selectedEleveIds.length === classeEleves.length && classeEleves.length > 0 ? "Tout désélectionner" : "Tout sélectionner"}
                                </button>
                            </div>

                            {loadingEleves || loadingSeances ? (
                                <p className="text-sm text-slate">Chargement des élèves...</p>
                            ) : !selectedSeance ? (
                                <p className="text-sm text-slate">Choisissez une séance pour afficher les élèves.</p>
                            ) : classeEleves.length === 0 ? (
                                <p className="text-sm text-slate">Aucun élève trouvé pour cette séance.</p>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                    {classeEleves.map((eleve) => (
                                        <label
                                            key={eleve.id}
                                            className="flex items-center gap-2 rounded-xl border border-navy/10 px-3 py-2.5 bg-ice/40 hover:bg-ice/70 cursor-pointer"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedEleveIds.includes(eleve.id)}
                                                onChange={() => toggleEleve(eleve.id)}
                                                className="w-4 h-4 accent-teal"
                                            />
                                            <span className="text-sm text-navy">{eleve.prenom} {eleve.nom}</span>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>

                        {submitError && (
                            <div className="rounded-xl border border-coral/20 bg-coral/10 text-coral text-sm px-3 py-2">
                                {submitError}
                            </div>
                        )}

                        {submitSuccess && (
                            <div className="rounded-xl border border-teal/20 bg-teal/10 text-teal text-sm px-3 py-2">
                                {submitSuccess}
                            </div>
                        )}

                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="nav-active text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-teal hover:opacity-95 transition-opacity disabled:opacity-70"
                            >
                                {isSubmitting ? "Enregistrement..." : "Enregistrer les absences"}
                            </button>
                        </div>
                    </form>
                </section>
                )}
            </main>
        </div>
    );
}
