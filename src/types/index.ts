// ─── Auth ────────────────────────────────────────────────────────────────────
export interface AuthTokens {
  access: string
  refresh: string
}

export interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  full_name: string
  tenant_id: string
  tenant_slug: string
  is_super_admin: boolean
  permissions: Record<string, boolean | string>
  enabled_modules: string[]
  preferences?: {
    theme?: 'light' | 'dark'
  }
}

// ─── Pagination ──────────────────────────────────────────────────────────────
export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface CursorPaginatedResponse<T> {
  next: string | null
  previous: string | null
  results: T[]
}

// ─── Enums ───────────────────────────────────────────────────────────────────
export type JobType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP'
export type ExperienceLevel = 'ENTRY' | 'MID' | 'SENIOR' | 'LEAD'
export type JobStatus = 'DRAFT' | 'OPEN' | 'PAUSED' | 'CLOSED'

export type ApplicantSource = 'MANUAL' | 'WEBSITE' | 'LINKEDIN' | 'REFERRAL' | 'IMPORT'

export type ApplicationStatus =
  | 'APPLIED'
  | 'AI_SCREENING'
  | 'AI_COMPLETED'
  | 'SHORTLISTED'
  | 'INTERVIEW_SCHEDULED'
  | 'INTERVIEWED'
  | 'OFFER'
  | 'HIRED'
  | 'REJECTED'
  | 'WITHDRAWN'

export type CallProvider = 'OMNIDIM' | 'BOLNA'
export type CallStatus =
  | 'QUEUED'
  | 'INITIATED'
  | 'RINGING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'FAILED'
  | 'NO_ANSWER'
  | 'BUSY'

export type ScorecardRecommendation = 'STRONG_YES' | 'YES' | 'MAYBE' | 'NO' | 'STRONG_NO'

export type InterviewType = 'AI_VOICE' | 'HR_SCREEN' | 'TECHNICAL' | 'CULTURE_FIT' | 'FINAL'
export type InterviewStatus =
  | 'SCHEDULED'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW'

export type NotificationType = 'EMAIL' | 'WHATSAPP' | 'IN_APP'
export type NotificationCategory = 'APPLICATION' | 'INTERVIEW' | 'CALL' | 'SYSTEM'

export type ActivityVerb =
  | 'created'
  | 'updated'
  | 'deleted'
  | 'status_changed'
  | 'published'
  | 'closed'
  | 'triggered_call'
  | 'call_completed'
  | 'call_failed'
  | 'interview_scheduled'
  | 'interview_completed'
  | 'interview_cancelled'
  | 'scorecard_created'
  | 'note_added'
  | 'bulk_action'

// ─── Jobs ────────────────────────────────────────────────────────────────────
export interface JobListItem {
  id: string
  title: string
  department: string
  location: string
  job_type: JobType
  experience_level: ExperienceLevel
  status: JobStatus
  application_count: number
  voice_agent_id: string | null
  voice_agent_provider: string
  published_at: string | null
  closes_at: string | null
  created_at: string
}

export interface JobDetail {
  id: string
  tenant_id: string
  owner_user_id: string
  title: string
  department: string
  location: string
  job_type: JobType
  experience_level: ExperienceLevel
  salary_min: string | null
  salary_max: string | null
  description: string
  requirements: string
  status: JobStatus
  application_count: number
  voice_agent_id: string | null
  voice_agent_provider: string
  voice_agent_config: {
    auto_shortlist_threshold?: number
    auto_reject_threshold?: number
  }
  published_at: string | null
  closes_at: string | null
  created_at: string
  updated_at: string
}

export interface JobFormData {
  title: string
  department: string
  location: string
  job_type: JobType
  experience_level: ExperienceLevel
  salary_min?: string
  salary_max?: string
  description: string
  requirements: string
  status: JobStatus
  voice_agent_id?: string
  voice_agent_provider?: string
  voice_agent_config?: {
    auto_shortlist_threshold?: number
    auto_reject_threshold?: number
  }
  published_at?: string | null
  closes_at?: string | null
}

export interface JobStats {
  total_applications: number
  avg_score: number
  by_status: Record<string, number>
}

// ─── Applicants ──────────────────────────────────────────────────────────────
export interface ApplicantListItem {
  id: string
  first_name: string
  last_name: string
  full_name: string
  email: string
  phone: string
  source: ApplicantSource
  skills: string[]
  experience_years: number
  current_role: string
  current_company: string
  tags: string[]
  created_at: string
}

