import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/api';
import ProfessorShell from '../components/ProfessorShell';

const QUESTION_TYPES = [
  { type: 'text', label: 'Texte' },
  { type: 'radio', label: 'Choix unique' },
  { type: 'checkbox', label: 'Choix multiple' },
  { type: 'code_html', label: 'Code HTML' },
];

const Page2_CreateExam = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [modules, setModules] = useState([]);
  const [groups, setGroups] = useState([]);
  const [title, setTitle] = useState('');
  const [moduleId, setModuleId] = useState('');
  const [groupId, setGroupId] = useState('');
  const [timerMinutes, setTimerMinutes] = useState('60');
  const [questions, setQuestions] = useState([]);
  const [deletedQuestionIds, setDeletedQuestionIds] = useState([]);

  useEffect(() => {
    const init = async () => {
      await fetchData();
      if (isEdit) await fetchExam();
      setFetching(false);
    };

    init();
  }, [id, isEdit]);

  const fetchData = async () => {
    try {
      const [modRes, grpRes] = await Promise.all([
        api.get('/modules'),
        api.get('/student-groups'),
      ]);

      setModules(modRes.data || []);
      setGroups(grpRes.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchExam = async () => {
    try {
      const res = await api.get(`/exams/${id}`);
      const data = res.data.data;
      setTitle(data.title);
      setModuleId(data.module_id);
      setGroupId(data.group_id);
      setTimerMinutes(data.timer_minutes);
      setQuestions(
        data.questions.map((question) => ({
          id: question.id,
          tempId: Date.now() + Math.random(),
          type: question.type,
          content: question.content,
          points: question.points,
          options: question.options || [],
          codeParts: question.code_template
            ? JSON.parse(question.code_template)
            : { html: '', css: '', js: '' },
          activeTab: 'html',
          isExisting: true,
        }))
      );
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddQuestion = (type) => {
    setQuestions((prev) => [
      ...prev,
      {
        tempId: Date.now() + Math.random(),
        type,
        content: '',
        points: 1,
        options:
          type === 'radio' || type === 'checkbox'
            ? [
                { text: 'Option 1', is_correct: false },
                { text: 'Option 2', is_correct: false },
              ]
            : [],
        codeParts: { html: '', css: '', js: '' },
        activeTab: 'html',
        isExisting: false,
      },
    ]);
  };

  const updateQuestion = (tempId, field, value) => {
    setQuestions((prev) =>
      prev.map((question) =>
        question.tempId === tempId ? { ...question, [field]: value } : question
      )
    );
  };

  const removeQuestion = (tempId) => {
    const question = questions.find((item) => item.tempId === tempId);
    if (question?.isExisting) {
      setDeletedQuestionIds((prev) => [...prev, question.id]);
    }
    setQuestions((prev) => prev.filter((item) => item.tempId !== tempId));
  };

  const addOption = (tempId) => {
    setQuestions((prev) =>
      prev.map((question) => {
        if (question.tempId !== tempId) return question;
        return {
          ...question,
          options: [
            ...question.options,
            { text: `Option ${question.options.length + 1}`, is_correct: false },
          ],
        };
      })
    );
  };

  const updateOption = (tempId, idx, field, value) => {
    setQuestions((prev) =>
      prev.map((question) => {
        if (question.tempId !== tempId) return question;
        const nextOptions = [...question.options];
        nextOptions[idx] = { ...nextOptions[idx], [field]: value };
        return { ...question, options: nextOptions };
      })
    );
  };

  const removeOption = (tempId, idx) => {
    setQuestions((prev) =>
      prev.map((question) => {
        if (question.tempId !== tempId) return question;
        return {
          ...question,
          options: question.options.filter((_, optionIndex) => optionIndex !== idx),
        };
      })
    );
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      if (!title || !moduleId || !groupId) {
        alert('Champs obligatoires !');
        return;
      }

      const payload = {
        title,
        module_id: moduleId,
        group_id: groupId,
        timer_minutes: parseInt(timerMinutes, 10),
        status: 'draft',
      };

      let examId = null;
      let privateToken = '';

      if (isEdit) {
        await api.put(`/exams/${id}`, payload);
        examId = id;

        for (const questionId of deletedQuestionIds) {
          await api.delete(`/questions/${questionId}`);
        }
      } else {
        const res = await api.post('/exams', payload);
        examId = res.data.data.id;
        privateToken = res.data.data.private_token;
      }

      if (!examId) {
        alert('Erreur: examId est undefined !');
        return;
      }

      for (const question of questions) {
        if (!question.content || question.points <= 0) {
          alert('Question invalide !');
          return;
        }

        if (
          (question.type === 'radio' || question.type === 'checkbox') &&
          !question.options.some((option) => option.is_correct)
        ) {
          alert('Ajoutez une bonne réponse !');
          return;
        }

        const questionPayload = {
          type: question.type,
          content: question.content,
          points: parseInt(question.points, 10),
        };

        if (question.type === 'code_html') {
          questionPayload.code_template = JSON.stringify(question.codeParts);
        }

        if (question.options?.length) {
          questionPayload.options = question.options.map((option) => ({
            label: option.text || option.label,
            is_correct: option.is_correct,
          }));
        }

        if (question.isExisting) {
          await api.put(`/questions/${question.id}`, questionPayload);
        } else {
          await api.post(`/exams/${examId}/questions`, questionPayload);
        }
      }

      if (!isEdit) {
        localStorage.setItem('latest_exam_link', `${window.location.origin}/exam/${privateToken}`);
        localStorage.setItem('latest_exam_title', title);
      }

      navigate('/dashboard');
    } catch (error) {
      console.error(error);
      alert(`Erreur: ${JSON.stringify(error.response?.data?.errors)}`);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <ProfessorShell title="Créer un examen" subtitle="Chargement de l'éditeur...">
        <style>{styles}</style>
        <div className="ce-loading-shell">
          <div className="ce-spinner" />
          <p>Chargement de l'examen...</p>
        </div>
      </ProfessorShell>
    );
  }

  return (
    <ProfessorShell
      title={isEdit ? "Modifier l'examen" : 'Créer un examen'}
      subtitle="Même structure visuelle que les autres pages professeur, avec un contenu centré et un éditeur propre."
      actions={
        <>
          <button type="button" className="ce-btn-ghost" onClick={() => navigate('/dashboard')}>
            Annuler
          </button>
          <button type="submit" form="exam-form" className="ce-btn-primary" disabled={loading}>
            {loading ? (
              <span className="ce-btn-loading">
                <span className="ce-btn-spinner" />
                Sauvegarde...
              </span>
            ) : (
              <>
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
                  <polyline points="17 21 17 13 7 13 7 21" />
                  <polyline points="7 3 7 8 15 8" />
                </svg>
                {isEdit ? 'Enregistrer' : "Créer l'examen"}
              </>
            )}
          </button>
        </>
      }
    >
      <style>{styles}</style>

      <div className="ce-page">
        <form id="exam-form" onSubmit={handleSave} className="ce-stack">
          <section className="ce-card ce-meta-strip">
            <div className="ce-meta-pill">
              <span>Questions</span>
              <strong>{questions.length}</strong>
            </div>
            <div className="ce-meta-pill">
              <span>Durée</span>
              <strong>{timerMinutes || 0} min</strong>
            </div>
            <div className="ce-meta-pill">
              <span>Mode</span>
              <strong>{isEdit ? 'Edition' : 'Nouveau'}</strong>
            </div>
          </section>

          <section className="ce-card">
            <div className="ce-card-header">
              <div className="ce-card-icon">{questionTypeIcon('text')}</div>
              <div>
                <h2 className="ce-card-title">Informations générales</h2>
                <p className="ce-card-sub">Titre, module, groupe et durée de l'épreuve.</p>
              </div>
            </div>

            <div className="ce-card-body">
              <div className="ce-field-full">
                <label className="ce-label">
                  Titre de l'examen <span className="ce-required">*</span>
                </label>
                <input
                  className="ce-input"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Ex : Examen final - Développement Web"
                  required
                />
              </div>

              <div className="ce-fields-grid">
                <div className="ce-field">
                  <label className="ce-label">
                    Module <span className="ce-required">*</span>
                  </label>
                  <div className="ce-select-wrap">
                    <select className="ce-select" value={moduleId} onChange={(event) => setModuleId(event.target.value)} required>
                      <option value="">Sélectionner un module</option>
                      {modules.map((module) => (
                        <option key={module.id} value={module.id}>
                          {module.name}
                        </option>
                      ))}
                    </select>
                    <span className="ce-select-arrow">{chevronIcon}</span>
                  </div>
                </div>

                <div className="ce-field">
                  <label className="ce-label">
                    Groupe <span className="ce-required">*</span>
                  </label>
                  <div className="ce-select-wrap">
                    <select className="ce-select" value={groupId} onChange={(event) => setGroupId(event.target.value)} required>
                      <option value="">Sélectionner un groupe</option>
                      {groups.map((group) => (
                        <option key={group.id} value={group.id}>
                          {group.name}
                        </option>
                      ))}
                    </select>
                    <span className="ce-select-arrow">{chevronIcon}</span>
                  </div>
                </div>

                <div className="ce-field">
                  <label className="ce-label">Durée (minutes)</label>
                  <input
                    className="ce-input"
                    type="number"
                    value={timerMinutes}
                    onChange={(event) => setTimerMinutes(event.target.value)}
                    min="1"
                    placeholder="60"
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="ce-section-head">
            <div>
              <div className="ce-section-label">Questions</div>
              <h2 className="ce-section-title">Composez votre copie</h2>
            </div>
            <div className="ce-add-btns">
              {QUESTION_TYPES.map(({ type, label }) => (
                <button key={type} type="button" className="ce-add-btn" onClick={() => handleAddQuestion(type)}>
                  {questionTypeIcon(type)}
                  {label}
                </button>
              ))}
            </div>
          </section>

          {questions.length === 0 ? (
            <section className="ce-empty">
              <div className="ce-empty-icon">{questionTypeIcon('checkbox')}</div>
              <p className="ce-empty-title">Aucune question pour le moment</p>
              <p className="ce-empty-sub">Ajoutez vos questions avec les boutons ci-dessus.</p>
            </section>
          ) : null}

          <section className="ce-questions-list">
            {questions.map((question, index) => (
              <article key={question.tempId} className="ce-question-card">
                <div className="ce-question-header">
                  <div className="ce-question-meta">
                    <span className="ce-question-number">Q{index + 1}</span>
                    <span className="ce-question-type-badge">
                      {questionTypeIcon(question.type)}
                      {questionTypeLabel(question.type)}
                    </span>
                  </div>

                  <button type="button" className="ce-delete-btn" onClick={() => removeQuestion(question.tempId)} title="Supprimer">
                    {trashIcon}
                  </button>
                </div>

                <div className="ce-question-body">
                  <div className="ce-field-full">
                    <label className="ce-label">
                      Enoncé <span className="ce-required">*</span>
                    </label>
                    <textarea
                      className="ce-textarea"
                      value={question.content}
                      onChange={(event) => updateQuestion(question.tempId, 'content', event.target.value)}
                      placeholder="Saisissez l'énoncé de la question..."
                      rows={3}
                      required
                    />
                  </div>

                  <div className="ce-field-points">
                    <label className="ce-label">Points</label>
                    <div className="ce-points-wrap">
                      <button
                        type="button"
                        className="ce-points-btn"
                        onClick={() => updateQuestion(question.tempId, 'points', Math.max(1, Number(question.points) - 1))}
                      >
                        -
                      </button>
                      <input
                        className="ce-points-input"
                        type="number"
                        value={question.points}
                        onChange={(event) => updateQuestion(question.tempId, 'points', parseInt(event.target.value, 10) || 1)}
                        min="1"
                      />
                      <button
                        type="button"
                        className="ce-points-btn"
                        onClick={() => updateQuestion(question.tempId, 'points', Number(question.points) + 1)}
                      >
                        +
                      </button>
                      <span className="ce-points-label">pt{Number(question.points) > 1 ? 's' : ''}</span>
                    </div>
                  </div>

                  {(question.type === 'radio' || question.type === 'checkbox') ? (
                    <div className="ce-options-section">
                      <label className="ce-label">Options de réponse</label>
                      <div className="ce-options-list">
                        {question.options.map((option, idx) => (
                          <div key={idx} className={`ce-option-row ${option.is_correct ? 'ce-option-correct' : ''}`}>
                            <button
                              type="button"
                              className={`ce-correct-toggle ${option.is_correct ? 'ce-correct-active' : ''}`}
                              onClick={() => updateOption(question.tempId, idx, 'is_correct', !option.is_correct)}
                              title="Marquer comme correct"
                            >
                              {option.is_correct ? checkIcon : circleIcon}
                            </button>

                            <input
                              className="ce-option-input"
                              value={option.text || option.label || ''}
                              onChange={(event) => updateOption(question.tempId, idx, 'text', event.target.value)}
                              placeholder={`Option ${idx + 1}`}
                            />

                            <button type="button" className="ce-remove-option" onClick={() => removeOption(question.tempId, idx)}>
                              {closeIcon}
                            </button>
                          </div>
                        ))}
                      </div>

                      <button type="button" className="ce-add-option-btn" onClick={() => addOption(question.tempId)}>
                        {plusIcon}
                        Ajouter une option
                      </button>
                    </div>
                  ) : null}

                  {question.type === 'code_html' ? (
                    <div className="ce-code-section">
                      <div className="ce-code-tabs">
                        {['html', 'css', 'js'].map((tab) => (
                          <button
                            key={tab}
                            type="button"
                            className={`ce-code-tab ${question.activeTab === tab ? 'ce-code-tab-active' : ''}`}
                            onClick={() => updateQuestion(question.tempId, 'activeTab', tab)}
                          >
                            {tab.toUpperCase()}
                          </button>
                        ))}
                      </div>

                      <textarea
                        className="ce-code-textarea"
                        value={question.codeParts[question.activeTab]}
                        onChange={(event) =>
                          updateQuestion(question.tempId, 'codeParts', {
                            ...question.codeParts,
                            [question.activeTab]: event.target.value,
                          })
                        }
                        placeholder={`Template ${question.activeTab.toUpperCase()}...`}
                        rows={6}
                        spellCheck={false}
                      />
                    </div>
                  ) : null}
                </div>
              </article>
            ))}
          </section>
        </form>
      </div>
    </ProfessorShell>
  );
};

const questionTypeLabel = (type) =>
  ({
    text: 'Texte libre',
    radio: 'Choix unique',
    checkbox: 'Choix multiple',
    code_html: 'Code HTML',
  }[type] || type);

const questionTypeIcon = (type) =>
  ({
    text: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M4 6h16M4 12h16M4 18h7" />
      </svg>
    ),
    radio: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="4" fill="currentColor" stroke="none" />
      </svg>
    ),
    checkbox: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <rect x="3" y="3" width="18" height="18" rx="3" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
    code_html: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M16 18l6-6-6-6M8 6l-6 6 6 6" />
      </svg>
    ),
  }[type] || null);

