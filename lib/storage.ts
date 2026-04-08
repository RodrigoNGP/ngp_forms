import type { NGPForm, FormField, FormResponse, FieldType, FormSession, FormStep } from '@/types/form';

const FORMS_KEY = 'ngp_forms';
const RESPONSES_KEY = 'ngp_responses';

function getLS(): Storage | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage;
}

export function getForms(): NGPForm[] {
  const ls = getLS();
  if (!ls) return [];
  return JSON.parse(ls.getItem(FORMS_KEY) || '[]');
}

export function getForm(id: string): NGPForm | null {
  return getForms().find((f) => f.id === id) || null;
}

export function saveForm(form: NGPForm): NGPForm {
  const ls = getLS();
  if (!ls) return form;
  const forms = getForms();
  const idx = forms.findIndex((f) => f.id === form.id);
  form.updatedAt = new Date().toISOString();
  if (idx >= 0) {
    forms[idx] = form;
  } else {
    form.createdAt = form.createdAt || new Date().toISOString();
    forms.push(form);
  }
  ls.setItem(FORMS_KEY, JSON.stringify(forms));
  return form;
}

export function deleteForm(id: string): void {
  const ls = getLS();
  if (!ls) return;
  const forms = getForms().filter((f) => f.id !== id);
  ls.setItem(FORMS_KEY, JSON.stringify(forms));
  const responses = getAllResponses();
  delete responses[id];
  ls.setItem(RESPONSES_KEY, JSON.stringify(responses));
  deleteFormSessions(id);
}

export function duplicateForm(id: string): NGPForm | null {
  const form = getForm(id);
  if (!form) return null;
  const newForm: NGPForm = JSON.parse(JSON.stringify(form));
  newForm.id = generateId();
  newForm.title = form.title + ' (cópia)';
  newForm.published = false;
  newForm.createdAt = new Date().toISOString();
  newForm.updatedAt = new Date().toISOString();
  return saveForm(newForm);
}

export function getAllResponses(): Record<string, FormResponse[]> {
  const ls = getLS();
  if (!ls) return {};
  return JSON.parse(ls.getItem(RESPONSES_KEY) || '{}');
}

export function getResponses(formId: string): FormResponse[] {
  return getAllResponses()[formId] || [];
}

export function saveResponse(
  formId: string,
  response: Omit<FormResponse, 'id' | 'submittedAt'>
): FormResponse {
  const ls = getLS();
  const full: FormResponse = {
    ...response,
    id: generateId(),
    submittedAt: new Date().toISOString(),
  };
  if (!ls) return full;
  const all = getAllResponses();
  if (!all[formId]) all[formId] = [];
  all[formId].push(full);
  ls.setItem(RESPONSES_KEY, JSON.stringify(all));
  return full;
}

export function getResponseCount(formId: string): number {
  return getResponses(formId).length;
}

// ── Session Tracking ─────────────────────────────────────────────
const SESSIONS_KEY = 'ngp_sessions';

function getAllSessions(): Record<string, FormSession[]> {
  const ls = getLS();
  if (!ls) return {};
  return JSON.parse(ls.getItem(SESSIONS_KEY) || '{}');
}

export function getSessions(formId: string): FormSession[] {
  return getAllSessions()[formId] || [];
}

export function createSession(formId: string): FormSession {
  const session: FormSession = {
    id: generateId(),
    formId,
    status: 'in_progress',
    startedAt: new Date().toISOString(),
    steps: [],
  };
  persistSession(formId, session);
  return session;
}

export function updateSession(session: FormSession): void {
  persistSession(session.formId, session);
}

function persistSession(formId: string, session: FormSession): void {
  const ls = getLS();
  if (!ls) return;
  const all = getAllSessions();
  if (!all[formId]) all[formId] = [];
  const idx = all[formId].findIndex(s => s.id === session.id);
  if (idx >= 0) all[formId][idx] = session; else all[formId].push(session);
  ls.setItem(SESSIONS_KEY, JSON.stringify(all));
}

