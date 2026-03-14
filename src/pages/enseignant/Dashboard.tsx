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
import TeacherSidebar from "../../components/layout/TeacherSidebar";
import TeacherHeader from "../../components/layout/TeacherHeader";

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
    const { user } = useAuth();
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
        <div className="min-h-screen flex bg-[#f8fafc] font-sans">
            <TeacherSidebar activeView={activeView} setActiveView={setActiveView} />

            <div className="ml-64 flex-1 flex flex-col min-h-screen">
                <TeacherHeader />

                <main className="flex-1 p-8 space-y-6">
                    {activeView === "emploi" && (
                        <section className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-6 md:p-8 animate-fadeUp transition-all duration-300">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Mon Emploi du Temps</h2>
                                    <p className="text-sm text-slate-500 mt-1">Saison 2025-2026 • Vue hebdomadaire</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    {loadingEmploi && (
                                        <span className="text-sm font-medium text-teal flex items-center gap-2">
                                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Chargement...
                                        </span>
                                    )}
                                    <button
                                        type="button"
                                        disabled={isDownloadingEmploi || emploiFlat.length === 0}
                                        onClick={handleDownloadEmploiPdf}
                                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-navy hover:border-slate-300 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                        {isDownloadingEmploi ? "Génération PDF..." : "Exporter PDF"}
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
                                <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                                        <svg className="w-12 h-12 text-teal" fill="currentColor" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" /><line stroke="white" strokeWidth="2" x1="16" y1="2" x2="16" y2="6" /><line stroke="white" strokeWidth="2" x1="8" y1="2" x2="8" y2="6" /><line stroke="white" strokeWidth="2" x1="3" y1="10" x2="21" y2="10" /></svg>
                                    </div>
                                    <p className="text-[12px] font-bold tracking-wider text-slate-400 uppercase mb-1">Total Séances</p>
                                    <p className="text-3xl font-display font-bold text-slate-800">{emploiStats.totalSeances}</p>
                                </div>
                                <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                                        <svg className="w-12 h-12 text-blue-500" fill="currentColor" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></svg>
                                    </div>
                                    <p className="text-[12px] font-bold tracking-wider text-slate-400 uppercase mb-1">Classes Enseignées</p>
                                    <p className="text-3xl font-display font-bold text-slate-800">{emploiStats.totalClasses}</p>
                                </div>
                                <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                                        <svg className="w-12 h-12 text-gold" fill="currentColor" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" /></svg>
                                    </div>
                                    <p className="text-[12px] font-bold tracking-wider text-slate-400 uppercase mb-1">Matières</p>
                                    <p className="text-3xl font-display font-bold text-slate-800">{emploiStats.totalMatieres}</p>
                                </div>
                            </div>

                            {!teacherUuid && (
                                <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 text-red-700 p-4 shadow-sm">
                                    <svg className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                    <div>
                                        <p className="font-semibold text-sm">Identifiant invalide</p>
                                        <p className="text-sm mt-1 opacity-90">L'identifiant enseignant ({teacherId || "absent"}) est invalide. Reconnectez-vous.</p>
                                    </div>
                                </div>
                            )}

                            {emploiError && (
                                <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 text-red-700 p-4 shadow-sm">
                                    <svg className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                    <p className="text-sm font-medium mt-0.5">{emploiError}</p>
                                </div>
                            )}

                            {!loadingEmploi && emploiByDay.length === 0 ? (
                                <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50">
                                    <svg className="w-12 h-12 text-slate-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                    <p className="text-base font-semibold text-slate-700 mb-1">Aucune séance planifiée</p>
                                    <p className="text-sm text-slate-500 max-w-sm">Votre emploi du temps est actuellement vide. Contactez l'administration si cela semble incorrect.</p>
                                </div>
                            ) : (
                                <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
                                    <div className="overflow-x-auto">
                                        <table className="min-w-[1000px] w-full text-sm border-collapse bg-white">
                                            <thead>
                                                <tr className="bg-slate-50 border-b border-slate-200">
                                                    <th className="px-5 py-4 text-left w-[130px] border-r border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">Horaire</th>
                                                    {CALENDAR_DAYS.map((day) => (
                                                        <th key={day} className="px-5 py-4 text-left border-r last:border-r-0 border-slate-200 text-xs font-bold text-slate-700 uppercase tracking-wider">
                                                            {DAY_LABELS[day]}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {TIME_SLOTS.map((slot) => (
                                                    <tr key={slot.key} className="group hover:bg-slate-50/50 transition-colors align-top">
                                                        <td className="px-5 py-4 text-slate-600 font-medium border-r border-slate-100 whitespace-nowrap bg-slate-50/30">
                                                            {slot.label}
                                                        </td>
                                                        {CALENDAR_DAYS.map((day) => {
                                                            const dayEntries = emploi
                                                                .filter((entry) => entry.jour === day)
                                                                .filter((entry) => isSessionInSlot(entry.heureDebut, entry.heureFin, slot.start, slot.end));

                                                            return (
                                                                <td key={`${slot.key}-${day}`} className="p-3 border-r last:border-r-0 border-slate-100 min-w-[150px]">
                                                                    {dayEntries.length === 0 ? (
                                                                        <div className="h-10 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                                                    ) : (
                                                                        <div className="space-y-2">
                                                                            {dayEntries.map((entry, idx) => (
                                                                                <div key={`${entry.id}-${idx}`} className="rounded-xl border border-teal-100 bg-teal-50/60 p-3 shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:border-teal-200 hover:bg-teal-50 transition-all cursor-default">
                                                                                    <p className="text-xs font-bold text-teal-800 leading-tight mb-1">{entry.matiereNom || entry.matiereId || "Matière"}</p>
                                                                                    <div className="flex items-center gap-2 mt-1.5">
                                                                                        <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-white text-slate-600 shadow-sm border border-slate-100">
                                                                                            {entry.classeNom || entry.classeId || "-"}
                                                                                        </span>
                                                                                        <span className="text-[10px] font-medium text-teal-600 opacity-90">
                                                                                            {normalizeTime(entry.heureDebut)} - {normalizeTime(entry.heureFin)}
                                                                                        </span>
                                                                                    </div>
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
                                </div>
                            )}
                        </section>
                    )}

                    {activeView === "notes" && (
                        <section className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-6 md:p-8 animate-fadeUp transition-all duration-300 space-y-8">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Saisie des Notes</h2>
                                    <p className="text-sm text-slate-500 mt-1">Évaluez vos élèves par séance et par matière</p>
                                </div>
                                {loadingNotes && (
                                    <span className="text-sm font-medium text-teal flex items-center gap-2">
                                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Chargement...
                                    </span>
                                )}
                            </div>

                            <form onSubmit={handleCreateNote} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Séance</label>
                                        <div className="relative">
                                            <select
                                                value={selectedNoteSeanceId}
                                                onChange={(e) => handleNoteSeanceChange(e.target.value)}
                                                className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100 transition-all font-medium"
                                            >
                                                <option value="">Sélectionnez une séance</option>
                                                {teacherSeances.map((seance) => (
                                                    <option key={seance.id} value={seance.id}>
                                                        {DAY_LABELS[seance.jour]} {normalizeTime(seance.heureDebut)} | {seance.classeNom || seance.classeId}
                                                    </option>
                                                ))}
                                            </select>
                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Élève</label>
                                        <div className="relative">
                                            <select
                                                value={selectedNoteEleveId}
                                                onChange={(e) => setSelectedNoteEleveId(e.target.value)}
                                                className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100 transition-all font-medium"
                                            >
                                                <option value="">Sélectionnez un élève</option>
                                                {noteClasseEleves.map((eleve) => (
                                                    <option key={eleve.id} value={eleve.id}>{eleve.prenom} {eleve.nom}</option>
                                                ))}
                                            </select>
                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Type d'évaluation</label>
                                        <div className="relative">
                                            <select
                                                value={noteType}
                                                onChange={(e) => setNoteType(e.target.value as NoteType)}
                                                className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100 transition-all font-medium"
                                            >
                                                <option value="DEVOIR">Devoir Continu</option>
                                                <option value="EXAMEN">Examen Final</option>
                                            </select>
                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Ordre de l'éval.</label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={noteNumeroExamen}
                                            onChange={(e) => setNoteNumeroExamen(e.target.value)}
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100 transition-all font-medium"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Note (sur 20)</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                min="0"
                                                max="20"
                                                step="0.25"
                                                value={noteValue}
                                                onChange={(e) => setNoteValue(e.target.value)}
                                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100 transition-all font-bold text-lg"
                                                placeholder="Ex: 15.5"
                                            />
                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400 font-bold">
                                                / 20
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Appréciation / Commentaire</label>
                                        <input
                                            type="text"
                                            value={noteCommentaire}
                                            onChange={(e) => setNoteCommentaire(e.target.value)}
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100 transition-all font-medium"
                                            placeholder="Optionnel : Très bon travail..."
                                        />
                                    </div>
                                </div>

                                {selectedNoteSeance && (
                                    <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 shrink-0 flex items-center flex-wrap gap-x-8 gap-y-3 shadow-sm">
                                        <div>
                                            <p className="text-[10px] font-bold tracking-wider text-indigo-400 uppercase">Classe active</p>
                                            <p className="text-sm font-bold text-indigo-900 mt-0.5">{selectedNoteSeance.classeNom || selectedNoteSeance.classeId}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold tracking-wider text-indigo-400 uppercase">Matière</p>
                                            <p className="text-sm font-bold text-indigo-900 mt-0.5">{selectedNoteSeance.matiereNom || selectedNoteSeance.matiereId}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold tracking-wider text-indigo-400 uppercase">Horaire du cours</p>
                                            <p className="text-sm font-bold text-indigo-900 mt-0.5">{DAY_LABELS[selectedNoteSeance.jour]} {normalizeTime(selectedNoteSeance.heureDebut)} à {normalizeTime(selectedNoteSeance.heureFin)}</p>
                                        </div>
                                    </div>
                                )}

                                {notesSubmitError && (
                                    <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 text-red-700 p-4 shadow-sm">
                                        <svg className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                        <p className="text-sm font-medium mt-0.5">{notesSubmitError}</p>
                                    </div>
                                )}
                                {notesSubmitSuccess && (
                                    <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 p-4 shadow-sm">
                                        <svg className="w-5 h-5 flex-shrink-0 mt-0.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        <p className="text-sm font-medium mt-0.5">{notesSubmitSuccess}</p>
                                    </div>
                                )}

                                <div className="flex justify-end pt-2">
                                    <button
                                        type="submit"
                                        disabled={isSavingNote}
                                        className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white text-sm font-bold px-8 py-3 rounded-xl shadow-[0_4px_14px_0_rgba(99,102,241,0.39)] hover:shadow-[0_6px_20px_rgba(99,102,241,0.23)] hover:scale-[1.02] hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-70 disabled:hover:scale-100 disabled:hover:translate-y-0"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                                        {isSavingNote ? "Enregistrement..." : "Valider la note"}
                                    </button>
                                </div>
                            </form>

                            <div className="pt-8 border-t border-slate-100">
                                <div className="flex items-center justify-between gap-3 mb-5">
                                    <h3 className="text-lg font-bold text-slate-800 tracking-tight">Historique des notes (Classe sélectionnée)</h3>
                                </div>

                                {notesError && (
                                    <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 text-red-700 p-4 shadow-sm">
                                        <p className="text-sm font-medium">{notesError}</p>
                                    </div>
                                )}

                                {!selectedNoteSeance ? (
                                    <div className="flex items-center justify-center p-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-500 text-sm font-medium">
                                        Sélectionnez une séance pour afficher les notes déjà enregistrées.
                                    </div>
                                ) : notesList.length === 0 ? (
                                    <div className="flex items-center justify-center p-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-500 text-sm font-medium">
                                        Aucune note enregistrée pour cette séance.
                                    </div>
                                ) : (
                                    <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full text-sm text-left">
                                                <thead>
                                                    <tr className="bg-slate-50 border-b border-slate-200">
                                                        <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Élève</th>
                                                        <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Type</th>
                                                        <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">N° Éval.</th>
                                                        <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Note</th>
                                                        <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider min-w-[200px]">Appréciation</th>
                                                        <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100 bg-white">
                                                    {notesList.map((note) => (
                                                        <tr key={note.id} className="hover:bg-slate-50/80 transition-colors group">
                                                            <td className="px-5 py-4 whitespace-nowrap">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-bold border border-slate-200">
                                                                        {note.elevePrenom?.charAt(0)}{note.eleveNom?.charAt(0)}
                                                                    </div>
                                                                    <span className="font-semibold text-slate-800">{`${note.elevePrenom || ""} ${note.eleveNom || ""}`.trim() || note.eleveId}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-5 py-4 whitespace-nowrap">
                                                                {editingNoteId === note.id ? (
                                                                    <select
                                                                        value={editNoteType}
                                                                        onChange={(e) => setEditNoteType(e.target.value as NoteType)}
                                                                        className="w-full rounded-lg border border-indigo-200 bg-indigo-50 px-2 py-1.5 text-xs font-semibold text-indigo-800 outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                                                                    >
                                                                        <option value="DEVOIR">DEVOIR</option>
                                                                        <option value="EXAMEN">EXAMEN</option>
                                                                    </select>
                                                                ) : (
                                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                                                        {note.type_note || note.typeNote || "-"}
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className="px-5 py-4 whitespace-nowrap text-slate-600 font-medium">
                                                                {editingNoteId === note.id ? (
                                                                    <input
                                                                        type="number"
                                                                        min="1"
                                                                        value={editNoteNumeroExamen}
                                                                        onChange={(e) => setEditNoteNumeroExamen(e.target.value)}
                                                                        className="w-16 rounded-lg border border-indigo-200 bg-indigo-50 px-2 py-1.5 text-xs font-semibold text-indigo-800 outline-none focus:ring-2 focus:ring-indigo-200 text-center"
                                                                    />
                                                                ) : `#${note.numeroExamen}`}
                                                            </td>
                                                            <td className="px-5 py-4 whitespace-nowrap">
                                                                {editingNoteId === note.id ? (
                                                                    <input
                                                                        type="number"
                                                                        min="0"
                                                                        max="20"
                                                                        step="0.25"
                                                                        value={editNoteValeur}
                                                                        onChange={(e) => setEditNoteValeur(e.target.value)}
                                                                        className="w-20 rounded-lg border border-emerald-300 bg-emerald-50 px-2 py-1.5 text-sm font-bold text-emerald-800 outline-none focus:ring-2 focus:ring-emerald-200 text-center"
                                                                    />
                                                                ) : (
                                                                    <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-md text-sm font-bold border ${note.valeur !== undefined && note.valeur >= 10 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                                                        {note.valeur} / 20
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className="px-5 py-4 text-slate-600 text-sm w-1/3">
                                                                {editingNoteId === note.id ? (
                                                                    <input
                                                                        type="text"
                                                                        value={editNoteCommentaire}
                                                                        onChange={(e) => setEditNoteCommentaire(e.target.value)}
                                                                        className="w-full rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-800 outline-none focus:ring-2 focus:ring-indigo-200"
                                                                        placeholder="Appréciation..."
                                                                    />
                                                                ) : (
                                                                    <span className="italic">{note.commentaire || <span className="text-slate-400 not-italic">-</span>}</span>
                                                                )}
                                                            </td>
                                                            <td className="px-5 py-4 whitespace-nowrap text-right">
                                                                {editingNoteId === note.id ? (
                                                                    <div className="flex items-center justify-end gap-2">
                                                                        <button
                                                                            type="button"
                                                                            onClick={cancelEditNote}
                                                                            className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors shadow-sm"
                                                                        >
                                                                            Annuler
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => saveEditNote(note)}
                                                                            disabled={isUpdatingNote}
                                                                            className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-70 flex items-center gap-1.5"
                                                                        >
                                                                            {isUpdatingNote ? (
                                                                                <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                                                            ) : (
                                                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                                                            )}
                                                                            Sauver
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => startEditNote(note)}
                                                                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                                                                        title="Modifier la note"
                                                                    >
                                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                                                    </button>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </section>
                    )}

                    {activeView === "classes" && (
                        <section className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-6 md:p-8 animate-fadeUp transition-all duration-300">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Mes Classes</h2>
                                    <p className="text-sm text-slate-500 mt-1">Vos groupes d'élèves assignés</p>
                                </div>
                                {loadingClasses && (
                                    <span className="text-sm font-medium text-teal flex items-center gap-2">
                                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Chargement...
                                    </span>
                                )}
                            </div>

                            {!teacherUuid && (
                                <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 text-red-700 p-4 shadow-sm">
                                    <svg className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                    <div>
                                        <p className="font-semibold text-sm">Identifiant invalide</p>
                                        <p className="text-sm mt-1 opacity-90">L'identifiant enseignant ({teacherId || "absent"}) est invalide.</p>
                                    </div>
                                </div>
                            )}

                            {classesError && (
                                <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 text-red-700 p-4 shadow-sm">
                                    <svg className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                    <p className="text-sm font-medium mt-0.5">{classesError}</p>
                                </div>
                            )}

                            {!loadingClasses && teacherClasses.length === 0 ? (
                                <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50">
                                    <svg className="w-12 h-12 text-slate-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                                    <p className="text-base font-semibold text-slate-700 mb-1">Aucune classe trouvée</p>
                                    <p className="text-sm text-slate-500 max-w-sm">Vous n'avez actuellement aucune classe assignée.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                                    {teacherClasses.map((classe) => (
                                        <article key={classe.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
                                            <div className="flex items-start justify-between gap-4 mb-5">
                                                <div>
                                                    <h3 className="text-lg font-bold text-slate-800">{classe.name}</h3>
                                                    <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 mt-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-500/10">
                                                        Niveau: {classe.levelClasse || "-"}
                                                    </span>
                                                </div>
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-teal-700 text-sm font-semibold border border-teal-100">
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                                                    {classe.eleves?.length || 0} élève(s)
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3 mb-5">
                                                <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 flex items-center gap-3">
                                                    <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-100">
                                                        <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                    </div>
                                                    <div>
                                                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Année</p>
                                                        <p className="text-sm font-bold text-slate-700">{classe.anneeScolaire || "-"}</p>
                                                    </div>
                                                </div>
                                                <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 flex items-center gap-3">
                                                    <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-100">
                                                        <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                                                    </div>
                                                    <div>
                                                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Salle</p>
                                                        <p className="text-sm font-bold text-slate-700 truncate">{classe.salleAttribuee || "Non définie"}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div>
                                                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 ml-1">Liste des élèves</p>
                                                {!classe.eleves || classe.eleves.length === 0 ? (
                                                    <p className="text-sm text-slate-500 italic ml-1">Aucun élève dans cette classe.</p>
                                                ) : (
                                                    <div className="space-y-2 max-h-52 overflow-y-auto pr-2 custom-scrollbar">
                                                        {classe.eleves.map((eleve) => (
                                                            <div key={eleve.id} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white hover:bg-slate-50 transition-colors px-4 py-2.5">
                                                                <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-bold border border-indigo-100">
                                                                    {eleve.prenom?.charAt(0)}{eleve.nom?.charAt(0)}
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-semibold text-slate-700">{eleve.prenom} {eleve.nom}</p>
                                                                    <p className="text-xs text-slate-500">{eleve.email}</p>
                                                                </div>
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
                        <section className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-6 md:p-8 animate-fadeUp transition-all duration-300">
                            <div className="mb-8">
                                <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Déclaration des absences</h2>
                                <p className="text-sm text-slate-500 mt-1">Gérez les présences pour vos séances assignées</p>
                            </div>

                            {seancesError && (
                                <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 text-red-700 p-4 shadow-sm">
                                    <svg className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                    <p className="text-sm font-medium mt-0.5">{seancesError}</p>
                                </div>
                            )}

                            <form onSubmit={handleSubmitAbsence} className="space-y-8">
                                <div className="p-6 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-6">
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-2">Informations de la séance</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-slate-600 ml-1">Séance concernée</label>
                                            <div className="relative">
                                                <select
                                                    value={selectedSeanceId}
                                                    onChange={(e) => handleSeanceChange(e.target.value)}
                                                    className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition-all shadow-sm"
                                                >
                                                    <option value="">Sélectionnez une séance</option>
                                                    {teacherSeances.map((seance) => (
                                                        <option key={seance.id} value={seance.id}>
                                                            {DAY_LABELS[seance.jour]} {normalizeTime(seance.heureDebut)} | {seance.matiereNom || seance.matiereId}
                                                        </option>
                                                    ))}
                                                </select>
                                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-slate-600 ml-1">Date d'enregistrement</label>
                                            <div className="relative">
                                                <input
                                                    type="date"
                                                    value={date}
                                                    onChange={(e) => setDate(e.target.value)}
                                                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition-all shadow-sm date-input-modern text-left"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-slate-600 ml-1">Type de déclaration</label>
                                            <div className="relative">
                                                <select
                                                    value={type}
                                                    onChange={(e) => setType(e.target.value as AbsenceType)}
                                                    className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition-all shadow-sm"
                                                >
                                                    <option value="ABSENCE">Absence (Non justifiée)</option>
                                                    <option value="RETARD">Retard</option>
                                                </select>
                                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-slate-600 ml-1">Motif (optionnel)</label>
                                            <input
                                                type="text"
                                                value={motif}
                                                onChange={(e) => setMotif(e.target.value)}
                                                placeholder="Ex: Raison médicale..."
                                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition-all shadow-sm"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-800 tracking-tight">Liste des élèves</h3>
                                            <p className="text-xs text-slate-500 mt-0.5">Cochez les élèves concernés par l'absence ou le retard</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={toggleAllEleves}
                                            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors border border-transparent hover:border-indigo-100"
                                        >
                                            {selectedEleveIds.length === classeEleves.length && classeEleves.length > 0 ? "Tout désélectionner" : "Tout sélectionner"}
                                        </button>
                                    </div>

                                    {loadingEleves || loadingSeances ? (
                                        <div className="flex flex-col items-center justify-center p-10 bg-slate-50 rounded-2xl border border-slate-100">
                                            <svg className="animate-spin h-6 w-6 text-indigo-500 mb-3" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                            <p className="text-sm font-medium text-slate-600">Chargement des élèves...</p>
                                        </div>
                                    ) : !selectedSeance ? (
                                        <div className="flex flex-col items-center justify-center p-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                                            <svg className="w-10 h-10 text-slate-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                            <p className="text-sm font-medium text-slate-500 text-center max-w-sm">Choisissez d'abord une séance ci-dessus pour afficher la liste des élèves.</p>
                                        </div>
                                    ) : classeEleves.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center p-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                                            <p className="text-sm font-medium text-slate-500 text-center">Aucun élève trouvé pour cette séance.</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                            {classeEleves.map((eleve) => {
                                                const isSelected = selectedEleveIds.includes(eleve.id);
                                                return (
                                                    <label
                                                        key={eleve.id}
                                                        className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition-all duration-200 shadow-sm ${isSelected ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-200 scale-[1.02]' : 'bg-white border-slate-200 hover:border-indigo-100 hover:bg-slate-50 hover:shadow-md'}`}
                                                    >
                                                        <div className={`flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-md border ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-300 text-transparent'} transition-colors`}>
                                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                                        </div>
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={() => toggleEleve(eleve.id)}
                                                            className="hidden"
                                                        />
                                                        <div className="flex items-center gap-2.5 overflow-hidden">
                                                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${isSelected ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>
                                                                {eleve.prenom?.charAt(0)}{eleve.nom?.charAt(0)}
                                                            </div>
                                                            <span className={`text-sm truncate font-medium ${isSelected ? 'text-indigo-900' : 'text-slate-700'}`}>
                                                                {eleve.prenom} <span className="uppercase">{eleve.nom}</span>
                                                            </span>
                                                        </div>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {submitError && (
                                    <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 text-red-700 p-4 shadow-sm animate-fadeUp">
                                        <svg className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                        <p className="text-sm font-medium mt-0.5">{submitError}</p>
                                    </div>
                                )}

                                {submitSuccess && (
                                    <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 p-4 shadow-sm animate-fadeUp">
                                        <svg className="w-5 h-5 flex-shrink-0 mt-0.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        <p className="text-sm font-medium mt-0.5">{submitSuccess}</p>
                                    </div>
                                )}

                                <div className="flex justify-end pt-4 border-t border-slate-100 mt-8">
                                    <button
                                        type="submit"
                                        disabled={isSubmitting || selectedEleveIds.length === 0}
                                        className="flex items-center gap-2 bg-gradient-to-r from-teal-500 to-teal-600 text-white text-sm font-bold px-8 py-3 rounded-xl shadow-[0_4px_14px_0_rgba(20,184,166,0.39)] hover:shadow-[0_6px_20px_rgba(20,184,166,0.23)] hover:scale-[1.02] hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:hover:scale-100 disabled:hover:translate-y-0 disabled:shadow-none disabled:bg-slate-300 disabled:from-slate-300 disabled:to-slate-300 disabled:text-slate-500"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        {isSubmitting ? "Enregistrement..." : `Valider ${selectedEleveIds.length > 0 ? `(${selectedEleveIds.length})` : ''} absence${selectedEleveIds.length > 1 ? 's' : ''}`}
                                    </button>
                                </div>
                            </form>
                        </section>
                    )}
                </main>
            </div>
        </div>
    );
}
