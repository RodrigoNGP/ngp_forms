import { supabase } from '@/lib/supabase';
import { generateId } from '@/lib/storage';
import type { NGPForm, FormResponse, FormSession } from '@/types/form';

// ── Helper: map snake_case DB row → camelCase NGPForm ──────────────────────

function rowToForm(row: Record<string, unknown>): NGPForm {
  return {
    id: row.id as string,
    title: row.title as string,
    description: row.description as string,
    fields: (row.fields as NGPForm['fields']) ?? [],
    theme: row.theme as NGPForm['theme'],
    settings: row.settings as NGPForm['settings'],
    published: row.published as boolean,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function formToRow(form: NGPForm): Record<string, unknown> {
  return {
    id: form.id,
    title: form.title,
    description: form.description,
    fields: form.fields,
    theme: form.theme,
    settings: form.settings,
    published: form.published,
    created_at: form.createdAt,
    updated_at: new Date().toISOString(),
  };
}

function rowToResponse(row: Record<string, unknown>): FormResponse {
  return {
    id: row.id as string,
    answers: row.answers as FormResponse['answers'],
    submittedAt: row.submitted_at as string,
  };
}

function rowToSession(row: Record<string, unknown>): FormSession {
  return {
    id: row.id as string,
    formId: row.form_id as string,
    status: row.status as FormSession['status'],
    startedAt: row.started_at as string,
    completedAt: (row.completed_at as string | null) ?? undefined,
    totalTimeMs: (row.total_time_ms as number | null) ?? undefined,
    lastFieldId: (row.last_field_id as string | null) ?? undefined,
    steps: (row.steps as FormSession['steps']) ?? [],
  };
}

// ── Forms ──────────────────────────────────────────────────────────────────

export async function getForms(): Promise<NGPForm[]> {
  const { data, error } = await supabase
    .from('forms')
    .select('*')
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToForm);
}

export async function getForm(id: string): Promise<NGPForm | null> {
  const { data, error } = await supabase
    .from('forms')
    .select('*')
    .eq('id', id)
    .single();
  if (error) {
    if (error.code === 'PGRST116') return null; // not found
    throw error;
  }
  return data ? rowToForm(data) : null;
}

export async function saveForm(form: NGPForm): Promise<NGPForm> {
  const row = formToRow(form);
  const { data, error } = await supabase
    .from('forms')
    .upsert(row, { onConflict: 'id' })
    .select()
    .single();
  if (error) throw error;
  return rowToForm(data);
}

export async function deleteForm(id: string): Promise<void> {
  // Delete related data first
  await supabase.from('sessions').delete().eq('form_id', id);
  await supabase.from('responses').delete().eq('form_id', id);
  const { error } = await supabase.from('forms').delete().eq('id', id);
  if (error) throw error;
}

export async function duplicateForm(id: string): Promise<NGPForm | null> {
  const form = await getForm(id);
  if (!form) return null;
  const newForm: NGPForm = JSON.parse(JSON.stringify(form));
  newForm.id = generateId();
  newForm.title = form.title + ' (cópia)';
  newForm.published = false;
  newForm.createdAt = new Date().toISOString();
  newForm.updatedAt = new Date().toISOString();
  return saveForm(newForm);
}

// ── Responses ──────────────────────────────────────────────────────────────

export async function getResponses(formId: string): Promise<FormResponse[]> {
  const { data, error } = await supabase
    .from('responses')
    .select('*')
    .eq('form_id', formId)
    .order('submitted_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToResponse);
}

export async function saveResponse(
  formId: string,
  answers: FormResponse['answers'],
): Promise<FormResponse> {
  const row = {
    id: generateId(),
    form_id: formId,
    answers,
    submitted_at: new Date().toISOString(),
  };
  const { data, error } = await supabase
    .from('responses')
    .insert(row)
    .select()
    .single();
  if (error) throw error;
  return rowToResponse(data);
}

export async function getAllResponseCounts(): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from('responses')
    .select('form_id');
  if (error) throw error;
  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    const fid = row.form_id as string;
    counts[fid] = (counts[fid] ?? 0) + 1;
  }
  return counts;
}

export async function getResponseCount(formId: string): Promise<number> {
  const { count, error } = await supabase
    .from('responses')
    .select('id', { count: 'exact', head: true })
    .eq('form_id', formId);
  if (error) throw error;
  return count ?? 0;
}

// ── Sessions ───────────────────────────────────────────────────────────────

export async function getSessions(formId: string): Promise<FormSession[]> {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('form_id', formId)
    .order('started_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToSession);
}

export async function createSession(formId: string): Promise<FormSession> {
  const row = {
    id: generateId(),
    form_id: formId,
    status: 'in_progress',
    started_at: new Date().toISOString(),
    steps: [],
  };
  const { data, error } = await supabase
    .from('sessions')
    .insert(row)
    .select()
    .single();
  if (error) throw error;
  return rowToSession(data);
}

export async function updateSession(session: FormSession): Promise<void> {
  const { error } = await supabase
    .from('sessions')
    .update({
      status: session.status,
      last_field_id: session.lastFieldId ?? null,
      steps: session.steps,
      completed_at: session.completedAt ?? null,
      total_time_ms: session.totalTimeMs ?? null,
    })
    .eq('id', session.id);
  if (error) throw error;
}

export async function completeSession(session: FormSession): Promise<FormSession> {
  const now = new Date().toISOString();
  const totalTimeMs = Date.now() - new Date(session.startedAt).getTime();
  const updated: FormSession = { ...session, status: 'completed', completedAt: now, totalTimeMs };
  await updateSession(updated);
  return updated;
}

export async function abandonSession(session: FormSession): Promise<void> {
  const updated: FormSession = { ...session, status: 'abandoned' };
  await updateSession(updated);
}

// ── Storage: image upload ───────────────────────────────────────────────────

const BUCKET = 'form-images';

export async function uploadImage(file: File, formId: string): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'jpg';
  const path = `${formId}/${Date.now()}.${ext}`;

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type });

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(data.path);

  return publicUrl;
}

export async function deleteImage(url: string): Promise<void> {
  // Extract path from public URL
  const match = url.match(/form-images\/(.+)$/);
  if (!match) return;
  await supabase.storage.from(BUCKET).remove([match[1]]);
}
