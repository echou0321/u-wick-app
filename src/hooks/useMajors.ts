import { useQuery } from '@tanstack/react-query';
import { getMajors } from '../api/majors';
import type { Major } from '../types/api';

export function useMajors() {
  return useQuery({
    queryKey: ['majors'],
    queryFn: () => getMajors(),
    staleTime: 60 * 60 * 1000,
  });
}

export type { Major };

