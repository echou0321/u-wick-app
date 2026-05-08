import { useQuery } from '@tanstack/react-query';
import { getMe } from '../api/users';

export function useUser() {
  return useQuery({
    queryKey: ['user'],
    queryFn: () => getMe(),
    staleTime: 5 * 60 * 1000,
  });
}
