import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import db from '@/db'
import type { Lesson } from '@/types'

export function useLessons(filters?: {
  studentId?: number
  month?: string
  paymentStatus?: 'paid' | 'unpaid'
  status?: 'done' | 'cancelled'
}) {
  return useQuery({
    queryKey: ['lessons', filters],
    queryFn: async () => {
      let lessons = await db.lessons.toArray()
      lessons.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      if (filters?.studentId) {
        lessons = lessons.filter(l => l.studentId === filters.studentId)
      }
      if (filters?.month) {
        lessons = lessons.filter(l => l.date.startsWith(filters.month!))
      }
      if (filters?.paymentStatus) {
        lessons = lessons.filter(l => l.paymentStatus === filters.paymentStatus)
      }
      if (filters?.status) {
        lessons = lessons.filter(l => l.status === filters.status)
      }
      return lessons
    },
  })
}

export function useCreateLesson() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<Lesson, 'id'>) => db.lessons.add(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lessons'] }),
  })
}

export function useUpdateLesson() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: Lesson) => db.lessons.update(id!, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lessons'] }),
  })
}

export function useDeleteLesson() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => db.lessons.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lessons'] }),
  })
}

export function useTogglePayment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, paymentStatus }: { id: number; paymentStatus: 'paid' | 'unpaid' }) =>
      db.lessons.update(id, { paymentStatus }),
    onMutate: async ({ id, paymentStatus }) => {
      await queryClient.cancelQueries({ queryKey: ['lessons'] })
      const previous = queryClient.getQueriesData({ queryKey: ['lessons'] })
      queryClient.setQueriesData({ queryKey: ['lessons'] }, (old: Lesson[] | undefined) =>
        old?.map(l => l.id === id ? { ...l, paymentStatus } : l)
      )
      return { previous }
    },
    onError: (_err, _vars, context) => {
      context?.previous?.forEach(([key, data]) => {
        queryClient.setQueryData(key, data)
      })
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['lessons'] }),
  })
}