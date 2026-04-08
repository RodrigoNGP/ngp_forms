export type FieldType =
  | 'short_text' | 'long_text' | 'email' | 'phone' | 'number' | 'url'
  | 'multiple_choice' | 'checkbox' | 'dropdown' | 'yes_no'
  | 'rating' | 'opinion_scale' | 'date' | 'file_upload'
  | 'welcome' | 'statement' | 'thank_you' | 'picture_choice';

export interface FormField {
  id: string;
  type: FieldType;
  title: string;
  description: string;
  required: boolean;
  placeholder?: string;
  options?: string[];
  allowMultiple?: boolean;
  allowOther?: boolean;
  maxRating?: number;
  ratingIcon?: string;
  minValue?: number;
  maxValue?: number;
  minLabel?: string;
  maxLabel?: string;
  buttonText?: string;
  maxSize?: number;
  allowedTypes?: string;
}

export interface FormTheme {
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
  backgroundImage: string;
}

export interface FormSettings {
  showProgressBar: boolean;
  showQuestionNumbers: boolean;
  submitButtonText: string;
  thankYouTitle: string;
  thankYouMessage: string;
  thankYouRedirectUrl: string;
  gtmContainerId?: string;   // e.g. "GTM-XXXXXX"
}

export interface NGPForm {
  id: string;
  title: string;
  description: string;
  fields: FormField[];
  theme: FormTheme;
  settings: FormSettings;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ResponseAnswer {
  fieldTitle: string;
  fieldType: FieldType;
  value: string | string[] | number | null;
}

export interface FormResponse {
  id: string;
  answers: Record<string, ResponseAnswer>;
  submittedAt: string;
}

// ── Session Tracking ────────────────────────────────────────────
export interface FormStep {
  fieldId: string;
  fieldTitle: string;
  fieldType: FieldType;
  viewedAt: string;
  answeredAt?: string;
  timeToAnswerMs?: number;
  answer?: string | string[] | number | null;
  revisits: number;
}

export type SessionStatus = 'in_progress' | 'completed' | 'abandoned';

export interface FormSession {
  id: string;
  formId: string;
  status: SessionStatus;
  startedAt: string;
  completedAt?: string;
  totalTimeMs?: number;
  lastFieldId?: string;
  steps: FormStep[];
}
