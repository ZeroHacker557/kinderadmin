import { useState, useEffect, useCallback } from 'react';
import { financesService } from '@/services/firestore';
import { useKindergarten } from '@/hooks/useKindergarten';
import type { FinanceTransaction } from '@/types';

export function useFinances(month?: string, year?: number) {
  const { kindergartenId } = useKindergarten();
  const [data, setData] = useState<FinanceTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(() => {
    setLoading(true);
    setError(null);
    try {
      const unsubscribe = financesService.getAll(kindergartenId, (finances) => {
        setData(finances);
        setLoading(false);
      }, month, year);
      return unsubscribe;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch finances'));
      setLoading(false);
      return () => {};
    }
  }, [kindergartenId, month, year]);

  useEffect(() => {
    const unsub = fetch();
    return () => unsub();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
