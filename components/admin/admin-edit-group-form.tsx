'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, Loader2 } from 'lucide-react';

const DAY_OPTIONS = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda-feira' },
  { value: 2, label: 'Terça-feira' },
  { value: 3, label: 'Quarta-feira' },
  { value: 4, label: 'Quinta-feira' },
  { value: 5, label: 'Sexta-feira' },
  { value: 6, label: 'Sábado' },
];

interface GroupData {
  id: string;
  name: string;
  default_meeting_day: number;
  default_meeting_time: string;
  leader_id: string | null;
}

interface LeaderOption {
  id: string;
  full_name: string;
  email: string;
  group_id: string | null;
}

export function AdminEditGroupForm({
  group,
  allLeaders,
}: {
  group: GroupData;
  allLeaders: LeaderOption[];
}) {
  const router = useRouter();
  const [name, setName] = useState(group.name);
  const [day, setDay] = useState(String(group.default_meeting_day));
  const [time, setTime] = useState(group.default_meeting_time.substring(0, 5));
  const [leaderId, setLeaderId] = useState(group.leader_id ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      const res = await fetch(`/api/admin/groups/${group.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          default_meeting_day: parseInt(day),
          default_meeting_time: time,
          leader_id: leaderId || null,
        }),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Erro ao salvar');
      }

      setSuccess(true);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar');
    } finally {
      setLoading(false);
    }
  };

  // Líderes disponíveis: sem grupo ou já vinculados a este grupo
  const availableLeaders = allLeaders.filter(
    (l) => !l.group_id || l.group_id === group.id
  );

  return (
    <form onSubmit={handleSave} className="space-y-4">
      {error && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-md p-2">{error}</p>
      )}
      {success && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-md p-2">
          Grupo atualizado com sucesso!
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="group-name">Nome do Grupo</Label>
          <Input
            id="group-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="leader-select">Líder</Label>
          <select
            id="leader-select"
            value={leaderId}
            onChange={(e) => setLeaderId(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="">— Sem líder —</option>
            {availableLeaders.map((l) => (
              <option key={l.id} value={l.id}>
                {l.full_name} ({l.email})
              </option>
            ))}
          </select>
          {allLeaders.filter((l) => l.group_id && l.group_id !== group.id).length > 0 && (
            <p className="text-xs text-muted-foreground">
              Líderes vinculados a outros grupos não aparecem na lista.
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="meeting-day">Dia padrão das reuniões</Label>
          <select
            id="meeting-day"
            value={day}
            onChange={(e) => setDay(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {DAY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="meeting-time">Horário padrão</Label>
          <Input
            id="meeting-time"
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Salvar Alterações
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
