import { useState, useEffect, useCallback } from 'react';
import { employeesService } from '@/services/firestore';
import { useKindergarten } from '@/hooks/useKindergarten';
import type { Employee } from '@/types';

export function useEmployees() {
  const { kindergartenId } = useKindergarten();
  const [data, setData] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(() => {
    setLoading(true);
    setError(null);
    try {
      const unsubscribe = employeesService.getAll(kindergartenId, (employees) => {
        setData(employees);
        setLoading(false);
      });
      return unsubscribe;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch employees'));
      setLoading(false);
      return () => {};
    }
  }, [kindergartenId]);

  useEffect(() => {
    const unsub = fetch();
    return () => unsub();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
