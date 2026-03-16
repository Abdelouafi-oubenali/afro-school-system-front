import { useAuth } from "../../context/AuthContext";
import NotificationBell from "./NotificationBell";

export default function TeacherHeader() {
    const { user, logout } = useAuth();

    return (
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-40 transition-all" style={{ boxShadow: '0 4px 24px rgba(26,43,74,.03)' }}>
            <div className="flex-1">
                <div className="max-w-md relative hidden md:flex items-center">
                    <svg className="w-5 h-5 text-slate-400 absolute left-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input className="bg-slate-50 border border-slate-200 rounded-xl outline-none text-[13px] text-slate-700 placeholder-slate-400 w-full py-2.5 pl-11 pr-4 focus:ring-2 focus:ring-navy/10 transition-all" placeholder="Rechercher…" />
                </div>
            </div>

            <div className="flex items-center gap-4 md:gap-6">
                <NotificationBell />

                <div className="h-8 w-px bg-slate-200 mx-1 hidden md:block"></div>

                <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-bold text-slate-800 leading-none mb-1">{user?.name || "Professeur"}</p>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-navy/5 text-navy border border-navy/10 uppercase tracking-wider">
                            Enseignant
                        </span>
                    </div>
                    <button onClick={logout} title="Déconnexion" className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center hover:bg-coral hover:text-white hover:border-coral transition-all group shadow-sm text-slate-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                    </button>
                </div>
            </div>
        </header>
    );
}