const chevronIcon = (
  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const plusIcon = (
  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const closeIcon = (
  <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const circleIcon = (
  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="9" />
  </svg>
);

const checkIcon = (
  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const trashIcon = (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
  </svg>
);

const styles = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');

.ce-page {
  width: 100%;
  max-width: 1040px;
  margin: 0 auto;
}

.ce-stack {
  display: grid;
  gap: 24px;
}

.ce-loading-shell {
  min-height: 48vh;
  display: grid;
  place-items: center;
  gap: 14px;
  text-align: center;
  color: #cbd5e1;
}

.ce-spinner {
  width: 38px;
  height: 38px;
  border-radius: 999px;
  border: 3px solid rgba(148,163,184,.22);
  border-top-color: #22d3ee;
  animation: ce-spin .8s linear infinite;
}

.ce-meta-strip {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  padding: 18px;
}

.ce-meta-pill {
  border-radius: 22px;
  border: 1px solid rgba(255,255,255,.08);
  background: rgba(2,6,23,.25);
  padding: 18px;
}

.ce-meta-pill span {
  display: block;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: .18em;
  text-transform: uppercase;
  color: #67e8f9;
}

.ce-meta-pill strong {
  display: block;
  margin-top: 10px;
  font-size: 1.8rem;
  color: white;
}

.ce-card {
  border-radius: 2rem;
  border: 1px solid rgba(255,255,255,.08);
  background: rgba(255,255,255,.05);
  box-shadow: 0 18px 45px rgba(2,6,23,.18);
  backdrop-filter: blur(20px);
  overflow: hidden;
}

.ce-card-header {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 22px 24px;
  border-bottom: 1px solid rgba(255,255,255,.08);
}

.ce-card-icon {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border-radius: 1rem;
  background: rgba(34,211,238,.14);
  color: #67e8f9;
  flex-shrink: 0;
}

.ce-card-title {
  font-size: 1rem;
  font-weight: 700;
  color: white;
}

.ce-card-sub {
  margin-top: 6px;
  color: #cbd5e1;
  font-size: .92rem;
}

.ce-card-body {
  padding: 24px;
  display: grid;
  gap: 20px;
}

.ce-fields-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.ce-field,
.ce-field-full,
.ce-field-points,
.ce-options-section {
  display: grid;
  gap: 8px;
}

.ce-label {
  color: #e2e8f0;
  font-size: .92rem;
  font-weight: 600;
}

.ce-required {
  color: #f87171;
}

.ce-input,
.ce-select,
.ce-textarea,
.ce-points-input {
  width: 100%;
  border: 1px solid rgba(148,163,184,.16);
  background: rgba(15,23,42,.72);
  color: #f8fafc;
  border-radius: 1rem;
  padding: 12px 14px;
  font: inherit;
  outline: none;
}

.ce-input:focus,
.ce-select:focus,
.ce-textarea:focus,
.ce-points-input:focus {
  border-color: #22d3ee;
  box-shadow: 0 0 0 3px rgba(34,211,238,.12);
}

.ce-textarea {
  min-height: 88px;
  resize: vertical;
}

.ce-select-wrap {
  position: relative;
}

.ce-select {
  appearance: none;
  padding-right: 40px;
}

.ce-select-arrow {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
  pointer-events: none;
}

.ce-section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.ce-section-label {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: .18em;
  text-transform: uppercase;
  color: #67e8f9;
}

.ce-section-title {
  margin-top: 8px;
  font-size: 1.5rem;
  font-weight: 800;
  color: white;
}

.ce-add-btns {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.ce-add-btn,
.ce-add-option-btn,
.ce-btn-ghost,
.ce-btn-primary,
.ce-points-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: none;
  cursor: pointer;
  font: inherit;
}

.ce-add-btn,
.ce-add-option-btn {
  padding: 10px 14px;
  border-radius: 999px;
  border: 1px solid rgba(103,232,249,.16);
  background: rgba(8,22,42,.76);
  color: #67e8f9;
  font-weight: 600;
}

.ce-add-btn:hover,
.ce-add-option-btn:hover {
  background: rgba(34,211,238,.1);
  border-color: rgba(103,232,249,.35);
}

.ce-btn-ghost {
  padding: 10px 16px;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,.1);
  background: rgba(255,255,255,.05);
  color: white;
  font-weight: 700;
}

.ce-btn-primary {
  padding: 10px 16px;
  border-radius: 999px;
  background: linear-gradient(135deg, #06b6d4 0%, #2563eb 100%);
  color: white;
  font-weight: 800;
  box-shadow: 0 12px 28px rgba(37,99,235,.25);
}

.ce-btn-primary:disabled {
  opacity: .72;
  cursor: not-allowed;
}

.ce-btn-loading {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.ce-btn-spinner {
  width: 14px;
  height: 14px;
  border-radius: 999px;
  border: 2px solid rgba(255,255,255,.35);
  border-top-color: white;
  animation: ce-spin .7s linear infinite;
}

.ce-empty {
  border-radius: 2rem;
  border: 1.5px dashed rgba(125,211,252,.22);
  background: rgba(255,255,255,.04);
  text-align: center;
  padding: 56px 24px;
  color: #cbd5e1;
}

.ce-empty-icon {
  display: inline-grid;
  place-items: center;
  width: 54px;
  height: 54px;
  border-radius: 1.2rem;
  background: rgba(34,211,238,.1);
  color: #67e8f9;
}

.ce-empty-title {
  margin-top: 14px;
  font-size: 1rem;
  font-weight: 700;
  color: white;
}

.ce-empty-sub {
  margin-top: 8px;
  font-size: .94rem;
}

.ce-questions-list {
  display: grid;
  gap: 16px;
}

.ce-question-card {
  border-radius: 2rem;
  border: 1px solid rgba(148,163,184,.14);
  background: rgba(255,255,255,.05);
  overflow: hidden;
  box-shadow: 0 18px 40px rgba(2,6,23,.16);
}

.ce-question-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255,255,255,.08);
  background: rgba(255,255,255,.03);
}

.ce-question-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.ce-question-number {
  border-radius: 999px;
  background: rgba(34,211,238,.12);
  color: #67e8f9;
  padding: 6px 10px;
  font: 700 12px 'DM Mono', monospace;
}

.ce-question-type-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #cbd5e1;
  font-size: .88rem;
}

.ce-delete-btn {
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  background: transparent;
  color: #94a3b8;
}

.ce-delete-btn:hover {
  background: rgba(239,68,68,.14);
  color: #fca5a5;
}

.ce-question-body {
  padding: 20px;
  display: grid;
  gap: 18px;
}

.ce-points-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
}

.ce-points-btn {
  width: 34px;
  height: 38px;
  justify-content: center;
  border-radius: 12px;
  background: rgba(15,23,42,.78);
  border: 1px solid rgba(148,163,184,.16);
  color: #cbd5e1;
  font-weight: 700;
}

.ce-points-label {
  color: #94a3b8;
  font-size: .9rem;
  margin-left: 4px;
}

.ce-options-list {
  display: grid;
  gap: 8px;
}

.ce-option-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 1rem;
  border: 1px solid rgba(148,163,184,.14);
  background: rgba(15,23,42,.7);
}

