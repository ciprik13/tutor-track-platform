import { apiClient } from './api';

export interface Payment {
  id: string;
  tutorId: string;
  studentId: string;
  lessonId?: string | null;
  amount: string;
  month: string;
  status: 'paid' | 'unpaid' | 'partial';
  category: 'single' | 'bulk';
  paidAt?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  student?: { id: string; name: string };
  lessonPayments?: { lessonId: string; lesson: { id: string; date: string; durationMinutes: number; price: string } }[];
}

export interface CreatePaymentPayload {
  studentId: string;
  lessonId?: string;
  amount: number;
  month: string;
  status?: 'paid' | 'unpaid' | 'partial';
  category?: 'single' | 'bulk';
  paidAt?: string;
  notes?: string;
}

export interface BulkPaymentPayload {
  studentId: string;
  month: string;
  lessonIds: string[];
  amount?: number;
  notes?: string;
}

export const paymentsApi = {
  getAll: (limit = 100, offset = 0) =>
    apiClient
      .get('/payments', { params: { limit, offset } })
      .then((r) => r.data),
  getOne: (id: string) =>
    apiClient.get<Payment>(`/payments/${id}`).then((r) => r.data),
  create: (payload: CreatePaymentPayload) =>
    apiClient.post<Payment>('/payments', payload).then((r) => r.data),
  createBulk: (payload: BulkPaymentPayload) =>
    apiClient.post('/payments/bulk', payload).then((r) => r.data),
  update: (id: string, payload: Partial<CreatePaymentPayload>) =>
    apiClient.patch<Payment>(`/payments/${id}`, payload).then((r) => r.data),
  remove: (id: string) =>
    apiClient.delete(`/payments/${id}`).then((r) => r.data),
};