export interface ApplicantApplication {
  id: string
  job_id: string
  job_title: string
  status: ApplicationStatus
  score: string | null
  created_at: string
}

export interface ApplicantDetail {
  id: string
  tenant_id: string
  owner_user_id: string
  first_name: string
  last_name: string
  full_name: string
  email: string
  phone: string
  resume_url: string
  linkedin_url: string
  portfolio_url: string
  skills: string[]
  experience_years: number
  current_company: string
  current_role: string
  notes: string
  source: ApplicantSource
  tags: string[]
  created_at: string
  updated_at: string
  applications: ApplicantApplication[]
}

export interface ApplicantFormData {
  first_name: string
  last_name: string
  email: string
  phone: string
  resume_url?: string
  linkedin_url?: string
  portfolio_url?: string
  skills?: string[]
  experience_years?: number
  current_company?: string
  current_role?: string
  notes?: string
  source: ApplicantSource
  tags?: string[]
}

// ─── Pipeline ────────────────────────────────────────────────────────────────
export interface PipelineStage {
  id: string
  tenant_id: string
  owner_user_id: string
  name: string
  slug: string
  order: number
  color: string
  is_default: boolean
  is_terminal: boolean
  auto_action: Record<string, unknown>
  created_at: string
  updated_at: string
}

// ─── Applications ─────────────────────────────────────────────────────────────
export interface ApplicationListItem {
  id: string
  job_id: string
  job_title: string
  applicant_id: string
  applicant_name: string
  applicant_email: string
  status: ApplicationStatus
  score: string | null
  created_at: string
  updated_at: string
}

export interface CallRecordSummary {
  id: string
  provider: CallProvider
  provider_call_id: string
  phone: string
  status: CallStatus
  duration: number
  summary: string
  recording_url: string
  started_at: string | null
  ended_at: string | null
  created_at: string
}

export interface ScorecardSummary {
  id: string
  communication_score: string
  knowledge_score: string
  confidence_score: string
  relevance_score: string
  overall_score: string
  recommendation: ScorecardRecommendation
  summary: string
  strengths: string[]
  weaknesses: string[]
  created_at: string
}

export interface InterviewSummary {
  id: string
  interview_type: InterviewType
  scheduled_at: string
  duration_minutes: number
  interviewer_name: string
  interviewer_email: string
  status: InterviewStatus
  meeting_link: string
  feedback: string
  rating: number | null
  created_at: string
}

export interface ApplicationDetail {
  id: string
  tenant_id: string
  owner_user_id: string
  job_id: string
  job: {
    id: string
    title: string
    department: string
    location: string
    job_type: JobType
    experience_level: ExperienceLevel
    status: JobStatus
  }
  applicant_id: string
  applicant: {
    id: string
    first_name: string
    last_name: string
    email: string
    phone: string
    skills: string[]
    experience_years: number
    current_role: string
    current_company: string
    source: ApplicantSource
  }
  status: ApplicationStatus
  score: string | null
  rejection_reason: string
  notes: string
  metadata: Record<string, unknown>
  call_records: CallRecordSummary[]
  scorecards: ScorecardSummary[]
  interviews: InterviewSummary[]
  created_at: string
  updated_at: string
}

export interface ApplicationFormData {
  job: string
  applicant: string
  status: ApplicationStatus
  notes?: string
}

// ─── Call Records ─────────────────────────────────────────────────────────────
export interface CallRecordListItem {
  id: string
  application_id: string
  provider: CallProvider
  status: CallStatus
  phone: string
  duration: number
  summary: string
  started_at: string | null
  ended_at: string | null
  created_at: string
  provider_call_id: string
  voice_agent_id: string
}

export interface ScorecardDetail {
  id: string
  communication_score: string
  knowledge_score: string
  confidence_score: string
  relevance_score: string
  overall_score: string
  recommendation: ScorecardRecommendation
  summary: string
  strengths: string[]
  weaknesses: string[]
  detailed_feedback: Record<string, string>
}

export interface CallRecordDetail {
  id: string
  tenant_id: string
  owner_user_id: string
  application_id: string
  provider: CallProvider
  voice_agent_id: string
  provider_call_id: string
  phone: string
  status: CallStatus
  duration: number
  transcript: string
  recording_url: string
  summary: string
  raw_response: Record<string, unknown>
  started_at: string | null
  ended_at: string | null
  error_message: string
  created_at: string
  updated_at: string
  scorecard: ScorecardDetail | null
}

