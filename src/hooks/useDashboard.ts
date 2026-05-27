import { useQuery } from '@tanstack/react-query';
import { getDashboard } from '../api/users';

export function useDashboard(enabled = true) {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboard,
    staleTime: 2 * 60 * 1000,
    enabled,
  });
}
