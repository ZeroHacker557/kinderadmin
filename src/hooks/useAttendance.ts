import { useState, useEffect, useCallback } from 'react';
import { attendanceService } from '@/services/firestore';
import type { AttendanceRecord } from '@/types';

export function useAttendance(date: string) {
  const [data, setData] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(() => {
    setLoading(true);
    setError(null);
    try {
      const unsubscribe = attendanceService.getByDate(date, (records) => {
        setData(records);
        setLoading(false);
      });
      return unsubscribe;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch attendance'));
      setLoading(false);
      return () => {};
    }
  }, [date]);

  useEffect(() => {
    const unsub = fetch();
    return () => unsub();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
