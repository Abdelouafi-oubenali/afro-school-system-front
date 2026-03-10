import { useState } from "react";
import Layout from "../../components/layout/Layout";
import StatCard from "../../components/layout/StatCard";
import EleveList from "../../components/eleves/EleveList";
import { useEleves } from "../../hooks/useEleves";
import eleveService from "../../services/eleveService";
import type { EleveCreatePayload, Eleve, EleveUpdatePayload } from "../../services/eleveService";

export default function Eleves() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeletingDetail, setIsDeletingDetail] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [listRefreshKey, setListRefreshKey] = useState(0);
  const { eleves } = useEleves(listRefreshKey);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedEleve, setSelectedEleve] = useState<Eleve | null>(null);
  const [formData, setFormData] = useState<EleveCreatePayload>({
    nom: "",
    prenom: "",
    email: "",
    password: "",
    phone: "",
    dateNaissance: "",
  });

  const updateField = (field: keyof EleveCreatePayload, value: string) => {
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
    });
    setFormError(null);
    setEditingId(null);
  };

  const toInputDate = (value: string) => {
    if (!value) return "";
    return value.includes("T") ? value.slice(0, 10) : value;
  };

  const handleEdit = (eleve: Eleve) => {
    setSelectedEleve(null);
    setFormData({
      nom: eleve.nom,
      prenom: eleve.prenom,
      email: eleve.email,
      password: "",
      phone: eleve.phone,
      dateNaissance: toInputDate(eleve.dateNaissance),
    });
    setEditingId(String(eleve.id));
    setIsModalOpen(true);
  };

  const handleView = (eleve: Eleve) => {
    setSelectedEleve(eleve);
    setIsModalOpen(false);
    setFormError(null);
  };

  const handleDeleteFromDetail = async () => {
    if (!selectedEleve) return;
    const confirmed = window.confirm(`Supprimer l'élève ${selectedEleve.prenom} ${selectedEleve.nom} ?`);
    if (!confirmed) return;

    try {
      setIsDeletingDetail(true);
      await eleveService.deleteEleve(selectedEleve.id);
      setSelectedEleve(null);
      setListRefreshKey((k) => k + 1);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Erreur lors de la suppression de l'eleve");
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
        // Mode édition
        if (!formData.password) {
          setFormError("Le mot de passe est obligatoire pour la modification.");
          setIsSubmitting(false);
          return;
        }

        const payload: EleveUpdatePayload = {
          id: editingId,
          nom: formData.nom,
          prenom: formData.prenom,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          dateNaissance: formData.dateNaissance,
        };
        await eleveService.updateEleve(editingId, payload);
      } else {
        // Mode création
        await eleveService.createEleve(formData);
      }
      setIsModalOpen(false);
      resetForm();
      setListRefreshKey((k) => k + 1);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : editingId ? "Erreur lors de la modification de l'eleve" : "Erreur lors de la creation de l'eleve");
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalEleves = eleves.length;
  const elevesAvecDate = eleves.filter((eleve) => Boolean(eleve.dateNaissance));

  const calculateAge = (dateNaissance: string) => {
    const birth = new Date(dateNaissance);
    if (Number.isNaN(birth.getTime())) return null;

    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age -= 1;
    }
    return age;
  };

  const ages = elevesAvecDate
    .map((eleve) => calculateAge(eleve.dateNaissance))
    .filter((age): age is number => age !== null);

  const ageMoyen = ages.length > 0
    ? (ages.reduce((sum, age) => sum + age, 0) / ages.length).toFixed(1)
    : "-";

  const elevesNesApres2000 = elevesAvecDate.filter((eleve) => {
    const birth = new Date(eleve.dateNaissance);
    return !Number.isNaN(birth.getTime()) && birth.getFullYear() >= 2000;
  }).length;

  const couvertureDates = totalEleves > 0
    ? `${Math.round((elevesAvecDate.length / totalEleves) * 100)}% avec date`
    : "Aucune date";

  return (
    <Layout>
      {selectedEleve ? (
        <div className="bg-white rounded-2xl p-6 shadow-card animate-fadeUp">
          <div className="flex items-start justify-between gap-3 flex-wrap mb-5">
            <div>
              <h2 className="font-display text-[22px] text-navy leading-tight">Détail de l'élève</h2>
              <p className="text-slate text-[13px] mt-0.5">Consultation des informations complètes</p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={() => setSelectedEleve(null)}
                className="px-4 py-2.5 rounded-xl border border-navy/10 text-navy text-sm font-medium hover:bg-ice transition-colors"
              >
                Retour à la liste
              </button>
              <button
                type="button"
                onClick={() => handleEdit(selectedEleve)}
                className="px-4 py-2.5 rounded-xl border border-gold/30 text-gold text-sm font-medium hover:bg-gold/5 transition-colors"
              >
                Modifier
              </button>
              <button
                type="button"
                onClick={handleDeleteFromDetail}
                disabled={isDeletingDetail}
                className="px-4 py-2.5 rounded-xl bg-coral text-white text-sm font-semibold hover:bg-coral/90 transition-colors disabled:opacity-60"
              >
                {isDeletingDetail ? "Suppression..." : "Supprimer"}
              </button>
            </div>
          </div>

          {formError && (
            <div className="mb-4 p-3 rounded-xl bg-coral/10 border border-coral/20 text-coral text-sm">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 rounded-xl bg-ice/60 border border-navy/10 md:col-span-2">
              <p className="text-[11px] uppercase tracking-wide text-slate">ID</p>
              <p className="text-sm font-medium text-navy break-all">{selectedEleve.id}</p>
            </div>
            <div className="p-3 rounded-xl bg-ice/60 border border-navy/10">
              <p className="text-[11px] uppercase tracking-wide text-slate">Nom</p>
              <p className="text-sm font-medium text-navy">{selectedEleve.nom}</p>
            </div>
            <div className="p-3 rounded-xl bg-ice/60 border border-navy/10">
              <p className="text-[11px] uppercase tracking-wide text-slate">Prénom</p>
              <p className="text-sm font-medium text-navy">{selectedEleve.prenom}</p>
            </div>
            <div className="p-3 rounded-xl bg-ice/60 border border-navy/10">
              <p className="text-[11px] uppercase tracking-wide text-slate">Email</p>
              <p className="text-sm font-medium text-navy break-all">{selectedEleve.email}</p>
            </div>
            <div className="p-3 rounded-xl bg-ice/60 border border-navy/10">
              <p className="text-[11px] uppercase tracking-wide text-slate">Téléphone</p>
              <p className="text-sm font-medium text-navy">{selectedEleve.phone || "-"}</p>
            </div>
            <div className="p-3 rounded-xl bg-ice/60 border border-navy/10">
              <p className="text-[11px] uppercase tracking-wide text-slate">Date de naissance</p>
              <p className="text-sm font-medium text-navy">{formatDisplayDate(selectedEleve.dateNaissance)}</p>
            </div>
            <div className="p-3 rounded-xl bg-ice/60 border border-navy/10">
              <p className="text-[11px] uppercase tracking-wide text-slate">Classe</p>
              <p className="text-sm font-medium text-navy">{selectedEleve.classe || selectedEleve.classeId || "-"}</p>
            </div>
            <div className="p-3 rounded-xl bg-ice/60 border border-navy/10">
              <p className="text-[11px] uppercase tracking-wide text-slate">Role</p>
              <p className="text-sm font-medium text-navy">{selectedEleve.role || "-"}</p>
            </div>
            <div className="p-3 rounded-xl bg-ice/60 border border-navy/10">
              <p className="text-[11px] uppercase tracking-wide text-slate">Password</p>
              <p className="text-sm font-medium text-navy break-all">{selectedEleve.password || "Non disponible"}</p>
            </div>
          </div>
        </div>
      ) : (
        <>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-display text-[22px] text-navy leading-tight">Gestion des élèves</h2>
          <p className="text-slate text-[13px] mt-0.5">Administration des fiches élèves, contacts et suivi</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button className="bg-white border border-navy/10 text-navy text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-ice transition-colors">
            Importer CSV
          </button>
          <button className="bg-white border border-navy/10 text-navy text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-ice transition-colors">
            Exporter liste
          </button>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="nav-active text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-teal hover:opacity-95 transition-opacity"
          >
            + Nouvel élève
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5">
        <StatCard
          title="Total élèves"
          value={totalEleves}
          icon={(
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
            </svg>
          )}
          trendValue={couvertureDates}
          trendIcon={(
            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><polyline points="18 15 12 9 6 15" /></svg>
          )}
          colorTheme={{
            gradient: "linear-gradient(90deg,#0E9E8E,#16BCA8)",
            iconBg: "rgba(14,158,142,.1)", iconColor: "#0E9E8E",
            trendBg: "rgba(91,173,139,.15)", trendColor: "#5BAD8B"
          }}
          delay="0.05s"
        />
        <StatCard
          title="Âge moyen"
          value={ageMoyen === "-" ? "-" : `${ageMoyen} ans`}
          icon={(
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
          )}
          trendValue={`${ages.length} dates valides`}
          trendIcon={(
            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><polyline points="18 15 12 9 6 15" /></svg>
          )}
          colorTheme={{
            gradient: "linear-gradient(90deg,#E8A020,#F5B84C)",
            iconBg: "rgba(232,160,32,.1)", iconColor: "#E8A020",
            trendBg: "rgba(232,160,32,.15)", trendColor: "#E8A020"
          }}
          delay="0.1s"
        />
        <StatCard
          title="Nés après 2000"
          value={elevesNesApres2000}
          icon={(
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M22 12a10 10 0 11-10-10" /><line x1="22" y1="2" x2="12" y2="12" />
            </svg>
          )}
          trendValue={totalEleves > 0 ? `${Math.round((elevesNesApres2000 / totalEleves) * 100)}% du total` : "0% du total"}
          trendIcon={(
            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9" /></svg>
          )}
          colorTheme={{
            gradient: "linear-gradient(90deg,#E05C5C,#f08080)",
            iconBg: "rgba(224,92,92,.1)", iconColor: "#E05C5C",
            trendBg: "rgba(224,92,92,.12)", trendColor: "#E05C5C"
          }}
          delay="0.15s"
        />
      </div>

      <EleveList refreshKey={listRefreshKey} onEdit={handleEdit} onView={handleView} />

      {isModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-navy/40" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-hover p-6 animate-fadeUp">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display text-[20px] text-navy">{editingId ? "Modifier l'élève" : "Nouvel élève"}</h3>
              <button
                type="button"
                className="w-9 h-9 rounded-lg border border-navy/10 text-slate hover:text-navy hover:bg-ice transition-colors"
                onClick={() => setIsModalOpen(false)}
                title="Fermer"
              >
                x
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-coral/10 border border-coral/20 text-coral text-sm">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-semibold text-slate mb-1.5">Nom</label>
                  <input
                    type="text"
                    required
                    value={formData.nom}
                    onChange={(e) => updateField("nom", e.target.value)}
                    className="w-full rounded-xl border border-navy/10 bg-white px-3 py-2.5 text-sm text-navy outline-none focus:border-teal"
                    placeholder="Hiba"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-slate mb-1.5">Prenom</label>
                  <input
                    type="text"
                    required
                    value={formData.prenom}
                    onChange={(e) => updateField("prenom", e.target.value)}
                    className="w-full rounded-xl border border-navy/10 bg-white px-3 py-2.5 text-sm text-navy outline-none focus:border-teal"
                    placeholder="System"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-semibold text-slate mb-1.5">Email</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    className="w-full rounded-xl border border-navy/10 bg-white px-3 py-2.5 text-sm text-navy outline-none focus:border-teal"
                    placeholder="testEleve@gmail.com"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-slate mb-1.5">Password</label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => updateField("password", e.target.value)}
                    className="w-full rounded-xl border border-navy/10 bg-white px-3 py-2.5 text-sm text-navy outline-none focus:border-teal"
                    placeholder={editingId ? "Nouveau mot de passe" : "admin123"}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-semibold text-slate mb-1.5">Phone</label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    className="w-full rounded-xl border border-navy/10 bg-white px-3 py-2.5 text-sm text-navy outline-none focus:border-teal"
                    placeholder="0600000000"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-slate mb-1.5">Date de naissance</label>
                  <input
                    type="date"
                    required
                    value={formData.dateNaissance}
                    onChange={(e) => updateField("dateNaissance", e.target.value)}
                    className="w-full rounded-xl border border-navy/10 bg-white px-3 py-2.5 text-sm text-navy outline-none focus:border-teal"
                  />
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
                  {isSubmitting ? (editingId ? "Modification..." : "Creation...") : (editingId ? "Mettre à jour" : "Creer eleve")}
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
