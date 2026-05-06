import client from './client';
import type { User } from '../types/api';

export function getMe() {
  return client.get<User>('/users/me').then((res) => res.data);
}
