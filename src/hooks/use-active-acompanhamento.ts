import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Hook para obter o ID do acompanhamento ativo do usuário
export function useActiveAcompanhamentoId() {
  return useQuery({
    queryKey: ['activeAcompanhamentoId'],
    queryFn: async () => {
      const res = await fetch('/api/user/active-acompanhamento');
      if (!res.ok) throw new Error('Erro ao buscar acompanhamento ativo');
      const data = await res.json();
      return data.activeAcompanhamentoId as string | null;
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
}

// Hook para definir o ID do acompanhamento ativo do usuário
export function useSetActiveAcompanhamentoId() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (activeAcompanhamentoId: string | null) => {
      const res = await fetch('/api/user/active-acompanhamento', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activeAcompanhamentoId })
      });
      if (!res.ok) throw new Error('Erro ao definir acompanhamento ativo');
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeAcompanhamentoId'] });
    }
  });
}
