import client from './client';
import type { Task } from '../types/api';

export function getTasks(params?: { done?: boolean; highlighted?: boolean }) {
  return client.get<Task[]>('/tasks', { params });
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
