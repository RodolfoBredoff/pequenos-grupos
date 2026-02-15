'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { db, PendingSync } from '@/lib/offline-db';

export function useOfflineSync(groupId?: string) {
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  const supabase = createClient();

  // Monitorar status de conexão
  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  // Contar itens pendentes
  const updatePendingCount = useCallback(async () => {
    try {
      const count = await db.pendingSync.count();
      setPendingCount(count);
    } catch (error) {
      console.error('Error counting pending sync:', error);
    }
  }, []);

  useEffect(() => {
    updatePendingCount();
  }, [updatePendingCount]);

  // Sincronizar dados
  const syncData = useCallback(async () => {
    if (!isOnline || isSyncing) return;

    setIsSyncing(true);

    try {
      // 1. Buscar itens pendentes
      const pending = await db.pendingSync.toArray();

      if (pending.length === 0) {
        setLastSyncTime(new Date());
        return;
      }

      // 2. Processar cada item pendente
      for (const item of pending) {
        try {
          switch (item.type) {
            case 'attendance':
              if (item.action === 'create' || item.action === 'update') {
                await supabase
                  .from('attendance')
                  .upsert(item.data, { onConflict: 'meeting_id,member_id' });
              }
              break;

            case 'member':
              if (item.action === 'create') {
                await supabase.from('members').insert(item.data);
              } else if (item.action === 'update') {
                await supabase.from('members').update(item.data).eq('id', item.data.id);
              }
              break;

            case 'meeting':
              if (item.action === 'create' || item.action === 'update') {
                await supabase.from('meetings').upsert(item.data);
              }
              break;
          }

          // Remover item sincronizado
          if (item.id) {
            await db.pendingSync.delete(item.id);
          }
        } catch (error) {
          console.error(`Error syncing ${item.type}:`, error);
          // Continuar com próximo item mesmo se este falhar
        }
      }

      // 3. Atualizar contadores
      await updatePendingCount();
      setLastSyncTime(new Date());

      // 4. Baixar dados atualizados do servidor
      if (groupId) {
        await downloadServerData(groupId);
      }
    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, isSyncing, groupId, updatePendingCount]);

  // Baixar dados do servidor para cache local
  const downloadServerData = async (gId: string) => {
    try {
      // Baixar membros
      const { data: members } = await supabase
        .from('members')
        .select('*')
        .eq('group_id', gId)
        .eq('is_active', true);

      if (members) {
        await db.members.bulkPut(
          members.map((m) => ({ ...m, synced: true }))
        );
      }

      // Baixar reuniões recentes (último mês)
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);

      const { data: meetings } = await supabase
        .from('meetings')
        .select('*')
        .eq('group_id', gId)
        .gte('meeting_date', lastMonth.toISOString().split('T')[0]);

      if (meetings) {
        await db.meetings.bulkPut(
          meetings.map((m) => ({ ...m, synced: true }))
        );
      }

      // Baixar presenças das reuniões
      if (meetings && meetings.length > 0) {
        const meetingIds = meetings.map((m) => m.id);
        
        const { data: attendance } = await supabase
          .from('attendance')
          .select('*')
          .in('meeting_id', meetingIds);

        if (attendance) {
          await db.attendance.bulkPut(
            attendance.map((a) => ({ ...a, synced: true }))
          );
        }
      }
    } catch (error) {
      console.error('Error downloading server data:', error);
    }
  };

  // Sincronizar automaticamente quando voltar online
  useEffect(() => {
    if (isOnline) {
      syncData();
    }
  }, [isOnline]);

  // Adicionar item à fila de sync
  const addToPendingSync = async (
    type: PendingSync['type'],
    action: PendingSync['action'],
    data: any
  ) => {
    try {
      await db.pendingSync.add({
        type,
        action,
        data,
        timestamp: new Date().toISOString(),
      });
      await updatePendingCount();
    } catch (error) {
      console.error('Error adding to pending sync:', error);
    }
  };

  return {
    isOnline,
    isSyncing,
    pendingCount,
    lastSyncTime,
    syncData,
    addToPendingSync,
    downloadServerData,
  };
}
