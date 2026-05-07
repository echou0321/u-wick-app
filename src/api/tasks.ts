import client from './client';
import type { Task, TaskSubtask } from '../types/api';

export function getTasks(params?: { done?: boolean; highlighted?: boolean }) {
  return client.get<Task[]>('/tasks', { params });
}

export function createTask(body: {
  title: string;
  due_date?: string | null;
  weight?: number;
  course_id?: string | null;
}) {
  return client.post<Task>('/tasks', body);
}

export function updateTask(
  id: string,
  body: Partial<Pick<Task, 'done' | 'highlighted' | 'title' | 'due_date' | 'weight'>>,
) {
  return client.patch<Task>(`/tasks/${id}`, body);
}

export function deleteTask(id: string) {
  return client.delete(`/tasks/${id}`);
}

export function getSubtasks(taskId: string) {
  return client.get<TaskSubtask[]>(`/tasks/${taskId}/subtasks`);
}

export function triggerBreakdown(taskId: string) {
  return client.post<TaskSubtask[]>(`/tasks/${taskId}/breakdown`);
}
