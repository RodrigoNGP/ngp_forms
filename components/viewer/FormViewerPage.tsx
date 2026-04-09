'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import * as Storage from '@/lib/storage';
import * as DB from '@/lib/db';
import * as GTM from '@/lib/gtm';
import type { NGPForm, FormField, FormSession } from '@/types/form';
import styles from './FormViewerPage.module.css';

type Answers = Record<string, string | string[] | number | null>;

export function FormViewerPage({ id }: { id: string }) {
  const searchParams = useSearchParams();
  const isPreview = searchParams.get('preview') === '1';

  const [form, setForm] = useState<NGPForm | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState<'down' | 'up'>('down');
  const [answers, setAnswers] = useState<Answers>({});
  const [submitted, setSubmitted] = useState(false);
  const [showError, setShowError] = useState(false);
  const [fileName, setFileName] = useState('');
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  // ── Session tracking + GTM ──
  const sessionRef   = useRef<FormSession | null>(null);
  const stepStartRef = useRef<number>(Date.now());
  const formStartRef = useRef<number>(Date.now()); // for total completion time
  const gtmActiveRef = useRef<boolean>(false);

  useEffect(() => {
    DB.getForm(id).then(f => {
      if (!f) { setNotFound(true); return; }
      setForm(f);
      document.title = f.title;
      const r = document.documentElement.style;
      r.setProperty('--viewer-primary', f.theme.primaryColor);
      r.setProperty('--viewer-bg', f.theme.backgroundColor);
      r.setProperty('--viewer-text', f.theme.textColor);
      r.setProperty('--viewer-button', f.theme.buttonColor || f.theme.primaryColor);
      r.setProperty('--viewer-font', f.theme.fontFamily);

      // ── GTM injection ──
      if (!isPreview && f.settings.gtmContainerId) {
        const injected = GTM.injectGTM(f.settings.gtmContainerId);
        gtmActiveRef.current = injected;
        if (injected) { formStartRef.current = Date.now(); GTM.gtmFormStart(f.id, f.title); }
      }

      // ── Session tracking (skip in preview) ──
      if (!isPreview) {
        DB.createSession(f.id).then(session => { sessionRef.current = session; }).catch(() => {});
      }

      // ── Abandon on tab close ──
      const handleUnload = () => {
        if (sessionRef.current && sessionRef.current.status === 'in_progress') {
          DB.abandonSession(sessionRef.current).catch(() => {});
        }
        if (gtmActiveRef.current) {
          const sess = sessionRef.current;
          const answeredCount = sess ? sess.steps.filter(s => s.answeredAt).length : 0;
          GTM.gtmFormAbandon({
            formId: f.id, formTitle: f.title,
            lastQuestionIndex: sess?.steps.length ?? 0,
            lastQuestionTitle: sess?.lastFieldId
              ? (f.fields.find(field => field.id === sess.lastFieldId)?.title ?? '') : '',
            questionsAnswered: answeredCount,
            totalQuestions: f.fields.length,
          });
        }
      };
      window.addEventListener('beforeunload', handleUnload);
      // store cleanup fn in a ref so it can be removed
      (window as Window & { _ngpCleanup?: () => void })._ngpCleanup = () =>
        window.removeEventListener('beforeunload', handleUnload);
    }).catch(() => setNotFound(true));

    return () => {
      (window as Window & { _ngpCleanup?: () => void })._ngpCleanup?.();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const slides = form?.fields ?? [];
  const total = slides.length;

  // Track which slide is being viewed
  useEffect(() => {
    if (!form || submitted || isPreview) return;
    const field = slides[current];
    if (!field) return;
    stepStartRef.current = Date.now();

    // Session tracking — update in memory then persist to Supabase
    if (sessionRef.current) {
      sessionRef.current = Storage.recordStepView(sessionRef.current, {
        id: field.id, title: field.title, type: field.type,
      });
      // Persist step to Supabase immediately so abandons have full data
      DB.updateSession(sessionRef.current).catch(() => {});
    }
    // GTM question view
    if (gtmActiveRef.current) {
      GTM.gtmQuestionView({
        formId: form.id,
        questionIndex: current + 1,
        questionId: field.id,
        questionTitle: field.title,
        questionType: field.type,
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, form]);

  const goNext = useCallback(() => {
    if (submitted) return;
    const slide = slides[current];
    // Validate required
    if (slide && slide.required) {
      const ans = answers[slide.id];
      const empty = !ans || (Array.isArray(ans) && ans.length === 0) || ans === '';
      if (empty) { setShowError(true); return; }
    }
    setShowError(false);
    if (current < total - 1) {
      setDirection('down');
      setCurrent(c => c + 1);
      setTimeout(() => (inputRef.current as HTMLElement)?.focus?.(), 300);
    } else {
      handleSubmit();
    }
  }, [current, total, slides, answers, submitted]);

  const goPrev = useCallback(() => {
    if (current > 0) {
      setShowError(false);
      setDirection('up');
      setCurrent(c => c - 1);
    }
  }, [current]);

  // Keyboard nav
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (submitted) return;
      if (e.key === 'Enter' && !e.shiftKey) {
        const tag = (e.target as HTMLElement).tagName;
        if (tag !== 'TEXTAREA') { e.preventDefault(); goNext(); }
      }
      if (e.key === 'ArrowUp') goPrev();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goNext, goPrev, submitted]);

  function setAnswer(fieldId: string, value: Answers[string]) {
    setShowError(false);
    setAnswers(prev => ({ ...prev, [fieldId]: value }));
    // Record answer timing
    const timeMs = Date.now() - stepStartRef.current;
    if (!isPreview && sessionRef.current) {
      sessionRef.current = Storage.recordStepAnswer(sessionRef.current, fieldId, value, timeMs);
      // Persist answer to Supabase immediately
      DB.updateSession(sessionRef.current).catch(() => {});
    }
    // GTM question answer
    if (!isPreview && gtmActiveRef.current && form) {
      const field = slides.find(s => s.id === fieldId);
      if (field) {
        GTM.gtmQuestionAnswer({
          formId: form.id,
          questionId: field.id,
          questionTitle: field.title,
          questionType: field.type,
          answerValue: value,
          timeToAnswerMs: timeMs,
        });
      }
    }
  }

  function toggleChoice(fieldId: string, value: string, multi: boolean) {
    const cur = (answers[fieldId] as string[] | undefined) || [];
    if (multi) {
      setAnswer(fieldId, cur.includes(value) ? cur.filter(v => v !== value) : [...cur, value]);
    } else {
      setAnswer(fieldId, cur[0] === value ? [] : [value]);
    }
  }

  function handleSubmit() {
    if (!form || isPreview) { setSubmitted(true); return; }
    const ans: Record<string, { fieldTitle: string; fieldType: FormField['type']; value: Answers[string] }> = {};
    slides.forEach(f => {
      ans[f.id] = { fieldTitle: f.title, fieldType: f.type, value: answers[f.id] ?? null };
    });
    DB.saveResponse(form.id, ans).then(saved => {
      // ── Google Sheets webhook ──
      if (form.settings.sheetsWebhookUrl?.startsWith('https://script.google.com/')) {
        fetch(form.settings.sheetsWebhookUrl, {
          method: 'POST', mode: 'no-cors',
          body: JSON.stringify(saved),
        }).catch(() => {});
      }
    }).catch(() => {});

    // Mark session as completed
    if (sessionRef.current) {
      DB.completeSession(sessionRef.current)
        .then(updated => { sessionRef.current = updated; })
        .catch(() => {});
    }
    // GTM form complete
    if (gtmActiveRef.current) {
      const answeredCount = Object.values(ans).filter(a => a.value != null && a.value !== '').length;
      GTM.gtmFormComplete({
        formId: form.id,
        formTitle: form.title,
        totalQuestions: slides.length,
        answeredQuestions: answeredCount,
        completionTimeMs: Date.now() - formStartRef.current,
      });
    }
    setSubmitted(true);
    if (form.settings.thankYouRedirectUrl) {
      setTimeout(() => { window.location.href = form.settings.thankYouRedirectUrl; }, 2000);
    }
  }

  function slideClass(idx: number) {
    if (submitted && idx === total) return styles.active;
    if (idx === current && !submitted) return styles.active;
    if (idx < current) return styles.exitUp;
    return styles.exitDown;
  }

  if (notFound) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: 16, color: 'var(--text-muted)' }}>
      <h2 style={{ color: 'var(--text-primary)' }}>Formulário não encontrado</h2>
      <p>Este formulário não existe ou foi removido.</p>
    </div>
  );
  if (!form) return null;

  const progress = total > 0 ? ((current) / total) * 100 : 0;
  const isLastSlide = current === total - 1;

  return (
    <div className={styles.wrap}>
      {form.theme.backgroundImage && (
        <div className={styles.bgImage} style={{ backgroundImage: `url(${form.theme.backgroundImage})` }} />
      )}
      {form.theme.logoUrl && (
        <img src={form.theme.logoUrl} alt="Logo" className={styles.formLogo} />
      )}
      {isPreview && <div className={styles.previewBanner}>Modo pré-visualização — as respostas não serão salvas</div>}

      {form.settings.showProgressBar && !submitted && (
        <div className={styles.progress} style={{ top: isPreview ? 33 : 0 }}>
          <div className={styles.progressBar} style={{ width: `${progress}%` }} />
        </div>
      )}

      <div className={styles.slides}>
        {/* Question slides */}
        {slides.map((field, idx) => (
          <div key={field.id} className={`${styles.slide} ${slideClass(idx)}`}>
            <div className={styles.slideInner}>
              {renderSlide(field, idx, form, answers, setAnswer, toggleChoice, goNext, showError, fileName, setFileName, inputRef, isLastSlide, form.settings.submitButtonText, idx === current && !submitted)}
            </div>
          </div>
        ))}

        {/* Thank you slide */}
        <div className={`${styles.slide} ${submitted ? styles.active : styles.exitDown}`}>
          <div className={styles.slideInner}>
            <div className={styles.tyWrap}>
              <div className={styles.tyIcon}>
                <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 16l8 8 12-14" />
                </svg>
              </div>
              <h2 className={styles.tyTitle}>{form.settings.thankYouTitle}</h2>
              <p className={styles.tyMessage}>{form.settings.thankYouMessage}</p>
              {isPreview && (
                <button className={styles.okBtn} style={{ marginTop: 8 }} onClick={() => { setSubmitted(false); setCurrent(0); setAnswers({}); }}>
                  Reiniciar pré-visualização
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      {!submitted && (
        <div className={styles.nav}>
          <button className={styles.navBtn} onClick={goPrev} disabled={current === 0} aria-label="Anterior">
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 7H3M7 3L3 7l4 4"/></svg>
          </button>
          <button className={styles.navBtn} onClick={goNext} aria-label="Próximo">
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7h8M7 3l4 4-4 4"/></svg>
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Render each field type ── */
function renderSlide(
  field: FormField,
  idx: number,
  form: NGPForm,
  answers: Answers,
  setAnswer: (id: string, v: Answers[string]) => void,
  toggleChoice: (id: string, v: string, multi: boolean) => void,
  goNext: () => void,
  showError: boolean,
  fileName: string,
  setFileName: (n: string) => void,
  inputRef: React.MutableRefObject<HTMLInputElement | HTMLTextAreaElement | null>,
  isLast: boolean,
  submitLabel: string,
  isActive: boolean,
): React.ReactNode {
  const qNum = form.settings.showQuestionNumbers ? idx + 1 : null;
  const val = answers[field.id];
  const isLayout = ['welcome', 'statement', 'thank_you'].includes(field.type);

  if (field.type === 'welcome' || field.type === 'statement') {
    return (
      <div className={styles.welcomeWrap}>
        <h1 className={styles.welcomeTitle}>{field.title}</h1>
        {field.description && <p className={styles.welcomeDesc}>{field.description}</p>}
        <button className={styles.welcomeBtn} onClick={goNext}>
          {field.buttonText || 'Continuar'}
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M4 8h8M8 4l4 4-4 4"/></svg>
        </button>
      </div>
    );
  }

  return (
    <>
      {qNum !== null && !isLayout && (
        <div className={styles.qNum}>
          <span>{qNum}</span>
          <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M2 5h6M5 2l3 3-3 3"/></svg>
        </div>
      )}
      <h2 className={styles.qTitle}>
        {field.title}
        {field.required && <span className={styles.required}>*</span>}
      </h2>
      {field.description && <p className={styles.qDesc}>{field.description}</p>}

      {/* ── short / long / email / phone / number / url ── */}
      {field.type === 'phone' && (
        <input
          ref={isActive ? (inputRef as React.RefObject<HTMLInputElement>) : null}
          autoFocus={isActive}
          className={`${styles.textInput}${showError && !val ? ' ' + styles.error : ''}`}
          type="tel"
          inputMode="numeric"
          placeholder={field.placeholder || '(00) 00000-0000'}
          value={(() => {
            const d = ((val as string) || '').replace(/\D/g, '');
            if (d.length === 0) return '';
            if (d.length <= 2) return `(${d}`;
            if (d.length <= 7) return `(${d.slice(0,2)}) ${d.slice(2)}`;
            return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7,11)}`;
          })()}
          maxLength={15}
          onChange={e => {
            const onlyDigits = e.target.value.replace(/\D/g, '').slice(0, 11);
            setAnswer(field.id, onlyDigits);
          }}
        />
      )}
      {['short_text', 'email', 'number', 'url', 'date'].includes(field.type) && (
        <input
          ref={isActive ? (inputRef as React.RefObject<HTMLInputElement>) : null}
          autoFocus={isActive}
          className={`${styles.textInput}${showError && !val ? ' ' + styles.error : ''}`}
          type={field.type === 'email' ? 'email' : field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : field.type === 'url' ? 'url' : 'text'}
          placeholder={field.placeholder || ''}
          value={(val as string) || ''}
          onChange={e => setAnswer(field.id, e.target.value)}
        />
      )}
      {field.type === 'long_text' && (
        <textarea
          ref={isActive ? (inputRef as React.RefObject<HTMLTextAreaElement>) : null}
          autoFocus={isActive}
          className={`${styles.textInput}${showError && !val ? ' ' + styles.error : ''}`}
          placeholder={field.placeholder || ''}
          rows={4}
          value={(val as string) || ''}
          onChange={e => setAnswer(field.id, e.target.value)}
        />
      )}

      {/* ── multiple choice / checkbox ── */}
      {(field.type === 'multiple_choice' || field.type === 'checkbox') && (
        <div className={styles.choices}>
          {(field.options || []).map((opt, i) => {
            const selected = Array.isArray(val) && val.includes(opt);
            return (
              <button
                key={i}
                className={`${styles.choiceBtn}${selected ? ' ' + styles.selected : ''}`}
                onClick={() => toggleChoice(field.id, opt, field.type === 'checkbox')}
              >
                <span className={styles.choiceKey}>{String.fromCharCode(65 + i)}</span>
                {opt}
              </button>
            );
          })}
          {field.allowOther && (
            <button className={`${styles.choiceBtn}${Array.isArray(val) && val.includes('__other__') ? ' ' + styles.selected : ''}`} onClick={() => toggleChoice(field.id, '__other__', field.type === 'checkbox')}>
              <span className={styles.choiceKey}>+</span> Outro
            </button>
          )}
        </div>
      )}

      {/* ── dropdown ── */}
      {field.type === 'dropdown' && (
        <select
          className={styles.selectInput}
          value={(val as string) || ''}
          onChange={e => setAnswer(field.id, e.target.value)}
        >
          <option value="">Selecione...</option>
          {(field.options || []).map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
        </select>
      )}

      {/* ── yes / no ── */}
      {field.type === 'yes_no' && (
        <div className={styles.yesno}>
          {['Sim', 'Não'].map(label => (
            <button
              key={label}
              className={`${styles.yesnoBtn}${val === label ? ' ' + styles.selected : ''}`}
              onClick={() => { setAnswer(field.id, label); setTimeout(goNext, 300); }}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* ── rating ── */}
      {field.type === 'rating' && (
        <div className={styles.stars}>
          {Array.from({ length: field.maxRating || 5 }).map((_, i) => (
            <button
              key={i}
              className={`${styles.starBtn}${typeof val === 'number' && i < val ? ' ' + styles.active : ''}`}
              onClick={() => setAnswer(field.id, i + 1)}
              onMouseEnter={e => {
                const stars = (e.currentTarget.parentNode as HTMLElement).querySelectorAll('button');
                stars.forEach((s, j) => j <= i ? s.classList.add(styles.active) : s.classList.remove(styles.active));
              }}
              onMouseLeave={e => {
                const stars = (e.currentTarget.parentNode as HTMLElement).querySelectorAll('button');
                const cur = typeof val === 'number' ? val : 0;
                stars.forEach((s, j) => j < cur ? s.classList.add(styles.active) : s.classList.remove(styles.active));
              }}
            >
              ★
            </button>
          ))}
        </div>
      )}

      {/* ── opinion scale ── */}
      {field.type === 'opinion_scale' && (() => {
        const min = field.minValue ?? 1;
        const max = field.maxValue ?? 10;
        const nums = Array.from({ length: max - min + 1 }, (_, i) => min + i);
        return (
          <div className={styles.scaleWrap}>
            <div className={styles.scaleBtns}>
              {nums.map(n => (
                <button
                  key={n}
                  className={`${styles.scaleBtn}${val === n ? ' ' + styles.selected : ''}`}
                  onClick={() => setAnswer(field.id, n)}
                >
                  {n}
                </button>
              ))}
            </div>
            {(field.minLabel || field.maxLabel) && (
              <div className={styles.scaleLabels}>
                <span>{field.minLabel}</span><span>{field.maxLabel}</span>
              </div>
            )}
          </div>
        );
      })()}

      {/* ── file upload ── */}
      {field.type === 'file_upload' && (
        <div className={styles.fileWrap}>
          <label className={styles.fileLabel}>
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10 1v12M6 5l4-4 4 4"/><path d="M1 15v3h18v-3"/></svg>
            {fileName || 'Clique para selecionar um arquivo'}
            <input type="file" className={styles.fileInput} onChange={e => {
              const f = e.target.files?.[0];
              if (f) { setFileName(f.name); setAnswer(field.id, f.name); }
            }} />
          </label>
          {fileName && <span className={styles.fileName}>{fileName}</span>}
        </div>
      )}

      {/* Error message */}
      {showError && !val && field.required && (
        <p className={styles.errorMsg}>Este campo é obrigatório</p>
      )}

      {/* OK button (not for yes/no, welcome, or statement) */}
      {!['yes_no', 'welcome', 'statement'].includes(field.type) && (
        <div className={styles.okWrap}>
          <button className={styles.okBtn} onClick={goNext}>
            {isLast ? submitLabel : 'OK'}
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M2 6h8M6 2l4 4-4 4"/></svg>
          </button>
          {!isLast && <span className={styles.okHint}>ou pressione Enter</span>}
        </div>
      )}
    </>
  );
}
