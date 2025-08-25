import { useMutation, useQueryClient } from '@tanstack/react-query';

interface RunCombinedReportResponse {
  success: boolean;
  message: string;
  error?: string;
}

export const useRunCombinedReportMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<RunCombinedReportResponse, Error, void>({
    mutationFn: async () => {
      const response = await fetch('/api/auto-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to run combined report');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['combined-report'] });
      console.log('✅ Combined report run successfully, cache invalidated.');
    },
    onError: (error) => {
      console.error('❌ Error running combined report:', error.message);
    },
  });
};