export function recordStepView(session: FormSession, field: { id: string; title: string; type: FieldType }): FormSession {
  const existing = session.steps.find(s => s.fieldId === field.id);
  const step: FormStep = existing
    ? { ...existing, revisits: existing.revisits + 1 }
    : { fieldId: field.id, fieldTitle: field.title, fieldType: field.type, viewedAt: new Date().toISOString(), revisits: 0 };
  const steps = existing
    ? session.steps.map(s => s.fieldId === field.id ? step : s)
    : [...session.steps, step];
  const updated = { ...session, steps, lastFieldId: field.id };
  persistSession(session.formId, updated);
  return updated;
}

export function recordStepAnswer(
  session: FormSession,
  fieldId: string,
  answer: FormStep['answer'],
  timeToAnswerMs: number,
): FormSession {
  const now = new Date().toISOString();
  const steps = session.steps.map(s =>
    s.fieldId === fieldId ? { ...s, answeredAt: now, timeToAnswerMs, answer } : s
  );
  const updated = { ...session, steps };
  persistSession(session.formId, updated);
  return updated;
}

export function completeSession(session: FormSession): FormSession {
  const now = new Date().toISOString();
  const totalTimeMs = Date.now() - new Date(session.startedAt).getTime();
  const updated: FormSession = { ...session, status: 'completed', completedAt: now, totalTimeMs };
  persistSession(session.formId, updated);
  return updated;
}

export function abandonSession(session: FormSession): void {
  const updated: FormSession = { ...session, status: 'abandoned' };
  persistSession(session.formId, updated);
}

export function deleteFormSessions(formId: string): void {
  const ls = getLS();
  if (!ls) return;
  const all = getAllSessions();
  delete all[formId];
  ls.setItem(SESSIONS_KEY, JSON.stringify(all));
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

export function createBlankForm(): NGPForm {
  return {
    id: generateId(),
    title: 'Formulário sem título',
    description: '',
    fields: [],
    theme: {
      primaryColor: '#6C5CE7',
      backgroundColor: '#1a1a2e',
      textColor: '#ffffff',
      fontFamily: 'Inter',
      backgroundImage: '',
    },
    settings: {
      showProgressBar: true,
      showQuestionNumbers: true,
      submitButtonText: 'Enviar',
      thankYouTitle: 'Obrigado!',
      thankYouMessage: 'Suas respostas foram enviadas com sucesso.',
      thankYouRedirectUrl: '',
    },
    published: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function createField(type: FieldType): FormField {
  const base: FormField = {
    id: generateId(),
    type,
    title: '',
    description: '',
    required: false,
  };
  const defaults: Partial<Record<FieldType, Partial<FormField>>> = {
    short_text:      { title: 'Texto curto', placeholder: 'Digite sua resposta...' },
    long_text:       { title: 'Texto longo', placeholder: 'Digite sua resposta...' },
    email:           { title: 'Qual seu e-mail?', placeholder: 'nome@exemplo.com' },
    phone:           { title: 'Qual seu telefone?', placeholder: '(00) 00000-0000' },
    number:          { title: 'Número', placeholder: '0' },
    url:             { title: 'URL', placeholder: 'https://' },
    multiple_choice: { title: 'Múltipla escolha', options: ['Opção 1', 'Opção 2', 'Opção 3'], allowMultiple: false },
    checkbox:        { title: 'Caixas de seleção', options: ['Opção 1', 'Opção 2', 'Opção 3'] },
    dropdown:        { title: 'Lista suspensa', options: ['Opção 1', 'Opção 2', 'Opção 3'] },
    yes_no:          { title: 'Sim ou Não?' },
    rating:          { title: 'Avaliação', maxRating: 5 },
    opinion_scale:   { title: 'Escala de opinião', minValue: 0, maxValue: 10, minLabel: 'Nada provável', maxLabel: 'Muito provável' },
    date:            { title: 'Data' },
    welcome:         { title: 'Bem-vindo!', description: 'Clique em começar para iniciar.', buttonText: 'Começar' },
    statement:       { title: 'Declaração', description: 'Texto informativo.', buttonText: 'Continuar' },
    file_upload:     { title: 'Upload de arquivo', allowedTypes: 'image/*,.pdf,.doc,.docx' },
    picture_choice:  { title: 'Escolha com imagem', options: ['Opção 1', 'Opção 2'], allowMultiple: false },
  };
  return { ...base, ...(defaults[type] || {}) };
}
