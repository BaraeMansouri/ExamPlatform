import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getReportDetail, getReports, addRemark } from '../api/reports';
import ProfessorShell from '../components/ProfessorShell';
import { downloadProtectedFile } from '../utils/downloadProtectedFile';

const Page5_Controllers = () => {
    const { examId } = useParams();
    const [reports, setReports] = useState([]);
    const [selectedReport, setSelectedReport] = useState(null);
    const [remark, setRemark] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [saving, setSaving] = useState(false);
    const [downloadingPdf, setDownloadingPdf] = useState(false);

    useEffect(() => {
        fetchReports();
    }, [examId]);

    const fetchReports = async () => {
        try {
            setLoading(true);
            const res = await getReports(examId);
            const data = Array.isArray(res.data) ? res.data : [];
            setReports(data);
            if (data[0] && !selectedReport) handleSelect(data[0].session_id);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = async (sessionId) => {
        try {
            setLoadingDetail(true);
            const res = await getReportDetail(sessionId);
            setSelectedReport(res.data || null);
            setRemark(res.data?.professor_remark || '');
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingDetail(false);
        }
    };

    const handleSaveRemark = async () => {
        if (!selectedReport) return;
        try {
            setSaving(true);
            await addRemark(selectedReport.id, { professor_remark: remark });
            await handleSelect(selectedReport.session_id);
        } catch (err) {
            console.error(err);
            alert('Erreur lors de l’enregistrement');
        } finally {
            setSaving(false);
        }
    };

    const handleDownloadPdf = async () => {
        if (!selectedReport) return;
        try {
            setDownloadingPdf(true);
            await downloadProtectedFile(`/pdf/report/${selectedReport.session_id}`, `rapport_${selectedReport.session?.student_number || selectedReport.session_id}.pdf`);
        } catch (error) {
            console.error(error);
            alert("Impossible de télécharger le PDF");
        } finally {
            setDownloadingPdf(false);
        }
    };

    return (
        <ProfessorShell title="Rapports & Surveillance" subtitle="Consultez les niveaux de suspicion et archivez des rapports clairs.">
            <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
                <aside className="glass-card rounded-[2rem] border border-white/10 bg-white/5 p-5 text-white">
                    <div className="mb-4 text-xs font-black uppercase tracking-[0.22em] text-cyan-300">Rapports</div>
                    {loading ? (
                        <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/20 p-6 text-center text-slate-400">Chargement...</div>
                    ) : reports.length === 0 ? (
                        <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/20 p-6 text-center text-slate-400">Aucun rapport.</div>
                    ) : (
                        <div className="grid gap-3">
                            {reports.map((report) => (
                                <button key={report.id} type="button" onClick={() => handleSelect(report.session_id)} className={`rounded-[1.5rem] border p-4 text-left ${selectedReport?.id === report.id ? 'border-cyan-300/30 bg-cyan-300/10' : 'border-white/10 bg-slate-950/20'}`}>
                                    <div className="text-lg font-black text-white">{report.session?.username || 'Étudiant'}</div>
                                    <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                                        <span>{report.session?.student_number || 'N/A'}</span>
                                        <span className={`rounded-full px-3 py-1 font-black ${levelPill(report.suspicion_level)}`}>
                                            {(report.suspicion_level || 'low').toUpperCase()}
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </aside>

                <main className="grid gap-6">
                    {loadingDetail ? (
                        <div className="glass-card rounded-[2rem] border border-white/10 bg-white/5 p-10 text-center text-slate-200">Chargement du rapport...</div>
                    ) : !selectedReport ? (
                        <div className="glass-card rounded-[2rem] border border-white/10 bg-white/5 p-10 text-center text-slate-300">Sélectionnez un rapport à gauche.</div>
                    ) : (
                        <>
                            <div className="glass-card rounded-[2rem] border border-white/10 bg-white/5 p-6 text-white">
                                <div className="flex flex-wrap items-start justify-between gap-4">
                                    <div>
                                        <div className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">Rapport sélectionné</div>
                                        <h2 className="mt-2 text-3xl font-black">{selectedReport.session?.username || 'Étudiant'}</h2>
                                        <p className="mt-2 text-sm text-slate-300">{selectedReport.exam?.title || 'Examen'} | {selectedReport.session?.student_number || 'N/A'}</p>
                                    </div>
                                    <button onClick={handleDownloadPdf} className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950">
                                        {downloadingPdf ? 'Téléchargement...' : 'Télécharger PDF'}
                                    </button>
                                </div>

                                <div className="mt-5 grid gap-4 md:grid-cols-3">
                                    <Metric label="Alertes critiques" value={selectedReport.danger_events ?? 0} tone="rose" />
                                    <Metric label="Avertissements" value={selectedReport.warning_events ?? 0} tone="amber" />
                                    <Metric label="Niveau" value={(selectedReport.suspicion_level || 'low').toUpperCase()} tone="cyan" />
                                </div>
                            </div>

                            <div className="glass-card rounded-[2rem] border border-white/10 bg-white/5 p-6 text-white">
                                <div className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">Appréciation</div>
                                <textarea rows="4" value={remark} onChange={(e) => setRemark(e.target.value)} className="mt-4 w-full rounded-[1.5rem] border border-white/10 bg-slate-950/30 px-4 py-3 text-white outline-none" />
                                <button onClick={handleSaveRemark} disabled={saving} className="mt-4 rounded-2xl bg-gradient-to-r from-emerald-400 to-cyan-400 px-5 py-3 text-sm font-black text-slate-950">
                                    {saving ? 'Enregistrement...' : 'Sauvegarder'}
                                </button>
                            </div>

                            <div className="glass-card rounded-[2rem] border border-white/10 bg-white/5 p-6 text-white">
                                <div className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">Journal d’activité</div>
                                <div className="mt-4 grid gap-3">
                                    {selectedReport.session?.activity_logs?.length > 0 ? selectedReport.session.activity_logs.map((log) => (
                                        <div key={log.id} className="rounded-[1.5rem] border border-white/10 bg-slate-950/20 p-4">
                                            <div className="flex flex-wrap items-center gap-3">
                                                <div className="font-mono text-xs text-slate-500">{new Date(log.logged_at).toLocaleTimeString()}</div>
                                                <div className={`rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] ${levelPill(log.severity)}`}>
                                                    {log.severity?.toUpperCase()}
                                                </div>
                                            </div>
                                            <div className="mt-3 text-sm leading-7 text-slate-300">{log.description}</div>
                                        </div>
                                    )) : <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/20 p-6 text-center text-slate-400">Aucune activité suspecte détectée.</div>}
                                </div>
                            </div>
                        </>
                    )}
                </main>
            </div>
        </ProfessorShell>
    );
};

function Metric({ label, value, tone }) {
    const tones = {
        rose: 'bg-rose-400/10 text-rose-100',
        amber: 'bg-amber-400/10 text-amber-100',
        cyan: 'bg-cyan-400/10 text-cyan-100',
    };
    return (
        <div className={`rounded-[1.5rem] border border-white/10 ${tones[tone]} p-4`}>
            <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-300">{label}</div>
            <div className="mt-2 text-3xl font-black">{value}</div>
        </div>
    );
}

function levelPill(level) {
    if (level === 'critical' || level === 'danger') return 'bg-rose-400/15 text-rose-100';
    if (level === 'high' || level === 'warning') return 'bg-amber-400/15 text-amber-100';
    if (level === 'medium') return 'bg-yellow-400/15 text-yellow-100';
    return 'bg-emerald-400/15 text-emerald-100';
}

export default Page5_Controllers;