.ce-option-correct {
  border-color: rgba(52,211,153,.4);
  background: rgba(16,185,129,.12);
}

.ce-correct-toggle {
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  border-radius: 999px;
  border: none;
  background: rgba(148,163,184,.18);
  color: #94a3b8;
  cursor: pointer;
  flex-shrink: 0;
}

.ce-correct-active {
  background: #22c55e;
  color: white;
}

.ce-option-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  color: white;
  font: inherit;
}

.ce-remove-option {
  width: 24px;
  height: 24px;
  display: grid;
  place-items: center;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: #94a3b8;
  cursor: pointer;
}

.ce-remove-option:hover {
  background: rgba(239,68,68,.14);
  color: #fca5a5;
}

.ce-code-section {
  border-radius: 1.2rem;
  overflow: hidden;
  border: 1px solid rgba(148,163,184,.16);
}

.ce-code-tabs {
  display: flex;
  background: rgba(8,22,42,.95);
  border-bottom: 1px solid rgba(148,163,184,.14);
}

.ce-code-tab {
  padding: 10px 16px;
  border: none;
  background: transparent;
  color: #94a3b8;
  font: 700 12px 'DM Mono', monospace;
  cursor: pointer;
}

.ce-code-tab-active {
  color: #67e8f9;
  background: rgba(34,211,238,.08);
}

.ce-code-textarea {
  width: 100%;
  min-height: 160px;
  padding: 16px;
  border: none;
  outline: none;
  resize: vertical;
  background: #091423;
  color: #cdd9ed;
  font: 500 13px 'DM Mono', monospace;
}

@keyframes ce-spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 900px) {
  .ce-meta-strip,
  .ce-fields-grid {
    grid-template-columns: 1fr;
  }
}
`;

export default Page2_CreateExam;
