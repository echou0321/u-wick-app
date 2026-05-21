import client from './client';
import type { User, EnrollmentStatus, Dashboard } from '../types/api';

export function getMe() {
  return client.get<User>('/users/me').then((res) => res.data);
}

export function getDashboard() {
  return client.get<Dashboard>('/users/me/dashboard').then((res) => res.data);
}

export function updateMe(body: {
  display_name?: string;
  major?: string | null;
  enrollment_status?: EnrollmentStatus | null;
  current_quarter?: string | null;
}) {
  return client.patch<User>('/users/me', body).then((res) => res.data);
}

export function completeOnboarding() {
  return client.post('/users/me/onboarding/complete').then((res) => res.data);
}

export function updatePushToken(expoPushToken: string) {
  // Backend expects { token } in the request body.
  return client.patch('/users/me/push-token', { token: expoPushToken }).then((res) => res.data);
}
