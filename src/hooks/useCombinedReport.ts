import { useQuery } from '@tanstack/react-query';

interface CombinedReportData {
  ok: boolean;
  hasFile: boolean;
  file?: {
    name: string;
    size: number;
    universalLastUpdate: string;
  };
  meta?: any;
  data?: any[];
  totalRecords?: number;
  sources?: {
    report134Count: number;
    report151Count: number;
  };
  error?: string;
  reason?: string;
}

export const useCombinedReport = () => {
  return useQuery<CombinedReportData, Error>({
    queryKey: ['combined-report'],
    queryFn: async () => {
      console.log('📊 Fetching combined report data...');
  const response = await fetch('/api/cache/combined-report?latest=1&read_only=1&t=' + Date.now(), {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      
      if (data.ok === false) {
        throw new Error(data.error || 'API returned an error');
      }

      console.log(`✅ Combined report fetched: ${data.totalRecords || 0} records.`);
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: false,
    retry: 1,
  });
};
