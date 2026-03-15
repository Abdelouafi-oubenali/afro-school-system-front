import { useEffect, useState } from "react";
import StudentSidebar from "../../components/layout/StudentSidebar";
import StudentHeader from "../../components/layout/StudentHeader";
import { useAuth } from "../../context/AuthContext";
import eleveService from "../../services/user/eleveService";
import type { Eleve } from "../../services/user/eleveService";
import seanceService from "../../services/user/seanceService";
import type { EmploiEntry } from "../../services/user/seanceService";
import noteService from "../../services/user/noteService";
import type { Note, NoteBilanMoyenne } from "../../services/user/noteService";
import classService from "../../services/user/classService";
import type { ClassRoom } from "../../services/user/classService";

const DAY_LABELS: Record<string, string> = {
    MONDAY: "Lundi",
    TUESDAY: "Mardi",
    WEDNESDAY: "Mercredi",
    THURSDAY: "Jeudi",
    FRIDAY: "Vendredi",
    SATURDAY: "Samedi",
    SUNDAY: "Dimanche",
};

function normalizeTime(time: string | null): string {
    if (!time) return "--:--";
    return time.substring(0, 5);
}

export default function EleveDashboard() {
    const { user } = useAuth();
    const [activeView, setActiveView] = useState<"emploi" | "classe" | "notes" | "bilan">("emploi");
    const [profile, setProfile] = useState<Eleve | null>(null);
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [emploi, setEmploi] = useState<EmploiEntry[]>([]);
    const [loadingEmploi, setLoadingEmploi] = useState(false);
    const [classData, setClassData] = useState<ClassRoom | null>(null);
    const [loadingClass, setLoadingClass] = useState(false);
    const [notes, setNotes] = useState<Note[]>([]);
    const [loadingNotes, setLoadingNotes] = useState(false);
    const [bilan, setBilan] = useState<NoteBilanMoyenne | null>(null);
    const [loadingBilan, setLoadingBilan] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (user?.id) {
            fetchProfile();
        }
    }, [user?.id]);

    const fetchProfile = async () => {
        try {
            setLoadingProfile(true);
            const data = await eleveService.getEleveById(user!.id);
            setProfile(data);
            if (data.classeId || data.classe) {
                fetchEmploi(data.classeId || data.classe!);
            }
        } catch (err: any) {
            console.error("Error fetching student profile:", err);
            setError("Impossible de charger votre profil.");
        } finally {
            setLoadingProfile(false);
        }
    };

    const fetchEmploi = async (classeId: string) => {
        try {
            setLoadingEmploi(true);
            const data = await seanceService.getEmploiByClasse(classeId);
            setEmploi(data);
        } catch (err) {
            console.error("Error fetching schedule:", err);
        } finally {
            setLoadingEmploi(false);
        }
    };

    const fetchNotes = async () => {
        if (!user?.id) return;
        try {
            setLoadingNotes(true);
            const data = await noteService.getNotesByEleve(user.id);
            setNotes(data);
        } catch (err) {
            console.error("Error fetching notes:", err);
        } finally {
            setLoadingNotes(false);
        }
    };

    const fetchBilan = async () => {
        if (!user?.id) return;
        try {
            setLoadingBilan(true);
            const data = await noteService.getBilanMoyenneByEleve(user.id);
            setBilan(data);
        } catch (err) {
            console.error("Error fetching report card:", err);
        } finally {
            setLoadingBilan(false);
        }
    };

    const fetchClassData = async (classeId: string) => {
        try {
            setLoadingClass(true);
            const data = await classService.getClassById(classeId);
            setClassData(data);
        } catch (err) {
            console.error("Error fetching class data:", err);
        } finally {
            setLoadingClass(false);
        }
    };

    useEffect(() => {
        if (activeView === "notes") fetchNotes();
        if (activeView === "bilan") fetchBilan();
        if (activeView === "classe" && profile?.classeId) fetchClassData(profile.classeId);
        else if (activeView === "classe" && profile?.classe) fetchClassData(profile.classe);
    }, [activeView, profile]);

    if (loadingProfile && !error) {
        return (
            <div className="flex h-screen items-center justify-center bg-white">
                <div className="flex flex-col items-center gap-4">
                    <svg className="animate-spin h-10 w-10 text-indigo-600" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-widest animate-pulse">Chargement de votre espace...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
            <StudentSidebar activeView={activeView} setActiveView={setActiveView} />

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <StudentHeader />

                <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
                    {error && (
                        <div className="mb-6 flex items-start gap-4 rounded-2xl border border-red-200 bg-red-50 text-red-700 p-5 shadow-sm">
                            <svg className="w-6 h-6 flex-shrink-0 mt-0.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                            <p className="font-semibold text-sm">{error}</p>
                        </div>
                    )}

                    {activeView === "emploi" && (
                        <section className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-6 md:p-8 animate-fadeUp transition-all duration-300">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Mon Emploi du Temps</h2>
                                    <p className="text-sm text-slate-500 mt-1">
                                        Classe: <span className="font-bold text-indigo-600">{profile?.classeNom || profile?.classe || "Chargement..."}</span>
                                    </p>
                                </div>
                                {loadingEmploi && (
                                    <div className="flex items-center gap-2 text-indigo-600 text-sm font-bold">
                                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                        Chargement...
                                    </div>
                                )}
                            </div>

                            {!loadingEmploi && emploi.length === 0 ? (
                                <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50">
                                    <svg className="w-12 h-12 text-slate-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    <p className="text-base font-semibold text-slate-700 mb-1">Aucun cours trouvé</p>
                                    <p className="text-sm text-slate-500 max-w-sm">Votre emploi du temps n'est pas encore disponible.</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {Object.keys(DAY_LABELS).map((dayKey) => {
                                        const dayClasses = emploi.filter(e => e.jour === dayKey);
                                        if (dayClasses.length === 0) return null;
                                        return (
                                            <div key={dayKey} className="relative">
                                                <div className="flex items-center gap-4 mb-4">
                                                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-indigo-600 pr-4 bg-white z-10">{DAY_LABELS[dayKey]}</h3>
                                                    <div className="flex-1 h-px bg-slate-100"></div>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                    {dayClasses.map((seance) => (
                                                        <div key={seance.id} className="group relative rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
                                                            <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500 rounded-l-2xl group-hover:w-2 transition-all"></div>
                                                            <div className="flex items-center justify-between mb-3 text-xs font-bold text-slate-400">
                                                                <span className="flex items-center gap-1.5">
                                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                                    {normalizeTime(seance.heureDebut)} - {normalizeTime(seance.heureFin)}
                                                                </span>
                                                            </div>
                                                            <h4 className="text-base font-black text-slate-800 leading-tight mb-2 group-hover:text-indigo-600 transition-colors">{seance.matiereNom || seance.matiereId}</h4>
                                                            <div className="flex items-center gap-2 mt-auto">
                                                                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500 border border-slate-200">
                                                                    {seance.enseignantNom?.charAt(0) || "P"}
                                                                </div>
                                                                <span className="text-xs font-bold text-slate-600">{seance.enseignantNom || "Professeur"}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </section>
                    )}

                    {activeView === "classe" && (
                        <section className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-6 md:p-8 animate-fadeUp transition-all duration-300">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Ma Classe</h2>
                                    <p className="text-sm text-slate-500 mt-1">Informations sur votre classe et vos enseignants</p>
                                </div>
                                {loadingClass && (
                                    <div className="flex items-center gap-2 text-indigo-600 text-sm font-bold">
                                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                        Chargement...
                                    </div>
                                )}
                            </div>

                            {classData && (
                                <div className="space-y-10">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Infos Classe</h3>
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm text-slate-500">Nom de la classe</span>
                                                    <span className="text-sm font-bold text-slate-800">{classData.name}</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm text-slate-500">Niveau</span>
                                                    <span className="text-sm font-bold text-slate-800">{classData.levelClasse}</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm text-slate-500">Professeur Principal</span>
                                                    <span className="text-sm font-bold text-indigo-600">{classData.enseignantPrincipal}</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm text-slate-500">Année Scolaire</span>
                                                    <span className="text-sm font-bold text-slate-800">{classData.anneeScolaire}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-indigo-600 rounded-2xl p-6 text-white shadow-xl shadow-indigo-100 flex flex-col justify-center">
                                            <h3 className="text-xs font-black uppercase tracking-[0.2em] opacity-80 mb-2">Effectif</h3>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-4xl font-black">{classData.eleves?.length || 0}</span>
                                                <span className="text-sm opacity-80">Élèves inscrits</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex items-center gap-4 mb-6">
                                            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-800 pr-4 bg-white z-10">Mes Camarades</h3>
                                            <div className="flex-1 h-px bg-slate-100"></div>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                            {classData.eleves?.map((eleve) => (
                                                <div key={eleve.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-white hover:border-indigo-200 hover:shadow-sm transition-all">
                                                    <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 font-black text-xs uppercase">
                                                        {eleve.prenom.charAt(0)}{eleve.nom.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-800 leading-tight">{eleve.prenom} {eleve.nom}</p>
                                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Élève</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex items-center gap-4 mb-6">
                                            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-800 pr-4 bg-white z-10">Mes Enseignants</h3>
                                            <div className="flex-1 h-px bg-slate-100"></div>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {classData.enseignants?.map((prof) => (
                                                <div key={prof.id} className="p-4 rounded-2xl border border-slate-100 bg-white hover:border-teal-200 hover:shadow-sm transition-all group">
                                                    <div className="flex items-start justify-between mb-3">
                                                        <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center text-sm font-black ring-1 ring-teal-200/50">
                                                            {prof.prenom.charAt(0)}{prof.nom.charAt(0)}
                                                        </div>
                                                        <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-slate-50 text-slate-400 border border-slate-100">Professeur</span>
                                                    </div>
                                                    <p className="text-base font-bold text-slate-800 leading-tight mb-1">{prof.prenom} {prof.nom}</p>
                                                    <p className="text-xs font-bold text-teal-600">{prof.matiere || "Enseignant"}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </section>
                    )}

                    {activeView === "notes" && (
                        <section className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-6 md:p-8 animate-fadeUp transition-all duration-300">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Mes Notes</h2>
                                    <p className="text-sm text-slate-500 mt-1">Historique des évaluations et examens</p>
                                </div>
                                {loadingNotes && (
                                    <div className="flex items-center gap-2 text-indigo-600 text-sm font-bold">
                                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                        Chargement...
                                    </div>
                                )}
                            </div>

                            {!loadingNotes && notes.length === 0 ? (
                                <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50">
                                    <svg className="w-12 h-12 text-slate-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                    <p className="text-base font-semibold text-slate-700 mb-1">Aucune note enregistrée</p>
                                    <p className="text-sm text-slate-500 max-w-sm">Vous n'avez pas encore de notes publiées.</p>
                                </div>
                            ) : (
                                <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm bg-white">
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full text-sm text-left">
                                            <thead>
                                                <tr className="bg-slate-50 border-b border-slate-200">
                                                    <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Matière</th>
                                                    <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Type</th>
                                                    <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Date / N°</th>
                                                    <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Note</th>
                                                    <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Appréciation</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {notes.map((note) => (
                                                    <tr key={note.id} className="hover:bg-slate-50/80 transition-colors group">
                                                        <td className="px-6 py-5">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs ring-1 ring-indigo-200/50">
                                                                    {note.matiereNom?.charAt(0) || "M"}
                                                                </div>
                                                                <span className="font-bold text-slate-800">{note.matiereNom || note.matiereId}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-5">
                                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black tracking-widest border ${note.typeNote === 'EXAMEN' ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-blue-50 text-blue-600 border-blue-200'}`}>
                                                                {note.typeNote || note.type_note || "-"}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-5 text-slate-600 font-bold">
                                                            #{note.numeroExamen}
                                                        </td>
                                                        <td className="px-6 py-5">
                                                            <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-black border ${note.valeur >= 10 ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm shadow-emerald-100' : 'bg-red-50 text-red-700 border-red-200 shadow-sm shadow-red-100'}`}>
                                                                {note.valeur} / 20
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-5">
                                                            <p className="text-slate-600 italic text-xs max-w-xs truncate group-hover:whitespace-normal group-hover:overflow-visible transition-all">
                                                                {note.commentaire || <span className="text-slate-300 not-italic">Pas de commentaire</span>}
                                                            </p>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </section>
                    )}

                    {activeView === "bilan" && (
                        <section className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-6 md:p-8 animate-fadeUp transition-all duration-300">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Mon Bilan (Bulletin)</h2>
                                    <p className="text-sm text-slate-500 mt-1">Résumé des performances par matière</p>
                                </div>
                                {loadingBilan && (
                                    <div className="flex items-center gap-2 text-indigo-600 text-sm font-bold">
                                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                        Chargement...
                                    </div>
                                )}
                            </div>

                            {!loadingBilan && !bilan ? (
                                <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50">
                                    <svg className="w-12 h-12 text-slate-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                    <p className="text-base font-semibold text-slate-700 mb-1">Bilan non disponible</p>
                                    <p className="text-sm text-slate-500 max-w-sm">Le calcul des moyennes générales n'est pas encore finalisé pour votre profil.</p>
                                </div>
                            ) : bilan && (
                                <div className="space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-700 p-6 text-white shadow-xl shadow-indigo-200">
                                            <p className="text-xs font-black uppercase tracking-[0.2em] opacity-80 mb-2">Moyenne Générale</p>
                                            <h3 className="text-4xl font-black mb-1">{bilan.moyenneGenerale.toFixed(2)} <span className="text-sm font-normal opacity-70">/ 20</span></h3>
                                            <p className="text-xs font-bold bg-white/20 inline-block px-2 py-0.5 rounded mt-2 uppercase tracking-widest">Bravo !</p>
                                        </div>
                                        <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm">
                                            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Matières</p>
                                            <h3 className="text-3xl font-black text-slate-800">{bilan.nombreMatieres}</h3>
                                            <p className="text-xs font-bold text-slate-500 mt-2 uppercase tracking-widest">Enseignées</p>
                                        </div>
                                        <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm">
                                            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Total Coefficients</p>
                                            <h3 className="text-3xl font-black text-slate-800">{bilan.totalCoefficients}</h3>
                                            <p className="text-xs font-bold text-slate-500 mt-2 uppercase tracking-widest">Unités de valeur</p>
                                        </div>
                                    </div>

                                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full text-sm text-left">
                                                <thead>
                                                    <tr className="bg-slate-50 border-b border-slate-200">
                                                        <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Matière</th>
                                                        <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Coef.</th>
                                                        <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Moy. Devoir</th>
                                                        <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Moy. Examen</th>
                                                        <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Note Finale</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {bilan.detailsParMatiere.map((item) => (
                                                        <tr key={item.matiereId} className="hover:bg-slate-50/80 transition-colors group">
                                                            <td className="px-6 py-5 font-bold text-slate-800">{item.nomMatiere}</td>
                                                            <td className="px-6 py-5 font-bold text-slate-600">{item.coefficient}</td>
                                                            <td className="px-6 py-5">
                                                                <span className="font-bold text-slate-700">{item.moyenneDevoir !== null ? item.moyenneDevoir.toFixed(2) : "-"}</span>
                                                            </td>
                                                            <td className="px-6 py-5">
                                                                <span className="font-bold text-slate-700">{item.moyenneExamen !== null ? item.moyenneExamen.toFixed(2) : "-"}</span>
                                                            </td>
                                                            <td className="px-6 py-5">
                                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-black border ${item.moyenneFinaleMatiere !== null && item.moyenneFinaleMatiere >= 10 ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                                                    {item.moyenneFinaleMatiere !== null ? item.moyenneFinaleMatiere.toFixed(2) : "-"} / 20
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </section>
                    )}
                </main>
            </div>
        </div>
    );
}
