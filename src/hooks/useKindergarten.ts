import { useAuth } from '@/context/AuthContext';
import type { Kindergarten } from '@/types';

/**
 * Returns the current kindergartenId and kindergarten data.
 * Throws if no kindergartenId is available (user not loaded yet).
 */
export function useKindergarten(): { kindergartenId: string; kindergarten: Kindergarten | null } {
  const { kindergartenId, kindergarten } = useAuth();
  if (!kindergartenId) {
    throw new Error('kindergartenId not found — user may not be loaded');
  }
  return { kindergartenId, kindergarten };
}