export interface VoiceAgent {
  id: string
  name: string
  provider: CallProvider
  is_active?: boolean
  isActive?: boolean
  description?: string
  voiceLanguage?: string
  callType?: string
  created_at?: string
}

// ─── Call Queues ──────────────────────────────────────────────────────────────
export type CallQueueStatus = 'DRAFT' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'CANCELLED'
export type CallQueueItemStatus = 'PENDING' | 'CALLING' | 'COMPLETED' | 'FAILED' | 'SKIPPED' | 'CANCELLED'

export interface CallQueueConfig {
  max_concurrent_calls: number
  delay_between_calls_seconds: number
  max_retries: number
  call_window_start: string
  call_window_end: string
  timezone: string
  auto_shortlist_threshold: number
  auto_reject_threshold: number
  filter_statuses: string[]
}

export interface CallQueue {
  id: string
  name: string
  job_id: string
  job_title: string
  voice_agent_id: string
  status: CallQueueStatus
  config: CallQueueConfig
  total_queued: number
  total_called: number
  total_completed: number
  total_failed: number
  created_at: string
  updated_at: string
}

export interface CallQueueItem {
  id: string
  queue_id: string
  application_id: string
  applicant_name: string
  applicant_email: string
  applicant_phone: string
  job_title: string
  position: number
  status: CallQueueItemStatus
  attempts: number
  score: number | null
  call_record_id: string | null
  last_attempt_at: string | null
  error_message: string
  completed_at: string | null
  created_at: string
}

// ─── Scorecards ──────────────────────────────────────────────────────────────
export interface ScorecardListItem {
  id: string
  application_id: string
  overall_score: string
  communication_score: string
  knowledge_score: string
  confidence_score: string
  relevance_score: string
  recommendation: ScorecardRecommendation
  summary: string
  created_at: string
}

// ─── Interviews ──────────────────────────────────────────────────────────────
export interface InterviewListItem {
  id: string
  application_id: string
  interview_type: InterviewType
  scheduled_at: string
  duration_minutes: number
  interviewer_name: string
  interviewer_email: string
  status: InterviewStatus
  meeting_link: string
  calendar_synced: boolean
  applicant_name: string
  applicant_email: string
  created_at: string
}

export interface InterviewDetail {
  id: string
  tenant_id: string
  owner_user_id: string
  application_id: string
  interview_type: InterviewType
  scheduled_at: string
  duration_minutes: number
  interviewer_user_id: string | null
  interviewer_name: string
  interviewer_email: string
  status: InterviewStatus
  meeting_link: string
  calendar_event_id: string
  calendar_synced: boolean
  feedback: string
  rating: number | null
  applicant_name: string
  applicant_email: string
  created_at: string
  updated_at: string
}

export interface InterviewFormData {
  application: string
  applicant_name?: string
  interview_type: InterviewType
  scheduled_at: string
  duration_minutes: number
  interviewer_user_id?: string | null
  interviewer_name: string
  interviewer_email: string
  meeting_link?: string
  calendar_event_id?: string
}

// ─── Analytics ───────────────────────────────────────────────────────────────
export interface DashboardMetrics {
  total_jobs_open: number
  total_applications: number
  total_calls_completed: number
  avg_candidate_score: number
  applications_today: number
  calls_today: number
  shortlisted_count: number
  offers_count: number
  hiring_conversion_rate: number
}

export interface FunnelItem {
  status: string
  count: number
}

export interface ScoreDistributionItem {
  range: string
  count: number
}

export interface TimelineItem {
  date: string
  applications: number
  calls: number
  hires: number
}

// ─── Notifications ───────────────────────────────────────────────────────────
export interface Notification {
  id: string
  tenant_id: string
  owner_user_id: string
  recipient_user_id: string
  notification_type: NotificationType
  category: NotificationCategory
  title: string
  message: string
  data: Record<string, unknown>
  is_read: boolean
  read_at: string | null
  sent_at: string
  created_at: string
  updated_at: string
}

// ─── Activity ─────────────────────────────────────────────────────────────────
export interface Activity {
  id: string
  tenant_id: string
  actor_user_id: string
  actor_email: string
  verb: ActivityVerb
  resource_type: string
  resource_id: string
  resource_label: string
  before: Record<string, unknown>
  after: Record<string, unknown>
  metadata: Record<string, unknown>
  created_at: string
}
