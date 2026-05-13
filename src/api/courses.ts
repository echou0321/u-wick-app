import client from './client';
import type { Course } from '../types/api';

export function getCourses() {
  return client.get<Course[]>('/courses');
}
