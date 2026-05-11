import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { lessonsApi } from '@/lib/lessonsApi'

export function useLessons(filters?: {
  studentId?: string
  month?: string
  paymentStatus?: 'paid' | 'unpaid'
  status?: 'done' | 'cancelled'
}) {
  return useQuery({
    queryKey: ['lessons', filters],
    queryFn: async () => {
      const response = await lessonsApi.getAll(100, 0)
      let lessons = response.data
      lessons.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
      if (filters?.studentId) {
        lessons = lessons.filter((l: any) => l.studentId === filters.studentId)
      }
      if (filters?.month) {
        lessons = lessons.filter((l: any) => l.date.startsWith(filters.month!))
      }
      if (filters?.paymentStatus) {
        const isPaid = filters.paymentStatus === 'paid'
        lessons = lessons.filter((l: any) => l.isPaid === isPaid)
      }
      return lessons
    },
  })
}

export function useCreateLesson() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: lessonsApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lessons'] }),
  })
}

export function useUpdateLesson() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; [key: string]: any }) =>
      lessonsApi.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lessons'] }),
  })
}

export function useDeleteLesson() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => lessonsApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lessons'] }),
  })
}

export function useTogglePayment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, isPaid }: { id: string; isPaid: boolean }) =>
      lessonsApi.update(id, { isPaid }),
    onMutate: async ({ id, isPaid }) => {
      await queryClient.cancelQueries({ queryKey: ['lessons'] })
      const previous = queryClient.getQueriesData({ queryKey: ['lessons'] })
      queryClient.setQueriesData({ queryKey: ['lessons'] }, (old: any) =>
        old?.map((l: any) => l.id === id ? { ...l, isPaid } : l)
      )
      return { previous }
    },
    onError: (_err, _vars, context) => {
      context?.previous?.forEach(([key, data]: any) => {
        queryClient.setQueryData(key, data)
      })
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['lessons'] }),
  })
}