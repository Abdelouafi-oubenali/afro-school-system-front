import { useAuth } from "../../context/AuthContext";
import NotificationBell from "./NotificationBell";

export default function StudentHeader() {
    const { user, logout } = useAuth();

    return (
        <header className="h-20 bg-white border-b border-slate-200 px-6 md:px-8 flex items-center justify-between z-10 sticky top-0">
            <div className="flex items-center gap-4 lg:hidden">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </div>
                <span className="text-lg font-bold text-slate-800">AfroSchool</span>
            </div>

            <div className="hidden md:flex items-center gap-3">
                <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                    <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Date d'aujourd'hui</p>
                    <p className="text-sm font-bold text-slate-700">{new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
            </div>

            <div className="flex items-center gap-4 md:gap-6">
                {/* Live Notification Bell */}
                <NotificationBell />

                <div className="h-10 w-[1px] bg-slate-200 hidden md:block"></div>

                <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-bold text-slate-800 leading-none mb-1">{user?.name || "Élève"}</p>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100 uppercase tracking-wider">
                            {user?.role || "Élève"}
                        </span>
                    </div>
                    <div className="relative group">
                        <button className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-bold hover:bg-slate-200 transition-colors shadow-sm">
                            {(user?.name || "E").charAt(0).toUpperCase()}
                        </button>

                        <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 translate-y-2 group-hover:translate-y-0">
                            <button
                                onClick={logout}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50 transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                                Déconnexion
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
