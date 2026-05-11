import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import db from '@/db'
import type { Payment } from '@/types'

export function usePayments(filters?: {
  studentId?: number
  period?: string
  status?: 'paid' | 'unpaid' | 'partial'
}) {
  return useQuery({
    queryKey: ['payments', filters],
    queryFn: async () => {
      let payments = await db.payments.orderBy('date').reverse().toArray()
      if (filters?.studentId) {
        payments = payments.filter(p => p.studentId === filters.studentId)
      }
      if (filters?.period) {
        payments = payments.filter(p => p.period === filters.period)
      }
      if (filters?.status) {
        payments = payments.filter(p => p.status === filters.status)
      }
      return payments
    },
  })
}

export function useCreatePayment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<Payment, 'id'>) => db.payments.add(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['payments'] }),
  })
}

export function useUpdatePayment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: Payment) => db.payments.update(id!, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['payments'] }),
  })
}

export function useDeletePayment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => db.payments.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['payments'] }),
  })
}