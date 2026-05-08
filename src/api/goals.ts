import client from './client';

export interface MajorGoalRow {
  id: string;
  major_req_id: string;
  status: 'active' | 'dropped' | 'achieved';
  declared_at: string;
  updated_at: string;
  application_deadline: string | null;
  checklist_progress: Record<string, boolean>;
  reminder_30d_sent: boolean;
  reminder_7d_sent: boolean;
  reminder_1d_sent: boolean;
  major_name: string;
  department: string | null;
  min_gpa: number | null;
}

export function getMajorGoals(status: 'active' | 'dropped' | 'achieved' | 'all' = 'active') {
  return client.get<MajorGoalRow[]>(`/goals/major`, {
    params: status ? { status } : undefined,
  }).then((res) => res.data);
}

export function createMajorGoal(major_req_id: string, application_deadline?: string | null) {
  return client
    .post('/goals/major', {
      major_req_id,
      application_deadline: application_deadline ?? undefined,
    })
    .then((res) => res.data);
}

export function dropOrAchieveMajorGoal(goalId: string, status: 'dropped' | 'achieved') {
  return client.patch(`/goals/major/${goalId}`, { status }).then((res) => res.data);
}

export function updateMajorChecklist(goalId: string, step_id: string, completed: boolean) {
  return client
    .patch(`/goals/major/${goalId}/checklist`, { step_id, completed })
    .then((res) => res.data);
}

