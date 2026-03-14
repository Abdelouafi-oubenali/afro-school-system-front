import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useAuth } from "../../context/AuthContext";
import { useSeances, useEmploiByEnseignant } from "../../hooks/useSeances";
import { useEleves } from "../../hooks/useEleves";
import absenceService, { type AbsenceType } from "../../services/user/absenceService";
import classService from "../../services/user/classService";
import type { ClassRoom } from "../../services/user/classService";
import noteService, { type Note, type NoteType } from "../../services/user/noteService";
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
    const [activeView, setActiveView] = useState<"emploi" | "classes" | "notes" | "absences">("emploi");
    const [isDownloadingEmploi, setIsDownloadingEmploi] = useState(false);
    const [teacherClasses, setTeacherClasses] = useState<ClassRoom[]>([]);
    const [loadingClasses, setLoadingClasses] = useState(false);
    const [classesError, setClassesError] = useState<string | null>(null);

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

    useEffect(() => {
        const loadTeacherClasses = async () => {
            if (!teacherUuid) {
                setTeacherClasses([]);
                setClassesError(null);
                return;
            }

            try {
                setLoadingClasses(true);
                setClassesError(null);
                const data = await classService.getClassesByEnseignant(teacherUuid);
                setTeacherClasses(Array.isArray(data) ? data : []);
            } catch (error) {
                setClassesError(error instanceof Error ? error.message : "Erreur de chargement des classes");
                setTeacherClasses([]);
            } finally {
                setLoadingClasses(false);
            }
        };

        void loadTeacherClasses();
    }, [teacherUuid]);

    const [selectedSeanceId, setSelectedSeanceId] = useState("");
    const [selectedEleveIds, setSelectedEleveIds] = useState<string[]>([]);
    const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
    const [type, setType] = useState<AbsenceType>("ABSENCE");
    const [motif, setMotif] = useState("");
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedNoteSeanceId, setSelectedNoteSeanceId] = useState("");
    const [selectedNoteEleveId, setSelectedNoteEleveId] = useState("");
    const [noteValue, setNoteValue] = useState("");
    const [noteType, setNoteType] = useState<NoteType>("EXAMEN");
    const [noteNumeroExamen, setNoteNumeroExamen] = useState("1");
    const [noteCommentaire, setNoteCommentaire] = useState("");
    const [notesList, setNotesList] = useState<Note[]>([]);
    const [loadingNotes, setLoadingNotes] = useState(false);
    const [notesError, setNotesError] = useState<string | null>(null);
    const [notesSubmitError, setNotesSubmitError] = useState<string | null>(null);
    const [notesSubmitSuccess, setNotesSubmitSuccess] = useState<string | null>(null);
    const [isSavingNote, setIsSavingNote] = useState(false);
    const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
    const [editNoteType, setEditNoteType] = useState<NoteType>("EXAMEN");
    const [editNoteNumeroExamen, setEditNoteNumeroExamen] = useState("1");
    const [editNoteValeur, setEditNoteValeur] = useState("");
    const [editNoteCommentaire, setEditNoteCommentaire] = useState("");
    const [isUpdatingNote, setIsUpdatingNote] = useState(false);

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

    const selectedNoteSeance = useMemo<Seance | null>(
        () => teacherSeances.find((s) => s.id === selectedNoteSeanceId) || null,
        [teacherSeances, selectedNoteSeanceId]
    );

    const classeEleves = useMemo(() => {
        if (!selectedSeance?.classeId) return [];
        return eleves.filter((eleve) => {
            const byClasseId = eleve.classeId && eleve.classeId === selectedSeance.classeId;
            const byClasse = eleve.classe && eleve.classe === selectedSeance.classeId;
            return Boolean(byClasseId || byClasse);
        });
    }, [eleves, selectedSeance]);

    const noteClasseEleves = useMemo(() => {
        if (!selectedNoteSeance?.classeId) return [];
        return eleves.filter((eleve) => {
            const byClasseId = eleve.classeId && eleve.classeId === selectedNoteSeance.classeId;
            const byClasse = eleve.classe && eleve.classe === selectedNoteSeance.classeId;
            return Boolean(byClasseId || byClasse);
        });
    }, [eleves, selectedNoteSeance]);

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

    useEffect(() => {
        const loadClassNotes = async () => {
            if (!teacherUuid || !selectedNoteSeance?.classeId) {
                setNotesList([]);
                setNotesError(null);
                return;
            }

            try {
                setLoadingNotes(true);
                setNotesError(null);
                const data = await noteService.getNotesByClasse(selectedNoteSeance.classeId);
                const filtered = data.filter((note) =>
                    note.enseignantId === teacherUuid &&
                    note.matiereId === selectedNoteSeance.matiereId
                );
                setNotesList(filtered);
            } catch (error) {
                setNotesError(error instanceof Error ? error.message : "Erreur de chargement des notes");
                setNotesList([]);
            } finally {
                setLoadingNotes(false);
            }
        };

        void loadClassNotes();
    }, [teacherUuid, selectedNoteSeance]);

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

    const handleNoteSeanceChange = (id: string) => {
        setSelectedNoteSeanceId(id);
        setSelectedNoteEleveId("");
        setNotesSubmitError(null);
        setNotesSubmitSuccess(null);
    };

    const handleCreateNote = async (e: React.FormEvent) => {
        e.preventDefault();
        setNotesSubmitError(null);
        setNotesSubmitSuccess(null);

        if (!teacherUuid) {
            setNotesSubmitError("Identifiant enseignant invalide. Reconnectez-vous.");
            return;
        }

        if (!selectedNoteSeance) {
            setNotesSubmitError("Choisissez une séance.");
            return;
        }

        if (!selectedNoteEleveId) {
            setNotesSubmitError("Choisissez un élève.");
            return;
        }

        const valeur = Number(noteValue);
        const numeroExamen = Number(noteNumeroExamen);

        if (Number.isNaN(valeur) || valeur < 0 || valeur > 20) {
            setNotesSubmitError("La note doit être comprise entre 0 et 20.");
            return;
        }

        if (Number.isNaN(numeroExamen) || numeroExamen < 1) {
            setNotesSubmitError("Le numéro d'examen doit être supérieur ou égal à 1.");
            return;
        }

        try {
            setIsSavingNote(true);
            const created = await noteService.createNote({
                eleveId: selectedNoteEleveId,
                matiereId: selectedNoteSeance.matiereId,
                enseignantId: teacherUuid,
                classeId: selectedNoteSeance.classeId,
                numeroExamen,
                valeur,
                type_note: noteType,
                commentaire: noteCommentaire.trim() || undefined,
            });

            setNotesList((prev) => [created, ...prev]);
            setNotesSubmitSuccess("Note enregistrée avec succès.");
            setSelectedNoteEleveId("");
            setNoteValue("");
            setNoteCommentaire("");
            setNoteNumeroExamen("1");
            setNoteType("EXAMEN");
        } catch (error) {
            setNotesSubmitError(error instanceof Error ? error.message : "Erreur lors de l'enregistrement de la note");
        } finally {
            setIsSavingNote(false);
        }
    };

    const startEditNote = (note: Note) => {
        setEditingNoteId(note.id);
        setEditNoteType((note.type_note || note.typeNote || "EXAMEN") as NoteType);
        setEditNoteNumeroExamen(String(note.numeroExamen || 1));
        setEditNoteValeur(String(note.valeur ?? ""));
        setEditNoteCommentaire(note.commentaire || "");
        setNotesSubmitError(null);
        setNotesSubmitSuccess(null);
    };

    const cancelEditNote = () => {
        setEditingNoteId(null);
    };

    const saveEditNote = async (note: Note) => {
        if (!teacherUuid) {
            setNotesSubmitError("Identifiant enseignant invalide. Reconnectez-vous.");
            return;
        }

        const valeur = Number(editNoteValeur);
        const numeroExamen = Number(editNoteNumeroExamen);

        if (Number.isNaN(valeur) || valeur < 0 || valeur > 20) {
            setNotesSubmitError("La note doit être comprise entre 0 et 20.");
            return;
        }

        if (Number.isNaN(numeroExamen) || numeroExamen < 1) {
            setNotesSubmitError("Le numéro d'examen doit être supérieur ou égal à 1.");
            return;
        }

        try {
            setIsUpdatingNote(true);
            setNotesSubmitError(null);
            setNotesSubmitSuccess(null);

            const updated = await noteService.updateNote(note.id, {
                eleveId: note.eleveId,
                matiereId: note.matiereId,
                enseignantId: teacherUuid,
                classeId: note.classeId,
                numeroExamen,
                valeur,
                type_note: editNoteType,
                commentaire: editNoteCommentaire.trim() || undefined,
            });

            setNotesList((prev) => prev.map((item) => (item.id === note.id ? { ...item, ...updated } : item)));
            setEditingNoteId(null);
            setNotesSubmitSuccess("Note mise à jour avec succès.");
        } catch (error) {
            setNotesSubmitError(error instanceof Error ? error.message : "Erreur lors de la mise à jour de la note");
        } finally {
            setIsUpdatingNote(false);
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
                            <button
                                type="button"
                                onClick={() => setActiveView("classes")}
                                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                                    activeView === "classes"
                                        ? "nav-active text-white shadow-teal"
                                        : "border border-navy/15 text-navy hover:bg-ice"
                                }`}
                            >
                                Mes classes
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveView("notes")}
                                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                                    activeView === "notes"
                                        ? "nav-active text-white shadow-teal"
                                        : "border border-navy/15 text-navy hover:bg-ice"
                                }`}
                            >
                                Mes notes
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

                {activeView === "notes" && (
                <section className="bg-white rounded-2xl shadow-card border border-navy/10 p-5 md:p-6 animate-fadeUp space-y-5">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                        <h2 className="text-lg font-semibold text-navy">Ajouter des notes à mes classes</h2>
                        {loadingNotes && <span className="text-sm text-slate">Chargement...</span>}
                    </div>

                    <form onSubmit={handleCreateNote} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-[12px] font-semibold text-slate mb-1">Séance</label>
                                <select
                                    value={selectedNoteSeanceId}
                                    onChange={(e) => handleNoteSeanceChange(e.target.value)}
                                    className="w-full rounded-xl border border-navy/10 bg-white px-3 py-2.5 text-sm text-navy outline-none focus:border-teal"
                                >
                                    <option value="">Choisir une séance</option>
                                    {teacherSeances.map((seance) => (
                                        <option key={seance.id} value={seance.id}>
                                            {DAY_LABELS[seance.jour]} {normalizeTime(seance.heureDebut)}-{normalizeTime(seance.heureFin)} | {seance.classeNom || seance.classeId} | {seance.matiereNom || seance.matiereId}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-[12px] font-semibold text-slate mb-1">Élève</label>
                                <select
                                    value={selectedNoteEleveId}
                                    onChange={(e) => setSelectedNoteEleveId(e.target.value)}
                                    className="w-full rounded-xl border border-navy/10 bg-white px-3 py-2.5 text-sm text-navy outline-none focus:border-teal"
                                >
                                    <option value="">Choisir un élève</option>
                                    {noteClasseEleves.map((eleve) => (
                                        <option key={eleve.id} value={eleve.id}>{eleve.prenom} {eleve.nom}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-[12px] font-semibold text-slate mb-1">Type</label>
                                <select
                                    value={noteType}
                                    onChange={(e) => setNoteType(e.target.value as NoteType)}
                                    className="w-full rounded-xl border border-navy/10 bg-white px-3 py-2.5 text-sm text-navy outline-none focus:border-teal"
                                >
                                    <option value="DEVOIR">DEVOIR</option>
                                    <option value="EXAMEN">EXAMEN</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-[12px] font-semibold text-slate mb-1">Numéro d'examen</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={noteNumeroExamen}
                                    onChange={(e) => setNoteNumeroExamen(e.target.value)}
                                    className="w-full rounded-xl border border-navy/10 bg-white px-3 py-2.5 text-sm text-navy outline-none focus:border-teal"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[12px] font-semibold text-slate mb-1">Note /20</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="20"
                                    step="0.25"
                                    value={noteValue}
                                    onChange={(e) => setNoteValue(e.target.value)}
                                    className="w-full rounded-xl border border-navy/10 bg-white px-3 py-2.5 text-sm text-navy outline-none focus:border-teal"
                                    placeholder="Ex: 15.5"
                                />
                            </div>
                            <div>
                                <label className="block text-[12px] font-semibold text-slate mb-1">Commentaire</label>
                                <input
                                    type="text"
                                    value={noteCommentaire}
                                    onChange={(e) => setNoteCommentaire(e.target.value)}
                                    className="w-full rounded-xl border border-navy/10 bg-white px-3 py-2.5 text-sm text-navy outline-none focus:border-teal"
                                    placeholder="Optionnel"
                                />
                            </div>
                        </div>

                        {selectedNoteSeance && (
                            <div className="rounded-xl border border-navy/10 bg-ice/40 p-3 text-sm text-navy grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div>
                                    <p className="text-[11px] uppercase tracking-wide text-slate">Classe</p>
                                    <p className="font-medium">{selectedNoteSeance.classeNom || selectedNoteSeance.classeId}</p>
                                </div>
                                <div>
                                    <p className="text-[11px] uppercase tracking-wide text-slate">Matière</p>
                                    <p className="font-medium">{selectedNoteSeance.matiereNom || selectedNoteSeance.matiereId}</p>
                                </div>
                                <div>
                                    <p className="text-[11px] uppercase tracking-wide text-slate">Horaire</p>
                                    <p className="font-medium">{DAY_LABELS[selectedNoteSeance.jour]} {normalizeTime(selectedNoteSeance.heureDebut)} - {normalizeTime(selectedNoteSeance.heureFin)}</p>
                                </div>
                            </div>
                        )}

                        {notesSubmitError && <div className="rounded-xl border border-coral/20 bg-coral/10 text-coral text-sm px-3 py-2">{notesSubmitError}</div>}
                        {notesSubmitSuccess && <div className="rounded-xl border border-teal/20 bg-teal/10 text-teal text-sm px-3 py-2">{notesSubmitSuccess}</div>}

                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={isSavingNote}
                                className="nav-active text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-teal hover:opacity-95 transition-opacity disabled:opacity-70"
                            >
                                {isSavingNote ? "Enregistrement..." : "Enregistrer la note"}
                            </button>
                        </div>
                    </form>

                    <div>
                        <div className="flex items-center justify-between gap-3 mb-3">
                            <h3 className="text-base font-semibold text-navy">Notes récentes de cette séance</h3>
                        </div>

                        {notesError && <div className="rounded-xl border border-coral/20 bg-coral/10 text-coral text-sm px-3 py-2 mb-3">{notesError}</div>}

                        {!selectedNoteSeance ? (
                            <p className="text-sm text-slate">Choisissez une séance pour afficher les notes.</p>
                        ) : notesList.length === 0 ? (
                            <p className="text-sm text-slate">Aucune note enregistrée pour cette classe et cette matière.</p>
                        ) : (
                            <div className="overflow-x-auto rounded-xl border border-navy/10">
                                <table className="min-w-full text-sm">
                                    <thead>
                                        <tr className="bg-ice/70 text-slate text-[11px] uppercase tracking-wide">
                                            <th className="px-3 py-2 text-left">Élève</th>
                                            <th className="px-3 py-2 text-left">Type</th>
                                            <th className="px-3 py-2 text-left">Examen</th>
                                            <th className="px-3 py-2 text-left">Valeur</th>
                                            <th className="px-3 py-2 text-left">Commentaire</th>
                                            <th className="px-3 py-2 text-left">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-navy/10">
                                        {notesList.map((note) => (
                                            <tr key={note.id} className="hover:bg-ice/40 transition-colors">
                                                <td className="px-3 py-2 text-navy font-medium">{`${note.elevePrenom || ""} ${note.eleveNom || ""}`.trim() || note.eleveId}</td>
                                                <td className="px-3 py-2 text-slate">
                                                    {editingNoteId === note.id ? (
                                                        <select
                                                            value={editNoteType}
                                                            onChange={(e) => setEditNoteType(e.target.value as NoteType)}
                                                            className="rounded-lg border border-navy/10 bg-white px-2 py-1 text-xs text-navy outline-none focus:border-teal"
                                                        >
                                                            <option value="DEVOIR">DEVOIR</option>
                                                            <option value="EXAMEN">EXAMEN</option>
                                                        </select>
                                                    ) : (note.type_note || note.typeNote || "-")}
                                                </td>
                                                <td className="px-3 py-2 text-slate">
                                                    {editingNoteId === note.id ? (
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            value={editNoteNumeroExamen}
                                                            onChange={(e) => setEditNoteNumeroExamen(e.target.value)}
                                                            className="w-20 rounded-lg border border-navy/10 bg-white px-2 py-1 text-xs text-navy outline-none focus:border-teal"
                                                        />
                                                    ) : note.numeroExamen}
                                                </td>
                                                <td className="px-3 py-2 text-navy font-semibold">
                                                    {editingNoteId === note.id ? (
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max="20"
                                                            step="0.25"
                                                            value={editNoteValeur}
                                                            onChange={(e) => setEditNoteValeur(e.target.value)}
                                                            className="w-24 rounded-lg border border-navy/10 bg-white px-2 py-1 text-xs text-navy outline-none focus:border-teal"
                                                        />
                                                    ) : note.valeur}
                                                </td>
                                                <td className="px-3 py-2 text-slate">
                                                    {editingNoteId === note.id ? (
                                                        <input
                                                            type="text"
                                                            value={editNoteCommentaire}
                                                            onChange={(e) => setEditNoteCommentaire(e.target.value)}
                                                            className="w-full min-w-[140px] rounded-lg border border-navy/10 bg-white px-2 py-1 text-xs text-navy outline-none focus:border-teal"
                                                            placeholder="Optionnel"
                                                        />
                                                    ) : (note.commentaire || "-")}
                                                </td>
                                                <td className="px-3 py-2">
                                                    {editingNoteId === note.id ? (
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => saveEditNote(note)}
                                                                disabled={isUpdatingNote}
                                                                className="px-2.5 py-1 rounded-lg bg-teal text-white text-xs font-semibold disabled:opacity-60"
                                                            >
                                                                {isUpdatingNote ? "..." : "Enregistrer"}
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={cancelEditNote}
                                                                className="px-2.5 py-1 rounded-lg border border-navy/15 text-navy text-xs font-semibold"
                                                            >
                                                                Annuler
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={() => startEditNote(note)}
                                                            className="px-2.5 py-1 rounded-lg border border-teal/20 bg-teal/10 text-teal text-xs font-semibold"
                                                        >
                                                            Modifier
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </section>
                )}

                {activeView === "classes" && (
                <section className="bg-white rounded-2xl shadow-card border border-navy/10 p-5 md:p-6 animate-fadeUp">
                    <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
                        <h2 className="text-lg font-semibold text-navy">Mes classes</h2>
                        {loadingClasses && <span className="text-sm text-slate">Chargement...</span>}
                    </div>

                    {!teacherUuid && (
                        <div className="mb-4 rounded-xl border border-coral/20 bg-coral/10 text-coral text-sm px-3 py-2">
                            Identifiant enseignant invalide ({teacherId || "absent"}). L'API classes exige un UUID.
                        </div>
                    )}

                    {classesError && (
                        <div className="mb-4 rounded-xl border border-coral/20 bg-coral/10 text-coral text-sm px-3 py-2">
                            {classesError}
                        </div>
                    )}

                    {!loadingClasses && teacherClasses.length === 0 ? (
                        <p className="text-sm text-slate">Aucune classe trouvée pour cet enseignant.</p>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {teacherClasses.map((classe) => (
                                <article key={classe.id} className="rounded-xl border border-navy/10 bg-ice/30 p-4">
                                    <div className="flex items-start justify-between gap-2 mb-3">
                                        <div>
                                            <h3 className="text-base font-semibold text-navy">{classe.name}</h3>
                                            <p className="text-xs text-slate mt-0.5">Niveau: {classe.levelClasse || "-"}</p>
                                        </div>
                                        <span className="inline-flex px-2 py-0.5 rounded-full bg-teal/10 text-teal text-[11px] font-semibold">
                                            {classe.eleves?.length || 0} élève(s)
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                                        <div className="rounded-lg border border-navy/10 bg-white px-2 py-1.5">
                                            <p className="text-slate">Année</p>
                                            <p className="text-navy font-medium">{classe.anneeScolaire || "-"}</p>
                                        </div>
                                        <div className="rounded-lg border border-navy/10 bg-white px-2 py-1.5">
                                            <p className="text-slate">Salle</p>
                                            <p className="text-navy font-medium">{classe.salleAttribuee || "Non définie"}</p>
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-[12px] font-semibold text-slate mb-2">Élèves</p>
                                        {!classe.eleves || classe.eleves.length === 0 ? (
                                            <p className="text-xs text-slate italic">Aucun élève dans cette classe.</p>
                                        ) : (
                                            <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                                                {classe.eleves.map((eleve) => (
                                                    <div key={eleve.id} className="rounded-lg border border-navy/10 bg-white px-2.5 py-2">
                                                        <p className="text-sm text-navy font-medium leading-tight">{eleve.prenom} {eleve.nom}</p>
                                                        <p className="text-[11px] text-slate leading-tight mt-0.5">{eleve.email}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </article>
                            ))}
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
