import { useState } from "react";
import Layout from "../../components/layout/Layout";
import StatCard from "../../components/layout/StatCard";
import EnseignentList from "../../components/enseignents/EnseignentList";
import { useEnseignents } from "../../hooks/useEnseignents";
import enseignentService from "../../services/user/enseignentService";
import type { Enseignent, EnseignentCreatePayload, EnseignentUpdatePayload } from "../../services/user/enseignentService";

export default function Enseignents() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeletingDetail, setIsDeletingDetail] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [listRefreshKey, setListRefreshKey] = useState(0);
    const { enseignents } = useEnseignents(listRefreshKey);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [selectedEnseignent, setSelectedEnseignent] = useState<Enseignent | null>(null);
    const [formData, setFormData] = useState<EnseignentCreatePayload>({
        nom: "",
        prenom: "",
        email: "",
        password: "",
        phone: "",
        dateNaissance: "",
        specialite: "",
        dateEmbauche: "",
    });

    const updateField = (field: keyof EnseignentCreatePayload, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const resetForm = () => {
        setFormData({
            nom: "",
            prenom: "",
            email: "",
            password: "",
            phone: "",
            dateNaissance: "",
            specialite: "",
            dateEmbauche: "",
        });
        setFormError(null);
        setEditingId(null);
    };

    const toInputDate = (value: string) => {
        if (!value) return "";
        return value.includes("T") ? value.slice(0, 10) : value;
    };

    const handleEdit = (item: Enseignent) => {
        setSelectedEnseignent(null);
        setFormData({
            nom: item.nom,
            prenom: item.prenom,
            email: item.email,
            password: "",
            phone: item.phone,
            dateNaissance: toInputDate(item.dateNaissance),
            specialite: item.specialite || item.matiere || "",
            dateEmbauche: toInputDate(item.dateEmbauche || ""),
        });
        setEditingId(item.id);
        setIsModalOpen(true);
    };

    const handleView = (item: Enseignent) => {
        setSelectedEnseignent(item);
        setIsModalOpen(false);
        setFormError(null);
    };

    const handleDeleteFromDetail = async () => {
        if (!selectedEnseignent) return;
        const confirmed = window.confirm(`Supprimer l'enseignant ${selectedEnseignent.prenom} ${selectedEnseignent.nom} ?`);
        if (!confirmed) return;

        try {
            setIsDeletingDetail(true);
            await enseignentService.deleteEnseignent(selectedEnseignent.id);
            setSelectedEnseignent(null);
            setListRefreshKey((k) => k + 1);
        } catch (error) {
            setFormError(error instanceof Error ? error.message : "Erreur lors de la suppression de l'enseignant");
        } finally {
            setIsDeletingDetail(false);
        }
    };

    const formatDisplayDate = (value: string) => {
        if (!value) return "-";
        return value.includes("T") ? value.slice(0, 10) : value;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setFormError(null);

        try {
            if (editingId) {
                if (!formData.password) {
                    setFormError("Le mot de passe est obligatoire pour la modification.");
                    setIsSubmitting(false);
                    return;
                }

                const payload: EnseignentUpdatePayload = {
                    id: editingId,
                    nom: formData.nom,
                    prenom: formData.prenom,
                    email: formData.email,
                    password: formData.password,
                    phone: formData.phone,
                    dateNaissance: formData.dateNaissance,
                    specialite: formData.specialite,
                    dateEmbauche: formData.dateEmbauche,
                };
                await enseignentService.updateEnseignent(editingId, payload);
            } else {
                await enseignentService.createEnseignent(formData);
            }

            setIsModalOpen(false);
            resetForm();
            setListRefreshKey((k) => k + 1);
        } catch (error) {
            setFormError(error instanceof Error ? error.message : "Erreur lors de l'enregistrement de l'enseignant");
        } finally {
            setIsSubmitting(false);
        }
    };

    const totalEnseignents = enseignents.length;
    const avecSpecialite = enseignents.filter((e) => Boolean(e.specialite || e.matiere)).length;
    const avecClasse = enseignents.filter((e) => Boolean((e.classes && e.classes.length > 0) || e.classe)).length;

    return (
        <Layout>
            {selectedEnseignent ? (
                <div className="bg-white rounded-2xl p-6 shadow-card animate-fadeUp">
                    <div className="flex items-start justify-between gap-3 flex-wrap mb-5">
                        <div>
                            <h2 className="font-display text-[22px] text-navy leading-tight">Détail de l'enseignant</h2>
                            <p className="text-slate text-[13px] mt-0.5">Consultation des informations complètes</p>
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                            <button type="button" onClick={() => setSelectedEnseignent(null)} className="px-4 py-2.5 rounded-xl border border-navy/10 text-navy text-sm font-medium hover:bg-ice transition-colors">Retour à la liste</button>
                            <button type="button" onClick={() => handleEdit(selectedEnseignent)} className="px-4 py-2.5 rounded-xl border border-gold/30 text-gold text-sm font-medium hover:bg-gold/5 transition-colors">Modifier</button>
                            <button type="button" onClick={handleDeleteFromDetail} disabled={isDeletingDetail} className="px-4 py-2.5 rounded-xl bg-coral text-white text-sm font-semibold hover:bg-coral/90 transition-colors disabled:opacity-60">{isDeletingDetail ? "Suppression..." : "Supprimer"}</button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-3 rounded-xl bg-ice/60 border border-navy/10 md:col-span-2"><p className="text-[11px] uppercase tracking-wide text-slate">ID</p><p className="text-sm font-medium text-navy break-all">{selectedEnseignent.id}</p></div>
                        <div className="p-3 rounded-xl bg-ice/60 border border-navy/10"><p className="text-[11px] uppercase tracking-wide text-slate">Nom</p><p className="text-sm font-medium text-navy">{selectedEnseignent.nom}</p></div>
                        <div className="p-3 rounded-xl bg-ice/60 border border-navy/10"><p className="text-[11px] uppercase tracking-wide text-slate">Prénom</p><p className="text-sm font-medium text-navy">{selectedEnseignent.prenom}</p></div>
                        <div className="p-3 rounded-xl bg-ice/60 border border-navy/10"><p className="text-[11px] uppercase tracking-wide text-slate">Email</p><p className="text-sm font-medium text-navy break-all">{selectedEnseignent.email}</p></div>
                        <div className="p-3 rounded-xl bg-ice/60 border border-navy/10"><p className="text-[11px] uppercase tracking-wide text-slate">Téléphone</p><p className="text-sm font-medium text-navy">{selectedEnseignent.phone || "-"}</p></div>
                        <div className="p-3 rounded-xl bg-ice/60 border border-navy/10"><p className="text-[11px] uppercase tracking-wide text-slate">Date de naissance</p><p className="text-sm font-medium text-navy">{formatDisplayDate(selectedEnseignent.dateNaissance)}</p></div>
                        <div className="p-3 rounded-xl bg-ice/60 border border-navy/10"><p className="text-[11px] uppercase tracking-wide text-slate">Spécialité</p><p className="text-sm font-medium text-navy">{selectedEnseignent.specialite || selectedEnseignent.matiere || "-"}</p></div>
                        <div className="p-3 rounded-xl bg-ice/60 border border-navy/10"><p className="text-[11px] uppercase tracking-wide text-slate">Date d'embauche</p><p className="text-sm font-medium text-navy">{formatDisplayDate(selectedEnseignent.dateEmbauche || "")}</p></div>
                        <div className="p-3 rounded-xl bg-ice/60 border border-navy/10"><p className="text-[11px] uppercase tracking-wide text-slate">Classes</p><p className="text-sm font-medium text-navy">{selectedEnseignent.classes?.length ? selectedEnseignent.classes.join(", ") : (selectedEnseignent.classe || "-")}</p></div>
                    </div>
                </div>
            ) : (
                <>
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div>
                            <h2 className="font-display text-[22px] text-navy leading-tight">Gestion des enseignants</h2>
                            <p className="text-slate text-[13px] mt-0.5">Administration des profils et affectations</p>
                        </div>
                
                    </div>

                    <div className="grid grid-cols-3 gap-5">
                        <StatCard title="Total enseignants" value={totalEnseignents} icon={(<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>)} trendValue="Effectif actuel" trendIcon={(<svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><polyline points="18 15 12 9 6 15" /></svg>)} colorTheme={{ gradient: "linear-gradient(90deg,#0E9E8E,#16BCA8)", iconBg: "rgba(14,158,142,.1)", iconColor: "#0E9E8E", trendBg: "rgba(91,173,139,.15)", trendColor: "#5BAD8B" }} delay="0.05s" />
                        <StatCard title="Avec spécialité" value={avecSpecialite} icon={(<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 20V10" /><path d="M18 20V4" /><path d="M6 20v-6" /></svg>)} trendValue={totalEnseignents > 0 ? `${Math.round((avecSpecialite / totalEnseignents) * 100)}% du total` : "0% du total"} trendIcon={(<svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><polyline points="18 15 12 9 6 15" /></svg>)} colorTheme={{ gradient: "linear-gradient(90deg,#E8A020,#F5B84C)", iconBg: "rgba(232,160,32,.1)", iconColor: "#E8A020", trendBg: "rgba(232,160,32,.15)", trendColor: "#E8A020" }} delay="0.1s" />
                        <StatCard title="Affectés à une classe" value={avecClasse} icon={(<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2" /><line x1="3" y1="10" x2="21" y2="10" /></svg>)} trendValue={totalEnseignents > 0 ? `${Math.round((avecClasse / totalEnseignents) * 100)}% du total` : "0% du total"} trendIcon={(<svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9" /></svg>)} colorTheme={{ gradient: "linear-gradient(90deg,#E05C5C,#f08080)", iconBg: "rgba(224,92,92,.1)", iconColor: "#E05C5C", trendBg: "rgba(224,92,92,.12)", trendColor: "#E05C5C" }} delay="0.15s" />
                    </div>

                        <div className="flex items-center gap-3 flex-wrap">
                            <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-64 rounded-xl border border-navy/10 bg-white px-3 py-2.5 text-sm text-navy outline-none focus:border-teal" placeholder="Rechercher: nom, email, matière..." />
                            <button type="button" onClick={() => setIsModalOpen(true)} className="nav-active text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-teal hover:opacity-95 transition-opacity">+ Nouvel enseignant</button>
                        </div>
                    <EnseignentList refreshKey={listRefreshKey} onEdit={handleEdit} onView={handleView} searchTerm={searchTerm} />

                    {isModalOpen && (
                        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                            <div className="absolute inset-0 bg-navy/40" onClick={() => setIsModalOpen(false)} />
                            <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-hover p-6 animate-fadeUp">
                                <div className="flex items-center justify-between mb-5">
                                    <h3 className="font-display text-[20px] text-navy">{editingId ? "Modifier l'enseignant" : "Nouvel enseignant"}</h3>
                                    <button type="button" className="w-9 h-9 rounded-lg border border-navy/10 text-slate hover:text-navy hover:bg-ice transition-colors" onClick={() => setIsModalOpen(false)} title="Fermer">x</button>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    {formError && (
                                        <div className="p-3 rounded-xl bg-coral/10 border border-coral/20 text-coral text-sm">{formError}</div>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div><label className="block text-[12px] font-semibold text-slate mb-1.5">Nom</label><input type="text" required value={formData.nom} onChange={(e) => updateField("nom", e.target.value)} className="w-full rounded-xl border border-navy/10 bg-white px-3 py-2.5 text-sm text-navy outline-none focus:border-teal" /></div>
                                        <div><label className="block text-[12px] font-semibold text-slate mb-1.5">Prenom</label><input type="text" required value={formData.prenom} onChange={(e) => updateField("prenom", e.target.value)} className="w-full rounded-xl border border-navy/10 bg-white px-3 py-2.5 text-sm text-navy outline-none focus:border-teal" /></div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div><label className="block text-[12px] font-semibold text-slate mb-1.5">Email</label><input type="email" required value={formData.email} onChange={(e) => updateField("email", e.target.value)} className="w-full rounded-xl border border-navy/10 bg-white px-3 py-2.5 text-sm text-navy outline-none focus:border-teal" /></div>
                                        <div><label className="block text-[12px] font-semibold text-slate mb-1.5">Password</label><input type="password" required value={formData.password} onChange={(e) => updateField("password", e.target.value)} className="w-full rounded-xl border border-navy/10 bg-white px-3 py-2.5 text-sm text-navy outline-none focus:border-teal" /></div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div><label className="block text-[12px] font-semibold text-slate mb-1.5">Phone</label><input type="text" required value={formData.phone} onChange={(e) => updateField("phone", e.target.value)} className="w-full rounded-xl border border-navy/10 bg-white px-3 py-2.5 text-sm text-navy outline-none focus:border-teal" /></div>
                                        <div><label className="block text-[12px] font-semibold text-slate mb-1.5">Date de naissance</label><input type="date" required value={formData.dateNaissance} onChange={(e) => updateField("dateNaissance", e.target.value)} className="w-full rounded-xl border border-navy/10 bg-white px-3 py-2.5 text-sm text-navy outline-none focus:border-teal" /></div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div><label className="block text-[12px] font-semibold text-slate mb-1.5">Spécialité</label><input type="text" required value={formData.specialite} onChange={(e) => updateField("specialite", e.target.value)} className="w-full rounded-xl border border-navy/10 bg-white px-3 py-2.5 text-sm text-navy outline-none focus:border-teal" /></div>
                                        <div><label className="block text-[12px] font-semibold text-slate mb-1.5">Date d'embauche</label><input type="date" required value={formData.dateEmbauche} onChange={(e) => updateField("dateEmbauche", e.target.value)} className="w-full rounded-xl border border-navy/10 bg-white px-3 py-2.5 text-sm text-navy outline-none focus:border-teal" /></div>
                                    </div>

                                    <div className="flex items-center justify-end gap-3 pt-2">
                                        <button type="button" onClick={() => { setIsModalOpen(false); resetForm(); }} className="px-4 py-2.5 rounded-xl border border-navy/10 text-navy text-sm font-medium hover:bg-ice transition-colors">Annuler</button>
                                        <button type="submit" disabled={isSubmitting} className="px-4 py-2.5 rounded-xl nav-active text-white text-sm font-semibold shadow-teal disabled:opacity-60">{isSubmitting ? (editingId ? "Modification..." : "Creation...") : (editingId ? "Mettre à jour" : "Creer enseignant")}</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </>
            )}
        </Layout>
    );
}
