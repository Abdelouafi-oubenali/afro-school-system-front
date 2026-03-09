import React from "react";

export function AlertsPanel() {
    const alerts = [
        {
            type: 'coral',
            icon: (
                <svg className="w-4 h-4 text-coral" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
            ),
            title: "Sara Alaoui — 9 absences",
            desc: "3ème B · Alerte envoyée aux parents",
            bgClass: "rgba(224,92,92,.07)",
            iconBgClass: "rgba(224,92,92,.15)",
            borderClass: "border-coral",
            delay: "0.05s"
        },
        {
            type: 'gold',
            icon: (
                <svg className="w-4 h-4 text-gold" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
                </svg>
            ),
            title: "Prof. Fassi — absence déclarée",
            desc: "Math 4ème A — 10h00 annulé",
            bgClass: "rgba(232,160,32,.07)",
            iconBgClass: "rgba(232,160,32,.15)",
            borderClass: "border-gold",
            delay: "0.1s"
        },
        {
            type: 'coral',
            icon: (
                <svg className="w-4 h-4 text-coral" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
            ),
            title: "Leila Kabbaj — niveau Faible",
            desc: "4ème C · Parents notifiés auto.",
            bgClass: "rgba(224,92,92,.07)",
            iconBgClass: "rgba(224,92,92,.15)",
            borderClass: "border-coral",
            delay: "0.15s"
        },
        {
            type: 'teal',
            icon: (
                <svg className="w-4 h-4 text-teal" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" />
                </svg>
            ),
            title: "Paiement reçu — Famille Benali",
            desc: "1 200 MAD · Facture FAC-0892",
            bgClass: "rgba(14,158,142,.07)",
            iconBgClass: "rgba(14,158,142,.15)",
            borderClass: "border-teal",
            delay: "0.2s"
        },
        {
            type: 'gold',
            icon: (
                <svg className="w-4 h-4 text-gold" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
            ),
            title: "3 absences consécutives — K. Tazi",
            desc: "1ère C · En attente justificatif",
            bgClass: "rgba(232,160,32,.07)",
            iconBgClass: "rgba(232,160,32,.15)",
            borderClass: "border-gold",
            delay: "0.25s"
        },
        {
            type: 'slate',
            icon: (
                <svg className="w-4 h-4 text-slate" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                </svg>
            ),
            title: "Nouveau document publié",
            desc: "Calendrier examens T2 disponible",
            bgClass: "rgba(107,126,159,.07)",
            iconBgClass: "rgba(107,126,159,.1)",
            borderClass: "border-slate/40",
            delay: "0.3s"
        }
    ];

    return (
        <div className="bg-white rounded-2xl p-6 shadow-card">
            <div className="flex items-start justify-between mb-5">
                <div>
                    <h3 className="font-display text-[16px] font-semibold text-navy">Alertes & Notifications</h3>
                    <p className="text-slate text-[12px] mt-0.5">Aujourd'hui — 9 mars 2026</p>
                </div>
                <span className="bg-coral text-white text-[11px] font-bold px-2.5 py-1 rounded-full">12</span>
            </div>
            <div className="space-y-3">
                {alerts.map((alert, i) => (
                    <div key={i} className={`flex gap-3 p-3 rounded-xl border-l-[3px] ${alert.borderClass} animate-slideIn`} style={{ background: alert.bgClass, animationDelay: alert.delay }}>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: alert.iconBgClass }}>
                            {alert.icon}
                        </div>
                        <div>
                            <p className="text-[13px] font-semibold text-navy leading-tight">{alert.title}</p>
                            <span className="text-[11px] text-slate">{alert.desc}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
