import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTasks, createTask, updateTask, deleteTask, getSubtasks, triggerBreakdown } from '../api/tasks';
import type { Task, TaskSubtask } from '../types/api';

export interface TaskFilters {
  done?: boolean;
  highlighted?: boolean;
}

export function useTasks(filters?: TaskFilters) {
  return useQuery({
    queryKey: ['tasks', filters ?? {}],
    queryFn: () => getTasks(filters).then((r) => r.data),
    staleTime: 2 * 60 * 1000,
  });
}

export function useTask(id: string): Task | undefined {
  const qc = useQueryClient();
  const cached: Task[] = [];
  qc.getQueriesData<Task[]>({ queryKey: ['tasks'] }).forEach(([, data]) => {
    if (data) cached.push(...data);
  });
  return cached.find((t) => t.id === id);
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: Parameters<typeof updateTask>[1];
    }) => updateTask(id, body).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTask(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Parameters<typeof createTask>[0]) =>
      createTask(body).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });
}

export function useSubtasks(taskId: string) {
  return useQuery<TaskSubtask[]>({
    queryKey: ['subtasks', taskId],
    queryFn: () => getSubtasks(taskId).then((r) => r.data),
    staleTime: 2 * 60 * 1000,
  });
}

export function useBreakdownTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (taskId: string) => triggerBreakdown(taskId).then((r) => r.data),
    onSuccess: (_, taskId) => qc.invalidateQueries({ queryKey: ['subtasks', taskId] }),
  });
}
