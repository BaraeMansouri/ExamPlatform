import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../api/api";
import ProfessorShell from "../components/ProfessorShell";
import { rejectSession, validateSession } from "../api/sessions";

const Page3_Control = () => {
  const { examId } = useParams();
  const navigate = useNavigate();

  const [exam, setExam] = useState(null);
  const [pending, setPending] = useState([]);
  const [accepted, setAccepted] = useState([]);
  const [submitted, setSubmitted] = useState([]);
  const [logs, setLogs] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionBySession, setActionBySession] = useState({});

  useEffect(() => {
    fetchInitialData({ silent: false });

    const refreshTimer = window.setInterval(() => {
      fetchInitialData({ silent: true });
    }, 12000);

    return () => window.clearInterval(refreshTimer);
  }, [examId]);

  const addToast = (message, type = "info") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3500);
  };

  const setSessionAction = (sessionId, action) => {
    setActionBySession((prev) => ({
      ...prev,
      [sessionId]: action,
    }));
  };

  const clearSessionAction = (sessionId) => {
    setActionBySession((prev) => {
      const next = { ...prev };
      delete next[sessionId];
      return next;
    });
  };

  const fetchInitialData = async ({ silent = false } = {}) => {
    if (silent) setRefreshing(true);
    else setLoading(true);

    try {
      const [examRes, pendRes, accRes, subRes, logsRes] = await Promise.all([
        api.get(`/exams/${examId}`),
        api.get(`/admin/pending/${examId}`),
        api.get(`/admin/accepted/${examId}`),
        api.get(`/results/${examId}`),
        api.get(`/admin/alerts/${examId}`),
      ]);

      setExam(examRes.data?.data ?? examRes.data ?? null);
      setPending(Array.isArray(pendRes.data) ? pendRes.data : pendRes.data?.data ?? []);
      setAccepted(accRes.data?.accepted ?? []);
      setSubmitted(Array.isArray(subRes.data) ? subRes.data : subRes.data?.data ?? []);
      setLogs(Array.isArray(logsRes.data) ? logsRes.data : logsRes.data?.data ?? []);
    } catch (error) {
      console.error(error);
      if (!silent) {
        addToast(getErrorMessage(error, "Erreur de chargement"), "danger");
      }
    } finally {
      if (silent) setRefreshing(false);
      else setLoading(false);
    }
  };

  const handleAccept = async (session) => {
    if (!session?.id || actionBySession[session.id]) return;

    setSessionAction(session.id, "accept");

    try {
      await validateSession(session.id);
      addToast(`${getDisplayName(session)} accepte`, "success");
      await fetchInitialData({ silent: true });
    } catch (error) {
      console.error(error);
      addToast(getErrorMessage(error, "Erreur lors de l'acceptation"), "danger");
    } finally {
      clearSessionAction(session.id);
    }
  };

  const handleReject = async (session) => {
    if (!session?.id || actionBySession[session.id]) return;

    setSessionAction(session.id, "reject");

    try {
      await rejectSession(session.id);
      addToast(`${getDisplayName(session)} refuse`, "warning");
      await fetchInitialData({ silent: true });
    } catch (error) {
      console.error(error);
      addToast(getErrorMessage(error, "Erreur lors du refus"), "danger");
    } finally {
      clearSessionAction(session.id);
    }
  };

  if (loading) {
    return (
      <ProfessorShell title="Controle en direct" subtitle="Chargement de la supervision...">
        <div className="glass-card rounded-[2rem] border border-white/10 bg-white/5 p-10 text-center text-slate-200">
          Chargement du controle...
        </div>
      </ProfessorShell>
    );
  }

  return (
    <ProfessorShell
      title={exam?.title || "Controle en direct"}
      subtitle={
        refreshing
          ? "Mise a jour en arriere-plan..."
          : "Validation, supervision et suivi en temps reel."
      }
      actions={
        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-white"
        >
          Retour dashboard
        </button>
      }
    >
      <div className="grid gap-6">
        <section className="grid gap-4 md:grid-cols-4">
          <Metric label="Demandes" value={pending.length} tone="cyan" />
          <Metric label="En cours" value={accepted.length} tone="violet" />
          <Metric label="Soumises" value={submitted.length} tone="emerald" />
          <Metric label="Alertes" value={logs.length} tone="rose" />
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <ControlCard title="Demandes d'acces" subtitle="Etudiants en attente d'approbation">
            {pending.length === 0 ? (
              <EmptyLabel text="Aucune demande en attente" />
            ) : (
              pending.map((session) => {
                const currentAction = actionBySession[session.id];
                const busy = Boolean(currentAction);

                return (
                  <div key={session.id} className="rounded-[1.5rem] border border-white/10 bg-slate-950/25 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <div className="text-lg font-black text-white">{getDisplayName(session)}</div>
                        <div className="mt-1 text-sm text-slate-400">{getGroupInfo(session)}</div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleAccept(session)}
                          disabled={busy}
                          className="rounded-2xl bg-emerald-400 px-4 py-2 text-sm font-black text-slate-950 transition disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {currentAction === "accept" ? "Validation..." : "Accepter"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReject(session)}
                          disabled={busy}
                          className="rounded-2xl border border-rose-300/20 bg-rose-400/10 px-4 py-2 text-sm font-bold text-rose-100 transition disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {currentAction === "reject" ? "Refus..." : "Refuser"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </ControlCard>

          <ControlCard title="En cours de passage" subtitle="Etudiants actuellement dans l'examen">
            {accepted.length === 0 ? (
              <EmptyLabel text="Aucun etudiant en cours" />
            ) : (
              accepted.map((session) => (
                <div key={session.id} className="rounded-[1.5rem] border border-white/10 bg-slate-950/25 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-lg font-black text-white">{getDisplayName(session)}</div>
                      <div className="mt-1 text-sm text-slate-400">Debute a {formatTime(session.started_at)}</div>
                    </div>
                    <div className="rounded-full bg-violet-400/15 px-3 py-2 text-xs font-black uppercase tracking-[0.18em] text-violet-100">
                      En examen
                    </div>
                  </div>
                </div>
              ))
            )}
          </ControlCard>

          <ControlCard title="Copies soumises" subtitle="Etudiants ayant termine">
            {submitted.length === 0 ? (
              <EmptyLabel text="Aucune copie soumise pour le moment" />
            ) : (
              submitted.map((session) => (
                <div key={session.id} className="rounded-[1.5rem] border border-white/10 bg-slate-950/25 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-lg font-black text-white">{getDisplayName(session)}</div>
                      <div className="mt-1 text-sm text-slate-400">{session.student_number || "N/A"}</div>
                    </div>
                    <Link
                      to={`/exams/${examId}/results`}
                      className="rounded-2xl bg-white px-4 py-2 text-sm font-black text-slate-950"
                    >
                      Voir la copie
                    </Link>
                  </div>
                </div>
              ))
            )}
          </ControlCard>

          <ControlCard title="Alertes suspectes" subtitle="Fullscreen, focus et activite surveillee">
            {logs.length === 0 ? (
              <EmptyLabel text="Aucune alerte pour le moment" />
            ) : (
              logs.map((log) => (
                <div key={log.id} className="rounded-[1.5rem] border border-white/10 bg-slate-950/25 p-4">
                  <div className="flex gap-3">
                    <div className="font-mono text-xs text-slate-500">{log.time}</div>
                    <div className="flex-1">
                      <div className="text-sm font-black text-white">{log.studentName}</div>
                      <div className="mt-2 inline-flex rounded-full bg-rose-400/15 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-rose-100">
                        {log.eventType}
                      </div>
                      {log.description ? (
                        <div className="mt-2 text-sm leading-7 text-slate-300">{log.description}</div>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))
            )}
          </ControlCard>
        </section>

        <div className="pointer-events-none fixed bottom-6 right-6 z-50 flex flex-col gap-3">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`rounded-2xl border px-4 py-3 text-sm font-bold shadow-lg ${toastTone(toast.type)}`}
            >
              {toast.message}
            </div>
          ))}
        </div>
      </div>
    </ProfessorShell>
  );
};

function Metric({ label, value, tone }) {
  const tones = {
    cyan: "from-cyan-400/20 to-blue-500/20 text-cyan-100",
    violet: "from-violet-400/20 to-fuchsia-500/20 text-violet-100",
    emerald: "from-emerald-400/20 to-green-500/20 text-emerald-100",
    rose: "from-rose-400/20 to-red-500/20 text-rose-100",
  };

  return (
    <div className={`rounded-[1.8rem] border border-white/10 bg-gradient-to-br ${tones[tone]} p-5 shadow-[0_12px_35px_rgba(2,8,23,0.18)]`}>
      <div className="text-xs font-black uppercase tracking-[0.22em] text-slate-300">{label}</div>
      <div className="mt-3 text-4xl font-black text-white">{value}</div>
    </div>
  );
}

function ControlCard({ title, subtitle, children }) {
  return (
    <section className="glass-card rounded-[2rem] border border-white/10 bg-white/5 p-6 text-white">
      <div className="mb-5">
        <div className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">{title}</div>
        <div className="mt-2 text-sm text-slate-300">{subtitle}</div>
      </div>
      <div className="grid gap-3">{children}</div>
    </section>
  );
}

function EmptyLabel({ text }) {
  return (
    <div className="rounded-[1.5rem] border border-dashed border-white/10 bg-slate-950/20 p-8 text-center text-slate-400">
      {text}
    </div>
  );
}

function getDisplayName(session) {
  return session?.studentName || session?.username || `Etudiant #${session?.id}`;
}

function getGroupInfo(session) {
  return session?.groupName || session?.group_name || session?.student_number || "Groupe N/A";
}

function formatTime(isoString) {
  if (!isoString) return "--";
  return new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(isoString));
}

function getErrorMessage(error, fallback) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    fallback
  );
}

function toastTone(type) {
  if (type === "success") return "border-emerald-300/20 bg-emerald-400/10 text-emerald-100";
  if (type === "warning") return "border-amber-300/20 bg-amber-400/10 text-amber-100";
  if (type === "danger") return "border-rose-300/20 bg-rose-400/10 text-rose-100";
  return "border-cyan-300/20 bg-cyan-400/10 text-cyan-100";
}

export default Page3_Control;
