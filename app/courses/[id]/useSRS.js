import { useState } from 'react';
import { apiFetch } from '@/lib/apiClient';
import toast from 'react-hot-toast';

export function useSRS() {
  const [isSyncing, setIsSyncing] = useState(false);

  const submitReview = async (cardId, quality, currentStats) => {
    setIsSyncing(true);
    try {
      const response = await apiFetch('/api/flashcards/review', {
        method: 'POST',
        body: JSON.stringify({ cardId, quality, currentStats }),
      });

      if (!response.ok) throw new Error('Sync failed');
      
      const data = await response.json();
      toast.success(`Scheduled for ${new Date(data.nextReviewDate).toLocaleDateString()}`);
      return data;
    } catch (err) {
      toast.error('Failed to save progress offline support pending');
      console.error(err);
    } finally {
      setIsSyncing(false);
    }
  };

  return { submitReview, isSyncing };
}