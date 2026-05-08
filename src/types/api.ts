export type FlowMode = 'planning' | 'proactive' | 'advising' | 'quarter_planning' | 'free';
export type EnrollmentStatus = 'pre-major' | 'in-major';
export type ParseStatus = 'pending' | 'extracting' | 'ready' | 'failed';
export type BlockType = 'class' | 'study' | 'commitment' | 'other';
export type TaskSource = 'ics' | 'syllabus' | 'manual' | 'ai';

export interface User {
  id: string;
  email: string;
  display_name: string;
  major: string | null;
  enrollment_status: EnrollmentStatus | null;
  ics_url: string | null;
  ics_last_synced: string | null;
  onboarding_complete: boolean;
  notif_active: boolean;
  expo_push_token: string | null;
  current_quarter: string | null;
  created_at: string;
}

// column is `name` not `title` — backend schema deviation
export interface Course {
  id: string;
  user_id: string;
  name: string;
  code: string | null;
  quarter: string | null;
  color: string | null;
  source: string;
  created_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  course_id: string | null;
  title: string;
  due_date: string | null;
  weight: number;
  tag: string | null;
  source: TaskSource;
  ics_uid: string | null;
  done: boolean;
  highlighted: boolean;
  created_at: string;
}

export interface ScheduleBlock {
  id: string;
  user_id: string;
  course_id: string | null;
  title: string;
  start_time: string;
  end_time: string;
  block_type: BlockType;
  source: string;
  color: string | null;
  created_at: string;
}

export interface HeatEntry {
  week_start: string;
  raw_score: number;
  normalized: number;
  label: 'light' | 'moderate' | 'heavy' | 'intense';
  color: string;
}

export interface Major {
  id: string;
  major_name: string;
  department: string | null;
  source_url: string | null;
  application_deadline: string | null;
  min_gpa: number | null;
  prereqs: Array<{ course: string; min_grade: string }>;
  checklist_steps: string[];
  last_scraped: string | null;
  notes: string | null;
}

export interface MajorGoal {
  id: string;
  user_id: string;
  major_req_id: string;
  status: 'active' | 'dropped' | 'achieved';
  declared_at: string;
  application_deadline: string | null;
  checklist_progress: Record<string, boolean>;
  reminder_30d_sent: boolean;
  reminder_7d_sent: boolean;
  reminder_1d_sent: boolean;
  major: Major;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  flow: FlowMode;
  created_at: string;
}

export interface TaskSubtask {
  id: string;
  task_id: string;
  title: string;
  suggested_start: string | null;
  done: boolean;
  sort_order: number;
}

export interface SyllabusMeta {
  id: string;
  user_id: string;
  course_id: string;
  quarter: string;
  blob_url: string | null;
  extracted_text: string | null;
  parse_status: ParseStatus;
  parsed_at: string | null;
}

export interface IcsStatus {
  connected: boolean;
  ics_url: string | null;
  last_synced: string | null;
}
