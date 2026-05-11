import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { paymentsApi } from '@/lib/paymentsApi'

export function usePayments(filters?: {
  studentId?: string
  month?: string
  status?: 'paid' | 'unpaid' | 'partial'
}) {
  return useQuery({
    queryKey: ['payments', filters],
    queryFn: async () => {
      const response = await paymentsApi.getAll(100, 0)
      let payments = response.data
      if (filters?.studentId) {
        payments = payments.filter((p: any) => p.studentId === filters.studentId)
      }
      if (filters?.month) {
        payments = payments.filter((p: any) => p.month === filters.month)
      }
      if (filters?.status) {
        payments = payments.filter((p: any) => p.status === filters.status)
      }
      return payments
    },
  })
}

export function useCreatePayment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: paymentsApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['payments'] }),
  })
}

export function useUpdatePayment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; [key: string]: any }) =>
      paymentsApi.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['payments'] }),
  })
}

export function useDeletePayment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => paymentsApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['payments'] }),
  })
}