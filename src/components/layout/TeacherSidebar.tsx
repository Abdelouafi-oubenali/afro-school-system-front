import { useAuth } from "../../context/AuthContext";

interface TeacherSidebarProps {
    activeView: "emploi" | "classes" | "notes" | "absences";
    setActiveView: (view: "emploi" | "classes" | "notes" | "absences") => void;
}

export default function TeacherSidebar({ activeView, setActiveView }: TeacherSidebarProps) {
    const { user } = useAuth();

    return (
        <aside className="fixed top-0 left-0 w-64 min-h-screen bg-navy flex flex-col z-50 shadow-2xl transition-all duration-300">
            {/* Logo */}
            <div className="flex items-center gap-3 px-6 py-8 border-b border-white/5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-gold to-orange-400 shadow-lg shadow-gold/20">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                </div>
                <div>
                    <h1 className="font-display text-white text-[17px] font-bold leading-tight tracking-wide">Espace Prof</h1>
                    <span className="text-gold text-[10px] font-semibold tracking-widest uppercase opacity-80">Portail Enseignant</span>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-6 overflow-y-auto px-3 space-y-1.5">
                <p className="px-3 pt-2 pb-2 text-[10px] font-bold tracking-[0.15em] uppercase text-white/40">Principal</p>

                <button
                    onClick={() => setActiveView("emploi")}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${activeView === "emploi"
                            ? "bg-white/10 text-white shadow-inner"
                            : "text-white/60 hover:bg-white/5 hover:text-white"
                        }`}
                >
                    <div className={`p-1.5 rounded-lg transition-colors ${activeView === "emploi" ? "bg-gold/20 text-gold" : "bg-white/5 text-white/60 group-hover:text-gold"}`}>
                        <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                    </div>
                    Mon Emploi
                </button>

                <button
                    onClick={() => setActiveView("classes")}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${activeView === "classes"
                            ? "bg-white/10 text-white shadow-inner"
                            : "text-white/60 hover:bg-white/5 hover:text-white"
                        }`}
                >
                    <div className={`p-1.5 rounded-lg transition-colors ${activeView === "classes" ? "bg-teal/20 text-teal" : "bg-white/5 text-white/60 group-hover:text-teal"}`}>
                        <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
                        </svg>
                    </div>
                    Mes Classes
                </button>

                <p className="px-3 pt-6 pb-2 text-[10px] font-bold tracking-[0.15em] uppercase text-white/40">Pédagogie & Suivi</p>

                <button
                    onClick={() => setActiveView("notes")}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${activeView === "notes"
                            ? "bg-white/10 text-white shadow-inner"
                            : "text-white/60 hover:bg-white/5 hover:text-white"
                        }`}
                >
                    <div className={`p-1.5 rounded-lg transition-colors ${activeView === "notes" ? "bg-blue-500/20 text-blue-400" : "bg-white/5 text-white/60 group-hover:text-blue-400"}`}>
                        <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                            <line x1="16" y1="13" x2="8" y2="13" />
                            <line x1="16" y1="17" x2="8" y2="17" />
                            <polyline points="10 9 9 9 8 9" />
                        </svg>
                    </div>
                    Saisie des Notes
                </button>

                <button
                    onClick={() => setActiveView("absences")}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${activeView === "absences"
                            ? "bg-white/10 text-white shadow-inner"
                            : "text-white/60 hover:bg-white/5 hover:text-white"
                        }`}
                >
                    <div className={`p-1.5 rounded-lg transition-colors ${activeView === "absences" ? "bg-coral/20 text-coral" : "bg-white/5 text-white/60 group-hover:text-coral"}`}>
                        <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                    </div>
                    Déclaration Absences
                </button>
            </nav>

            {/* Profile Section */}
            <div className="p-4 mx-3 mb-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-bold text-navy flex-shrink-0 bg-gradient-to-br from-gold to-orange-400 shadow-md">
                        {user?.name ? user.name.substring(0, 2).toUpperCase() : 'EN'}
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-white text-sm font-semibold truncate leading-tight">{user?.name || 'Enseignant'}</p>
                        <span className="text-white/40 text-[11px] font-medium block mt-0.5">Connecté</span>
                    </div>
                </div>
            </div>
        </aside>
    );
}
