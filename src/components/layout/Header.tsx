import { useAuth } from "../../context/AuthContext";
import NotificationBell from "./NotificationBell";


export default function Header() {
    const { logout } = useAuth();

    return (
        <header className="sticky top-0 z-40 bg-white border-b border-navy/8 px-9 py-[18px] flex items-center justify-between" style={{ boxShadow: '0 2px 12px rgba(26,43,74,.06)' }}>
            <div>
                <h2 className="font-display text-[22px] text-navy leading-tight">Tableau de Bord</h2>
                <p className="text-slate text-[13px] mt-0.5">Lundi, 09 Mars 2026 — Année scolaire 2025/2026</p>
            </div>
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-ice border border-navy/10 rounded-xl px-4 py-2 w-56 focus-within:border-teal transition-colors">
                    <svg className="w-4 h-4 text-slate flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input className="bg-transparent outline-none text-[13px] text-navy placeholder-slate w-full" placeholder="Rechercher…" />
                </div>
                {/* Live Notification Bell */}
                <NotificationBell />
                <button onClick={logout} title="Déconnexion" className="w-10 h-10 rounded-xl bg-ice border border-navy/10 flex items-center justify-center hover:bg-navy hover:border-navy transition-all group">
                    <svg className="w-5 h-5 text-navy group-hover:text-white transition-colors" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                        <polyline points="16 17 21 12 16 7"></polyline>
                        <line x1="21" y1="12" x2="9" y2="12"></line>
                    </svg>
                </button>
            </div>
        </header>
    );
}
