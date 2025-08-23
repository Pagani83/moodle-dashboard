import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import type { Acompanhamento } from '@/types/moodle'

const ACOMPANHAMENTOS_KEY = 'acompanhamentos'

// Fetch acompanhamentos do usuário
export function useAcompanhamentos() {
  const { data: session } = useSession()
  
  return useQuery({
    queryKey: [ACOMPANHAMENTOS_KEY, session?.user?.id],
    queryFn: async () => {
      const response = await fetch('/api/acompanhamentos')
      if (!response.ok) {
        throw new Error('Failed to fetch acompanhamentos')
      }
      const data = await response.json()
      console.log('Fetched acompanhamentos for user:', session?.user?.id, data.acompanhamentos)
      return data.acompanhamentos as Acompanhamento[]
    },
    enabled: !!session?.user,
    staleTime: 1 * 60 * 1000, // 1 minute (reduzido para forçar mais atualizações)
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  })
}

// Criar acompanhamento
export function useCreateAcompanhamento() {
  const queryClient = useQueryClient()
  const { data: session } = useSession()
  
  return useMutation({
    mutationFn: async (acompanhamento: Omit<Acompanhamento, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => {
      const response = await fetch('/api/acompanhamentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(acompanhamento)
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create acompanhamento')
      }
      
      return response.json()
    },
    onSuccess: (data) => {
      console.log('Created acompanhamento:', data)
      queryClient.invalidateQueries({ queryKey: [ACOMPANHAMENTOS_KEY, session?.user?.id] })
      // Force refetch to ensure UI updates
      queryClient.refetchQueries({ queryKey: [ACOMPANHAMENTOS_KEY, session?.user?.id] })
    }
  })
}

// Atualizar acompanhamento
export function useUpdateAcompanhamento() {
  const queryClient = useQueryClient()
  const { data: session } = useSession()
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Acompanhamento> & { id: string }) => {
      const response = await fetch('/api/acompanhamentos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates })
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update acompanhamento')
      }
      
      return response.json()
    },
    onSuccess: (data) => {
      console.log('Updated acompanhamento:', data)
      queryClient.invalidateQueries({ queryKey: [ACOMPANHAMENTOS_KEY, session?.user?.id] })
      queryClient.refetchQueries({ queryKey: [ACOMPANHAMENTOS_KEY, session?.user?.id] })
    }
  })
}

// Deletar acompanhamento
export function useDeleteAcompanhamento() {
  const queryClient = useQueryClient()
  const { data: session } = useSession()
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/acompanhamentos?id=${id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete acompanhamento')
      }
      
      return response.json()
    },
    onSuccess: (data, variables) => {
      console.log('Deleted acompanhamento:', variables)
      queryClient.invalidateQueries({ queryKey: [ACOMPANHAMENTOS_KEY, session?.user?.id] })
      queryClient.refetchQueries({ queryKey: [ACOMPANHAMENTOS_KEY, session?.user?.id] })
    }
  })
}

// Hook para sincronizar acompanhamentos entre Zustand e API
export function useAcompanhamentosSync() {
  const { data: session } = useSession()
  const { data: acompanhamentos, isLoading, error } = useAcompanhamentos()
  const createMutation = useCreateAcompanhamento()
  const updateMutation = useUpdateAcompanhamento()
  const deleteMutation = useDeleteAcompanhamento()

  return {
    acompanhamentos: acompanhamentos || [],
    isLoading,
    error,
    createAcompanhamento: createMutation.mutateAsync,
    updateAcompanhamento: updateMutation.mutateAsync,
    deleteAcompanhamento: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    userId: session?.user?.id
  }
}
