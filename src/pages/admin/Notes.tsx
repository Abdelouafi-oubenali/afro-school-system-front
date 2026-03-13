import { useMemo, useState } from "react";
import Layout from "../../components/layout/Layout";
import StatCard from "../../components/layout/StatCard";
import { useClasses } from "../../hooks/useClasses";
import { useEleves } from "../../hooks/useEleves";
import { useEnseignents } from "../../hooks/useEnseignents";
import { useMatieres } from "../../hooks/useMatieres";
import noteService from "../../services/user/noteService";
import type { Note, NoteCreatePayload, NoteType, NoteUpdatePayload } from "../../services/user/noteService";

interface NoteSummaryRow {
    key: string;
    eleveId: string;
    eleveNom: string;
    classeNom: string;
    matiereNom: string;
    enseignantNom: string;
    notesByExam: Map<number, Note>;
    notes: Note[];
}

export default function Notes() {
    const { classes } = useClasses();
    const { eleves } = useEleves();
    const { matieres } = useMatieres();
    const { enseignents } = useEnseignents();

    const [notes, setNotes] = useState<Note[]>([]);
    const [loadingNotes, setLoadingNotes] = useState(false);
    const [notesError, setNotesError] = useState<string | null>(null);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isAddFormOpen, setIsAddFormOpen] = useState(false);

    const [formData, setFormData] = useState<NoteCreatePayload>({
        eleveId: "",
        matiereId: "",
        enseignantId: "",
        classeId: "",
        numeroExamen: 1,
        valeur: 0,
        type_note: "EXAMEN",
        commentaire: "",
    });

    const [queryEleveId, setQueryEleveId] = useState("");
    const [queryClasseId, setQueryClasseId] = useState("");
    const [queryMatiereId, setQueryMatiereId] = useState("");
    const [selectedSummary, setSelectedSummary] = useState<NoteSummaryRow | null>(null);
    const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const [editError, setEditError] = useState<string | null>(null);
    const [editSuccess, setEditSuccess] = useState<string | null>(null);
    const [editFormData, setEditFormData] = useState<NoteUpdatePayload>({
        eleveId: "",
        matiereId: "",
        enseignantId: "",
        classeId: "",
        numeroExamen: 1,
        valeur: 0,
        type_note: "EXAMEN",
        commentaire: "",
    });

    const elevesOfSelectedClass = useMemo(() => {
        if (!formData.classeId) return eleves;
        return eleves.filter((e) => e.classeId === formData.classeId || e.classe === formData.classeId);
    }, [eleves, formData.classeId]);

    const queryElevesOfSelectedClass = useMemo(() => {
        if (!queryClasseId) return eleves;
        return eleves.filter((e) => e.classeId === queryClasseId || e.classe === queryClasseId);
    }, [eleves, queryClasseId]);

    const averageNote = useMemo(() => {
        if (notes.length === 0) return 0;
        const sum = notes.reduce((acc, n) => acc + Number(n.valeur || 0), 0);
        return sum / notes.length;
    }, [notes]);

    const uniqueStudents = useMemo(
        () => new Set(notes.map((n) => n.eleveId).filter(Boolean)).size,
        [notes]
    );

    const summaryRows = useMemo<NoteSummaryRow[]>(() => {
        const groups = new Map<string, NoteSummaryRow>();

        for (const note of notes) {
            const key = `${note.eleveId}-${note.classeId}-${note.matiereId}`;
            const eleveNom = `${note.elevePrenom || ""} ${note.eleveNom || ""}`.trim() || note.eleveId;
            const classeNom = note.classeNom || note.classeId;
            const matiereNom = note.matiereNom || note.matiereId;
            const enseignantNom = note.enseignantNom || note.enseignantId;

            const existing = groups.get(key);
            if (!existing) {
                groups.set(key, {
                    key,
                    eleveId: note.eleveId,
                    eleveNom,
                    classeNom,
                    matiereNom,
                    enseignantNom,
                    notesByExam: new Map([[Number(note.numeroExamen), note]]),
                    notes: [note],
                });
                continue;
            }

            existing.notes.push(note);
            const examNumber = Number(note.numeroExamen);
            const already = existing.notesByExam.get(examNumber);

            if (!already || String(note.id) > String(already.id)) {
                existing.notesByExam.set(examNumber, note);
            }
        }

        return Array.from(groups.values()).sort((a, b) => a.eleveNom.localeCompare(b.eleveNom));
    }, [notes]);

    const examColumns = useMemo(() => {
        const maxExam = notes.reduce((max, n) => Math.max(max, Number(n.numeroExamen) || 0), 0);
        const total = Math.max(3, maxExam);
        return Array.from({ length: total }, (_, index) => index + 1);
    }, [notes]);

    const handleFormField = <K extends keyof NoteCreatePayload>(field: K, value: NoteCreatePayload[K]) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleClasseChangeInForm = (classeId: string) => {
        setFormData((prev) => ({ ...prev, classeId, eleveId: "" }));
    };

    const handleCreateNote = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitError(null);
        setSubmitSuccess(null);

        if (!formData.eleveId || !formData.matiereId || !formData.enseignantId || !formData.classeId) {
            setSubmitError("Veuillez renseigner eleve, matiere, enseignant et classe.");
            return;
        }

        try {
            setIsSubmitting(true);
            await noteService.createNote({
                ...formData,
                numeroExamen: Number(formData.numeroExamen),
                valeur: Number(formData.valeur),
                commentaire: formData.commentaire?.trim() || undefined,
            });
            setSubmitSuccess("Note enregistree avec succes.");
            setIsAddFormOpen(false);
        } catch (error) {
            setSubmitError(error instanceof Error ? error.message : "Erreur lors de l'enregistrement de la note");
        } finally {
            setIsSubmitting(false);
        }
    };

    const runQuery = async (loader: () => Promise<Note[]>) => {
        setLoadingNotes(true);
        setNotesError(null);
        try {
            const data = await loader();
            setNotes(data);
        } catch (error) {
            setNotesError(error instanceof Error ? error.message : "Erreur lors du chargement des notes");
            setNotes([]);
        } finally {
            setLoadingNotes(false);
        }
    };

    const startEditNote = (note: Note) => {
        setEditError(null);
        setEditSuccess(null);
        setEditingNoteId(note.id);
        setEditFormData({
            eleveId: note.eleveId,
            matiereId: note.matiereId,
            enseignantId: note.enseignantId,
            classeId: note.classeId,
            numeroExamen: Number(note.numeroExamen),
            valeur: Number(note.valeur),
            type_note: note.type_note || "EXAMEN",
            commentaire: note.commentaire || "",
        });
    };

    const cancelEditNote = () => {
        setEditingNoteId(null);
        setEditError(null);
    };

    const saveEditNote = async (noteId: string) => {
        try {
            setIsUpdating(true);
            setEditError(null);
            setEditSuccess(null);

            const updated = await noteService.updateNote(noteId, {
                ...editFormData,
                numeroExamen: Number(editFormData.numeroExamen),
                valeur: Number(editFormData.valeur),
                commentaire: editFormData.commentaire?.trim() || undefined,
            });

            setNotes((prev) => prev.map((item) => (item.id === noteId ? { ...item, ...updated } : item)));
            setEditingNoteId(null);
            setEditSuccess("Note modifiee avec succes.");
        } catch (error) {
            setEditError(error instanceof Error ? error.message : "Erreur lors de la modification");
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <Layout>
            <div className="space-y-6">
                <div>
                    <h2 className="font-display text-[22px] text-navy leading-tight">Notes & Bulletins</h2>
                    <p className="text-slate text-[13px] mt-0.5">Gestion des notes via le service notes</p>
                </div>

                <div className="flex justify-end">
                    <button
                        type="button"
                        onClick={() => {
                            setSubmitError(null);
                            setSubmitSuccess(null);
                            setIsAddFormOpen((prev) => !prev);
                        }}
                        className="nav-active text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-teal hover:opacity-95 transition-opacity"
                    >
                        {isAddFormOpen ? "Fermer" : "+ Ajouter note"}
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <StatCard
                        title="Notes affichees"
                        value={notes.length}
                        icon={(<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>)}
                        trendValue="Resultat courant"
                        trendIcon={(<svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><polyline points="18 15 12 9 6 15" /></svg>)}
                        colorTheme={{ gradient: "linear-gradient(90deg,#0E9E8E,#16BCA8)", iconBg: "rgba(14,158,142,.1)", iconColor: "#0E9E8E", trendBg: "rgba(91,173,139,.15)", trendColor: "#5BAD8B" }}
                        delay="0.05s"
                    />
                    <StatCard
                        title="Moyenne"
                        value={averageNote.toFixed(2)}
                        icon={(<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 3v18h18" /><path d="M7 14l3-3 3 2 4-5" /></svg>)}
                        trendValue="Valeur sur 20"
                        trendIcon={(<svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><polyline points="18 15 12 9 6 15" /></svg>)}
                        colorTheme={{ gradient: "linear-gradient(90deg,#E8A020,#F5B84C)", iconBg: "rgba(232,160,32,.1)", iconColor: "#E8A020", trendBg: "rgba(232,160,32,.15)", trendColor: "#E8A020" }}
                        delay="0.1s"
                    />
                    <StatCard
                        title="Eleves concernes"
                        value={uniqueStudents}
                        icon={(<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>)}
                        trendValue="Selection actuelle"
                        trendIcon={(<svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><polyline points="18 15 12 9 6 15" /></svg>)}
                        colorTheme={{ gradient: "linear-gradient(90deg,#E05C5C,#f08080)", iconBg: "rgba(224,92,92,.1)", iconColor: "#E05C5C", trendBg: "rgba(224,92,92,.12)", trendColor: "#E05C5C" }}
                        delay="0.15s"
                    />
                </div>

                {isAddFormOpen && (
                <div className="bg-white rounded-2xl p-6 shadow-card animate-fadeUp border border-navy/10">
                    <h3 className="font-semibold text-navy text-base mb-4">Nouvelle note</h3>
                    <form onSubmit={handleCreateNote} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-[12px] font-semibold text-slate mb-1.5">Classe</label>
                                <select
                                    value={formData.classeId}
                                    onChange={(e) => handleClasseChangeInForm(e.target.value)}
                                    className="w-full rounded-xl border border-navy/10 bg-white px-3 py-2.5 text-sm text-navy outline-none focus:border-teal"
                                    required
                                >
                                    <option value="">Choisir une classe</option>
                                    {classes.map((c) => (
                                        <option key={c.id} value={c.id}>{c.name || c.id}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[12px] font-semibold text-slate mb-1.5">Eleve</label>
                                <select
                                    value={formData.eleveId}
                                    onChange={(e) => handleFormField("eleveId", e.target.value)}
                                    className="w-full rounded-xl border border-navy/10 bg-white px-3 py-2.5 text-sm text-navy outline-none focus:border-teal"
                                    required
                                >
                                    <option value="">Choisir un eleve</option>
                                    {elevesOfSelectedClass.map((e) => (
                                        <option key={e.id} value={e.id}>{e.prenom} {e.nom}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[12px] font-semibold text-slate mb-1.5">Matiere</label>
                                <select
                                    value={formData.matiereId}
                                    onChange={(e) => handleFormField("matiereId", e.target.value)}
                                    className="w-full rounded-xl border border-navy/10 bg-white px-3 py-2.5 text-sm text-navy outline-none focus:border-teal"
                                    required
                                >
                                    <option value="">Choisir une matiere</option>
                                    {matieres.map((m) => (
                                        <option key={m.id} value={m.id}>{m.nom}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[12px] font-semibold text-slate mb-1.5">Enseignant</label>
                                <select
                                    value={formData.enseignantId}
                                    onChange={(e) => handleFormField("enseignantId", e.target.value)}
                                    className="w-full rounded-xl border border-navy/10 bg-white px-3 py-2.5 text-sm text-navy outline-none focus:border-teal"
                                    required
                                >
                                    <option value="">Choisir un enseignant</option>
                                    {enseignents.map((en) => (
                                        <option key={en.id} value={en.id}>{en.prenom} {en.nom}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-[12px] font-semibold text-slate mb-1.5">Numero examen</label>
                                <input
                                    type="number"
                                    min={1}
                                    value={formData.numeroExamen}
                                    onChange={(e) => handleFormField("numeroExamen", Number(e.target.value))}
                                    className="w-full rounded-xl border border-navy/10 bg-white px-3 py-2.5 text-sm text-navy outline-none focus:border-teal"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-[12px] font-semibold text-slate mb-1.5">Valeur</label>
                                <input
                                    type="number"
                                    min={0}
                                    max={20}
                                    step="0.01"
                                    value={formData.valeur}
                                    onChange={(e) => handleFormField("valeur", Number(e.target.value))}
                                    className="w-full rounded-xl border border-navy/10 bg-white px-3 py-2.5 text-sm text-navy outline-none focus:border-teal"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-[12px] font-semibold text-slate mb-1.5">Type note</label>
                                <select
                                    value={formData.type_note}
                                    onChange={(e) => handleFormField("type_note", e.target.value as NoteType)}
                                    className="w-full rounded-xl border border-navy/10 bg-white px-3 py-2.5 text-sm text-navy outline-none focus:border-teal"
                                    required
                                >
                                    <option value="DEVOIR">DEVOIR</option>
                                    <option value="EXAMEN">EXAMEN</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[12px] font-semibold text-slate mb-1.5">Commentaire</label>
                                <input
                                    type="text"
                                    value={formData.commentaire || ""}
                                    onChange={(e) => handleFormField("commentaire", e.target.value)}
                                    placeholder="Examen trimestriel"
                                    className="w-full rounded-xl border border-navy/10 bg-white px-3 py-2.5 text-sm text-navy outline-none focus:border-teal"
                                />
                            </div>
                        </div>

                        {submitError && <div className="p-3 rounded-xl bg-coral/10 border border-coral/20 text-coral text-sm">{submitError}</div>}
                        {submitSuccess && <div className="p-3 rounded-xl bg-teal/10 border border-teal/20 text-teal text-sm">{submitSuccess}</div>}

                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="nav-active text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-teal hover:opacity-95 transition-opacity disabled:opacity-60"
                            >
                                {isSubmitting ? "Enregistrement..." : "Enregistrer la note"}
                            </button>
                        </div>
                    </form>
                </div>
                )}

                <div className="bg-white rounded-2xl p-6 shadow-card animate-fadeUp border border-navy/10">
                    <h3 className="font-semibold text-navy text-base mb-4">Rechercher les notes</h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                            <label className="block text-[12px] font-semibold text-slate mb-1.5">Par eleve</label>
                            <select
                                value={queryEleveId}
                                onChange={(e) => setQueryEleveId(e.target.value)}
                                className="w-full rounded-xl border border-navy/10 bg-white px-3 py-2.5 text-sm text-navy outline-none focus:border-teal"
                            >
                                <option value="">Choisir un eleve</option>
                                {queryElevesOfSelectedClass.map((e) => (
                                    <option key={e.id} value={e.id}>{e.prenom} {e.nom}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[12px] font-semibold text-slate mb-1.5">Par classe</label>
                            <select
                                value={queryClasseId}
                                onChange={(e) => setQueryClasseId(e.target.value)}
                                className="w-full rounded-xl border border-navy/10 bg-white px-3 py-2.5 text-sm text-navy outline-none focus:border-teal"
                            >
                                <option value="">Choisir une classe</option>
                                {classes.map((c) => (
                                    <option key={c.id} value={c.id}>{c.name || c.id}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[12px] font-semibold text-slate mb-1.5">Matiere (eleve + matiere)</label>
                            <select
                                value={queryMatiereId}
                                onChange={(e) => setQueryMatiereId(e.target.value)}
                                className="w-full rounded-xl border border-navy/10 bg-white px-3 py-2.5 text-sm text-navy outline-none focus:border-teal"
                            >
                                <option value="">Choisir une matiere</option>
                                {matieres.map((m) => (
                                    <option key={m.id} value={m.id}>{m.nom}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                        <button
                            type="button"
                            onClick={() => {
                                if (!queryEleveId) {
                                    setNotesError("Selectionnez un eleve pour cette requete.");
                                    return;
                                }
                                void runQuery(() => noteService.getNotesByEleve(queryEleveId));
                            }}
                            className="px-4 py-2 rounded-xl border border-navy/10 text-navy text-sm font-medium hover:bg-ice transition-colors"
                        >
                            Charger par eleve
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                if (!queryClasseId) {
                                    setNotesError("Selectionnez une classe pour cette requete.");
                                    return;
                                }
                                void runQuery(() => noteService.getNotesByClasse(queryClasseId));
                            }}
                            className="px-4 py-2 rounded-xl border border-navy/10 text-navy text-sm font-medium hover:bg-ice transition-colors"
                        >
                            Charger par classe
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                if (!queryEleveId || !queryMatiereId) {
                                    setNotesError("Selectionnez eleve et matiere pour cette requete.");
                                    return;
                                }
                                void runQuery(() => noteService.getNotesByEleveAndMatiere(queryEleveId, queryMatiereId));
                            }}
                            className="px-4 py-2 rounded-xl border border-navy/10 text-navy text-sm font-medium hover:bg-ice transition-colors"
                        >
                            Charger eleve + matiere
                        </button>
                        <button
                            type="button"
                            onClick={() => { void runQuery(() => noteService.getAllNotes()); }}
                            className="px-4 py-2 rounded-xl border border-teal/30 text-teal text-sm font-semibold hover:bg-teal/5 transition-colors"
                        >
                            Charger tout
                        </button>
                    </div>

                    {notesError && (
                        <div className="p-3 rounded-xl bg-coral/10 border border-coral/20 text-coral text-sm mb-4">{notesError}</div>
                    )}

                    {loadingNotes ? (
                        <div className="text-sm text-slate">Chargement des notes...</div>
                    ) : summaryRows.length === 0 ? (
                        <div className="text-sm text-slate">Aucune note chargee.</div>
                    ) : (
                        <div className="overflow-x-auto rounded-xl border border-navy/10">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-ice/70 text-slate text-[11px] uppercase tracking-wide">
                                        <th className="px-3 py-2 text-left">Eleve</th>
                                        <th className="px-3 py-2 text-left">Classe</th>
                                        <th className="px-3 py-2 text-left">Matiere</th>
                                        <th className="px-3 py-2 text-left">Enseignant</th>
                                        {examColumns.map((examNumber) => (
                                            <th key={examNumber} className="px-3 py-2 text-left">Note {examNumber}</th>
                                        ))}
                                        <th className="px-3 py-2 text-left">Details</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-navy/10">
                                    {summaryRows.map((row) => (
                                        <tr key={row.key} className="hover:bg-ice/50 transition-colors">
                                            <td className="px-3 py-2 text-navy">{row.eleveNom}</td>
                                            <td className="px-3 py-2 text-navy">{row.classeNom}</td>
                                            <td className="px-3 py-2 text-navy">{row.matiereNom}</td>
                                            <td className="px-3 py-2 text-navy">{row.enseignantNom}</td>
                                            {examColumns.map((examNumber) => {
                                                const examNote = row.notesByExam.get(examNumber);
                                                return (
                                                    <td key={`${row.key}-${examNumber}`} className="px-3 py-2 text-navy font-semibold">
                                                        {examNote ? examNote.valeur : "-"}
                                                    </td>
                                                );
                                            })}
                                            <td className="px-3 py-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedSummary(row)}
                                                    className="px-3 py-1.5 rounded-lg border border-teal/30 text-teal text-xs font-semibold hover:bg-teal/5 transition-colors"
                                                >
                                                    Voir detail
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {selectedSummary && (
                    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-navy/40" onClick={() => { setSelectedSummary(null); setEditingNoteId(null); setEditError(null); }} />
                        <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-hover p-6 animate-fadeUp">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="font-display text-[20px] text-navy">Detail des notes</h4>
                                <button
                                    type="button"
                                    className="w-9 h-9 rounded-lg border border-navy/10 text-slate hover:text-navy hover:bg-ice transition-colors"
                                    onClick={() => { setSelectedSummary(null); setEditingNoteId(null); setEditError(null); }}
                                >
                                    x
                                </button>
                            </div>

                            {editError && <div className="mb-3 p-3 rounded-xl bg-coral/10 border border-coral/20 text-coral text-sm">{editError}</div>}
                            {editSuccess && <div className="mb-3 p-3 rounded-xl bg-teal/10 border border-teal/20 text-teal text-sm">{editSuccess}</div>}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                                <div className="p-3 rounded-xl bg-ice/60 border border-navy/10">
                                    <p className="text-[11px] uppercase tracking-wide text-slate">Eleve</p>
                                    <p className="text-sm font-medium text-navy">{selectedSummary.eleveNom}</p>
                                </div>
                                <div className="p-3 rounded-xl bg-ice/60 border border-navy/10">
                                    <p className="text-[11px] uppercase tracking-wide text-slate">Classe</p>
                                    <p className="text-sm font-medium text-navy">{selectedSummary.classeNom}</p>
                                </div>
                                <div className="p-3 rounded-xl bg-ice/60 border border-navy/10">
                                    <p className="text-[11px] uppercase tracking-wide text-slate">Matiere</p>
                                    <p className="text-sm font-medium text-navy">{selectedSummary.matiereNom}</p>
                                </div>
                                <div className="p-3 rounded-xl bg-ice/60 border border-navy/10">
                                    <p className="text-[11px] uppercase tracking-wide text-slate">Enseignant</p>
                                    <p className="text-sm font-medium text-navy">{selectedSummary.enseignantNom}</p>
                                </div>
                            </div>

                            <div className="overflow-x-auto rounded-xl border border-navy/10">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-ice/70 text-slate text-[11px] uppercase tracking-wide">
                                            <th className="px-3 py-2 text-left">Examen</th>
                                            <th className="px-3 py-2 text-left">Type</th>
                                            <th className="px-3 py-2 text-left">Valeur</th>
                                            <th className="px-3 py-2 text-left">Commentaire</th>
                                            <th className="px-3 py-2 text-left">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-navy/10">
                                        {[...selectedSummary.notes]
                                            .sort((a, b) => Number(a.numeroExamen) - Number(b.numeroExamen))
                                            .map((note) => (
                                                <tr key={note.id}>
                                                    {editingNoteId === note.id ? (
                                                        <>
                                                            <td className="px-3 py-2 text-navy">
                                                                <input
                                                                    type="number"
                                                                    min={1}
                                                                    value={editFormData.numeroExamen}
                                                                    onChange={(e) => setEditFormData((prev) => ({ ...prev, numeroExamen: Number(e.target.value) }))}
                                                                    className="w-20 rounded-lg border border-navy/10 px-2 py-1 text-sm"
                                                                />
                                                            </td>
                                                            <td className="px-3 py-2 text-navy">
                                                                <select
                                                                    value={editFormData.type_note}
                                                                    onChange={(e) => setEditFormData((prev) => ({ ...prev, type_note: e.target.value as NoteType }))}
                                                                    className="rounded-lg border border-navy/10 px-2 py-1 text-sm"
                                                                >
                                                                    <option value="DEVOIR">DEVOIR</option>
                                                                    <option value="EXAMEN">EXAMEN</option>
                                                                </select>
                                                            </td>
                                                            <td className="px-3 py-2 text-navy">
                                                                <input
                                                                    type="number"
                                                                    min={0}
                                                                    max={20}
                                                                    step="0.01"
                                                                    value={editFormData.valeur}
                                                                    onChange={(e) => setEditFormData((prev) => ({ ...prev, valeur: Number(e.target.value) }))}
                                                                    className="w-24 rounded-lg border border-navy/10 px-2 py-1 text-sm"
                                                                />
                                                            </td>
                                                            <td className="px-3 py-2 text-slate">
                                                                <input
                                                                    type="text"
                                                                    value={editFormData.commentaire || ""}
                                                                    onChange={(e) => setEditFormData((prev) => ({ ...prev, commentaire: e.target.value }))}
                                                                    className="w-full rounded-lg border border-navy/10 px-2 py-1 text-sm"
                                                                />
                                                            </td>
                                                            <td className="px-3 py-2 text-slate">
                                                                <div className="flex gap-2">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => { void saveEditNote(note.id); }}
                                                                        disabled={isUpdating}
                                                                        className="px-2 py-1 rounded-lg text-xs font-semibold text-white bg-teal disabled:opacity-60"
                                                                    >
                                                                        {isUpdating ? "..." : "Enregistrer"}
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={cancelEditNote}
                                                                        className="px-2 py-1 rounded-lg text-xs font-semibold border border-navy/10 text-navy"
                                                                    >
                                                                        Annuler
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <td className="px-3 py-2 text-navy">{note.numeroExamen}</td>
                                                            <td className="px-3 py-2 text-navy">{note.type_note || "-"}</td>
                                                            <td className="px-3 py-2 text-navy font-semibold">{note.valeur}</td>
                                                            <td className="px-3 py-2 text-slate">{note.commentaire || "-"}</td>
                                                            <td className="px-3 py-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => startEditNote(note)}
                                                                    className="px-2 py-1 rounded-lg border border-gold/30 text-gold text-xs font-semibold hover:bg-gold/5 transition-colors"
                                                                >
                                                                    Modifier
                                                                </button>
                                                            </td>
                                                        </>
                                                    )}
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
}
