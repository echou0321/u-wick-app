import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getSchedule,
  createBlock,
  updateBlock,
  deleteBlock,
} from '../api/schedule';
import type { ScheduleBlock } from '../types/api';

export function useScheduleBlocks(start: string, end: string) {
  return useQuery<ScheduleBlock[]>({
    queryKey: ['schedule', start, end],
    queryFn: () => getSchedule({ start, end }).then((r) => r.data),
    staleTime: 2 * 60 * 1000,
    enabled: !!start && !!end,
  });
}

export function useCreateScheduleBlock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Parameters<typeof createBlock>[0]) =>
      createBlock(body).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['schedule'] });
      qc.invalidateQueries({ queryKey: ['heat'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdateScheduleBlock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: Parameters<typeof updateBlock>[1];
    }) => updateBlock(id, body).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['schedule'] });
      qc.invalidateQueries({ queryKey: ['heat'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useDeleteScheduleBlock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteBlock(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['schedule'] });
      qc.invalidateQueries({ queryKey: ['heat'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
