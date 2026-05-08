import { useQuery } from '@tanstack/react-query';
import { getMajorGoals, type MajorGoalRow } from '../api/goals';

export function useMajorGoals(status: 'active' | 'dropped' | 'achieved' | 'all' = 'active') {
  return useQuery({
    queryKey: ['goals', 'major', status],
    queryFn: () => getMajorGoals(status),
    staleTime: 5 * 60 * 1000,
  });
}

export type { MajorGoalRow };

