import { useQuery } from '@tanstack/react-query';
import { getIcsStatus } from '../api/ics';

export function useIcsStatus() {
  return useQuery({
    queryKey: ['ics-status'],
    queryFn: getIcsStatus,
    staleTime: 5 * 60 * 1000,
  });
}
