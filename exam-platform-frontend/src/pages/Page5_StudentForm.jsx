import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000/api",
  headers: { Accept: "application/json" },
});

const POLL_INTERVAL = 3000;

export default function Page5_StudentForm() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [exam, setExam] = useState(null);
  const [groups, setGroups] = useState([]);
  const [form, setForm] = useState({
    firstname: "",
    lastname: "",
    group_name: "",
    student_number: "",
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [session, setSession] = useState(null);
  const [alert, setAlert] = useState({
    type: searchParams.get("submitted") ? "success" : "info",
    message: searchParams.get("submitted")
      ? "Votre examen a ete soumis avec succes."
      : "",
  });

  useEffect(() => {
    const bootstrap = async () => {
      setLoading(true);

      try {
        const [examRes, groupsRes] = await Promise.all([
          api.get(`/exam/access/${token}`),
          api.get("/student-groups"),
        ]);

        const examData = examRes.data?.data || examRes.data;
        setExam(examData);
        setGroups(groupsRes.data?.data || groupsRes.data || []);

        const storedSessionId = localStorage.getItem("session_id");
        if (storedSessionId) {
          const sessionRes = await api.get(`/exam/session/${storedSessionId}`);
          const currentSession = sessionRes.data?.data || sessionRes.data;

          if (currentSession?.exam_id === examData?.id) {
            setSession(currentSession);
          }
        }
      } catch (error) {
        setAlert({
          type: "error",
          message: error.response?.data?.message || "Lien d'examen invalide ou indisponible.",
        });
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, [token]);

  useEffect(() => {
    if (!session?.id || session.status !== "pending") {
      return undefined;
    }

    const poll = async () => {
      try {
        const res = await api.get(`/exam/session/${session.id}`);
        const nextSession = res.data?.data || res.data;
        setSession(nextSession);

        if (nextSession.status === "accepted" || nextSession.status === "in_progress") {
          localStorage.setItem("session_id", String(nextSession.id));
          navigate(`/exam/${token}/take?session_id=${nextSession.id}`, { replace: true });
          return;
        }

        if (nextSession.status === "rejected") {
          localStorage.removeItem("session_id");
          setAlert({
            type: "error",
            message: "Votre demande a ete refusee par le professeur.",
          });
        }
      } catch (error) {
        setAlert({
          type: "error",
          message: error.response?.data?.message || "Impossible de verifier le statut de votre demande.",
        });
      }
    };

    poll();
    const timer = window.setInterval(poll, POLL_INTERVAL);
    return () => window.clearInterval(timer);
  }, [session?.id, session?.status, navigate, token]);

  const waiting = useMemo(() => session?.status === "pending", [session]);

  const handleChange = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event?.preventDefault();

    const { firstname, lastname, group_name, student_number } = form;

    if (!firstname || !lastname || !group_name || !student_number) {
      setAlert({ type: "error", message: "Tous les champs sont obligatoires." });
      return;
    }

    setSubmitting(true);
    setAlert({ type: "info", message: "" });

    try {
      const res = await api.post("/exam/join", {
        token,
        username: `${firstname} ${lastname}`.trim(),
        group_name,
        student_number,
      });

      const nextSession = res.data?.data || res.data;
      setSession(nextSession);
      localStorage.setItem("session_id", String(nextSession.id));

      if (nextSession.status === "accepted" || nextSession.status === "in_progress") {
        navigate(`/exam/${token}/take?session_id=${nextSession.id}`, { replace: true });
        return;
      }

      if (nextSession.status === "rejected") {
        setAlert({
          type: "error",
          message: "Cette demande etait refusee. Une nouvelle demande vient d'etre envoyee.",
        });
        return;
      }

      if (nextSession.status === "submitted") {
        setAlert({
          type: "error",
          message: "Cet examen a deja ete soumis avec ce numero etudiant.",
        });
        return;
      }

      setAlert({
        type: "info",
        message: "Votre demande a ete envoyee. Attendez la validation du professeur.",
      });
    } catch (error) {
      setAlert({
        type: "error",
        message: error.response?.data?.message || "Impossible d'envoyer votre demande.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <>
        <style>{styles}</style>
        <div className="student-shell">
          <div className="student-card student-centered">
            <div className="student-spinner" />
            <p>Chargement de l'examen...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{styles}</style>
      <div className="student-shell">
        <div className="student-backdrop" />
        <div className="student-orb student-orb-a" />
        <div className="student-orb student-orb-b" />
        <div className="student-orb student-orb-c" />
        <div className="student-card">
          <div className="student-hero">
            <div className="student-badge">Acces etudiant</div>
            <h1>{exam?.title || "Examen"}</h1>
            <p>
              Completez vos informations. L'examen sera disponible apres validation
              du professeur.
            </p>
          </div>

          <div className="student-panel">
            {alert.message ? (
              <div className={`student-alert student-alert-${alert.type}`}>
                {alert.message}
              </div>
            ) : null}

            {waiting ? (
              <div className="student-waiting">
                <div className="student-spinner" />
                <h2>Demande en attente</h2>
                <p>
                  Votre acces est en attente de validation. Cette page se met a jour
                  automatiquement.
                </p>
                <div className="student-meta">
                  <span>Numero: {session?.student_number}</span>
                  <span>Groupe: {session?.group_name}</span>
                </div>
              </div>
            ) : (
              <>
                <form onSubmit={handleSubmit} className="student-form">
                  <div className="student-grid">
                    <label>
                      <span>Prenom</span>
                      <input
                        value={form.firstname}
                        onChange={(event) => handleChange("firstname", event.target.value)}
                        placeholder="Jean"
                      />
                    </label>

                    <label>
                      <span>Nom</span>
                      <input
                        value={form.lastname}
                        onChange={(event) => handleChange("lastname", event.target.value)}
                        placeholder="Dupont"
                      />
                    </label>

                    <label>
                      <span>Groupe</span>
                      <select
                        value={form.group_name}
                        onChange={(event) => handleChange("group_name", event.target.value)}
                      >
                        <option value="">Selectionner un groupe</option>
                        {groups.map((group) => (
                          <option key={group.id} value={group.name}>
                            {group.name}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label>
                      <span>Numero etudiant</span>
                      <input
                        value={form.student_number}
                        onChange={(event) => handleChange("student_number", event.target.value)}
                        placeholder="20230001"
                      />
                    </label>
                  </div>

                  <button type="submit" className="student-primary" disabled={submitting}>
                    {submitting ? "Envoi..." : "Demander l'acces a l'examen"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

const styles = `
@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500&display=swap');
* { box-sizing: border-box; }
body { margin: 0; font-family: 'Manrope', sans-serif; }
.student-shell { min-height: 100vh; padding: 32px 18px; background: linear-gradient(145deg, #fef6e4 0%, #eef7ff 45%, #f4fffb 100%); display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden; }
.student-backdrop { position: absolute; inset: 0; background-image: linear-gradient(rgba(15,23,42,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,.04) 1px, transparent 1px); background-size: 36px 36px; mask-image: linear-gradient(to bottom, transparent, black 10%, black 90%, transparent); }
.student-orb { position: absolute; border-radius: 999px; filter: blur(10px); opacity: .8; animation: student-float 18s ease-in-out infinite; }
.student-orb-a { width: 340px; height: 340px; background: radial-gradient(circle, rgba(251,191,36,.28), rgba(251,191,36,0)); top: -30px; left: -60px; }
.student-orb-b { width: 320px; height: 320px; background: radial-gradient(circle, rgba(56,189,248,.24), rgba(56,189,248,0)); right: -80px; top: 18%; animation-delay: -6s; }
.student-orb-c { width: 280px; height: 280px; background: radial-gradient(circle, rgba(45,212,191,.22), rgba(45,212,191,0)); bottom: -40px; left: 30%; animation-delay: -12s; }
.student-card { width: min(1160px, 100%); min-height: min(760px, calc(100vh - 64px)); border-radius: 34px; overflow: hidden; display: grid; grid-template-columns: 1.06fr .94fr; position: relative; z-index: 1; border: 1px solid rgba(255,255,255,.75); box-shadow: 0 34px 80px rgba(148,163,184,.22); background: rgba(255,255,255,.58); backdrop-filter: blur(18px); }
.student-centered { min-height: 280px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; color: #0f172a; background: rgba(255,255,255,.74); }
.student-hero { background:
  radial-gradient(circle at top right, rgba(255,255,255,.95), rgba(255,255,255,.2) 32%, transparent 36%),
  linear-gradient(160deg, #ffb86c 0%, #ff9f9f 36%, #8bd3ff 100%);
  color: #102a43; padding: 54px 46px; display: flex; flex-direction: column; justify-content: center; gap: 20px; position: relative; }
.student-hero::after { content: ""; position: absolute; inset: 24px; border-radius: 28px; border: 1px solid rgba(255,255,255,.36); pointer-events: none; }
.student-hero h1 { margin: 0; font-size: clamp(30px, 4vw, 44px); line-height: 1.02; max-width: 10ch; }
.student-hero p { margin: 0; color: rgba(16,42,67,.86); line-height: 1.8; max-width: 42ch; }
.student-badge { width: fit-content; padding: 8px 12px; border-radius: 999px; background: rgba(255,255,255,.62); border: 1px solid rgba(255,255,255,.6); color: #0f766e; font-size: 12px; text-transform: uppercase; letter-spacing: .14em; font-weight: 800; box-shadow: 0 10px 24px rgba(255,255,255,.24); }
.student-panel { background: rgba(255,255,255,.8); padding: 42px 40px; display: flex; flex-direction: column; justify-content: center; gap: 24px; }
.student-form { display: grid; gap: 20px; }
.student-alert { padding: 15px 16px; border-radius: 18px; font-size: 14px; line-height: 1.6; border: 1px solid transparent; box-shadow: 0 16px 32px rgba(148,163,184,.12); }
.student-alert-info { background: rgba(224,242,254,.8); color: #075985; border-color: rgba(56,189,248,.22); }
.student-alert-success { background: rgba(220,252,231,.86); color: #166534; border-color: rgba(74,222,128,.26); }
.student-alert-error { background: rgba(255,228,230,.9); color: #be123c; border-color: rgba(251,113,133,.25); }
.student-grid { display: grid; gap: 18px; grid-template-columns: repeat(2, minmax(0, 1fr)); }
.student-grid label { display: grid; gap: 8px; }
.student-grid span { font-size: 13px; font-weight: 700; color: #355070; }
.student-grid input, .student-grid select { width: 100%; border: 1px solid rgba(125,211,252,.6); border-radius: 18px; padding: 17px 18px; background: rgba(255,255,255,.94); color: #0f172a; font: inherit; outline: none; transition: border-color .18s ease, box-shadow .18s ease, transform .18s ease; box-shadow: inset 0 1px 0 rgba(255,255,255,.7); }
.student-grid input:focus, .student-grid select:focus { border-color: #38bdf8; box-shadow: 0 0 0 5px rgba(56,189,248,.14), 0 18px 34px rgba(14,165,233,.1); transform: translateY(-2px); }
.student-primary { border: none; border-radius: 20px; padding: 18px 22px; background: linear-gradient(135deg, #ff8f70 0%, #ffb547 45%, #20c997 100%); color: white; font: inherit; font-weight: 800; cursor: pointer; transition: transform .18s ease, box-shadow .18s ease, opacity .18s ease; box-shadow: 0 22px 40px rgba(255,159,103,.24); }
.student-primary:hover:not(:disabled) { transform: translateY(-2px) scale(1.01); }
.student-primary:disabled { opacity: .7; cursor: not-allowed; }
.student-waiting { display: grid; gap: 16px; padding: 12px 0; }
.student-waiting h2, .student-waiting p { margin: 0; }
.student-waiting p { color: #526581; line-height: 1.8; }
.student-meta { display: flex; gap: 12px; flex-wrap: wrap; font-size: 12px; font-family: 'JetBrains Mono', monospace; color: #0f766e; }
.student-meta span { padding: 10px 12px; border-radius: 999px; background: rgba(45,212,191,.12); border: 1px solid rgba(45,212,191,.2); }
.student-spinner { width: 42px; height: 42px; border-radius: 999px; border: 4px solid rgba(56,189,248,.18); border-top-color: #f97316; animation: student-spin .8s linear infinite; }
@keyframes student-float { 0%, 100% { transform: translate3d(0,0,0) scale(1); } 50% { transform: translate3d(0,-18px,0) scale(1.05); } }
@keyframes student-spin { to { transform: rotate(360deg); } }
@media (max-width: 820px) { .student-card { grid-template-columns: 1fr; } .student-grid { grid-template-columns: 1fr; } .student-hero, .student-panel { padding: 26px 22px; } .student-hero h1 { max-width: none; } }
`;
