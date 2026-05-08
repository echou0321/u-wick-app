import client from './client';
import type { ScheduleBlock, HeatEntry } from '../types/api';

export function getSchedule(params: { start: string; end: string }) {
  return client.get<ScheduleBlock[]>('/schedule', { params });
}

export function createBlock(body: {
  title: string;
  start_time: string;
  end_time: string;
  block_type?: string;
  color?: string | null;
  course_id?: string | null;
}) {
  return client.post<ScheduleBlock>('/schedule/blocks', body);
}

export function updateBlock(
  id: string,
  body: Partial<Pick<ScheduleBlock, 'title' | 'start_time' | 'end_time' | 'color'>>,
) {
  return client.patch<ScheduleBlock>(`/schedule/blocks/${id}`, body);
}

export function deleteBlock(id: string) {
  return client.delete(`/schedule/blocks/${id}`);
}

export function getHeat(params: { start: string; weeks: number }) {
  return client.get<HeatEntry[]>('/schedule/heat', { params });
}
