import { useAuth } from "../../context/AuthContext";

export default function TeacherHeader() {
    const { logout } = useAuth();

    return (
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-navy/5 shadow-sm">
            <div className="px-8 py-4 flex items-center justify-between">
                <div>
                    {/* Welcome message can be added here or kept in main layout */}
                </div>

                <div className="flex items-center gap-4">
                    {/* Notification Icon */}
                    <button className="relative p-2 rounded-full text-slate hover:bg-ice transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
                            <path d="M13.73 21a2 2 0 01-3.46 0" />
                        </svg>
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-coral ring-2 ring-white"></span>
                    </button>

                    <div className="h-6 w-px bg-navy/10 mx-1"></div>

                    {/* Logout Button */}
                    <button
                        onClick={logout}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-coral bg-coral/5 hover:bg-coral/10 hover:text-coral-dark transition-all duration-200"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Déconnexion
                    </button>
                </div>
            </div>
        </header>
    );
}
