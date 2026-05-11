import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { studentsApi } from '@/lib/studentsApi'

export function useStudents(filters?: { status?: 'active' | 'inactive'; search?: string }) {
  return useQuery({
    queryKey: ['students', filters],
    queryFn: async () => {
      const response = await studentsApi.getAll(100, 0)
      let students = response.data
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

export function useStudent(id: string) {
  return useQuery({
    queryKey: ['students', id],
    queryFn: () => studentsApi.getOne(id),
    enabled: !!id,
  })
}

export function useCreateStudent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: studentsApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['students'] }),
  })
}

export function useUpdateStudent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; [key: string]: any }) =>
      studentsApi.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['students'] }),
  })
}

export function useDeleteStudent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => studentsApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['students'] }),
  })
}