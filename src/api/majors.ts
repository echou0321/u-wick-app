import client from './client';
import type { Major } from '../types/api';

export function getMajors() {
  return client.get<Major[]>('/majors').then((res) => res.data);
}

export function getMajor(majorReqId: string) {
  return client.get<Major>(`/majors/${majorReqId}`).then((res) => res.data);
}

