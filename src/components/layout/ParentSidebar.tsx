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
        <aside className="w-72 bg-white border-r border-slate-200 flex flex-col hidden lg:flex h-screen sticky top-0 shadow-sm">
            <div className="p-8">
                <div className="flex items-center gap-3 mb-10">
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100">
                        <span className="text-white font-black text-xl">D</span>
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-slate-800 tracking-tight leading-none">DNAS</h1>
                        <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mt-1">Espace Parent</p>
                    </div>
                </div>

                <nav className="space-y-2">
                    {menuItems.map((item) => (
                        item.id === "chat" ? (
                            <Link
                                key={item.id}
                                to="/chat"
                                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all duration-200 text-slate-500 hover:bg-slate-50 hover:text-indigo-600"
                            >
                                <span className="opacity-70">{item.icon}</span>
                                {item.label}
                            </Link>
                        ) : (
                            <button
                                key={item.id}
                                onClick={() => setActiveView(item.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all duration-200 ${activeView === item.id
                                        ? "bg-indigo-50 text-indigo-600 shadow-sm ring-1 ring-indigo-100"
                                        : "text-slate-500 hover:bg-slate-50 hover:text-indigo-600"
                                    }`}
                            >
                                <span className={`${activeView === item.id ? "opacity-100" : "opacity-70"}`}>{item.icon}</span>
                                {item.label}
                            </button>
                        )
                    ))}
                </nav>
            </div>

            <div className="mt-auto p-6">
                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 text-center">Support</p>
                    <button className="w-full py-3 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-700 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all shadow-sm">
                        AIDE & FAQ
                    </button>
                </div>
            </div>
        </aside>
    );
}
