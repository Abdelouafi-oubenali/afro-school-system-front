import { useState, useEffect } from "react";
import ParentSidebar from "../../components/layout/ParentSidebar";
import ParentHeader from "../../components/layout/ParentHeader";
import { useAuth } from "../../context/AuthContext";
import parentService from "../../services/user/parentService";
import type { Parent } from "../../services/user/parentService";
import eleveService from "../../services/user/eleveService";
import type { Eleve } from "../../services/user/eleveService";
import seanceService from "../../services/user/seanceService";
import type { EmploiEntry } from "../../services/user/seanceService";
import noteService from "../../services/user/noteService";
import type { Note, NoteBilanMoyenne } from "../../services/user/noteService";

export default function ParentDashboard() {
    const { user } = useAuth();
    const [activeView, setActiveView] = useState<"enfants">("enfants");
    const [activeTab, setActiveTab] = useState<"emploi" | "notes" | "bilan">("emploi");
    const [_parentProfile, setParentProfile] = useState<Parent | null>(null);
    const [children, setChildren] = useState<Eleve[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
    const [childDetail, setChildDetail] = useState<{
        emploi: EmploiEntry[];
        notes: Note[];
        bilan: NoteBilanMoyenne | null;
        loading: boolean;
    }>({
        emploi: [],
        notes: [],
        bilan: null,
        loading: false
    });

    useEffect(() => {
        const fetchParentData = async () => {
            if (!user?.id) return;
            try {
                setLoading(true);
                const profile = await parentService.getParentById(user.id);
                setParentProfile(profile);

                if (profile.childIds && profile.childIds.length > 0) {
                    const childData = await Promise.all(
                        profile.childIds.map(id => eleveService.getEleveById(id))
                    );
                    setChildren(childData);
                }
            } catch (err) {
                console.error("Error fetching parent data:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchParentData();
    }, [user?.id]);

    useEffect(() => {
        const fetchChildData = async () => {
            if (!selectedChildId) return;
            try {
                setChildDetail(prev => ({ ...prev, loading: true }));
                const child = children.find(c => c.id === selectedChildId);
                const classeId = child?.classeId || child?.classe;

                const [emploi, notes, bilan] = await Promise.all([
                    classeId ? seanceService.getEmploiByClasse(classeId) : Promise.resolve([]),
                    noteService.getNotesByEleve(selectedChildId),
                    noteService.getBilanMoyenneByEleve(selectedChildId)
                ]);

                setChildDetail({
                    emploi,
                    notes,
                    bilan,
                    loading: false
                });
            } catch (err) {
                console.error("Error fetching child data:", err);
                setChildDetail(prev => ({ ...prev, loading: false }));
            }
        };
        fetchChildData();
    }, [selectedChildId, children]);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-white">
                <div className="flex flex-col items-center gap-4">
                    <svg className="animate-spin h-10 w-10 text-indigo-600" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-widest animate-pulse">Chargement de votre espace parent...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-ice text-navy flex min-h-screen font-sans">
            <ParentSidebar activeView={activeView} setActiveView={setActiveView} />
            <div className="ml-64 flex-1 flex flex-col min-h-screen bg-transparent">
                <ParentHeader />
                <main className="flex-1 overflow-y-auto">
                    <div className="max-w-7xl mx-auto space-y-8 animate-fadeIn">
                        {/* Summary Section */}
                        <section className="bg-indigo-600 rounded-3xl p-8 text-white shadow-2xl shadow-indigo-200 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700"></div>
                            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div>
                                    <h2 className="text-3xl font-black tracking-tight mb-2">Bienvenue, {user?.name}</h2>
                                    <p className="text-indigo-100 font-bold opacity-90 max-w-md">
                                        Consultez la progression et l'emploi du temps de vos enfants en toute simplicité.
                                    </p>
                                </div>
                                <div className="flex gap-4">
                                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-70 mb-1 text-indigo-200">Enfants inscrits</p>
                                        <p className="text-2xl font-black">{children.length}</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                            {/* Children List */}
                            <div className="lg:col-span-1 space-y-4">
                                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-800 mb-6">Mes Enfants</h3>
                                {children.map(child => (
                                    <button
                                        key={child.id}
                                        onClick={() => setSelectedChildId(child.id)}
                                        className={`w-full text-left p-4 rounded-2xl border transition-all duration-200 group ${selectedChildId === child.id
                                            ? "bg-indigo-50 border-indigo-200 ring-4 ring-indigo-50 shadow-sm"
                                            : "bg-white border-slate-100 hover:border-indigo-100 hover:bg-slate-50"
                                            }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-sm transition-colors ${selectedChildId === child.id ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-600"
                                                }`}>
                                                {child.prenom.charAt(0)}{child.nom.charAt(0)}
                                            </div>
                                            <div>
                                                <p className={`font-black text-sm leading-tight ${selectedChildId === child.id ? "text-indigo-600" : "text-slate-800"}`}>
                                                    {child.prenom} {child.nom}
                                                </p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                                    {child.classeNom || child.classe || "Aucune classe"}
                                                </p>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>

                            {/* Child Detail View */}
                            <div className="lg:col-span-3">
                                {!selectedChildId ? (
                                    <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-white rounded-3xl border border-dashed border-slate-200 p-8 text-center">
                                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                                            <svg className="w-10 h-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                            </svg>
                                        </div>
                                        <h3 className="text-xl font-black text-slate-800 mb-2">Sélectionnez un enfant</h3>
                                        <p className="text-slate-500 text-sm max-w-sm font-medium">Cliquez sur l'un de vos enfants pour voir son emploi du temps, ses notes et son bulletin.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-8 animate-fadeUp">
                                        {childDetail.loading ? (
                                            <div className="flex flex-col items-center justify-center p-20 bg-white rounded-3xl border border-slate-100">
                                                <svg className="animate-spin h-8 w-8 text-indigo-600 mb-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Chargement des données...</p>
                                            </div>
                                        ) : (
                                            <>
                                                {/* Child Quick Stats */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                                                    <div className="bg-white rounded-2xl p-5 border border-slate-100 flex items-center gap-4">
                                                        <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 border border-indigo-100">
                                                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Enfant sélectionné</p>
                                                            <p className="text-xl font-black text-slate-800">{children.find(c => c.id === selectedChildId)?.prenom}</p>
                                                        </div>
                                                    </div>
                                                    <div className="bg-white rounded-2xl p-5 border border-slate-100 flex items-center gap-4">
                                                        <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 border border-emerald-100">
                                                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Moyenne Générale</p>
                                                            <p className="text-xl font-black text-slate-800">{childDetail.bilan?.moyenneGenerale?.toFixed(2) || "N/A"}/20</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Tabs */}
                                                <div className="flex items-center gap-1 bg-slate-100/50 p-1 rounded-2xl border border-slate-200 w-fit mb-8">
                                                    {[
                                                        { id: "emploi", label: "Emploi" },
                                                        { id: "notes", label: "Notes" },
                                                        { id: "bilan", label: "Bulletin" }
                                                    ].map(tab => (
                                                        <button
                                                            key={tab.id}
                                                            onClick={() => setActiveTab(tab.id as any)}
                                                            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab.id
                                                                ? "bg-white text-indigo-600 shadow-sm"
                                                                : "text-slate-400 hover:text-slate-600"
                                                                }`}
                                                        >
                                                            {tab.label}
                                                        </button>
                                                    ))}
                                                </div>

                                                {activeTab === "emploi" && (
                                                    <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
                                                        <h4 className="text-lg font-black text-slate-800 tracking-tight mb-6">Emploi du temps</h4>
                                                        {childDetail.emploi.length === 0 ? (
                                                            <p className="text-sm text-slate-400 font-medium italic">Aucun cours trouvé pour cet enfant.</p>
                                                        ) : (
                                                            <div className="space-y-4">
                                                                {childDetail.emploi.slice(0, 5).map(e => (
                                                                    <div key={e.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                                                        <div className="flex items-center gap-4">
                                                                            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-100">{e.jour?.substring(0, 3)}</span>
                                                                            <div>
                                                                                <p className="text-sm font-bold text-slate-800">{e.matiereNom}</p>
                                                                                <p className="text-[10px] text-slate-400 font-bold">{e.heureDebut} - {e.heureFin}</p>
                                                                            </div>
                                                                        </div>
                                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white p-2 rounded-xl border border-slate-100">{e.enseignantNom}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {activeTab === "notes" && (
                                                    <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
                                                        <h4 className="text-lg font-black text-slate-800 tracking-tight mb-6">Dernières Notes</h4>
                                                        {childDetail.notes.length === 0 ? (
                                                            <p className="text-sm text-slate-400 font-medium italic">Aucune note enregistrée.</p>
                                                        ) : (
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                {childDetail.notes.map(note => (
                                                                    <div key={note.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                                                                        <div className="flex justify-between items-start mb-2">
                                                                            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{note.matiereNom}</span>
                                                                            <span className={`text-sm font-black ${note.valeur >= 10 ? "text-emerald-600" : "text-coral"}`}>{note.valeur}/20</span>
                                                                        </div>
                                                                        <p className="text-[11px] text-slate-500 font-medium leading-relaxed italic line-clamp-2">
                                                                            "{note.commentaire || "Pas de commentaire"}"
                                                                        </p>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {activeTab === "bilan" && (
                                                    <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
                                                        <h4 className="text-lg font-black text-slate-800 tracking-tight mb-6">Bulletin Scolaire</h4>
                                                        {childDetail.bilan ? (
                                                            <div className="space-y-6">
                                                                <div className="bg-indigo-600 rounded-2xl p-6 text-white text-center">
                                                                    <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-1">Moyenne Générale</p>
                                                                    <p className="text-4xl font-black">{childDetail.bilan.moyenneGenerale.toFixed(2)}/20</p>
                                                                </div>
                                                                <div className="space-y-2">
                                                                    {childDetail.bilan.detailsParMatiere?.map((m: any, idx: number) => (
                                                                        <div key={idx} className="flex items-center justify-between p-3 border-b border-slate-100">
                                                                            <span className="text-sm font-bold text-slate-700">{m.matiereNom}</span>
                                                                            <span className="text-sm font-black text-slate-800">{(m.moyenneFinaleMatiere ?? 0).toFixed(2)}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <p className="text-sm text-slate-400 font-medium italic">Bilan non disponible.</p>
                                                        )}
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}

// Inline fade animations if App.css doesn't have them
const style = document.createElement('style');
style.innerHTML = `
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.animate-fadeIn { animation: fadeIn 0.4s ease-out; }
.animate-fadeUp { animation: fadeUp 0.5s ease-out; }
`;
document.head.appendChild(style);
