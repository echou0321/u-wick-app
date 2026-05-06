import client from './client';
import type { User } from '../types/api';

interface AuthResponse {
  token: string;
  user: User;
}

export function login(email: string, password: string) {
  return client.post<AuthResponse>('/auth/login', { email, password });
}

export function register(displayName: string, email: string, password: string) {
  return client.post<AuthResponse>('/auth/register', {
    display_name: displayName,
    email,
    password,
  });
}
