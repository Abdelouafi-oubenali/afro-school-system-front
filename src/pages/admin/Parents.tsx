import { useState } from "react";
import Layout from "../../components/layout/Layout";
import StatCard from "../../components/layout/StatCard";
import ParentList from "../../components/parents/ParentList";
import { useParents } from "../../hooks/useParents";
import parentService from "../../services/user/parentService";
import type { Parent, ParentCreatePayload, ParentUpdatePayload } from "../../services/user/parentService";

export default function Parents() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeletingDetail, setIsDeletingDetail] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [listRefreshKey, setListRefreshKey] = useState(0);
    const { parents } = useParents(listRefreshKey);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [selectedParent, setSelectedParent] = useState<Parent | null>(null);
    const [formData, setFormData] = useState<ParentCreatePayload>({
        nom: "",
        prenom: "",
        email: "",
        password: "",
        phone: "",
        dateNaissance: "",
        childIds: [],
    });

    const updateField = (field: keyof ParentCreatePayload, value: string | string[]) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const addChildIdField = () => {
        setFormData((prev) => ({ ...prev, childIds: [...prev.childIds, ""] }));
    };

    const updateChildIdAt = (index: number, value: string) => {
        setFormData((prev) => {
            const next = [...prev.childIds];
            next[index] = value;
            return { ...prev, childIds: next };
        });
    };

    const removeChildIdAt = (index: number) => {
        setFormData((prev) => ({
            ...prev,
            childIds: prev.childIds.filter((_, i) => i !== index),
        }));
    };

    const resetForm = () => {
        setFormData({
            nom: "",
            prenom: "",
            email: "",
            password: "",
            phone: "",
            dateNaissance: "",
            childIds: [],
        });
        setFormError(null);
        setEditingId(null);
    };

    const toInputDate = (value: string) => {
        if (!value) return "";
        return value.includes("T") ? value.slice(0, 10) : value;
    };

    const handleEdit = (item: Parent) => {
        setSelectedParent(null);
        setFormData({
            nom: item.nom,
            prenom: item.prenom,
            email: item.email,
            password: "",
            phone: item.phone,
            dateNaissance: toInputDate(item.dateNaissance),
            childIds: item.childIds ?? [],
        });
        setEditingId(item.id);
        setIsModalOpen(true);
    };

    const handleView = (item: Parent) => {
        setSelectedParent(item);
        setIsModalOpen(false);
        setFormError(null);
    };

    const handleDeleteFromDetail = async () => {
        if (!selectedParent) return;
        const confirmed = window.confirm(`Supprimer le parent ${selectedParent.prenom} ${selectedParent.nom} ?`);
        if (!confirmed) return;

        try {
            setIsDeletingDetail(true);
            await parentService.deleteParent(selectedParent.id);
            setSelectedParent(null);
            setListRefreshKey((k) => k + 1);
        } catch (error) {
            setFormError(error instanceof Error ? error.message : "Erreur lors de la suppression du parent");
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

                const payload: ParentUpdatePayload = {
                    id: editingId,
                    nom: formData.nom,
                    prenom: formData.prenom,
                    email: formData.email,
                    password: formData.password,
                    phone: formData.phone,
                    dateNaissance: formData.dateNaissance,
                    childIds: formData.childIds.map((id) => id.trim()).filter(Boolean),
                };
                await parentService.updateParent(editingId, payload);
            } else {
                await parentService.createParent({
                    ...formData,
                    childIds: formData.childIds.map((id) => id.trim()).filter(Boolean),
                });
            }

            setIsModalOpen(false);
            resetForm();
            setListRefreshKey((k) => k + 1);
        } catch (error) {
            setFormError(error instanceof Error ? error.message : "Erreur lors de l'enregistrement du parent");
        } finally {
            setIsSubmitting(false);
        }
    };

    const totalParents = parents.length;
    const avecEnfants = parents.filter((p) => (p.childIds?.length ?? 0) > 0).length;
    const sansEnfants = totalParents - avecEnfants;

    return (
        <Layout>
            {selectedParent ? (
                <div className="bg-white rounded-2xl p-6 shadow-card animate-fadeUp">
                    <div className="flex items-start justify-between gap-3 flex-wrap mb-5">
                        <div>
                            <h2 className="font-display text-[22px] text-navy leading-tight">Détail du parent</h2>
                            <p className="text-slate text-[13px] mt-0.5">Consultation des informations complètes</p>
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                            <button type="button" onClick={() => setSelectedParent(null)} className="px-4 py-2.5 rounded-xl border border-navy/10 text-navy text-sm font-medium hover:bg-ice transition-colors">Retour à la liste</button>
                            <button type="button" onClick={() => handleEdit(selectedParent)} className="px-4 py-2.5 rounded-xl border border-gold/30 text-gold text-sm font-medium hover:bg-gold/5 transition-colors">Modifier</button>
                            <button type="button" onClick={handleDeleteFromDetail} disabled={isDeletingDetail} className="px-4 py-2.5 rounded-xl bg-coral text-white text-sm font-semibold hover:bg-coral/90 transition-colors disabled:opacity-60">{isDeletingDetail ? "Suppression..." : "Supprimer"}</button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-3 rounded-xl bg-ice/60 border border-navy/10 md:col-span-2"><p className="text-[11px] uppercase tracking-wide text-slate">ID</p><p className="text-sm font-medium text-navy break-all">{selectedParent.id}</p></div>
                        <div className="p-3 rounded-xl bg-ice/60 border border-navy/10"><p className="text-[11px] uppercase tracking-wide text-slate">Nom</p><p className="text-sm font-medium text-navy">{selectedParent.nom}</p></div>
                        <div className="p-3 rounded-xl bg-ice/60 border border-navy/10"><p className="text-[11px] uppercase tracking-wide text-slate">Prénom</p><p className="text-sm font-medium text-navy">{selectedParent.prenom}</p></div>
                        <div className="p-3 rounded-xl bg-ice/60 border border-navy/10"><p className="text-[11px] uppercase tracking-wide text-slate">Email</p><p className="text-sm font-medium text-navy break-all">{selectedParent.email}</p></div>
                        <div className="p-3 rounded-xl bg-ice/60 border border-navy/10"><p className="text-[11px] uppercase tracking-wide text-slate">Téléphone</p><p className="text-sm font-medium text-navy">{selectedParent.phone || "-"}</p></div>
                        <div className="p-3 rounded-xl bg-ice/60 border border-navy/10"><p className="text-[11px] uppercase tracking-wide text-slate">Date de naissance</p><p className="text-sm font-medium text-navy">{formatDisplayDate(selectedParent.dateNaissance)}</p></div>
                        <div className="p-3 rounded-xl bg-ice/60 border border-navy/10"><p className="text-[11px] uppercase tracking-wide text-slate">Role</p><p className="text-sm font-medium text-navy">{selectedParent.role || "PARENT"}</p></div>
                        <div className="p-3 rounded-xl bg-ice/60 border border-navy/10 md:col-span-2"><p className="text-[11px] uppercase tracking-wide text-slate">Child IDs</p><p className="text-sm font-medium text-navy break-all">{selectedParent.childIds?.length ? selectedParent.childIds.join(", ") : "-"}</p></div>
                    </div>
                </div>
            ) : (
                <>
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div>
                            <h2 className="font-display text-[22px] text-navy leading-tight">Gestion des parents</h2>
                            <p className="text-slate text-[13px] mt-0.5">Administration des comptes parents</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-5">
                        <StatCard title="Total parents" value={totalParents} icon={(<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>)} trendValue="Effectif actuel" trendIcon={(<svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><polyline points="18 15 12 9 6 15" /></svg>)} colorTheme={{ gradient: "linear-gradient(90deg,#0E9E8E,#16BCA8)", iconBg: "rgba(14,158,142,.1)", iconColor: "#0E9E8E", trendBg: "rgba(91,173,139,.15)", trendColor: "#5BAD8B" }} delay="0.05s" />
                        <StatCard title="Avec enfants" value={avecEnfants} icon={(<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></svg>)} trendValue={totalParents > 0 ? `${Math.round((avecEnfants / totalParents) * 100)}% du total` : "0% du total"} trendIcon={(<svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><polyline points="18 15 12 9 6 15" /></svg>)} colorTheme={{ gradient: "linear-gradient(90deg,#E8A020,#F5B84C)", iconBg: "rgba(232,160,32,.1)", iconColor: "#E8A020", trendBg: "rgba(232,160,32,.15)", trendColor: "#E8A020" }} delay="0.1s" />
                        <StatCard title="Sans enfants" value={sansEnfants} icon={(<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>)} trendValue={totalParents > 0 ? `${Math.round((sansEnfants / totalParents) * 100)}% du total` : "0% du total"} trendIcon={(<svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9" /></svg>)} colorTheme={{ gradient: "linear-gradient(90deg,#E05C5C,#f08080)", iconBg: "rgba(224,92,92,.1)", iconColor: "#E05C5C", trendBg: "rgba(224,92,92,.12)", trendColor: "#E05C5C" }} delay="0.15s" />
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                        <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-64 rounded-xl border border-navy/10 bg-white px-3 py-2.5 text-sm text-navy outline-none focus:border-teal" placeholder="Rechercher: nom, email..." />
                        <button type="button" onClick={() => setIsModalOpen(true)} className="nav-active text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-teal hover:opacity-95 transition-opacity">+ Nouveau parent</button>
                    </div>

                    <ParentList refreshKey={listRefreshKey} onEdit={handleEdit} onView={handleView} searchTerm={searchTerm} />

                    {isModalOpen && (
                        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                            <div className="absolute inset-0 bg-navy/40" onClick={() => setIsModalOpen(false)} />
                            <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-hover p-6 animate-fadeUp">
                                <div className="flex items-center justify-between mb-5">
                                    <h3 className="font-display text-[20px] text-navy">{editingId ? "Modifier le parent" : "Nouveau parent"}</h3>
                                    <button type="button" className="w-9 h-9 rounded-lg border border-navy/10 text-slate hover:text-navy hover:bg-ice transition-colors" onClick={() => setIsModalOpen(false)} title="Fermer">x</button>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    {formError && <div className="p-3 rounded-xl bg-coral/10 border border-coral/20 text-coral text-sm">{formError}</div>}

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

                                    <div>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <label className="block text-[12px] font-semibold text-slate">Child IDs</label>
                                            <button
                                                type="button"
                                                onClick={addChildIdField}
                                                className="text-[12px] font-semibold text-teal hover:text-teal/80 transition-colors"
                                            >
                                                + Ajouter un enfant
                                            </button>
                                        </div>

                                        <div className="space-y-2">
                                            {formData.childIds.length === 0 && (
                                                <p className="text-[12px] text-slate">Aucun enfant ajouté.</p>
                                            )}

                                            {formData.childIds.map((childId, index) => (
                                                <div key={`${index}-${childId}`} className="flex items-center gap-2">
                                                    <input
                                                        type="text"
                                                        value={childId}
                                                        onChange={(e) => updateChildIdAt(index, e.target.value)}
                                                        className="w-full rounded-xl border border-navy/10 bg-white px-3 py-2.5 text-sm text-navy outline-none focus:border-teal"
                                                        placeholder="UUID élève"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeChildIdAt(index)}
                                                        className="px-3 py-2.5 rounded-xl border border-coral/30 text-coral text-xs font-semibold hover:bg-coral/5 transition-colors"
                                                    >
                                                        Suppr.
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-end gap-3 pt-2">
                                        <button type="button" onClick={() => { setIsModalOpen(false); resetForm(); }} className="px-4 py-2.5 rounded-xl border border-navy/10 text-navy text-sm font-medium hover:bg-ice transition-colors">Annuler</button>
                                        <button type="submit" disabled={isSubmitting} className="px-4 py-2.5 rounded-xl nav-active text-white text-sm font-semibold shadow-teal disabled:opacity-60">{isSubmitting ? (editingId ? "Modification..." : "Creation...") : (editingId ? "Mettre à jour" : "Creer parent")}</button>
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
