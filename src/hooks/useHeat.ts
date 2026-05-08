import { useQuery } from '@tanstack/react-query';
import { getHeat } from '../api/schedule';
import type { HeatEntry } from '../types/api';

export function useHeat(start: string, weeks = 8) {
  return useQuery<HeatEntry[]>({
    queryKey: ['heat', start, weeks],
    queryFn: () => getHeat({ start, weeks }).then((r) => r.data),
    staleTime: 10 * 60 * 1000,
    enabled: !!start,
  });
}
