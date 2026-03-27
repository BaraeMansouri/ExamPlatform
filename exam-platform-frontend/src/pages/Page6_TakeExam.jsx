import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000/api",
  headers: { Accept: "application/json" },
});

const EXAM_RELOAD_FLAG_PREFIX = "exam_reload_expired_";

export default function Page6_TakeExam() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [exam, setExam] = useState(null);
  const [session, setSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [submittedAnswers, setSubmittedAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [notice, setNotice] = useState("");
  const [timeLeft, setTimeLeft] = useState(0);
  const [examStarted, setExamStarted] = useState(false);
  const [expiredByRefresh, setExpiredByRefresh] = useState(false);

  const tabRef = useRef({});
  const antiCheatRef = useRef({});
  const submittingRef = useRef(false);
  const completedRef = useRef(false);
  const alertLockRef = useRef(false);

  const sessionId = useMemo(
    () =>
      searchParams.get("session_id") ||
      searchParams.get("session") ||
      localStorage.getItem("session_id"),
    [searchParams]
  );
  const reloadFlagKey = sessionId ? `${EXAM_RELOAD_FLAG_PREFIX}${sessionId}` : null;

  const logActivity = useCallback(async (eventType, severity, description) => {
    if (!sessionId) return;

    const key = `${eventType}:${description}`;
    const last = antiCheatRef.current[key];
    const now = Date.now();

    if (last && now - last < 6000) return;
    antiCheatRef.current[key] = now;

    try {
      await api.post("/exam/log-activity", {
        session_id: sessionId,
        event_type: eventType,
        severity,
        description,
      });
    } catch (error) {
      console.error("logActivity failed", error);
    }
  }, [sessionId]);

  const requestExamFullscreen = useCallback(async () => {
    if (completedRef.current || submittingRef.current) return;

    try {
      if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch (error) {
      console.warn("Fullscreen request blocked", error);
    }
  }, []);

  const startExamSession = useCallback(async () => {
    await requestExamFullscreen();
    setExamStarted(true);
    setNotice("");
  }, [requestExamFullscreen]);

  useEffect(() => {
    submittingRef.current = submitting;
  }, [submitting]);

  useEffect(() => {
    completedRef.current = completed;
  }, [completed]);

  useEffect(() => {
    if (!reloadFlagKey) return;

    if (sessionStorage.getItem(reloadFlagKey) === "1") {
      sessionStorage.removeItem(reloadFlagKey);
      localStorage.removeItem("session_id");
      setExpiredByRefresh(true);
      setNotice("Lien expire apres actualisation de la page.");
      setLoading(false);
    }
  }, [reloadFlagKey]);

  useEffect(() => {
    const loadExam = async () => {
      if (expiredByRefresh) {
        setLoading(false);
        return;
      }

      if (!sessionId) {
        setNotice("Session introuvable. Recommencez depuis le formulaire d'acces.");
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const [sessionRes, examRes] = await Promise.all([
          api.get(`/exam/session/${sessionId}`),
          api.get(`/exam/${token}/take`, { params: { session_id: sessionId } }),
        ]);

        const currentSession = sessionRes.data?.data || sessionRes.data;
        if (!["accepted", "in_progress", "submitted"].includes(currentSession.status)) {
          setNotice("Votre acces n'est pas encore valide pour cet examen.");
          setLoading(false);
          return;
        }

        const payload = examRes.data || {};
        const examData = payload.exam || null;
        const questionsData = Array.isArray(payload.questions) ? payload.questions : [];

        setSession(currentSession);
        setSubmittedAnswers(currentSession?.answers || []);
        setExam(examData);
        setQuestions(questionsData);
        setAnswers(buildInitialAnswers(questionsData));
        setTimeLeft((examData?.duration || 60) * 60);
        setCompleted(currentSession.status === "submitted");
      } catch (error) {
        setNotice(error.response?.data?.message || "Impossible de charger l'examen.");
      } finally {
        setLoading(false);
      }
    };

    loadExam();
  }, [expiredByRefresh, sessionId, token]);

  useEffect(() => {
    if (!exam || submitting || completed || !examStarted) return undefined;

    const timer = window.setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          handleSubmit(true);
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [exam, submitting, completed, examStarted]);

  useEffect(() => {
    if (!exam || completed || !examStarted) return undefined;

    requestExamFullscreen();

    const onFullscreenChange = () => {
      const isFullscreen = Boolean(document.fullscreenElement);

      if (!isFullscreen && !completedRef.current && !submittingRef.current) {
        setNotice("Le plein écran est obligatoire pendant l'examen.");
        logActivity(
          "fullscreen_exit",
          "danger",
          "L'etudiant a quitte le mode plein écran pendant l'examen."
        );

        if (!alertLockRef.current) {
          alertLockRef.current = true;
          window.alert("Impossible de sortir du mode plein écran pendant l'examen.");
          window.setTimeout(() => {
            alertLockRef.current = false;
          }, 300);
        }

        window.setTimeout(() => {
          requestExamFullscreen();
        }, 120);
      }
    };

    document.addEventListener("fullscreenchange", onFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
    };
  }, [exam, completed, examStarted, logActivity, requestExamFullscreen]);

  useEffect(() => {
    if (!exam || completed || examStarted) return undefined;

    let cancelled = false;

    const tryAutoStart = async () => {
      await requestExamFullscreen();
      if (!cancelled && document.fullscreenElement) {
        setExamStarted(true);
      }
    };

    tryAutoStart();

    return () => {
      cancelled = true;
    };
  }, [exam, completed, examStarted, requestExamFullscreen]);

  useEffect(() => {
    if (!sessionId || completed) return undefined;

    const handleBeforeUnload = (event) => {
      if (reloadFlagKey) {
        sessionStorage.setItem(reloadFlagKey, "1");
      }

      event.preventDefault();
      event.returnValue = "";
      return "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [completed, reloadFlagKey, sessionId]);

  useEffect(() => {
    if (!examStarted) return undefined;

    const onVisibility = () => {
      if (document.hidden) {
        setNotice("Retournez sur l'examen. Le changement d'onglet est enregistre.");
        logActivity("tab_hidden", "warning", "L'etudiant a quitte l'onglet de l'examen.");
      }
    };

    const onBlur = () => {
      logActivity("window_blur", "warning", "La fenetre de l'examen a perdu le focus.");
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
    };
  }, [examStarted, logActivity]);

  const updateAnswer = (questionId, nextValue) => {
    setAnswers((current) => ({
      ...current,
      [questionId]: { ...current[questionId], ...nextValue },
    }));
  };

  const handleSubmit = useCallback(async (forced = false) => {
    if (!sessionId || submitting || completed) return;
    if (!examStarted) {
      setNotice("Vous devez d'abord demarrer l'examen en plein ecran.");
      return;
    }
    if (!forced && !window.confirm("Soumettre l'examen maintenant ?")) return;

    setSubmitting(true);

    try {
      await api.post("/exam/submit", {
        session_id: sessionId,
        answers: questions.map((question) => ({
          question_id: question.id,
          text_answer: answers[question.id]?.text_answer || null,
          selected_options: answers[question.id]?.selected_options || [],
          boolean_answer: answers[question.id]?.boolean_answer ?? null,
          code_html: answers[question.id]?.code_html || null,
          code_css: answers[question.id]?.code_css || null,
          code_js: answers[question.id]?.code_js || null,
        })),
      });

      const sessionRes = await api.get(`/exam/session/${sessionId}`);
      const updatedSession = sessionRes.data?.data || sessionRes.data;

      setCompleted(true);
      setSession(updatedSession);
      setSubmittedAnswers(updatedSession?.answers || []);
      localStorage.removeItem("session_id");

      if (document.fullscreenElement && document.exitFullscreen) {
        await document.exitFullscreen();
      }
    } catch (error) {
      setNotice(error.response?.data?.message || "La soumission a echoue.");
    } finally {
      setSubmitting(false);
    }
  }, [answers, completed, examStarted, questions, sessionId, submitting]);

  if (loading) {
    return (
      <>
        <style>{styles}</style>
        <div className="take-shell">
          <div className="take-state">
            <div className="take-spinner" />
            <p>Chargement de l'examen...</p>
          </div>
        </div>
      </>
    );
  }

  if (completed) {
    return (
      <>
        <style>{styles}</style>
        <div className="take-shell">
          <div className="take-success">
            <div className="take-success-badge">Soumis</div>
            <h1>Votre copie a bien ete envoyee.</h1>
            <p>Merci. Vous pouvez revoir vos reponses ci-dessous, y compris votre code quand il est disponible.</p>
            <button className="take-main-btn" onClick={() => navigate(`/exam/${token}?submitted=1`, { replace: true })}>
              Retour
            </button>
          </div>

          {submittedAnswers.length ? (
            <div className="take-review">
              <h2>Voir mes reponses</h2>
              {submittedAnswers.map((answer, index) => (
                <article key={answer.id} className="take-review-card">
                  <div className="take-card-head">
                    <span className="take-pill">Question {index + 1}</span>
                    <span className="take-type">{formatType(answer.question?.type)}</span>
                    <span className={`take-result-pill ${answer.is_correct ? "take-result-ok" : "take-result-ko"}`}>
                      {answer.is_correct ? "Correcte" : "Incorrecte"}
                    </span>
                  </div>

                  <h3>{answer.question?.content || "Question"}</h3>

                  <pre className="take-review-answer">{getAnswerDisplay(answer)}</pre>

                  {answer.professor_comment ? (
                    <div className="take-review-comment">
                      Commentaire: {answer.professor_comment}
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          ) : null}
        </div>
      </>
    );
  }

  if (expiredByRefresh) {
    return (
      <>
        <style>{styles}</style>
        <div className="take-shell">
          <div className="take-state">
            <p>{notice || "Lien expire."}</p>
            <button className="take-main-btn" onClick={() => navigate(`/exam/${token}`, { replace: true })}>
              Retour
            </button>
          </div>
        </div>
      </>
    );
  }

  if (!exam || !questions.length) {
    return (
      <>
        <style>{styles}</style>
        <div className="take-shell">
          <div className="take-state">
            <p>{notice || "Aucune question n'est disponible pour cet examen."}</p>
            <button className="take-main-btn" onClick={() => navigate(`/exam/${token}`, { replace: true })}>
              Retour
            </button>
          </div>
        </div>
      </>
    );
  }

  const minutes = Math.floor(timeLeft / 60);
  const seconds = `${timeLeft % 60}`.padStart(2, "0");

  return (
    <>
      <style>{styles}</style>
      <div className="take-shell">
        <div className="take-grid" />
        <div className="take-aura take-aura-a" />
        <div className="take-aura take-aura-b" />
        <div className="take-aura take-aura-c" />
        <header className="take-header">
          <div>
            <div className="take-header-label">Session {session?.student_number}</div>
            <h1>{exam.title}</h1>
          </div>
          <div className="take-header-tools">
            <div className="take-timer">{minutes}:{seconds}</div>
            <button
              className="take-main-btn"
              onClick={() => handleSubmit(false)}
              disabled={submitting || !examStarted}
            >
              {submitting ? "Soumission..." : "Soumettre"}
            </button>
          </div>
        </header>

        <main className="take-main">
          {notice ? <div className="take-notice">{notice}</div> : null}

          {!examStarted ? (
            <section className="take-start-card">
              <div className="take-start-badge">Plein ecran obligatoire</div>
              <h2>Commencer l'examen</h2>
              <p>
                Le navigateur peut bloquer le plein ecran automatique. Cliquez sur le
                bouton ci-dessous pour lancer l'examen directement en plein ecran.
              </p>
              <button className="take-main-btn" onClick={startExamSession}>
                Demarrer l'examen
              </button>
            </section>
          ) : (
            <>
              <div className="take-summary">
            <div><strong>Duree</strong><span>{exam.duration} minutes</span></div>
            <div><strong>Questions</strong><span>{questions.length}</span></div>
            <div><strong>Points</strong><span>{exam.total_points}</span></div>
          </div>

              {questions.map((question, index) => (
            <article key={question.id} className="take-card">
              <div className="take-card-head">
                <span className="take-pill">Question {index + 1}</span>
                <span className="take-type">{formatType(question.type)}</span>
                <span className="take-points">{question.points} pts</span>
              </div>

              <h2>{question.content}</h2>

              {question.type === "text" ? (
                <textarea
                  className="take-textarea"
                  value={answers[question.id]?.text_answer || ""}
                  onChange={(event) => updateAnswer(question.id, { text_answer: event.target.value })}
                  placeholder="Votre reponse..."
                />
              ) : null}

              {(question.type === "radio" || question.type === "true_false") ? (
                <div className="take-options">
                  {(question.choices?.length ? question.choices : ["Vrai", "Faux"]).map((choice) => (
                    <label key={choice} className="take-option">
                      <input
                        type="radio"
                        name={`question-${question.id}`}
                        checked={answers[question.id]?.selected_options?.[0] === choice}
                        onChange={() => updateAnswer(question.id, {
                          selected_options: [choice],
                          boolean_answer: question.type === "true_false" ? choice === "Vrai" : null,
                        })}
                      />
                      <span>{choice}</span>
                    </label>
                  ))}
                </div>
              ) : null}

              {question.type === "checkbox" ? (
                <div className="take-options">
                  {question.choices?.map((choice) => {
                    const selected = answers[question.id]?.selected_options || [];
                    return (
                      <label key={choice} className="take-option">
                        <input
                          type="checkbox"
                          checked={selected.includes(choice)}
                          onChange={(event) => updateAnswer(question.id, {
                            selected_options: event.target.checked
                              ? [...selected, choice]
                              : selected.filter((item) => item !== choice),
                          })}
                        />
                        <span>{choice}</span>
                      </label>
                    );
                  })}
                </div>
              ) : null}

              {question.type === "code_html" ? (
                <CodeEditorCard
                  question={question}
                  answer={answers[question.id]}
                  onChange={(next) => updateAnswer(question.id, next)}
                  tabRef={tabRef}
                />
              ) : null}
            </article>
              ))}
            </>
          )}
        </main>
      </div>
    </>
  );
}

function CodeEditorCard({ question, answer, onChange, tabRef, disabled = false }) {
  const [activeTab, setActiveTab] = useState(tabRef.current[question.id] || "html");
  const [previewDoc, setPreviewDoc] = useState(() => buildPreviewDocument(answer));

  useEffect(() => {
    tabRef.current[question.id] = activeTab;
  }, [activeTab, question.id, tabRef]);

  useEffect(() => {
    if (!previewDoc) {
      setPreviewDoc(buildPreviewDocument(answer));
    }
  }, [answer, previewDoc]);

  const handleRun = () => {
    setPreviewDoc(buildPreviewDocument(answer));
  };

  return (
    <div className="take-code-runner">
      <div className="take-code-pane">
        <div className="take-code-toolbar">
          <div className="take-code-tabs">
            {["html", "css", "js"].map((tab) => (
              <button
                key={tab}
                type="button"
                className={activeTab === tab ? "take-code-tab take-code-tab-active" : "take-code-tab"}
                onClick={() => setActiveTab(tab)}
                disabled={disabled}
              >
                {tab.toUpperCase()}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="take-run-btn"
            onClick={handleRun}
            disabled={disabled}
          >
            Run
          </button>
        </div>

        <div className="take-code-wrap">
          <textarea
            className="take-code"
            value={answer?.[`code_${activeTab}`] || ""}
            onChange={(event) => onChange({ [`code_${activeTab}`]: event.target.value })}
            placeholder={`Code ${activeTab.toUpperCase()}...`}
            disabled={disabled}
          />
        </div>
      </div>

      <div className="take-preview-pane">
        <div className="take-preview-label">Preview</div>
        <iframe
          title={`preview-${question.id}`}
          className="take-preview-frame"
          sandbox="allow-scripts"
          srcDoc={previewDoc}
        />
      </div>
    </div>
  );
}

function buildInitialAnswers(questions) {
  return Object.fromEntries(
    questions.map((question) => {
      let codeTemplate = { html: "", css: "", js: "" };

      if (question.code_template) {
        try {
          codeTemplate = JSON.parse(question.code_template);
        } catch (error) {
          console.error("Invalid code template", error);
        }
      }

      return [question.id, {
        text_answer: "",
        selected_options: [],
        boolean_answer: null,
        code_html: codeTemplate.html || "",
        code_css: codeTemplate.css || "",
        code_js: codeTemplate.js || "",
      }];
    })
  );
}

function formatType(type) {
  return {
    text: "Texte",
    radio: "Choix unique",
    checkbox: "Choix multiple",
    true_false: "Vrai/Faux",
    code_html: "Code",
  }[type] || type;
}

function getAnswerDisplay(answer) {
  if (answer?.text_answer) return answer.text_answer;
  if (Array.isArray(answer?.selected_options) && answer.selected_options.length) {
    return answer.selected_options.join(", ");
  }
  if (answer?.boolean_answer !== null && answer?.boolean_answer !== undefined) {
    return answer.boolean_answer ? "Vrai" : "Faux";
  }

  const parts = [];
  if (answer?.code_html) parts.push(`HTML:\n${answer.code_html}`);
  if (answer?.code_css) parts.push(`CSS:\n${answer.code_css}`);
  if (answer?.code_js) parts.push(`JS:\n${answer.code_js}`);

  return parts.length ? parts.join("\n\n") : "Aucune reponse";
}

function buildPreviewDocument(answer) {
  const html = answer?.code_html || "";
  const css = answer?.code_css || "";
  const js = answer?.code_js || "";

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>
      body { margin: 0; padding: 16px; font-family: Arial, sans-serif; }
      ${css}
    </style>
  </head>
  <body>
    ${html}
    <script>
      try {
        ${js}
      } catch (error) {
        document.body.innerHTML += '<pre style="color:red;white-space:pre-wrap;">' + error.message + '</pre>';
      }
    </script>
  </body>
</html>`;
}

const styles = `
@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500&display=swap');
* { box-sizing: border-box; }
body { margin: 0; font-family: 'Manrope', sans-serif; }
.take-shell { min-height: 100vh; background: linear-gradient(180deg, #fff7ed 0%, #f0f9ff 44%, #ecfeff 100%); color: #16324f; position: relative; overflow: hidden; }
.take-grid { position: absolute; inset: 0; background-image: linear-gradient(rgba(37,99,235,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,.05) 1px, transparent 1px); background-size: 32px 32px; opacity: .55; }
.take-aura { position: absolute; border-radius: 999px; filter: blur(16px); opacity: .75; animation: take-drift 18s ease-in-out infinite; }
.take-aura-a { width: 340px; height: 340px; background: radial-gradient(circle, rgba(251,146,60,.25), rgba(251,146,60,0)); top: -70px; left: -80px; }
.take-aura-b { width: 360px; height: 360px; background: radial-gradient(circle, rgba(56,189,248,.22), rgba(56,189,248,0)); top: 18%; right: -120px; animation-delay: -5s; }
.take-aura-c { width: 300px; height: 300px; background: radial-gradient(circle, rgba(45,212,191,.22), rgba(45,212,191,0)); bottom: -90px; left: 30%; animation-delay: -10s; }
.take-header, .take-main, .take-state, .take-success { position: relative; z-index: 1; }
.take-header { display: flex; justify-content: space-between; gap: 18px; align-items: center; padding: 28px 20px 18px; max-width: 1320px; margin: 0 auto; }
.take-header-label { font-size: 12px; text-transform: uppercase; letter-spacing: .16em; color: #0f766e; font-weight: 800; }
.take-header h1 { margin: 8px 0 0; font-size: clamp(26px, 4vw, 40px); color: #102a43; }
.take-header-tools { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
.take-timer { padding: 13px 16px; border-radius: 18px; background: rgba(255,255,255,.78); border: 1px solid rgba(125,211,252,.42); font-family: 'JetBrains Mono', monospace; font-size: 18px; color: #0f172a; box-shadow: 0 18px 34px rgba(148,163,184,.14); }
.take-main { max-width: 1320px; margin: 0 auto; padding: 0 20px 36px; }
.take-summary { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; margin-bottom: 20px; }
.take-summary div, .take-card, .take-state, .take-success { background: rgba(255,255,255,.76); border: 1px solid rgba(255,255,255,.9); border-radius: 28px; backdrop-filter: blur(18px); box-shadow: 0 24px 50px rgba(148,163,184,.16); }
.take-summary div { padding: 18px; display: grid; gap: 8px; }
.take-summary strong { color: #0ea5e9; font-size: 12px; text-transform: uppercase; letter-spacing: .12em; }
.take-card { padding: 24px; margin-bottom: 18px; }
.take-start-card { margin-bottom: 20px; padding: 26px; background: linear-gradient(140deg, rgba(255,255,255,.82), rgba(255,247,237,.88)); border: 1px solid rgba(255,255,255,.92); border-radius: 28px; backdrop-filter: blur(18px); box-shadow: 0 24px 52px rgba(251,146,60,.16); }
.take-start-badge { display: inline-block; margin-bottom: 12px; padding: 8px 12px; border-radius: 999px; background: rgba(14,165,233,.12); color: #0369a1; font-size: 12px; font-weight: 800; text-transform: uppercase; }
.take-start-card h2 { margin: 0 0 10px; color: #102a43; }
.take-start-card p { margin: 0 0 18px; line-height: 1.8; color: #486581; }
.take-card-head { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; margin-bottom: 12px; }
.take-pill, .take-type, .take-points { padding: 7px 10px; border-radius: 999px; font-size: 12px; font-weight: 800; }
.take-pill { background: rgba(56,189,248,.14); color: #0369a1; }
.take-type { background: rgba(251,191,36,.18); color: #b45309; }
.take-points { background: rgba(16,185,129,.12); color: #0f766e; margin-left: auto; }
.take-card h2 { margin: 0 0 16px; font-size: 20px; color: #102a43; }
.take-textarea, .take-code { width: 100%; min-height: 140px; border-radius: 20px; border: 1px solid rgba(125,211,252,.4); padding: 16px; background: rgba(255,255,255,.92); color: #0f172a; font: inherit; outline: none; box-shadow: inset 0 1px 0 rgba(255,255,255,.8); }
.take-code { font-family: 'JetBrains Mono', monospace; min-height: 420px; }
.take-options { display: grid; gap: 10px; }
.take-option { display: flex; align-items: center; gap: 12px; padding: 14px 16px; border-radius: 20px; background: rgba(255,255,255,.82); border: 1px solid rgba(125,211,252,.35); }
.take-option input { accent-color: #0ea5e9; }
.take-code-runner { display: grid; gap: 18px; grid-template-columns: minmax(0, 1.2fr) minmax(420px, 1fr); align-items: stretch; }
.take-code-pane, .take-preview-pane { min-width: 0; }
.take-code-toolbar { display: flex; justify-content: space-between; gap: 12px; align-items: center; margin-bottom: 10px; }
.take-code-wrap { border-radius: 24px; overflow: hidden; border: 1px solid rgba(125,211,252,.35); background: rgba(255,255,255,.88); }
.take-code-tabs { display: flex; background: rgba(255,255,255,.78); border: 1px solid rgba(125,211,252,.3); border-radius: 16px; padding: 4px; box-shadow: 0 12px 24px rgba(148,163,184,.12); }
.take-code-tab { border: none; background: transparent; color: #64748b; padding: 10px 14px; cursor: pointer; font-family: 'JetBrains Mono', monospace; font-size: 12px; font-weight: 700; border-radius: 12px; }
.take-code-tab:disabled { opacity: .45; cursor: not-allowed; }
.take-code-tab-active { color: #0f172a; background: linear-gradient(135deg, #fde68a 0%, #7dd3fc 100%); }
.take-run-btn { border: none; border-radius: 14px; padding: 11px 18px; background: linear-gradient(135deg, #34d399 0%, #10b981 100%); color: white; cursor: pointer; font: inherit; font-weight: 800; box-shadow: 0 16px 28px rgba(16,185,129,.2); }
.take-run-btn:disabled { opacity: .6; cursor: not-allowed; }
.take-preview-pane { display: grid; gap: 10px; }
.take-preview-label { font-size: 12px; text-transform: uppercase; letter-spacing: .14em; color: #0f766e; font-weight: 800; }
.take-preview-frame { width: 100%; min-height: 520px; border: 1px solid rgba(125,211,252,.35); border-radius: 24px; background: white; box-shadow: inset 0 1px 0 rgba(255,255,255,.7); }
.take-main-btn { border: none; border-radius: 18px; padding: 13px 18px; background: linear-gradient(135deg, #ff8f70 0%, #ffb547 42%, #22c55e 100%); color: white; cursor: pointer; font: inherit; font-weight: 800; box-shadow: 0 20px 36px rgba(251,146,60,.22); }
.take-main-btn:disabled { opacity: .72; cursor: not-allowed; }
.take-notice { margin-bottom: 16px; padding: 14px 16px; border-radius: 18px; background: rgba(254,243,199,.84); color: #92400e; border: 1px solid rgba(251,191,36,.22); }
.take-state, .take-success { width: min(760px, calc(100% - 32px)); margin: 60px auto 0; padding: 30px; text-align: center; }
.take-review { width: min(1120px, calc(100% - 32px)); margin: 24px auto 40px; position: relative; z-index: 1; display: grid; gap: 18px; }
.take-review h2 { margin: 0; font-size: 28px; color: #102a43; }
.take-review-card { background: rgba(255,255,255,.78); border: 1px solid rgba(255,255,255,.9); border-radius: 28px; padding: 22px; backdrop-filter: blur(16px); box-shadow: 0 22px 46px rgba(148,163,184,.16); }
.take-review-card h3 { margin: 0 0 16px; color: #102a43; }
.take-review-answer { margin: 0; white-space: pre-wrap; border-radius: 18px; border: 1px solid rgba(125,211,252,.26); background: rgba(255,255,255,.9); padding: 16px; color: #0f172a; font-family: 'JetBrains Mono', monospace; }
.take-review-comment { margin-top: 14px; padding: 12px 14px; border-radius: 16px; background: rgba(56,189,248,.1); color: #164e63; }
.take-result-pill { padding: 7px 10px; border-radius: 999px; font-size: 12px; font-weight: 800; margin-left: auto; }
.take-result-ok { background: rgba(16,185,129,.12); color: #6ee7b7; }
.take-result-ko { background: rgba(244,63,94,.14); color: #e11d48; }
.take-success-badge { display: inline-block; margin-bottom: 12px; padding: 8px 12px; border-radius: 999px; background: rgba(16,185,129,.12); color: #0f766e; font-size: 12px; font-weight: 800; text-transform: uppercase; }
.take-spinner { width: 42px; height: 42px; margin: 0 auto 12px; border-radius: 999px; border: 4px solid rgba(56,189,248,.16); border-top-color: #fb923c; animation: take-spin .8s linear infinite; }
@keyframes take-drift { 0%, 100% { transform: translate3d(0,0,0) scale(1); } 50% { transform: translate3d(0,-20px,0) scale(1.06); } }
@keyframes take-spin { to { transform: rotate(360deg); } }
@media (max-width: 860px) { .take-summary { grid-template-columns: 1fr; } .take-header { flex-direction: column; align-items: flex-start; } .take-code-runner { grid-template-columns: 1fr; } .take-code { min-height: 280px; } .take-preview-frame { min-height: 320px; } }
`;
