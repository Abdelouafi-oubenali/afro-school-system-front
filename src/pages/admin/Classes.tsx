import { useState } from "react";
import Layout from "../../components/layout/Layout";
import StatCard from "../../components/layout/StatCard";
import ClassList from "../../components/classes/ClassList";
import { useClasses } from "../../hooks/useClasses";
import { useEleves } from "../../hooks/useEleves";
import classService from "../../services/user/classService";
import enseignentService from "../../services/user/enseignentService";
import seanceService from "../../services/user/seanceService";
import type { ClassRoom, ClassCreatePayload, ClassUpdatePayload } from "../../services/user/classService";
import type { Enseignent } from "../../services/user/enseignentService";
import type { EmploiEntry } from "../../services/user/seanceService";

const LEVEL_OPTIONS = ["MATERNELLE", "PRIMAIRE", "COLLEGE", "LYCEE"];

const JOUR_LABELS: Record<string, string> = {
    MONDAY: "Lundi",
    TUESDAY: "Mardi",
    WEDNESDAY: "Mercredi",
    THURSDAY: "Jeudi",
    FRIDAY: "Vendredi",
    SATURDAY: "Samedi",
    SUNDAY: "Dimanche",
};

const JOUR_ORDER: Record<string, number> = {
    MONDAY: 1,
    TUESDAY: 2,
    WEDNESDAY: 3,
    THURSDAY: 4,
    FRIDAY: 5,
    SATURDAY: 6,
    SUNDAY: 7,
};

const WEEK_DAYS = [
    { key: "MONDAY", label: "Lundi" },
    { key: "TUESDAY", label: "Mardi" },
    { key: "WEDNESDAY", label: "Mercredi" },
    { key: "THURSDAY", label: "Jeudi" },
    { key: "FRIDAY", label: "Vendredi" },
] as const;

const WEEK_DAY_SET: Set<string> = new Set(WEEK_DAYS.map((d) => d.key));

const TIME_SLOTS = Array.from({ length: 10 }, (_, i) => {
    const start = 8 + i;
    const end = start + 1;
    return {
        key: `${String(start).padStart(2, "0")}:00`,
        label: `${String(start).padStart(2, "0")}:00 - ${String(end).padStart(2, "0")}:00`,
    };
});

