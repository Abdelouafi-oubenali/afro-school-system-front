import { Link } from "react-router-dom";

export function QuickActions() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
            <button className="bg-white border border-navy/8 rounded-xl p-4 flex items-center gap-3 text-[13px] font-medium text-navy hover:border-teal hover:bg-teal/5 hover:-translate-y-0.5 shadow-card transition-all duration-200">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-teal/10 flex-shrink-0">
                    <svg className="w-[18px] h-[18px] text-teal" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" />
                    </svg>
                </div>
                Nouvel élève
            </button>
            <button className="bg-white border border-navy/8 rounded-xl p-4 flex items-center gap-3 text-[13px] font-medium text-navy hover:border-gold hover:bg-gold/5 hover:-translate-y-0.5 shadow-card transition-all duration-200">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-gold/10 flex-shrink-0">
                    <svg className="w-[18px] h-[18px] text-gold" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
                    </svg>
                </div>
                Saisir absences
            </button>
            <button className="bg-white border border-navy/8 rounded-xl p-4 flex items-center gap-3 text-[13px] font-medium text-navy hover:border-sage hover:bg-sage/5 hover:-translate-y-0.5 shadow-card transition-all duration-200">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-sage/10 flex-shrink-0">
                    <svg className="w-[18px] h-[18px] text-sage" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
                    </svg>
                </div>
                Générer bulletin
            </button>
            <Link to="/classes" className="bg-white border border-navy/8 rounded-xl p-4 flex items-center gap-3 text-[13px] font-medium text-navy hover:border-blue-500/40 hover:bg-blue-50 hover:-translate-y-0.5 shadow-card transition-all duration-200">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-blue-100 flex-shrink-0">
                    <svg className="w-[18px] h-[18px] text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M3 21h18" /><rect x="5" y="9" width="4" height="8" /><rect x="10" y="5" width="4" height="12" /><rect x="15" y="11" width="4" height="6" />
                    </svg>
                </div>
                Gérer classes
            </Link>
            <button className="bg-white border border-navy/8 rounded-xl p-4 flex items-center gap-3 text-[13px] font-medium text-navy hover:border-navy/30 hover:bg-navy/5 hover:-translate-y-0.5 shadow-card transition-all duration-200">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-slate/10 flex-shrink-0">
                    <svg className="w-[18px] h-[18px] text-slate" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M22 17H2a3 3 0 003-3V9a7 7 0 0114 0v5a3 3 0 003 3zm-8.27 4a2 2 0 01-3.46 0" />
                    </svg>
                </div>
                Envoyer annonce
            </button>
        </div>
    );
}
