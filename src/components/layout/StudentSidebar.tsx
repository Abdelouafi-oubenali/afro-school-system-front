import { Link } from "react-router-dom";

interface StudentSidebarProps {
    activeView: string;
    setActiveView: (view: any) => void;
}

export default function StudentSidebar({ activeView, setActiveView }: StudentSidebarProps) {
    const menuItems = [
        {
            id: "emploi", label: "Mon Emploi", icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            )
        },
        {
            id: "classe", label: "Ma Classe", icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
            )
        },
        {
            id: "notes", label: "Mes Notes", icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            )
        },
        {
            id: "bilan", label: "Mon Bilan", icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            )
        },
    ];

    return (
        <aside className="fixed top-0 left-0 w-64 min-h-screen bg-navy flex flex-col z-50 shadow-2xl transition-all duration-300">
            {/* Logo */}
            <div className="flex items-center gap-3 px-6 py-7 border-b border-white/10">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg,#0E9E8E,#16BCA8)' }}>
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zm0 2.18L20.49 9 12 12.82 3.51 9 12 5.18zM5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z" />
                    </svg>
                </div>
                <div>
                    <h1 className="font-display text-white text-[15px] font-bold tracking-wide">Afro-School</h1>
                    <span className="text-teal-lt text-[10px] font-semibold tracking-widest uppercase opacity-80">System Élève</span>
                </div>
            </div>

            <nav className="flex-1 py-6 overflow-y-auto px-3 space-y-1.5">
                <p className="px-3 pt-2 pb-2 text-[10px] font-bold tracking-[0.15em] uppercase text-white/40">Principal</p>

                {menuItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setActiveView(item.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${activeView === item.id
                            ? "bg-white/10 text-white shadow-inner"
                            : "text-white/60 hover:bg-white/5 hover:text-white"
                            }`}
                    >
                        <div className={`p-1.5 rounded-lg transition-colors ${activeView === item.id ? "bg-teal/20 text-teal" : "bg-white/5 text-white/60 group-hover:text-teal"}`}>
                            {item.icon}
                        </div>
                        {item.label}
                    </button>
                ))}

                <p className="px-3 pt-6 pb-2 text-[10px] font-bold tracking-[0.15em] uppercase text-white/40">Communication</p>

                <Link
                    to="/chat"
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-white/60 hover:bg-white/5 hover:text-white transition-all group"
                >
                    <div className="p-1.5 rounded-lg bg-white/5 text-white/60 group-hover:text-blue-400 transition-colors">
                        <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                    </div>
                    Messagerie
                </Link>
            </nav>

            <div className="p-4 mx-3 mb-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-bold text-navy flex-shrink-0" style={{ background: 'linear-gradient(135deg,#0E9E8E,#16BCA8)' }}>
                        ST
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-white text-sm font-semibold truncate leading-tight">Mon Espace</p>
                        <span className="text-teal-lt text-[11px] font-medium block mt-0.5">Élève Connecté</span>
                    </div>
                </div>
            </div>
        </aside >
    );
}
