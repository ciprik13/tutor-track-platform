import { apiClient } from './api';

export interface Lesson {
  id: string;
  tutorId: string;
  studentId: string;
  date: string;
  durationMinutes: number;
  price: string;
  isPaid: boolean;
  gradeSnapshot?: string;
  studentNameSnapshot: string;
  subjectSnapshot?: string;
  googleCalendarEventId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  student?: { id: string; name: string; subject?: string };
}

export interface CreateLessonPayload {
  studentId: string;
  date: string;
  durationMinutes: number;
  price: number;
  isPaid?: boolean;
  googleCalendarEventId?: string;
  notes?: string;
}

export const lessonsApi = {
  getAll: (limit = 100, offset = 0) =>
    apiClient
      .get('/lessons', { params: { limit, offset } })
      .then((r) => r.data),

  getOne: (id: string) =>
    apiClient.get<Lesson>(`/lessons/${id}`).then((r) => r.data),

  create: (payload: CreateLessonPayload) =>
    apiClient.post<Lesson>('/lessons', payload).then((r) => r.data),

  update: (id: string, payload: Partial<CreateLessonPayload>) =>
    apiClient.patch<Lesson>(`/lessons/${id}`, payload).then((r) => r.data),

  remove: (id: string) =>
    apiClient.delete(`/lessons/${id}`).then((r) => r.data),
};
