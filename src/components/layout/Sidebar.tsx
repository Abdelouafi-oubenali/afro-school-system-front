import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Sidebar() {
    const { user } = useAuth();

    return (
        <aside className="fixed top-0 left-0 w-64 min-h-screen bg-navy flex flex-col z-50" style={{ boxShadow: '4px 0 24px rgba(26,43,74,.22)' }}>
            {/* Logo */}
            <div className="flex items-center gap-3 px-6 py-7 border-b border-white/10">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg,#0E9E8E,#16BCA8)' }}>
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zm0 2.18L20.49 9 12 12.82 3.51 9 12 5.18zM5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z" />
                    </svg>
                </div>
                <div>
                    <h1 className="font-display text-white text-[17px] leading-tight">EduManager</h1>
                    <span className="text-teal-lt text-[10px] font-semibold tracking-widest uppercase">Gestion Scolaire</span>
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 py-4 overflow-y-auto">
                <p className="px-5 pt-2 pb-1 text-[10px] font-semibold tracking-[.12em] uppercase text-slate">Principal</p>

                <NavLink
                    to="/dashboard"
                    className={({ isActive }) =>
                        `${isActive ? "nav-active text-white font-semibold" : "text-white/60"} flex items-center gap-3 mx-3 px-4 py-[10px] rounded-xl text-sm mb-1 transition-colors hover-bg-white-8 hover:text-white`
                    }
                >
                    <svg className="w-[17px] h-[17px] flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
                        <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
                    </svg>
                    Tableau de bord
                </NavLink>

                <NavLink
                    to="/eleves"
                    className={({ isActive }) =>
                        `${isActive ? "nav-active text-white font-semibold" : "text-white/60"} flex items-center gap-3 mx-3 px-4 py-[10px] rounded-xl text-sm mb-1 transition-colors hover-bg-white-8 hover:text-white`
                    }
                >
                    <svg className="w-[17px] h-[17px] flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
                    </svg>
                    Élèves
                </NavLink>

                <NavLink
                    to="/parents"
                    className={({ isActive }) =>
                        `${isActive ? "nav-active text-white font-semibold" : "text-white/60"} flex items-center gap-3 mx-3 px-4 py-[10px] rounded-xl text-sm mb-1 transition-colors hover-bg-white-8 hover:text-white`
                    }
                >
                    <svg className="w-[17px] h-[17px] flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 00-3-3.87" />
                        <circle cx="18" cy="8" r="3" />
                    </svg>
                    Parents
                </NavLink>

                <NavLink
                    to="/enseignents"
                    className={({ isActive }) =>
                        `${isActive ? "nav-active text-white font-semibold" : "text-white/60"} flex items-center gap-3 mx-3 px-4 py-[10px] rounded-xl text-sm mb-1 transition-colors hover-bg-white-8 hover:text-white`
                    }
                >
                    <svg className="w-[17px] h-[17px] flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
                    </svg>
                    Enseignants
                </NavLink>

                <NavLink
                    to="/classes"
                    className={({ isActive }) =>
                        `${isActive ? "nav-active text-white font-semibold" : "text-white/60"} flex items-center gap-3 mx-3 px-4 py-[10px] rounded-xl text-sm mb-1 transition-colors hover-bg-white-8 hover:text-white`
                    }
                >
                    <svg className="w-[17px] h-[17px] flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                    Classes & Groupes
                </NavLink>

                <NavLink
                    to="/matieres"
                    className={({ isActive }) =>
                        `${isActive ? "nav-active text-white font-semibold" : "text-white/60"} flex items-center gap-3 mx-3 px-4 py-[10px] rounded-xl text-sm mb-1 transition-colors hover-bg-white-8 hover:text-white`
                    }
                >
                    <svg className="w-[17px] h-[17px] flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
                    </svg>
                    Matieres
                </NavLink>

                <NavLink
                    to="/seances"
                    className={({ isActive }) =>
                        `${isActive ? "nav-active text-white font-semibold" : "text-white/60"} flex items-center gap-3 mx-3 px-4 py-[10px] rounded-xl text-sm mb-1 transition-colors hover-bg-white-8 hover:text-white`
                    }
                >
                    <svg className="w-[17px] h-[17px] flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <rect x="3" y="4" width="18" height="18" rx="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    Seances
                </NavLink>

                <NavLink
                    to="/admins"
                    className={({ isActive }) =>
                        `${isActive ? "nav-active text-white font-semibold" : "text-white/60"} flex items-center gap-3 mx-3 px-4 py-[10px] rounded-xl text-sm mb-1 transition-colors hover-bg-white-8 hover:text-white`
                    }
                >
                    <svg className="w-[17px] h-[17px] flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                        <path d="M4 21v-1a3 3 0 013-3h10a3 3 0 013 3v1" />
                    </svg>
                    Admins
                </NavLink>

                <p className="px-5 pt-5 pb-1 text-[10px] font-semibold tracking-[.12em] uppercase text-slate">Pédagogie</p>

                <NavLink
                    to="/notes"
                    className={({ isActive }) =>
                        `${isActive ? "nav-active text-white font-semibold" : "text-white/60"} flex items-center gap-3 mx-3 px-4 py-[10px] rounded-xl text-sm mb-1 transition-colors hover-bg-white-8 hover:text-white`
                    }
                >
                    <svg className="w-[17px] h-[17px] flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                    </svg>
                    Notes & Bulletins
                </NavLink>

                <NavLink
                    to="/seances"
                    className={({ isActive }) =>
                        `${isActive ? "nav-active text-white font-semibold" : "text-white/60"} flex items-center gap-3 mx-3 px-4 py-[10px] rounded-xl text-sm mb-1 transition-colors hover-bg-white-8 hover:text-white`
                    }
                >
                    <svg className="w-[17px] h-[17px] flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    Emploi du temps
                </NavLink>

                <a href="#" className="flex items-center gap-3 mx-3 px-4 py-[10px] rounded-xl text-white/60 text-sm mb-1 transition-colors hover-bg-white-8 hover:text-white">
                    <svg className="w-[17px] h-[17px] flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                    </svg>
                    Documents
                </a>

                <p className="px-5 pt-5 pb-1 text-[10px] font-semibold tracking-[.12em] uppercase text-slate">Administration</p>

                <NavLink
                    to="/absences"
                    className={({ isActive }) =>
                        `${isActive ? "nav-active text-white font-semibold" : "text-white/60"} flex items-center gap-3 mx-3 px-4 py-[10px] rounded-xl text-sm mb-1 transition-colors hover-bg-white-8 hover:text-white`
                    }
                >
                    <svg className="w-[17px] h-[17px] flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    Absences & Retards
                </NavLink>

                <a href="#" className="flex items-center gap-3 mx-3 px-4 py-[10px] rounded-xl text-white/60 text-sm mb-1 transition-colors hover-bg-white-8 hover:text-white">
                    <svg className="w-[17px] h-[17px] flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" />
                    </svg>
                    Paiements
                </a>

                <NavLink
                    to="/chat"
                    className={({ isActive }) =>
                        `${isActive ? "nav-active text-white font-semibold" : "text-white/60"} flex items-center gap-3 mx-3 px-4 py-[10px] rounded-xl text-sm mb-1 transition-colors hover-bg-white-8 hover:text-white`
                    }
                >
                    <svg className="w-[17px] h-[17px] flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                    </svg>
                    Messagerie
                </NavLink>
            </nav>

            {/* User profile */}
            <div className="mx-3 mb-4 p-3 rounded-xl bg-white/6 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-bold text-navy flex-shrink-0" style={{ background: 'linear-gradient(135deg,#E8A020,#F5B84C)' }}>
                    {user?.name ? user.name.substring(0, 2).toUpperCase() : 'AD'}
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-white text-[13px] font-semibold truncate">{user?.name || 'Ahmed Driss'}</p>
                    <span className="text-slate text-[11px]">Administrateur</span>
                </div>
                <button className="flex-shrink-0 text-slate hover:text-white transition-colors" title="Settings / Logout">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="3" />
                        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
                    </svg>
                </button>
            </div>
        </aside>
    );
}
