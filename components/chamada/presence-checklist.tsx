'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useOfflineSync } from '@/hooks/use-offline-sync';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import { Loader2, Save, WifiOff } from 'lucide-react';

interface Member {
  id: string;
  full_name: string;
}

interface Attendance {
  member_id: string;
  is_present: boolean;
}

interface PresenceChecklistProps {
  meetingId: string;
  members: Member[];
  attendance: Attendance[];
}

export function PresenceChecklist({ meetingId, members, attendance }: PresenceChecklistProps) {
  const supabase = createClient();
  const { isOnline, addToPendingSync } = useOfflineSync();
  const [presenceMap, setPresenceMap] = useState<Record<string, boolean>>(
    attendance.reduce((acc, att) => {
      acc[att.member_id] = att.is_present;
      return acc;
    }, {} as Record<string, boolean>)
  );
  const [saving, setSaving] = useState(false);

  const togglePresence = (memberId: string) => {
    setPresenceMap((prev) => ({ ...prev, [memberId]: !prev[memberId] }));
  };

  const saveAttendance = async () => {
    setSaving(true);
    
    try {
      const updates = members.map((member) => ({
        meeting_id: meetingId,
        member_id: member.id,
        is_present: presenceMap[member.id] ?? false,
      }));

      if (isOnline) {
        // Online: salvar diretamente no Supabase
        const { error } = await supabase
          .from('attendance')
          .upsert(updates, { 
            onConflict: 'meeting_id,member_id',
            ignoreDuplicates: false 
          });

        if (error) throw error;
        alert('Presença salva com sucesso!');
      } else {
        // Offline: adicionar à fila de sync
        for (const update of updates) {
          await addToPendingSync('attendance', 'create', update);
        }
        alert('Presença salva localmente! Será sincronizada quando a conexão voltar.');
      }
    } catch (error: any) {
      console.error('Error saving attendance:', error);
      alert('Erro ao salvar presença: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const presentCount = Object.values(presenceMap).filter(Boolean).length;
  const absentCount = members.length - presentCount;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{presentCount}</p>
          <p className="text-sm text-muted-foreground">Presentes</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-red-600">{absentCount}</p>
          <p className="text-sm text-muted-foreground">Ausentes</p>
        </Card>
      </div>

      <div className="space-y-2">
        {members.map((member) => (
          <Card
            key={member.id}
            className="p-4 flex items-center justify-between cursor-pointer hover:bg-accent transition-colors"
            onClick={() => togglePresence(member.id)}
          >
            <span className="font-medium">{member.full_name}</span>
            <Checkbox
              checked={presenceMap[member.id] ?? false}
              onCheckedChange={() => togglePresence(member.id)}
              onClick={(e) => e.stopPropagation()}
            />
          </Card>
        ))}
      </div>

      <Button 
        onClick={saveAttendance} 
        disabled={saving} 
        className="w-full"
        size="lg"
      >
        {saving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Salvando...
          </>
        ) : (
          <>
            {!isOnline && <WifiOff className="mr-2 h-4 w-4" />}
            <Save className="mr-2 h-4 w-4" />
            {isOnline ? 'Salvar Presença' : 'Salvar Offline'}
          </>
        )}
      </Button>
      {!isOnline && (
        <p className="text-sm text-yellow-600 text-center">
          Modo offline ativo. Os dados serão sincronizados quando a conexão voltar.
        </p>
      )}
    </div>
  );
}
