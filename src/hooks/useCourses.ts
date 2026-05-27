import { useQuery } from '@tanstack/react-query';
import { getCourses } from '../api/courses';

export function useCourses() {
  return useQuery({
    queryKey: ['courses'],
    queryFn: () => getCourses().then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });
}
