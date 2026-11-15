export type Role = "patient" | "healthcare_worker" | "administrator";

export type DocumentCategory =
  | "prescription"
  | "discharge_summary"
  | "medical_report";

export type ContentStatus = "draft" | "published";

export type FollowUpStatus = "scheduled" | "completed" | "cancelled";

export interface User {
  id: number;
  full_name: string;
  email: string;
  phone: string | null;
  role: Role;
  preferred_language: string;
  is_active: boolean;
  is_approved: boolean;
  created_at?: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

export interface RegisterPayload {
  full_name: string;
  email: string;
  phone?: string | null;
  password: string;
  preferred_language: string;
}

export interface ProfileUpdatePayload {
  full_name?: string;
  phone?: string | null;
  preferred_language?: string;
}

export interface MedicalDocument {
  id: number;
  original_filename: string;
  category: DocumentCategory;
  content_type: string;
  size_bytes: number;
  created_at: string;
}

export interface HistoryItem {
  document_id: number;
  original_filename: string;
  category: DocumentCategory;
  upload_date: string;
  file_type: string;
}

export interface HealthContent {
  id: number;
  title: string;
  content: string;
  category: string;
  language: string;
  author_id: number;
  author_name: string;
  status: ContentStatus;
  created_at: string;
  updated_at: string;
}

export interface HealthContentPayload {
  title: string;
  content: string;
  category: string;
  language: string;
  status: ContentStatus;
}

export interface AdminUser extends User {
  created_at: string;
}

export interface AdminWorker extends AdminUser {
  assigned_patient_count: number;
  authored_content_count: number;
}

export interface AdminOverview {
  total_patients: number;
  total_workers: number;
  approved_workers: number;
  pending_workers: number;
  total_documents: number;
  total_content: number;
  published_content: number;
  draft_content: number;
  active_assignments: number;
  scheduled_follow_ups: number;
  overdue_follow_ups: number;
  database_status: string;
  api_status: string;
}

export interface LanguageCount {
  language: string;
  count: number;
}

export interface AdminAnalytics {
  patient_registrations: number;
  worker_registrations: number;
  approved_workers: number;
  pending_workers: number;
  total_documents: number;
  documents_by_category: Record<string, number>;
  total_content: number;
  published_content: number;
  draft_content: number;
  active_assignments: number;
  scheduled_follow_ups: number;
  completed_follow_ups: number;
  language_preferences: LanguageCount[];
  content_languages: LanguageCount[];
}

export interface AdminMonitoring {
  api_status: string;
  database_status: string;
  application_version: string;
  checked_at: string;
  database_detail: string;
}

export interface AdminAssignment {
  id: number;
  worker_id: number;
  worker_name: string;
  patient_id: number;
  patient_name: string;
  assigned_by_id: number | null;
  assigned_by_name: string | null;
  created_at: string;
}

export interface WorkerPatientSummary {
  id: number;
  full_name: string;
  phone: string | null;
  preferred_language: string;
  created_at: string;
  document_count: number;
  scheduled_follow_ups: number;
}

export interface WorkerPatientDetail extends WorkerPatientSummary {
  documents: MedicalDocument[];
}

export interface WorkerOverview {
  assigned_patients: number;
  scheduled_follow_ups: number;
  overdue_follow_ups: number;
  completed_follow_ups: number;
  authored_content: number;
  published_content: number;
  draft_content: number;
}

export interface FollowUp {
  id: number;
  worker_id: number;
  patient_id: number;
  patient_name: string;
  due_date: string;
  status: FollowUpStatus;
  notes: string | null;
  is_overdue: boolean;
  created_at: string;
  updated_at: string;
}

export interface FollowUpPayload {
  patient_id: number;
  due_date: string;
  status?: FollowUpStatus;
  notes?: string | null;
}

export interface FollowUpUpdatePayload {
  due_date?: string;
  status?: FollowUpStatus;
  notes?: string | null;
}
