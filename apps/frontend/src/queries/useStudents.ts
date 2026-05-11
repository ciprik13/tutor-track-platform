import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import db from '@/db'
import type { Student } from '@/types'

export function useStudents(filters?: { status?: 'active' | 'inactive'; search?: string }) {
  return useQuery({
    queryKey: ['students', filters],
    queryFn: async () => {
      let students = await db.students.orderBy('name').toArray()
      if (filters?.status) {
        students = students.filter(s => s.status === filters.status)
      }
      if (filters?.search) {
        const q = filters.search.toLowerCase()
        students = students.filter(s => s.name.toLowerCase().includes(q))
      }
      return students
    },
  })
}

export function useStudent(id: number) {
  return useQuery({
    queryKey: ['students', id],
    queryFn: () => db.students.get(id),
    enabled: !!id,
  })
}

export function useCreateStudent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<Student, 'id'>) => db.students.add(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['students'] }),
  })
}

export function useUpdateStudent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: Student) => db.students.update(id!, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['students'] }),
  })
}

export function useDeleteStudent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => db.students.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['students'] }),
  })
}