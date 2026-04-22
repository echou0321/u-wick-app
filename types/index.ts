export type ChatRole = 'assistant' | 'user';

export type FlowMode = 'planning' | 'proactive';

export type SchedulePreviewKey = 'info200' | 'math207';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  text: string;
  quickReplies?: string[];
  // Side effects rendered inline with a message
  showUpload?: boolean;
  showCanvas?: boolean;
  showSchedulePreview?: SchedulePreviewKey;
  showNotifPreview?: boolean;
  showStatusCard?: boolean;
  showChecklist?: boolean;
  showDeadlineAdded?: boolean;
  isProactive?: boolean;
  isUpload?: boolean;
  isCanvas?: boolean;
}

export interface ScriptStep {
  id: number;
  role: ChatRole;
  text: string;
  next?: number;
  quickReplies?: string[];
  // Same side-effect flags used in ChatMessage
  showUpload?: boolean;
  showCanvas?: boolean;
  showSchedulePreview?: SchedulePreviewKey;
  showNotifPreview?: boolean;
  showStatusCard?: boolean;
  showChecklist?: boolean;
  showDeadlineAdded?: boolean;
  isProactive?: boolean;
  isUpload?: boolean;
  isCanvas?: boolean;
}

export interface Task {
  id: string;
  label: string;
  due: string;
  done: boolean;
  highlight?: boolean;
}

export interface ScheduleBlock {
  id: string;
  time: string;
  course: string;
  room?: string;
  color: string;
  day?: string;
}

export interface ChecklistItem {
  label: string;
  done: boolean;
  link?: boolean;
}

export interface UserProfile {
  name: string;
  targetMajor: string;
  status: 'pre-major' | 'in-major';
  gpa?: number;
}

export interface AppState {
  user: UserProfile;
  tasks: Task[];
  todaySchedule: ScheduleBlock[];
  studyBlocks: ScheduleBlock[];
  notifActive: boolean;
  proactiveAlertDismissed: boolean;
  deadlineAdded: boolean;
  activeChatFlow: FlowMode;
}
