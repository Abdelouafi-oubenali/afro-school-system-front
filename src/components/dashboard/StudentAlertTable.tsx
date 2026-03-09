import React from "react";

export function StudentAlertTable() {
    const students = [
        {
            initials: "SA", name: "Sara Alaoui", id: "ID-2341", class: "3ème B", level: "Faible", abs: 9, status: "Alerte",
            bg: "rgba(224,92,92,.15)", textClass: "text-coral",
            levelStyle: { bgClass: "rgba(224,92,92,.12)", textClass: "text-coral" }
        },
        {
            initials: "YB", name: "Youssef Benali", id: "ID-1892", class: "5ème A", level: "Moyen", abs: 6, status: "Surveillance",
            bg: "rgba(232,160,32,.15)", textClass: "text-gold",
            levelStyle: { bgClass: "bg-gold/15", textClass: "text-gold" }
        },
        {
            initials: "LK", name: "Leila Kabbaj", id: "ID-2017", class: "4ème C", level: "Faible", abs: 7, status: "Alerte",
            bg: "rgba(224,92,92,.15)", textClass: "text-coral",
            levelStyle: { bgClass: "rgba(224,92,92,.12)", textClass: "text-coral" }
        },
        {
            initials: "AO", name: "Amine Ouhabi", id: "ID-1654", class: "2ème A", level: "Bon", abs: 2, status: "Normal",
            bg: "rgba(91,173,139,.15)", textClass: "text-sage",
            levelStyle: { bgClass: "bg-sage/15", textClass: "text-sage" },
            absText: "text-navy"
        },
        {
            initials: "NC", name: "Nadia Chraibi", id: "ID-2204", class: "6ème B", level: "Moyen", abs: 5, status: "Surveillance",
            bg: "rgba(232,160,32,.15)", textClass: "text-gold",
            levelStyle: { bgClass: "bg-gold/15", textClass: "text-gold" }
        }
    ];

    return (
        <div className="bg-white rounded-2xl p-6 shadow-card">
            <div className="flex items-start justify-between mb-5">
                <div>
                    <h3 className="font-display text-[16px] font-semibold text-navy">Élèves — alertes actives</h3>
                    <p className="text-slate text-[12px] mt-0.5">Niveaux faibles & absences répétées</p>
                </div>
                <button className="text-[13px] text-teal font-semibold flex items-center gap-1 hover:underline">
                    Voir tout
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <polyline points="9 18 15 12 9 6" />
                    </svg>
                </button>
            </div>
            <table className="w-full">
                <thead>
                    <tr className="border-b-2 border-ice">
                        <th className="text-left text-[11px] font-semibold tracking-wider uppercase text-slate pb-3 pl-2">Élève</th>
                        <th className="text-left text-[11px] font-semibold tracking-wider uppercase text-slate pb-3 px-2">Classe</th>
                        <th className="text-left text-[11px] font-semibold tracking-wider uppercase text-slate pb-3 px-2">Niveau</th>
                        <th className="text-left text-[11px] font-semibold tracking-wider uppercase text-slate pb-3 px-2">Abs.</th>
                        <th className="text-left text-[11px] font-semibold tracking-wider uppercase text-slate pb-3 px-2">Statut</th>
                    </tr>
                </thead>
                <tbody>
                    {students.map((st, i) => (
                        <tr key={i} className={`hover:bg-ice cursor-pointer transition-colors ${i !== students.length - 1 ? 'border-b border-navy/5' : ''}`}>
                            <td className="py-3 pl-2 pr-2">
                                <div className="flex items-center gap-2.5">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold ${st.textClass} flex-shrink-0`} style={{ background: st.bg }}>{st.initials}</div>
                                    <div><div className="text-[13px] font-medium leading-tight">{st.name}</div><div className="text-[11px] text-slate">{st.id}</div></div>
                                </div>
                            </td>
                            <td className="py-3 px-2 text-[13px]">{st.class}</td>
                            <td className="py-3 px-2">
                                <span
                                    className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${st.levelStyle.textClass} ${!st.levelStyle.bgClass.includes('rgba') ? st.levelStyle.bgClass : ''}`}
                                    style={{ background: st.levelStyle.bgClass.includes('rgba') ? st.levelStyle.bgClass : undefined }}
                                >
                                    {st.level}
                                </span>
                            </td>
                            <td className={`py-3 px-2 text-[13px] font-bold ${st.absText || st.textClass}`}>{st.abs}</td>
                            <td className="py-3 px-2">
                                <div className={`flex items-center gap-1.5 text-[11px] ${st.textClass} font-medium`}>
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 8 8"><circle cx="4" cy="4" r="4" /></svg>{st.status}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
