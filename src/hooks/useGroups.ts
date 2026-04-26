import { useState, useEffect, useCallback } from 'react';
import { groupsService } from '@/services/firestore';
import { useKindergarten } from '@/hooks/useKindergarten';
import type { GroupInfo } from '@/types';

export function useGroups() {
  const { kindergartenId } = useKindergarten();
  const [data, setData] = useState<GroupInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(() => {
    setLoading(true);
    setError(null);
    try {
      const unsubscribe = groupsService.getAll(kindergartenId, (groups) => {
        setData(groups);
        setLoading(false);
      });
      return unsubscribe;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch groups'));
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
