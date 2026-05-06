import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTasks, updateTask, deleteTask } from '../api/tasks';
import type { Task } from '../types/api';

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
