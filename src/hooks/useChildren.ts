import { useState, useEffect, useCallback } from 'react';
import { childrenService } from '@/services/firestore';
import type { Child } from '@/types';

export function useChildren(groupId?: string) {
  const [data, setData] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(() => {
    setLoading(true);
    setError(null);
    try {
      const unsubscribe = childrenService.getAll((children) => {
        setData(children);
        setLoading(false);
      }, groupId);
      return unsubscribe;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch children'));
      setLoading(false);
      return () => {};
    }
  }, [groupId]);

  useEffect(() => {
    const unsub = fetch();
    return () => unsub();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
