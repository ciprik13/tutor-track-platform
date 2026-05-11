import { apiClient } from './api';

export interface Student {
  id: string;
  tutorId: string;
  name: string;
  subject?: string;
  grade?: string;
  status: 'active' | 'inactive';
  phone?: string;
  email?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface CreateStudentPayload {
  name: string;
  subject?: string;
  grade?: string;
  status?: 'active' | 'inactive';
  phone?: string;
  email?: string;
  notes?: string;
}

export const studentsApi = {
  getAll: (limit = 100, offset = 0) =>
    apiClient
      .get<PaginatedResponse<Student>>('/students', { params: { limit, offset } })
      .then((r) => r.data),

  getOne: (id: string) =>
    apiClient.get<Student>(`/students/${id}`).then((r) => r.data),

  create: (payload: CreateStudentPayload) =>
    apiClient.post<Student>('/students', payload).then((r) => r.data),

  update: (id: string, payload: Partial<CreateStudentPayload>) =>
    apiClient.patch<Student>(`/students/${id}`, payload).then((r) => r.data),

  remove: (id: string) =>
    apiClient.delete(`/students/${id}`).then((r) => r.data),
};
