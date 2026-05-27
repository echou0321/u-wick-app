import client from './client';
import type { Task } from '../types/api';

export interface ExtractedTask {
  title: string;
  due_date: string | null;
  weight: number;
}

export interface SyllabusExtractResponse {
  jobId: string;
  tasks: ExtractedTask[];
}

export function extractSyllabus(course_id: string | null, quarter: string, text: string) {
  return client
    .post<SyllabusExtractResponse>('/syllabus', { course_id, quarter, text })
    .then((res) => res.data);
}

export function confirmSyllabus(jobId: string, tasks: ExtractedTask[]) {
  return client
    .post<{ tasks: Task[] }>(`/syllabus/confirm/${jobId}`, { tasks })
    .then((res) => res.data);
}
