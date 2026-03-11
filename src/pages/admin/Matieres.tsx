import { useState } from "react";
import Layout from "../../components/layout/Layout";
import StatCard from "../../components/layout/StatCard";
import MatiereList from "../../components/matieres/MatiereList";
import matiereService from "../../services/user/matiereService";
import { useMatieres } from "../../hooks/useMatieres";
import type { Matiere, MatiereCreatePayload, MatiereUpdatePayload } from "../../services/user/matiereService";

export default function Matieres() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [listRefreshKey, setListRefreshKey] = useState(0);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [selectedMatiere, setSelectedMatiere] = useState<Matiere | null>(null);

    const { matieres } = useMatieres(listRefreshKey);

    const [formData, setFormData] = useState<MatiereCreatePayload>({
        nom: "",
        description: "",
        coefficient: 1,
        estActif: true,
    });

    const updateField = <K extends keyof MatiereCreatePayload>(field: K, value: MatiereCreatePayload[K]) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const resetForm = () => {
        setFormData({ nom: "", description: "", coefficient: 1, estActif: true });
        setFormError(null);
        setEditingId(null);
    };

    const handleEdit = (item: Matiere) => {
        setSelectedMatiere(null);
        setFormData({
            nom: item.nom,
            description: item.description ?? "",
            coefficient: item.coefficient,
            estActif: item.estActif,
        });
        setEditingId(item.id);
        setIsModalOpen(true);
    };

    const handleView = (item: Matiere) => {
        setSelectedMatiere(item);
        setIsModalOpen(false);
        setFormError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setFormError(null);

        try {
            if (editingId) {
                const payload: MatiereUpdatePayload = {
                    id: editingId,
                    nom: formData.nom,
                    description: formData.description,
                    coefficient: Number(formData.coefficient),
                    estActif: formData.estActif,
                };
                await matiereService.updateMatiere(editingId, payload);
            } else {
                await matiereService.createMatiere({
                    nom: formData.nom,
                    description: formData.description,
                    coefficient: Number(formData.coefficient),
                    estActif: formData.estActif,
                });
            }

            setIsModalOpen(false);
            resetForm();
            setListRefreshKey((k) => k + 1);
        } catch (error) {
            setFormError(error instanceof Error ? error.message : "Erreur lors de l'enregistrement de la matiere");
        } finally {
            setIsSubmitting(false);
        }
    };

    const totalMatieres = matieres.length;
    const activeMatieres = matieres.filter((m) => m.estActif).length;
    const avgCoefficient = totalMatieres > 0
        ? (matieres.reduce((sum, m) => sum + Number(m.coefficient || 0), 0) / totalMatieres).toFixed(1)
        : "0";

    return (
        <Layout>
            {selectedMatiere ? (
                <div className="bg-white rounded-2xl p-6 shadow-card animate-fadeUp">
                    <div className="flex items-start justify-between gap-3 flex-wrap mb-5">
                        <div>
                            <h2 className="font-display text-[22px] text-navy leading-tight">Detail de la matiere</h2>
                            <p className="text-slate text-[13px] mt-0.5">Consultation des informations completes</p>
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                            <button type="button" onClick={() => setSelectedMatiere(null)} className="px-4 py-2.5 rounded-xl border border-navy/10 text-navy text-sm font-medium hover:bg-ice transition-colors">Retour a la liste</button>
                            <button type="button" onClick={() => handleEdit(selectedMatiere)} className="px-4 py-2.5 rounded-xl border border-gold/30 text-gold text-sm font-medium hover:bg-gold/5 transition-colors">Modifier</button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div className="p-3 rounded-xl bg-ice/60 border border-navy/10 md:col-span-2">
                            <p className="text-[11px] uppercase tracking-wide text-slate">ID</p>
                            <p className="text-sm font-medium text-navy break-all">{selectedMatiere.id}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-ice/60 border border-navy/10">
                            <p className="text-[11px] uppercase tracking-wide text-slate">Nom</p>
                            <p className="text-sm font-medium text-navy">{selectedMatiere.nom}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-ice/60 border border-navy/10">
                            <p className="text-[11px] uppercase tracking-wide text-slate">Coefficient</p>
                            <p className="text-sm font-medium text-navy">{selectedMatiere.coefficient}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-ice/60 border border-navy/10 md:col-span-2">
                            <p className="text-[11px] uppercase tracking-wide text-slate">Description</p>
                            <p className="text-sm font-medium text-navy">{selectedMatiere.description || "-"}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-ice/60 border border-navy/10">
                            <p className="text-[11px] uppercase tracking-wide text-slate">Statut</p>
                            <span className={`inline-flex text-[11px] font-semibold px-2.5 py-1 rounded-full ${selectedMatiere.estActif ? "bg-teal/10 text-teal" : "bg-slate/15 text-slate"}`}>
                                {selectedMatiere.estActif ? "Actif" : "Inactif"}
                            </span>
                        </div>
                    </div>
                </div>
            ) : (
                <>
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div>
                            <h2 className="font-display text-[22px] text-navy leading-tight">Gestion des matieres</h2>
                            <p className="text-slate text-[13px] mt-0.5">Administration des matieres scolaires</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-5">
                        <StatCard
                            title="Total matieres"
                            value={totalMatieres}
                            icon={(<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" /></svg>)}
                            trendValue="Catalogue"
                            trendIcon={(<svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><polyline points="18 15 12 9 6 15" /></svg>)}
                            colorTheme={{ gradient: "linear-gradient(90deg,#0E9E8E,#16BCA8)", iconBg: "rgba(14,158,142,.1)", iconColor: "#0E9E8E", trendBg: "rgba(91,173,139,.15)", trendColor: "#5BAD8B" }}
                            delay="0.05s"
                        />
                        <StatCard
                            title="Matieres actives"
                            value={activeMatieres}
                            icon={(<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" /></svg>)}
                            trendValue={totalMatieres > 0 ? `${Math.round((activeMatieres / totalMatieres) * 100)}% du total` : "0% du total"}
                            trendIcon={(<svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><polyline points="18 15 12 9 6 15" /></svg>)}
                            colorTheme={{ gradient: "linear-gradient(90deg,#E8A020,#F5B84C)", iconBg: "rgba(232,160,32,.1)", iconColor: "#E8A020", trendBg: "rgba(232,160,32,.15)", trendColor: "#E8A020" }}
                            delay="0.1s"
                        />
                        <StatCard
                            title="Coeff. moyen"
                            value={avgCoefficient}
                            icon={(<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 3v18h18" /><path d="M7 14l3-3 3 2 4-5" /></svg>)}
                            trendValue="Moyenne generale"
                            trendIcon={(<svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><polyline points="18 15 12 9 6 15" /></svg>)}
                            colorTheme={{ gradient: "linear-gradient(90deg,#E05C5C,#f08080)", iconBg: "rgba(224,92,92,.1)", iconColor: "#E05C5C", trendBg: "rgba(224,92,92,.12)", trendColor: "#E05C5C" }}
                            delay="0.15s"
                        />
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-64 rounded-xl border border-navy/10 bg-white px-3 py-2.5 text-sm text-navy outline-none focus:border-teal"
                            placeholder="Rechercher: nom, description..."
                        />
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(true)}
                            className="nav-active text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-teal hover:opacity-95 transition-opacity"
                        >
                            + Nouvelle matiere
                        </button>
                    </div>

                    <MatiereList refreshKey={listRefreshKey} onEdit={handleEdit} onView={handleView} searchTerm={searchTerm} />

                    {isModalOpen && (
                        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                            <div className="absolute inset-0 bg-navy/40" onClick={() => setIsModalOpen(false)} />
                            <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-hover p-6 animate-fadeUp">
                                <div className="flex items-center justify-between mb-5">
                                    <h3 className="font-display text-[20px] text-navy">{editingId ? "Modifier la matiere" : "Nouvelle matiere"}</h3>
                                    <button type="button" className="w-9 h-9 rounded-lg border border-navy/10 text-slate hover:text-navy hover:bg-ice transition-colors" onClick={() => setIsModalOpen(false)} title="Fermer">x</button>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    {formError && <div className="p-3 rounded-xl bg-coral/10 border border-coral/20 text-coral text-sm">{formError}</div>}

                                    <div>
                                        <label className="block text-[12px] font-semibold text-slate mb-1.5">Nom de la matiere</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.nom}
                                            onChange={(e) => updateField("nom", e.target.value)}
                                            className="w-full rounded-xl border border-navy/10 bg-white px-3 py-2.5 text-sm text-navy outline-none focus:border-teal"
                                            placeholder="Mathematiques"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[12px] font-semibold text-slate mb-1.5">Description</label>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => updateField("description", e.target.value)}
                                            className="w-full rounded-xl border border-navy/10 bg-white px-3 py-2.5 text-sm text-navy outline-none focus:border-teal min-h-[90px]"
                                            placeholder="Cours de mathematiques"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[12px] font-semibold text-slate mb-1.5">Coefficient</label>
                                            <input
                                                type="number"
                                                min={0}
                                                step="0.1"
                                                required
                                                value={formData.coefficient}
                                                onChange={(e) => updateField("coefficient", Number(e.target.value))}
                                                className="w-full rounded-xl border border-navy/10 bg-white px-3 py-2.5 text-sm text-navy outline-none focus:border-teal"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-[12px] font-semibold text-slate mb-1.5">Statut</label>
                                            <select
                                                value={formData.estActif ? "true" : "false"}
                                                onChange={(e) => updateField("estActif", e.target.value === "true")}
                                                className="w-full rounded-xl border border-navy/10 bg-white px-3 py-2.5 text-sm text-navy outline-none focus:border-teal"
                                            >
                                                <option value="true">Actif</option>
                                                <option value="false">Inactif</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-end gap-3 pt-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsModalOpen(false);
                                                resetForm();
                                            }}
                                            className="px-4 py-2.5 rounded-xl border border-navy/10 text-navy text-sm font-medium hover:bg-ice transition-colors"
                                        >
                                            Annuler
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="px-4 py-2.5 rounded-xl nav-active text-white text-sm font-semibold shadow-teal disabled:opacity-60"
                                        >
                                            {isSubmitting ? (editingId ? "Modification..." : "Creation...") : (editingId ? "Mettre a jour" : "Creer matiere")}
                                        </button>
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