export default function Classes() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [isAssignEnseignantModalOpen, setIsAssignEnseignantModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isAssigning, setIsAssigning] = useState(false);
    const [isAssigningEnseignant, setIsAssigningEnseignant] = useState(false);
    const [isDeletingDetail, setIsDeletingDetail] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [assignError, setAssignError] = useState<string | null>(null);
    const [assignEnseignantError, setAssignEnseignantError] = useState<string | null>(null);
    const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
    const [assignSearchTerm, setAssignSearchTerm] = useState("");
    const [assignEnseignantSearchTerm, setAssignEnseignantSearchTerm] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [listRefreshKey, setListRefreshKey] = useState(0);
    const [enseignants, setEnseignants] = useState<Enseignent[]>([]);
    const [loadingEnseignants, setLoadingEnseignants] = useState(false);
    const [emploiClasse, setEmploiClasse] = useState<EmploiEntry[]>([]);
    const [loadingEmploiClasse, setLoadingEmploiClasse] = useState(false);
    const [emploiClasseError, setEmploiClasseError] = useState<string | null>(null);
    const { classes } = useClasses(listRefreshKey);
    const { eleves, loading: loadingEleves, error: elevesError } = useEleves();
    const [editingId, setEditingId] = useState<string | null>(null);
    const [selectedClass, setSelectedClass] = useState<ClassRoom | null>(null);
    const [formData, setFormData] = useState<ClassCreatePayload>({
        name: "",
        levelClasse: "LYCEE",
        enseignantPrincipal: "",
        anneeScolaire: "",
    });

    const updateField = (field: keyof ClassCreatePayload, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const resetForm = () => {
        setFormData({
            name: "",
            levelClasse: "LYCEE",
            enseignantPrincipal: "",
            anneeScolaire: "",
        });
        setFormError(null);
        setEditingId(null);
    };

    const handleEdit = (item: ClassRoom) => {
        setSelectedClass(null);
        setIsAssignModalOpen(false);
        setFormData({
            name: item.name,
            levelClasse: item.levelClasse,
            enseignantPrincipal: item.enseignantPrincipal,
            anneeScolaire: item.anneeScolaire,
        });
        setEditingId(item.id);
        setIsModalOpen(true);
    };

    const handleView = async (item: ClassRoom) => {
        setSelectedClass(item);
        setIsModalOpen(false);
        setIsAssignModalOpen(false);
        setIsAssignEnseignantModalOpen(false);
        setFormError(null);
        setAssignError(null);
        setEmploiClasse([]);
        setEmploiClasseError(null);

        try {
            const enseignants = await classService.getClassEnseignants(item.id);
            setLoadingEmploiClasse(true);
            const emploi = await seanceService.getEmploiByClasse(item.id);
            const sortedEmploi = [...emploi].sort((a, b) => {
                const dayA = a.jour ? (JOUR_ORDER[a.jour] ?? 99) : 99;
                const dayB = b.jour ? (JOUR_ORDER[b.jour] ?? 99) : 99;
                if (dayA !== dayB) return dayA - dayB;
                return (a.heureDebut || "99:99:99").localeCompare(b.heureDebut || "99:99:99");
            });
            setEmploiClasse(sortedEmploi);
            setSelectedClass((prev) =>
                prev && prev.id === item.id
                    ? {
                          ...prev,
                          enseignants,
                      }
                    : prev
            );
        } catch (error) {
            setEmploiClasseError(error instanceof Error ? error.message : "Erreur chargement emploi du temps");
            setSelectedClass((prev) =>
                prev && prev.id === item.id
                    ? {
                          ...prev,
                          enseignants: [],
                      }
                    : prev
            );
        } finally {
            setLoadingEmploiClasse(false);
        }
    };

    const openAssignModal = () => {
        if (!selectedClass) return;
        const existingIds = (selectedClass.eleves ?? []).map((eleve) => eleve.id);
        setSelectedStudentIds(existingIds);
        setAssignSearchTerm("");
        setAssignError(null);
        setIsAssignModalOpen(true);
    };

    const openAssignEnseignantModal = async () => {
        if (!selectedClass) return;
        try {
            setLoadingEnseignants(true);
            setAssignEnseignantError(null);
            const data = await enseignentService.getAllEnseignents();
            setEnseignants(data);
            setAssignEnseignantSearchTerm("");
            setIsAssignEnseignantModalOpen(true);
        } catch (error) {
            setAssignEnseignantError(error instanceof Error ? error.message : "Erreur chargement enseignants");
        } finally {
            setLoadingEnseignants(false);
        }
    };

    const toggleStudentSelection = (studentId: string) => {
        setSelectedStudentIds((prev) =>
            prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]
        );
    };

    const handleAssignEnseignant = async (enseignantId: string) => {
        if (!selectedClass) return;

        try {
            setIsAssigningEnseignant(true);
            setAssignEnseignantError(null);
            const updatedClass = await classService.assignEnseignant(selectedClass.id, enseignantId);
            const enseignants = await classService.getClassEnseignants(selectedClass.id);
            setSelectedClass({ ...updatedClass, enseignants });
            setIsAssignEnseignantModalOpen(false);
            setListRefreshKey((k) => k + 1);
        } catch (error) {
            setAssignEnseignantError(error instanceof Error ? error.message : "Erreur lors de l'assignation de l'enseignant");
        } finally {
            setIsAssigningEnseignant(false);
        }
    };

    const handleAssignStudents = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedClass) return;

        if (selectedStudentIds.length === 0) {
            setAssignError("Ajoutez au moins un ID eleve.");
            return;
        }

        try {
            setIsAssigning(true);
            setAssignError(null);
            const updatedClass = await classService.assignStudents(selectedClass.id, selectedStudentIds);
            setSelectedClass(updatedClass);
            setIsAssignModalOpen(false);
            setListRefreshKey((k) => k + 1);
        } catch (error) {
            setAssignError(error instanceof Error ? error.message : "Erreur lors de l'assignation des eleves");
        } finally {
            setIsAssigning(false);
        }
    };

    const handleDeleteFromDetail = async () => {
        if (!selectedClass) return;
        const confirmed = window.confirm(`Supprimer la classe ${selectedClass.name} ?`);
        if (!confirmed) return;

        try {
            setIsDeletingDetail(true);
            await classService.deleteClass(selectedClass.id);
            setSelectedClass(null);
            setListRefreshKey((k) => k + 1);
        } catch (error) {
            setFormError(error instanceof Error ? error.message : "Erreur lors de la suppression de la classe");
        } finally {
            setIsDeletingDetail(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setFormError(null);

        try {
            if (editingId) {
                const payload: ClassUpdatePayload = {
                    id: editingId,
                    name: formData.name,
                    levelClasse: formData.levelClasse,
                    enseignantPrincipal: formData.enseignantPrincipal,
                    anneeScolaire: formData.anneeScolaire,
                };
                await classService.updateClass(editingId, payload);
            } else {
                await classService.createClass(formData);
            }

            setIsModalOpen(false);
            resetForm();
            setListRefreshKey((k) => k + 1);
        } catch (error) {
            setFormError(error instanceof Error ? error.message : "Erreur lors de l'enregistrement de la classe");
        } finally {
            setIsSubmitting(false);
        }
    };

    const totalClasses = classes.length;
    const lyceeCount = classes.filter((c) => c.levelClasse === "LYCEE").length;
    const collegeCount = classes.filter((c) => c.levelClasse === "COLLEGE").length;
    const normalizedAssignSearch = assignSearchTerm.trim().toLowerCase();
    const filteredEleves = normalizedAssignSearch
        ? eleves.filter((eleve) => {
              const haystack = [
                  eleve.id,
                  eleve.nom,
                  eleve.prenom,
                  eleve.email,
                  eleve.phone,
                  eleve.classe ?? "",
              ]
                  .join(" ")
                  .toLowerCase();
              return haystack.includes(normalizedAssignSearch);
          })
        : eleves;

    const invalidEmploiEntries = emploiClasse.filter((entry) => {
        if (!entry.jour || !entry.heureDebut || !entry.heureFin) return true;
        return !WEEK_DAY_SET.has(entry.jour);
    });

    const weeklyCells = new Map<string, EmploiEntry[]>();
    for (const entry of emploiClasse) {
        if (!entry.jour || !entry.heureDebut || !entry.heureFin || !WEEK_DAY_SET.has(entry.jour)) continue;

        const startHour = Number.parseInt(entry.heureDebut.slice(0, 2), 10);
        const endHour = Number.parseInt(entry.heureFin.slice(0, 2), 10);
        if (Number.isNaN(startHour) || Number.isNaN(endHour) || endHour <= startHour) continue;

        for (let hour = startHour; hour < endHour; hour += 1) {
            if (hour < 8 || hour >= 18) continue;
            const slotKey = `${String(hour).padStart(2, "0")}:00`;
            const cellKey = `${entry.jour}-${slotKey}`;
            const list = weeklyCells.get(cellKey) ?? [];
            list.push(entry);
            weeklyCells.set(cellKey, list);
        }
    }

    return (
        <Layout>
            {selectedClass ? (
                <div className="bg-white rounded-2xl p-6 shadow-card animate-fadeUp">
                    <div className="flex items-start justify-between gap-3 flex-wrap mb-5">
                        <div>
                            <h2 className="font-display text-[22px] text-navy leading-tight">Détail de la classe</h2>
                            <p className="text-slate text-[13px] mt-0.5">Consultation des informations complètes</p>
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                            <button type="button" onClick={() => setSelectedClass(null)} className="px-4 py-2.5 rounded-xl border border-navy/10 text-navy text-sm font-medium hover:bg-ice transition-colors">Retour à la liste</button>
                            <button type="button" onClick={openAssignModal} className="px-4 py-2.5 rounded-xl border border-teal/30 text-teal text-sm font-medium hover:bg-teal/5 transition-colors">Assigner eleves</button>
                            <button type="button" onClick={openAssignEnseignantModal} className="px-4 py-2.5 rounded-xl border border-gold/30 text-gold text-sm font-medium hover:bg-gold/5 transition-colors">Assigner enseignants</button>
                            <button type="button" onClick={() => handleEdit(selectedClass)} className="px-4 py-2.5 rounded-xl border border-gold/30 text-gold text-sm font-medium hover:bg-gold/5 transition-colors">Modifier</button>
                            <button type="button" onClick={handleDeleteFromDetail} disabled={isDeletingDetail} className="px-4 py-2.5 rounded-xl bg-coral text-white text-sm font-semibold hover:bg-coral/90 transition-colors disabled:opacity-60">{isDeletingDetail ? "Suppression..." : "Supprimer"}</button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div className="p-3 rounded-xl bg-ice/60 border border-navy/10 md:col-span-2"><p className="text-[11px] uppercase tracking-wide text-slate">ID</p><p className="text-sm font-medium text-navy break-all">{selectedClass.id}</p></div>
                        <div className="p-3 rounded-xl bg-ice/60 border border-navy/10"><p className="text-[11px] uppercase tracking-wide text-slate">Nom</p><p className="text-sm font-medium text-navy">{selectedClass.name}</p></div>
                        <div className="p-3 rounded-xl bg-ice/60 border border-navy/10"><p className="text-[11px] uppercase tracking-wide text-slate">Niveau</p><p className="text-sm font-medium text-navy">{selectedClass.levelClasse}</p></div>
                        <div className="p-3 rounded-xl bg-ice/60 border border-navy/10"><p className="text-[11px] uppercase tracking-wide text-slate">Année scolaire</p><p className="text-sm font-medium text-navy">{selectedClass.anneeScolaire}</p></div>
                        <div className="p-3 rounded-xl bg-ice/60 border border-navy/10"><p className="text-[11px] uppercase tracking-wide text-slate">Enseignant principal</p><p className="text-sm font-medium text-navy break-all">{selectedClass.enseignantPrincipal}</p></div>
                    </div>

                    {/* ÉLÈVES */}
                    <div className="border-t border-navy/8 pt-5">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-display text-[16px] font-semibold text-navy">Élèves de la classe</h3>
                            <span className="bg-teal/10 text-teal text-[11px] font-bold px-2.5 py-1 rounded-full">{selectedClass.eleves?.length ?? 0}</span>
                        </div>

                        {(!selectedClass.eleves || selectedClass.eleves.length === 0) ? (
                            <div className="flex flex-col items-center justify-center py-10 rounded-xl bg-ice/40 border border-navy/5">
                                <svg className="w-10 h-10 text-slate/40 mb-2" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>
                                <p className="text-slate text-sm">Aucun élève dans cette classe</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b-2 border-ice">
                                            <th className="text-left text-[11px] font-semibold tracking-wider uppercase text-slate pb-3 pl-2">Élève</th>
                                            <th className="text-left text-[11px] font-semibold tracking-wider uppercase text-slate pb-3 px-2">Email</th>
                                            <th className="text-left text-[11px] font-semibold tracking-wider uppercase text-slate pb-3 px-2">Téléphone</th>
                                            <th className="text-left text-[11px] font-semibold tracking-wider uppercase text-slate pb-3 px-2">Naissance</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedClass.eleves.map((eleve, idx) => {
                                            const initials = `${eleve.prenom?.[0] ?? ""}${eleve.nom?.[0] ?? ""}`.toUpperCase();
                                            return (
                                                <tr key={eleve.id} className={`hover:bg-ice transition-colors ${idx !== (selectedClass.eleves!.length - 1) ? "border-b border-navy/5" : ""}`}>
                                                    <td className="py-3 pl-2 pr-2">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-teal bg-teal/10 flex-shrink-0">{initials || "EL"}</div>
                                                            <div>
                                                                <p className="text-[13px] font-medium text-navy">{eleve.prenom} {eleve.nom}</p>
                                                                <p className="text-[11px] text-slate break-all">{eleve.id}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-2 text-[13px] text-slate">{eleve.email}</td>
                                                    <td className="py-3 px-2 text-[13px] text-slate">{eleve.phone || "-"}</td>
                                                    <td className="py-3 px-2 text-[13px] text-slate">{eleve.dateNaissance?.slice(0, 10) || "-"}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* ENSEIGNANTS */}
                    <div className="border-t border-navy/8 pt-5">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-display text-[16px] font-semibold text-navy">Enseignants de la classe</h3>
                            <span className="bg-gold/10 text-gold text-[11px] font-bold px-2.5 py-1 rounded-full">{selectedClass.enseignants?.length ?? 0}</span>
                        </div>

                        {(!selectedClass.enseignants || selectedClass.enseignants.length === 0) ? (
                            <div className="flex flex-col items-center justify-center py-10 rounded-xl bg-ice/40 border border-navy/5">
                                <svg className="w-10 h-10 text-slate/40 mb-2" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                                <p className="text-slate text-sm">Aucun enseignant dans cette classe</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b-2 border-ice">
                                            <th className="text-left text-[11px] font-semibold tracking-wider uppercase text-slate pb-3 pl-2">Enseignant</th>
                                            <th className="text-left text-[11px] font-semibold tracking-wider uppercase text-slate pb-3 px-2">Email</th>
                                            <th className="text-left text-[11px] font-semibold tracking-wider uppercase text-slate pb-3 px-2">Spécialité</th>
                                            <th className="text-left text-[11px] font-semibold tracking-wider uppercase text-slate pb-3 px-2">Téléphone</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedClass.enseignants.map((enseignant, idx) => {
                                            const initials = `${enseignant.prenom?.[0] ?? ""}${enseignant.nom?.[0] ?? ""}`.toUpperCase();
                                            return (
                                                <tr key={enseignant.id} className={`hover:bg-ice transition-colors ${idx !== (selectedClass.enseignants!.length - 1) ? "border-b border-navy/5" : ""}`}>
                                                    <td className="py-3 pl-2 pr-2">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-gold bg-gold/10 flex-shrink-0">{initials || "EN"}</div>
                                                            <div>
                                                                <p className="text-[13px] font-medium text-navy">{enseignant.prenom} {enseignant.nom}</p>
                                                                <p className="text-[11px] text-slate break-all">{enseignant.id}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-2 text-[13px] text-slate">{enseignant.email}</td>
                                                    <td className="py-3 px-2 text-[13px] text-slate">{enseignant.specialite || "-"}</td>
                                                    <td className="py-3 px-2 text-[13px] text-slate">{enseignant.phone || "-"}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    <div className="border-t border-navy/8 pt-5">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-display text-[16px] font-semibold text-navy">Emploi du temps de la classe</h3>
                            <span className="bg-coral/10 text-coral text-[11px] font-bold px-2.5 py-1 rounded-full">{emploiClasse.length}</span>
                        </div>

                        {loadingEmploiClasse ? (
                            <div className="flex flex-col items-center justify-center py-10 rounded-xl bg-ice/40 border border-navy/5">
                                <p className="text-slate text-sm">Chargement de l'emploi du temps...</p>
                            </div>
                        ) : emploiClasseError ? (
                            <div className="p-3 rounded-xl bg-coral/10 border border-coral/20 text-coral text-sm">{emploiClasseError}</div>
                        ) : emploiClasse.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 rounded-xl bg-ice/40 border border-navy/5">
                                <p className="text-slate text-sm">Aucune seance trouvee pour cette classe</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[900px]">
                                        <thead>
                                            <tr className="border-b-2 border-ice">
                                                <th className="text-left text-[11px] font-semibold tracking-wider uppercase text-slate pb-3 pl-2 pr-2">Heure</th>
                                                {WEEK_DAYS.map((day) => (
                                                    <th key={day.key} className="text-left text-[11px] font-semibold tracking-wider uppercase text-slate pb-3 px-2">
                                                        {day.label}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {TIME_SLOTS.map((slot, rowIdx) => (
                                                <tr key={slot.key} className={`${rowIdx !== TIME_SLOTS.length - 1 ? "border-b border-navy/5" : ""}`}>
                                                    <td className="py-3 pl-2 pr-2 text-[12px] font-semibold text-navy whitespace-nowrap">{slot.label}</td>
                                                    {WEEK_DAYS.map((day) => {
                                                        const entries = weeklyCells.get(`${day.key}-${slot.key}`) ?? [];
                                                        return (
                                                            <td key={`${day.key}-${slot.key}`} className="py-2 px-2 align-top">
                                                                {entries.length === 0 ? (
                                                                    <span className="text-[12px] text-slate">-</span>
                                                                ) : (
                                                                    <div className="space-y-1">
                                                                        {entries.map((entry) => (
                                                                            <div key={entry.id} className="rounded-lg border border-teal/20 bg-teal/5 px-2 py-1">
                                                                                <p className="text-[12px] font-semibold text-navy leading-tight">{entry.matiereNom || entry.matiereId}</p>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {invalidEmploiEntries.length > 0 && (
                                    <div className="p-3 rounded-xl bg-coral/10 border border-coral/20">
                                        <p className="text-coral text-sm font-semibold mb-2">Donnees invalides detectees (jour/heure manquants)</p>
                                        <div className="space-y-1">
                                            {invalidEmploiEntries.map((entry) => (
                                                <p key={entry.id} className="text-coral text-xs break-all">
                                                    {entry.id} | {entry.jour ? JOUR_LABELS[entry.jour] || entry.jour : "Jour manquant"} | {entry.heureDebut || "Heure debut manquante"} - {entry.heureFin || "Heure fin manquante"}
                                                </p>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {isAssignEnseignantModalOpen && (
                        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
                            <div className="absolute inset-0 bg-navy/45" onClick={() => setIsAssignEnseignantModalOpen(false)} />
                            <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-hover p-6 animate-fadeUp">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-display text-[20px] text-navy">Assigner un enseignant</h3>
                                    <button type="button" className="w-9 h-9 rounded-lg border border-navy/10 text-slate hover:text-navy hover:bg-ice transition-colors" onClick={() => setIsAssignEnseignantModalOpen(false)} title="Fermer">x</button>
                                </div>

                                <div className="space-y-4">
                                    {assignEnseignantError && <div className="p-3 rounded-xl bg-coral/10 border border-coral/20 text-coral text-sm">{assignEnseignantError}</div>}

                                    <input
                                        type="text"
                                        value={assignEnseignantSearchTerm}
                                        onChange={(e) => setAssignEnseignantSearchTerm(e.target.value)}
                                        className="w-full rounded-xl border border-navy/10 bg-white px-3 py-2.5 text-sm text-navy outline-none focus:border-teal"
                                        placeholder="Rechercher enseignant: nom, email, UUID..."
                                    />

                                    <div className="max-h-80 overflow-y-auto border border-navy/10 rounded-xl divide-y divide-navy/5">
                                        {loadingEnseignants && <p className="p-4 text-sm text-slate">Chargement des enseignants...</p>}
                                        {!loadingEnseignants && assignEnseignantError && <p className="p-4 text-sm text-coral">Erreur: {assignEnseignantError}</p>}

                                        {!loadingEnseignants && !assignEnseignantError && enseignants.length === 0 && (
                                            <p className="p-4 text-sm text-slate">Aucun enseignant trouve.</p>
                                        )}

                                        {!loadingEnseignants && !assignEnseignantError && enseignants.filter((e) => {
                                            const haystack = [e.id, e.nom, e.prenom, e.email, e.phone, e.specialite ?? ""].join(" ").toLowerCase();
                                            return haystack.includes(assignEnseignantSearchTerm.trim().toLowerCase());
                                        }).map((enseignant) => {
                                            const initials = `${enseignant.prenom?.[0] ?? ""}${enseignant.nom?.[0] ?? ""}`.toUpperCase();
                                            return (
                                                <div key={enseignant.id} className="flex items-start gap-3 p-3 hover:bg-ice/60 cursor-pointer" onClick={() => handleAssignEnseignant(enseignant.id)}>
                                                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-gold bg-gold/10 flex-shrink-0">{initials || "EN"}</div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-[13px] font-medium text-navy">{enseignant.prenom} {enseignant.nom}</p>
                                                        <p className="text-[12px] text-slate break-all">{enseignant.email}</p>
                                                        <p className="text-[11px] text-slate break-all">{enseignant.specialite || "Aucune specialite"}</p>
                                                        <p className="text-[11px] text-slate break-all">{enseignant.id}</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div className="flex items-center justify-end gap-3 pt-2">
                                        <button type="button" onClick={() => setIsAssignEnseignantModalOpen(false)} className="px-4 py-2.5 rounded-xl border border-navy/10 text-navy text-sm font-medium hover:bg-ice transition-colors" disabled={isAssigningEnseignant}>Annuler</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {isAssignModalOpen && (
                        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
                            <div className="absolute inset-0 bg-navy/45" onClick={() => setIsAssignModalOpen(false)} />
                            <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-hover p-6 animate-fadeUp">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-display text-[20px] text-navy">Assigner des eleves</h3>
                                    <button type="button" className="w-9 h-9 rounded-lg border border-navy/10 text-slate hover:text-navy hover:bg-ice transition-colors" onClick={() => setIsAssignModalOpen(false)} title="Fermer">x</button>
                                </div>

                                <form onSubmit={handleAssignStudents} className="space-y-4">
                                    {assignError && <div className="p-3 rounded-xl bg-coral/10 border border-coral/20 text-coral text-sm">{assignError}</div>}

                                    <div className="flex items-center justify-between gap-3 flex-wrap">
                                        <label className="block text-[12px] font-semibold text-slate">Choisissez les eleves a assigner</label>
                                        <span className="bg-teal/10 text-teal text-[11px] font-bold px-2.5 py-1 rounded-full">{selectedStudentIds.length} selectionne(s)</span>
                                    </div>

                                    <input
                                        type="text"
                                        value={assignSearchTerm}
                                        onChange={(e) => setAssignSearchTerm(e.target.value)}
                                        className="w-full rounded-xl border border-navy/10 bg-white px-3 py-2.5 text-sm text-navy outline-none focus:border-teal"
                                        placeholder="Rechercher eleve: nom, email, UUID..."
                                    />

                                    <div className="max-h-80 overflow-y-auto border border-navy/10 rounded-xl divide-y divide-navy/5">
                                        {loadingEleves && <p className="p-4 text-sm text-slate">Chargement des eleves...</p>}
                                        {!loadingEleves && elevesError && <p className="p-4 text-sm text-coral">Erreur chargement eleves: {elevesError}</p>}

                                        {!loadingEleves && !elevesError && filteredEleves.length === 0 && (
                                            <p className="p-4 text-sm text-slate">Aucun eleve trouve.</p>
                                        )}

                                        {!loadingEleves && !elevesError && filteredEleves.map((eleve) => {
                                            const isChecked = selectedStudentIds.includes(eleve.id);
                                            return (
                                                <label key={eleve.id} className="flex items-start gap-3 p-3 hover:bg-ice/60 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={isChecked}
                                                        onChange={() => toggleStudentSelection(eleve.id)}
                                                        className="mt-1 h-4 w-4 rounded border-navy/30 text-teal focus:ring-teal/30"
                                                    />
                                                    <div className="min-w-0">
                                                        <p className="text-[13px] font-medium text-navy">{eleve.prenom} {eleve.nom}</p>
                                                        <p className="text-[12px] text-slate break-all">{eleve.email}</p>
                                                        <p className="text-[11px] text-slate break-all">{eleve.id}</p>
                                                    </div>
                                                </label>
                                            );
                                        })}
                                    </div>

                                    <div className="flex items-center justify-end gap-3 pt-2">
                                        <button type="button" onClick={() => setIsAssignModalOpen(false)} className="px-4 py-2.5 rounded-xl border border-navy/10 text-navy text-sm font-medium hover:bg-ice transition-colors">Annuler</button>
                                        <button type="submit" disabled={isAssigning} className="px-4 py-2.5 rounded-xl nav-active text-white text-sm font-semibold shadow-teal disabled:opacity-60">{isAssigning ? "Assignation..." : "Assigner"}</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <>
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div>
                            <h2 className="font-display text-[22px] text-navy leading-tight">Gestion des classes</h2>
                            <p className="text-slate text-[13px] mt-0.5">Administration des classes et niveaux</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-5">
                        <StatCard title="Total classes" value={totalClasses} icon={(<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 21h18" /><rect x="5" y="9" width="4" height="8" /><rect x="10" y="5" width="4" height="12" /><rect x="15" y="11" width="4" height="6" /></svg>)} trendValue="Effectif actuel" trendIcon={(<svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><polyline points="18 15 12 9 6 15" /></svg>)} colorTheme={{ gradient: "linear-gradient(90deg,#0E9E8E,#16BCA8)", iconBg: "rgba(14,158,142,.1)", iconColor: "#0E9E8E", trendBg: "rgba(91,173,139,.15)", trendColor: "#5BAD8B" }} delay="0.05s" />
                        <StatCard title="Niveau LYCEE" value={lyceeCount} icon={(<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 3l9 4.5-9 4.5-9-4.5L12 3z" /><path d="M3 12l9 4.5 9-4.5" /></svg>)} trendValue={totalClasses > 0 ? `${Math.round((lyceeCount / totalClasses) * 100)}% du total` : "0% du total"} trendIcon={(<svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><polyline points="18 15 12 9 6 15" /></svg>)} colorTheme={{ gradient: "linear-gradient(90deg,#E8A020,#F5B84C)", iconBg: "rgba(232,160,32,.1)", iconColor: "#E8A020", trendBg: "rgba(232,160,32,.15)", trendColor: "#E8A020" }} delay="0.1s" />
                        <StatCard title="Niveau COLLEGE" value={collegeCount} icon={(<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M8 12h8" /></svg>)} trendValue={totalClasses > 0 ? `${Math.round((collegeCount / totalClasses) * 100)}% du total` : "0% du total"} trendIcon={(<svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9" /></svg>)} colorTheme={{ gradient: "linear-gradient(90deg,#E05C5C,#f08080)", iconBg: "rgba(224,92,92,.1)", iconColor: "#E05C5C", trendBg: "rgba(224,92,92,.12)", trendColor: "#E05C5C" }} delay="0.15s" />
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                        <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-64 rounded-xl border border-navy/10 bg-white px-3 py-2.5 text-sm text-navy outline-none focus:border-teal" placeholder="Rechercher: nom, niveau..." />
                        <button type="button" onClick={() => setIsModalOpen(true)} className="nav-active text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-teal hover:opacity-95 transition-opacity">+ Nouvelle classe</button>
                    </div>

                    <ClassList refreshKey={listRefreshKey} onEdit={handleEdit} onView={handleView} searchTerm={searchTerm} />

                    {isModalOpen && (
                        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                            <div className="absolute inset-0 bg-navy/40" onClick={() => setIsModalOpen(false)} />
                            <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-hover p-6 animate-fadeUp">
                                <div className="flex items-center justify-between mb-5">
                                    <h3 className="font-display text-[20px] text-navy">{editingId ? "Modifier la classe" : "Nouvelle classe"}</h3>
                                    <button type="button" className="w-9 h-9 rounded-lg border border-navy/10 text-slate hover:text-navy hover:bg-ice transition-colors" onClick={() => setIsModalOpen(false)} title="Fermer">x</button>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    {formError && <div className="p-3 rounded-xl bg-coral/10 border border-coral/20 text-coral text-sm">{formError}</div>}

                                    <div><label className="block text-[12px] font-semibold text-slate mb-1.5">Nom de la classe</label><input type="text" value={formData.name} onChange={(e) => updateField("name", e.target.value)} className="w-full rounded-xl border border-navy/10 bg-white px-3 py-2.5 text-sm text-navy outline-none focus:border-teal" placeholder="A4" /></div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[12px] font-semibold text-slate mb-1.5">Niveau</label>
                                            <select value={formData.levelClasse} onChange={(e) => updateField("levelClasse", e.target.value)} className="w-full rounded-xl border border-navy/10 bg-white px-3 py-2.5 text-sm text-navy outline-none focus:border-teal">
                                                {LEVEL_OPTIONS.map((level) => (
                                                    <option key={level} value={level}>{level}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div><label className="block text-[12px] font-semibold text-slate mb-1.5">Année scolaire</label><input type="text" required value={formData.anneeScolaire} onChange={(e) => updateField("anneeScolaire", e.target.value)} className="w-full rounded-xl border border-navy/10 bg-white px-3 py-2.5 text-sm text-navy outline-none focus:border-teal" placeholder="2024-2025" /></div>
                                    </div>

                                    <div><label className="block text-[12px] font-semibold text-slate mb-1.5">Enseignant principal (UUID)</label><input type="text" required value={formData.enseignantPrincipal} onChange={(e) => updateField("enseignantPrincipal", e.target.value)} className="w-full rounded-xl border border-navy/10 bg-white px-3 py-2.5 text-sm text-navy outline-none focus:border-teal" placeholder="00000000-0000-0000-0000-000000000001" /></div>

                                    <div className="flex items-center justify-end gap-3 pt-2">
                                        <button type="button" onClick={() => { setIsModalOpen(false); resetForm(); }} className="px-4 py-2.5 rounded-xl border border-navy/10 text-navy text-sm font-medium hover:bg-ice transition-colors">Annuler</button>
                                        <button type="submit" disabled={isSubmitting} className="px-4 py-2.5 rounded-xl nav-active text-white text-sm font-semibold shadow-teal disabled:opacity-60">{isSubmitting ? (editingId ? "Modification..." : "Creation...") : (editingId ? "Mettre à jour" : "Creer classe")}</button>
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
