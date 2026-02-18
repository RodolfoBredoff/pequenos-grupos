'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function useRealtime(table: string, groupId: string) {
  const supabase = createClient();
  const [channel, setChannel] = useState<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null);

  useEffect(() => {
    // Subscribe to realtime changes
    const ch = supabase
      .channel(`${table}-${groupId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table,
          filter: `group_id=eq.${groupId}`,
        },
        (payload) => {
          console.log('Realtime update:', payload);
          // Trigger a refresh of the page data
          window.location.reload();
        }
      )
      .subscribe();

    setChannel(ch);

    // Cleanup subscription on unmount
    return () => {
      if (ch) {
        supabase.removeChannel(ch);
      }
    };
  }, [table, groupId]);

  return { channel };
}
