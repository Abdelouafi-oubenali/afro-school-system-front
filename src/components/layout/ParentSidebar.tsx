import { Link } from "react-router-dom";

interface ParentSidebarProps {
    activeView: string;
    setActiveView: (view: any) => void;
}

export default function ParentSidebar({ activeView, setActiveView }: ParentSidebarProps) {
    const menuItems = [
        {
            id: "enfants", label: "Mes Enfants", icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
            )
        },
        {
            id: "chat", label: "Messagerie", icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
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
                    <span className="text-teal-lt text-[10px] font-semibold tracking-widest uppercase opacity-80">System Parent</span>
                </div>
            </div>

            <nav className="flex-1 py-6 overflow-y-auto px-3 space-y-1.5">
                <p className="px-3 pt-2 pb-2 text-[10px] font-bold tracking-[0.15em] uppercase text-white/40">Principal</p>
                {menuItems.map((item) => (
                    item.id === "chat" ? (
                        <Link
                            key={item.id}
                            to="/chat"
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-white/60 hover:bg-white/5 hover:text-white transition-all group"
                        >
                            <div className="p-1.5 rounded-lg bg-white/5 text-white/60 group-hover:text-blue-400 transition-colors">
                                {item.icon}
                            </div>
                            {item.label}
                        </Link>
                    ) : (
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
                    )
                ))}
            </nav>

            <div className="p-4 mx-3 mb-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-bold text-navy flex-shrink-0" style={{ background: 'linear-gradient(135deg,#0E9E8E,#16BCA8)' }}>
                        PR
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-white text-sm font-semibold truncate leading-tight">Mon Compte</p>
                        <span className="text-teal-lt text-[11px] font-medium block mt-0.5">Parent Connecté</span>
                    </div>
                </div>
            </div>
        </aside >
    );
}
