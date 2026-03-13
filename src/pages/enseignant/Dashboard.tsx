import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useSeances, useEmploiByEnseignant } from "../../hooks/useSeances";
import { useEleves } from "../../hooks/useEleves";
import absenceService, { type AbsenceType } from "../../services/user/absenceService";
import type { Seance, JourSemaine } from "../../services/user/seanceService";

const DAY_LABELS: Record<JourSemaine, string> = {
    MONDAY: "Lundi",
    TUESDAY: "Mardi",
    WEDNESDAY: "Mercredi",
    THURSDAY: "Jeudi",
    FRIDAY: "Vendredi",
    SATURDAY: "Samedi",
    SUNDAY: "Dimanche",
};

const dayOrder: Record<JourSemaine, number> = {
    MONDAY: 1,
    TUESDAY: 2,
    WEDNESDAY: 3,
    THURSDAY: 4,
    FRIDAY: 5,
    SATURDAY: 6,
    SUNDAY: 7,
};

function normalizeTime(value?: string | null): string {
    if (!value) return "";
    return value.length >= 5 ? value.slice(0, 5) : value;
}

function isTeacherRole(role?: string): boolean {
    return (role || "").toLowerCase().includes("enseign");
}

function isUuid(value?: string | null): boolean {
    if (!value) return false;
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export default function EnseignantDashboard() {
    const { user, logout } = useAuth();
    const teacherId = user?.id || null;
    const teacherUuid = isUuid(teacherId) ? teacherId : null;

    useEffect(() => {
        console.log("[EnseignantDashboard] debug teacher id", {
            teacherId,
            teacherUuid,
            role: user?.role,
            email: user?.email,
        });
    }, [teacherId, teacherUuid, user?.role, user?.email]);

    const { seances, loading: loadingSeances, error: seancesError } = useSeances();
    const { emploi, loading: loadingEmploi, error: emploiError } = useEmploiByEnseignant(teacherUuid);
    const { eleves, loading: loadingEleves } = useEleves();

    const [selectedSeanceId, setSelectedSeanceId] = useState("");
    const [selectedEleveIds, setSelectedEleveIds] = useState<string[]>([]);
    const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
    const [type, setType] = useState<AbsenceType>("ABSENCE");
    const [motif, setMotif] = useState("");
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const teacherSeances = useMemo(
        () => seances
            .filter((s) => s.enseignantId === teacherUuid)
            .sort((a, b) => {
                const dayA = dayOrder[a.jour] ?? 99;
                const dayB = dayOrder[b.jour] ?? 99;
                if (dayA !== dayB) return dayA - dayB;
                return (a.heureDebut || "99:99:99").localeCompare(b.heureDebut || "99:99:99");
            }),
        [seances, teacherUuid]
    );

    const selectedSeance = useMemo<Seance | null>(
        () => teacherSeances.find((s) => s.id === selectedSeanceId) || null,
        [teacherSeances, selectedSeanceId]
    );

    const classeEleves = useMemo(() => {
        if (!selectedSeance?.classeId) return [];
        return eleves.filter((eleve) => {
            const byClasseId = eleve.classeId && eleve.classeId === selectedSeance.classeId;
            const byClasse = eleve.classe && eleve.classe === selectedSeance.classeId;
            return Boolean(byClasseId || byClasse);
        });
    }, [eleves, selectedSeance]);

    const emploiByDay = useMemo(() => {
        const map = new Map<JourSemaine, typeof emploi>();
        for (const entry of emploi) {
            if (!entry.jour) continue;
            const list = map.get(entry.jour) || [];
            list.push(entry);
            map.set(entry.jour, list);
        }

        return Array.from(map.entries())
            .sort((a, b) => (dayOrder[a[0]] ?? 99) - (dayOrder[b[0]] ?? 99))
            .map(([jour, entries]) => ({
                jour,
                entries: entries.sort((a, b) => (a.heureDebut || "99:99:99").localeCompare(b.heureDebut || "99:99:99")),
            }));
    }, [emploi]);

    const toggleEleve = (eleveId: string) => {
        setSelectedEleveIds((prev) =>
            prev.includes(eleveId) ? prev.filter((id) => id !== eleveId) : [...prev, eleveId]
        );
    };

    const toggleAllEleves = () => {
        if (classeEleves.length === 0) return;
        if (selectedEleveIds.length === classeEleves.length) {
            setSelectedEleveIds([]);
            return;
        }
        setSelectedEleveIds(classeEleves.map((e) => e.id));
    };

    const handleSeanceChange = (id: string) => {
        setSelectedSeanceId(id);
        setSelectedEleveIds([]);
        setSubmitError(null);
        setSubmitSuccess(null);
    };

    const handleSubmitAbsence = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitError(null);
        setSubmitSuccess(null);

        if (!user) {
            setSubmitError("Session expirée. Reconnectez-vous.");
            return;
        }

        if (!selectedSeance) {
            setSubmitError("Veuillez choisir une séance.");
            return;
        }

        if (!teacherUuid) {
            setSubmitError("Identifiant enseignant invalide. Reconnectez-vous pour recharger un ID UUID.");
            return;
        }

        if (selectedEleveIds.length === 0) {
            setSubmitError("Veuillez sélectionner au moins un élève.");
            return;
        }

        if (!date) {
            setSubmitError("Veuillez renseigner la date.");
            return;
        }

        try {
            setIsSubmitting(true);
            await absenceService.createBulk({
                eleveIds: selectedEleveIds,
                classeId: selectedSeance.classeId,
                enseignantId: teacherUuid,
                seanceId: selectedSeance.id,
                date,
                heureDebut: selectedSeance.heureDebut,
                heureFin: selectedSeance.heureFin,
                type,
                motif: motif.trim() ? motif.trim() : undefined,
            });

            setSubmitSuccess(`${selectedEleveIds.length} absence(s) enregistrée(s).`);
            setSelectedEleveIds([]);
            setMotif("");
        } catch (error) {
            setSubmitError(error instanceof Error ? error.message : "Erreur lors de l'enregistrement des absences.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (!isTeacherRole(user.role)) {
        return <Navigate to="/dashboard" replace />;
    }

    return (
        <div className="min-h-screen bg-ice">
            <header className="sticky top-0 z-20 bg-white border-b border-navy/10">
                <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between gap-4">
                    <div>
                        <h1 className="font-display text-[24px] text-navy">Espace Enseignant</h1>
                        <p className="text-sm text-slate">Bienvenue {user.name}</p>
                    </div>
                    <button
                        type="button"
                        onClick={logout}
                        className="px-4 py-2 rounded-xl border border-navy/20 text-navy text-sm font-semibold hover:bg-navy hover:text-white transition-colors"
                    >
                        Déconnexion
                    </button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6">
                <section className="bg-white rounded-2xl shadow-card border border-navy/10 p-5 md:p-6">
                    <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
                        <h2 className="text-lg font-semibold text-navy">Mon emploi du temps</h2>
                        {loadingEmploi && <span className="text-sm text-slate">Chargement...</span>}
                    </div>

                    {!teacherUuid && (
                        <div className="mb-4 rounded-xl border border-coral/20 bg-coral/10 text-coral text-sm px-3 py-2">
                            Identifiant enseignant invalide ({teacherId || "absent"}). L'API emploi exige un UUID. Reconnectez-vous.
                        </div>
                    )}

                    {emploiError && (
                        <div className="mb-4 rounded-xl border border-coral/20 bg-coral/10 text-coral text-sm px-3 py-2">
                            {emploiError}
                        </div>
                    )}

                    {!loadingEmploi && emploiByDay.length === 0 ? (
                        <p className="text-sm text-slate">Aucune séance trouvée pour votre profil.</p>
                    ) : (
                        <div className="space-y-4">
                            {emploiByDay.map((group) => (
                                <div key={group.jour}>
                                    <p className="text-[12px] uppercase tracking-wide font-semibold text-slate mb-2">
                                        {DAY_LABELS[group.jour]}
                                    </p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {group.entries.map((entry, index) => (
                                            <article key={`${entry.id}-${index}`} className="rounded-xl border border-navy/10 bg-ice/40 p-3">
                                                <p className="font-semibold text-navy text-sm">{entry.matiereNom || entry.matiereId || "Matière"}</p>
                                                <p className="text-xs text-slate mt-1">Classe: {entry.classeNom || entry.classeId || "-"}</p>
                                                <p className="text-xs text-teal font-semibold mt-2">
                                                    {normalizeTime(entry.heureDebut)} - {normalizeTime(entry.heureFin)}
                                                </p>
                                            </article>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                <section className="bg-white rounded-2xl shadow-card border border-navy/10 p-5 md:p-6">
                    <h2 className="text-lg font-semibold text-navy mb-4">Déclaration des absences (mes séances uniquement)</h2>

                    {seancesError && (
                        <div className="mb-4 rounded-xl border border-coral/20 bg-coral/10 text-coral text-sm px-3 py-2">
                            {seancesError}
                        </div>
                    )}

                    <form onSubmit={handleSubmitAbsence} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-[12px] font-semibold text-slate mb-1">Séance</label>
                                <select
                                    value={selectedSeanceId}
                                    onChange={(e) => handleSeanceChange(e.target.value)}
                                    className="w-full rounded-xl border border-navy/10 bg-white px-3 py-2.5 text-sm text-navy outline-none focus:border-teal"
                                >
                                    <option value="">Choisir une séance</option>
                                    {teacherSeances.map((seance) => (
                                        <option key={seance.id} value={seance.id}>
                                            {DAY_LABELS[seance.jour]} {normalizeTime(seance.heureDebut)}-{normalizeTime(seance.heureFin)} | {seance.matiereNom || seance.matiereId}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-[12px] font-semibold text-slate mb-1">Date</label>
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="w-full rounded-xl border border-navy/10 bg-white px-3 py-2.5 text-sm text-navy outline-none focus:border-teal"
                                />
                            </div>

                            <div>
                                <label className="block text-[12px] font-semibold text-slate mb-1">Type</label>
                                <select
                                    value={type}
                                    onChange={(e) => setType(e.target.value as AbsenceType)}
                                    className="w-full rounded-xl border border-navy/10 bg-white px-3 py-2.5 text-sm text-navy outline-none focus:border-teal"
                                >
                                    <option value="ABSENCE">ABSENCE</option>
                                    <option value="RETARD">RETARD</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-[12px] font-semibold text-slate mb-1">Motif (optionnel)</label>
                                <input
                                    type="text"
                                    value={motif}
                                    onChange={(e) => setMotif(e.target.value)}
                                    placeholder="Ex: Maladie"
                                    className="w-full rounded-xl border border-navy/10 bg-white px-3 py-2.5 text-sm text-navy outline-none focus:border-teal"
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-[12px] font-semibold text-slate">Élèves de la séance</label>
                                <button
                                    type="button"
                                    onClick={toggleAllEleves}
                                    className="text-xs font-semibold text-teal hover:underline"
                                >
                                    {selectedEleveIds.length === classeEleves.length && classeEleves.length > 0 ? "Tout désélectionner" : "Tout sélectionner"}
                                </button>
                            </div>

                            {loadingEleves || loadingSeances ? (
                                <p className="text-sm text-slate">Chargement des élèves...</p>
                            ) : !selectedSeance ? (
                                <p className="text-sm text-slate">Choisissez une séance pour afficher les élèves.</p>
                            ) : classeEleves.length === 0 ? (
                                <p className="text-sm text-slate">Aucun élève trouvé pour cette séance.</p>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                    {classeEleves.map((eleve) => (
                                        <label
                                            key={eleve.id}
                                            className="flex items-center gap-2 rounded-xl border border-navy/10 px-3 py-2.5 bg-ice/40 hover:bg-ice/70 cursor-pointer"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedEleveIds.includes(eleve.id)}
                                                onChange={() => toggleEleve(eleve.id)}
                                                className="w-4 h-4 accent-teal"
                                            />
                                            <span className="text-sm text-navy">{eleve.prenom} {eleve.nom}</span>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>

                        {submitError && (
                            <div className="rounded-xl border border-coral/20 bg-coral/10 text-coral text-sm px-3 py-2">
                                {submitError}
                            </div>
                        )}

                        {submitSuccess && (
                            <div className="rounded-xl border border-teal/20 bg-teal/10 text-teal text-sm px-3 py-2">
                                {submitSuccess}
                            </div>
                        )}

                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="nav-active text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-teal hover:opacity-95 transition-opacity disabled:opacity-70"
                            >
                                {isSubmitting ? "Enregistrement..." : "Enregistrer les absences"}
                            </button>
                        </div>
                    </form>
                </section>
            </main>
        </div>
    );
}
