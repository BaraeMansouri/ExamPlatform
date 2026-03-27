import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getResultDetail, getResults, gradeAnswer } from '../api/results';
import ProfessorShell from '../components/ProfessorShell';
import { downloadProtectedFile } from '../utils/downloadProtectedFile';

const Page4_Results = () => {
    const [sessions, setSessions] = useState([]);
    const [selectedSession, setSelectedSession] = useState(null);
    const [drafts, setDrafts] = useState({});
    const [loadingList, setLoadingList] = useState(true);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [savingId, setSavingId] = useState(null);
    const [downloadingPdf, setDownloadingPdf] = useState(false);
    const [pageError, setPageError] = useState('');
    const { examId } = useParams();

    useEffect(() => {
        loadSessions();
    }, [examId]);

    const loadSessions = async (preferredSessionId = null) => {
        try {
            setLoadingList(true);
            setPageError('');
            const res = await getResults(examId);
            const data = Array.isArray(res.data) ? res.data : [];
            setSessions(data);

            const sessionIdToLoad = preferredSessionId || selectedSession?.id || data[0]?.id;
            if (sessionIdToLoad) await handleSelect(sessionIdToLoad);
            else setSelectedSession(null);
        } catch (error) {
            console.error(error);
            setPageError("Impossible de charger les résultats.");
        } finally {
            setLoadingList(false);
        }
    };

    const handleSelect = async (sessionId) => {
        try {
            setLoadingDetail(true);
            const res = await getResultDetail(sessionId);
            const session = res.data || null;
            setSelectedSession(session);

            const initialDrafts = {};
            (session?.answers || []).forEach((answer) => {
                initialDrafts[answer.id] = {
                    score: answer.score ?? 0,
                    professor_comment: answer.professor_comment || '',
                };
            });
            setDrafts(initialDrafts);
        } catch (error) {
            console.error(error);
            setPageError("Impossible de charger la copie sélectionnée.");
        } finally {
            setLoadingDetail(false);
        }
    };

    const handleDraftChange = (answerId, field, value) => {
        setDrafts((current) => ({
            ...current,
            [answerId]: { ...current[answerId], [field]: value },
        }));
    };

    const handleSaveAnswer = async (answer) => {
        const draft = drafts[answer.id];
        const parsedScore = Number.parseInt(draft?.score, 10);
        const maxPoints = answer.question?.points ?? 0;

        if (Number.isNaN(parsedScore) || parsedScore < 0 || parsedScore > maxPoints) {
            setPageError(`Le score doit être entre 0 et ${maxPoints}.`);
            return;
        }

        try {
            setSavingId(answer.id);
            setPageError('');
            await gradeAnswer(answer.id, {
                score: parsedScore,
                is_correct: parsedScore > 0,
                professor_comment: draft?.professor_comment || '',
            });
            await handleSelect(selectedSession.id);
            await loadSessions(selectedSession.id);
        } catch (error) {
            console.error(error);
            setPageError("Impossible d'enregistrer cette correction.");
        } finally {
            setSavingId(null);
        }
    };

    const handleDownloadPdf = async () => {
        if (!selectedSession) return;

        try {
            setDownloadingPdf(true);
            await downloadProtectedFile(`/pdf/session/${selectedSession.id}`, `copie_${selectedSession.student_number || selectedSession.id}.pdf`);
        } catch (error) {
            console.error(error);
            setPageError("Impossible de télécharger le PDF.");
        } finally {
            setDownloadingPdf(false);
        }
    };

    const pendingSessions = useMemo(() => sessions.filter((session) => !session.is_graded), [sessions]);
    const gradedSessions = useMemo(() => sessions.filter((session) => session.is_graded), [sessions]);

    return (
        <ProfessorShell title="Résultats & Corrections" subtitle="Séparez les copies corrigées et non corrigées, puis exportez les PDF.">
            <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
                <aside className="glass-card rounded-[2rem] border border-white/10 bg-white/5 p-5 text-white">
                    <SectionTitle title="À corriger" />
                    <SessionList sessions={pendingSessions} selectedSessionId={selectedSession?.id} onSelect={handleSelect} emptyLabel="Aucune copie en attente." />
                    <div className="my-5 h-px bg-white/10" />
                    <SectionTitle title="Déjà corrigées" />
                    <SessionList sessions={gradedSessions} selectedSessionId={selectedSession?.id} onSelect={handleSelect} emptyLabel="Aucune copie corrigée." />
                </aside>

                <main className="grid gap-6">
                    {pageError ? <div className="rounded-[1.5rem] border border-rose-300/20 bg-rose-400/10 px-5 py-4 text-sm font-bold text-rose-100">{pageError}</div> : null}

                    {loadingList || loadingDetail ? (
                        <div className="glass-card rounded-[2rem] border border-white/10 bg-white/5 p-10 text-center text-slate-200">Chargement des copies...</div>
                    ) : !selectedSession ? (
                        <div className="glass-card rounded-[2rem] border border-white/10 bg-white/5 p-10 text-center text-slate-300">Sélectionnez une copie pour commencer la correction.</div>
                    ) : (
                        <>
                            <div className="glass-card rounded-[2rem] border border-white/10 bg-white/5 p-6 text-white">
                                <div className="flex flex-wrap items-start justify-between gap-4">
                                    <div>
                                        <div className="text-xs font-black uppercase tracking-[0.26em] text-cyan-300">Copie étudiante</div>
                                        <h2 className="mt-2 text-3xl font-black">{selectedSession.username}</h2>
                                        <p className="mt-2 text-sm text-slate-300">
                                            {selectedSession.student_number} | {selectedSession.group_name} | {formatDate(selectedSession.submitted_at)}
                                        </p>
                                    </div>
                                    <button onClick={handleDownloadPdf} className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950">
                                        {downloadingPdf ? 'Téléchargement...' : 'Télécharger PDF'}
                                    </button>
                                </div>

                                <div className="mt-5 grid gap-4 md:grid-cols-3">
                                    <Metric label="Score" value={`${selectedSession.total_score ?? 0} / ${selectedSession.max_score ?? 0}`} />
                                    <Metric label="État" value={selectedSession.is_graded ? 'Corrigée' : 'À corriger'} />
                                    <Metric label="Suspicion" value={(selectedSession.report?.suspicion_level || 'low').toUpperCase()} />
                                </div>
                            </div>

                            <div className="grid gap-4">
                                {(selectedSession.answers || []).map((answer, index) => {
                                    const maxPoints = answer.question?.points ?? 0;
                                    const draft = drafts[answer.id] || { score: answer.score ?? 0, professor_comment: answer.professor_comment || '' };
                                    return (
                                        <article key={answer.id} className="glass-card rounded-[2rem] border border-white/10 bg-white/5 p-6 text-white">
                                            <div className="flex flex-wrap items-start justify-between gap-4">
                                                <div>
                                                    <div className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">Question {index + 1}</div>
                                                    <h3 className="mt-2 text-2xl font-black">{answer.question?.content || 'Question'}</h3>
                                                </div>
                                                <div className="rounded-full bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-[0.18em] text-slate-200">
                                                    {formatType(answer.question?.type)} | {maxPoints} pts
                                                </div>
                                            </div>

                                            <pre className="mt-5 rounded-[1.5rem] border border-white/10 bg-slate-950/30 p-4 font-mono text-sm leading-7 text-slate-200 whitespace-pre-wrap">
                                                {getAnswerDisplay(answer)}
                                            </pre>

                                            <div className="mt-5 grid gap-4 md:grid-cols-[180px_1fr]">
                                                <label className="grid gap-2">
                                                    <span className="text-sm font-bold text-slate-300">Note</span>
                                                    <input type="number" min="0" max={maxPoints} value={draft.score} onChange={(e) => handleDraftChange(answer.id, 'score', e.target.value)} className="rounded-2xl border border-white/10 bg-slate-950/30 px-4 py-3 text-white outline-none" />
                                                </label>

                                                <label className="grid gap-2">
                                                    <span className="text-sm font-bold text-slate-300">Commentaire</span>
                                                    <textarea rows="3" value={draft.professor_comment} onChange={(e) => handleDraftChange(answer.id, 'professor_comment', e.target.value)} className="rounded-2xl border border-white/10 bg-slate-950/30 px-4 py-3 text-white outline-none" />
                                                </label>
                                            </div>

                                            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                                                <div className="rounded-full bg-emerald-400/10 px-3 py-2 text-xs font-black uppercase tracking-[0.18em] text-emerald-100">
                                                    {Number(draft.score) > 0 ? 'Réponse valorisée' : 'Réponse à revoir'}
                                                </div>
                                                <button onClick={() => handleSaveAnswer(answer)} disabled={savingId === answer.id} className="rounded-2xl bg-gradient-to-r from-emerald-400 to-cyan-400 px-5 py-3 text-sm font-black text-slate-950">
                                                    {savingId === answer.id ? 'Enregistrement...' : 'Enregistrer la correction'}
                                                </button>
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </main>
            </div>
        </ProfessorShell>
    );
};

function SectionTitle({ title }) {
    return <div className="mb-3 text-xs font-black uppercase tracking-[0.22em] text-cyan-300">{title}</div>;
}

function SessionList({ sessions, selectedSessionId, onSelect, emptyLabel }) {
    if (!sessions.length) return <div className="rounded-[1.5rem] border border-dashed border-white/10 bg-slate-950/20 p-6 text-center text-sm text-slate-400">{emptyLabel}</div>;
    return (
        <div className="grid gap-3">
            {sessions.map((session) => (
                <button key={session.id} type="button" onClick={() => onSelect(session.id)} className={`rounded-[1.5rem] border p-4 text-left ${selectedSessionId === session.id ? 'border-cyan-300/30 bg-cyan-300/10' : 'border-white/10 bg-slate-950/20'}`}>
                    <div className="text-lg font-black text-white">{session.username}</div>
                    <div className="mt-2 text-xs text-slate-400">{session.student_number} | {session.total_score ?? 0}/{session.max_score ?? 0}</div>
                </button>
            ))}
        </div>
    );
}

function Metric({ label, value }) {
    return (
        <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/20 p-4">
            <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">{label}</div>
            <div className="mt-2 text-2xl font-black text-white">{value}</div>
        </div>
    );
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    return new Intl.DateTimeFormat('fr-FR', {
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    }).format(new Date(dateString));
}

function formatType(type) {
    return { text: 'Texte', radio: 'Choix unique', checkbox: 'Choix multiple', true_false: 'Vrai/Faux', code_html: 'Code' }[type] || type || 'Question';
}

function getAnswerDisplay(answer) {
    if (answer.text_answer) return answer.text_answer;
    if (Array.isArray(answer.selected_options) && answer.selected_options.length) return answer.selected_options.join(', ');
    if (answer.boolean_answer !== null && answer.boolean_answer !== undefined) return answer.boolean_answer ? 'Vrai' : 'Faux';
    if (answer.code_html || answer.code_css || answer.code_js) {
        const parts = [];
        if (answer.code_html) parts.push(`HTML:\n${answer.code_html}`);
        if (answer.code_css) parts.push(`CSS:\n${answer.code_css}`);
        if (answer.code_js) parts.push(`JS:\n${answer.code_js}`);
        return parts.join('\n\n');
    }
    return 'Aucune réponse';
}

export default Page4_Results;
