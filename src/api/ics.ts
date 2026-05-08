import client from './client';
import { IcsStatus } from '../types/api';

export async function connectIcs(icsUrl: string): Promise<{ tasks_imported: number }> {
  const res = await client.post<{ tasks_imported: number }>('/ics/connect', { icsUrl });
  return res.data;
}

export async function syncIcs(): Promise<{ synced: number }> {
  const res = await client.post<{ synced: number }>('/ics/sync');
  return res.data;
}

export async function getIcsStatus(): Promise<IcsStatus> {
  const res = await client.get<IcsStatus>('/ics/status');
  return res.data;
}

export async function disconnectIcs(): Promise<void> {
  await client.delete('/ics/disconnect');
}
