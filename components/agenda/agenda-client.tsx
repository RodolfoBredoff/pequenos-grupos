'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Calendar as CalendarIcon, Clock, Pencil, Settings, Ban, RotateCcw } from 'lucide-react';
import { formatDate, getDayOfWeekName } from '@/lib/utils';

// ============================================================
// Tipos
// ============================================================

interface Meeting {
  id: string;
  group_id: string;
  meeting_date: string;
  meeting_time: string | null;
  is_cancelled: boolean;
  title: string | null;
  notes: string | null;
  created_at: string;
}

interface MeetingWithCount extends Meeting {
  attendanceCount: number;
}


interface GroupSettings {
  default_meeting_day: number;
  default_meeting_time: string;
}

interface AgendaClientProps {
  meetings: Meeting[];
  pastMeetings: MeetingWithCount[];
  group: GroupSettings;
}

// ============================================================
// Dialog de edição de reunião
// ============================================================

function EditMeetingDialog({
  meeting,
  defaultTime,
  open,
  onOpenChange,
  onSave,
}: {
  meeting: Meeting;
  defaultTime: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSave: (updated?: Partial<Meeting>) => void;
}) {
  const [date, setDate] = useState(meeting.meeting_date);
  const [time, setTime] = useState(meeting.meeting_time ?? defaultTime);
  const [title, setTitle] = useState(meeting.title ?? '');
  const [notes, setNotes] = useState(meeting.notes ?? '');

  // Sincronizar estado quando o meeting mudar (ex.: abrir para outro encontro)
  useEffect(() => {
    if (meeting) {
      setDate(meeting.meeting_date);
      setTime(meeting.meeting_time ?? defaultTime);
      setTitle(meeting.title ?? '');
      setNotes(meeting.notes ?? '');
    }
  }, [meeting?.id, meeting?.meeting_date, meeting?.meeting_time, meeting?.title, meeting?.notes, defaultTime]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!date) {
      setError('A data é obrigatória');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`/api/meetings/${meeting.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meeting_date: date,
          meeting_time: time || null,
          title: title || null,
          notes: notes || null,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Erro ao salvar');
      }
      onSave({
        meeting_date: date,
        meeting_time: time || null,
        title: title || null,
        notes: notes || null,
      });
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Encontro</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-md p-2">{error}</p>
          )}
          <div className="space-y-2">
            <Label htmlFor="meeting-title">Nome / Tema do Encontro</Label>
            <Input
              id="meeting-title"
              placeholder="Ex: Estudo sobre fé, Confraternização..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="meeting-date">Data</Label>
            <Input
              id="meeting-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="meeting-time">Horário</Label>
            <Input
              id="meeting-time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Horário padrão do grupo: {defaultTime}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="meeting-notes">Observações (opcional)</Label>
            <Input
              id="meeting-notes"
              placeholder="Outras anotações sobre o encontro..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={loading}>Cancelar</Button>
          </DialogClose>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// Dialog de configurações do grupo
// ============================================================

const DAY_OPTIONS = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda-feira' },
  { value: 2, label: 'Terça-feira' },
  { value: 3, label: 'Quarta-feira' },
  { value: 4, label: 'Quinta-feira' },
  { value: 5, label: 'Sexta-feira' },
  { value: 6, label: 'Sábado' },
];

function GroupSettingsDialog({
  group,
  open,
  onOpenChange,
  onSave,
}: {
  group: GroupSettings;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSave: () => void;
}) {
  const [day, setDay] = useState(String(group.default_meeting_day));
  const [time, setTime] = useState(group.default_meeting_time);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/groups/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          default_meeting_day: parseInt(day),
          default_meeting_time: time,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Erro ao salvar');
      }
      onSave();
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Configurações do Grupo</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-md p-2">{error}</p>
          )}
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
            <Label htmlFor="default-time">Horário padrão das reuniões</Label>
            <Input
              id="default-time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Estas configurações afetam novas reuniões geradas automaticamente.
            Reuniões já agendadas podem ser editadas individualmente.
          </p>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={loading}>Cancelar</Button>
          </DialogClose>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// Componente principal
// ============================================================

export function AgendaClient({ meetings: initialMeetings, pastMeetings, group: initialGroup }: AgendaClientProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [meetings, setMeetings] = useState(initialMeetings);
  const [group, setGroup] = useState(initialGroup);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
  const [showGroupSettings, setShowGroupSettings] = useState(false);

  useEffect(() => {
    setMeetings(initialMeetings);
    setGroup(initialGroup);
  }, [initialMeetings, initialGroup]);

  const refresh = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  const handleCancelToggle = async (meeting: Meeting) => {
    try {
      const res = await fetch(`/api/meetings/${meeting.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_cancelled: !meeting.is_cancelled }),
      });
      if (res.ok) {
        setMeetings((prev) =>
          prev.map((m) =>
            m.id === meeting.id ? { ...m, is_cancelled: !m.is_cancelled } : m
          )
        );
        refresh();
      }
    } catch (e) {
      console.error('Erro ao atualizar reunião:', e);
    }
  };

  const getMeetingTime = (meeting: Meeting) =>
    meeting.meeting_time
      ? meeting.meeting_time.substring(0, 5)
      : group.default_meeting_time.substring(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Agenda</h1>
          <p className="text-muted-foreground">
            Reuniões às {getDayOfWeekName(group.default_meeting_day)}s,{' '}
            {group.default_meeting_time.substring(0, 5)}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowGroupSettings(true)}
          className="flex items-center gap-2 shrink-0"
        >
          <Settings className="h-4 w-4" />
          <span className="hidden sm:inline">Configurações</span>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Próximas Reuniões */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Próximas Reuniões
            </CardTitle>
          </CardHeader>
          <CardContent>
            {meetings && meetings.length > 0 ? (
              <div className="space-y-3">
                {meetings.map((meeting) => (
                  <div
                    key={meeting.id}
                    className="flex items-center justify-between p-3 border rounded-lg gap-2"
                  >
                    <div className="min-w-0">
                      {meeting.title ? (
                        <p className="font-semibold text-sm truncate">{meeting.title}</p>
                      ) : null}
                      <p className={meeting.title ? 'text-sm text-muted-foreground' : 'font-medium'}>
                        {formatDate(meeting.meeting_date)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {getMeetingTime(meeting)}
                        {meeting.meeting_time && (
                          <span className="ml-1 text-blue-500">(horário alterado)</span>
                        )}
                      </p>
                      {meeting.notes && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{meeting.notes}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {meeting.is_cancelled ? (
                        <Badge variant="destructive">Cancelada</Badge>
                      ) : (
                        <Badge>Confirmada</Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title="Editar reunião"
                        onClick={() => setEditingMeeting(meeting)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title={meeting.is_cancelled ? 'Reativar reunião' : 'Cancelar reunião'}
                        onClick={() => handleCancelToggle(meeting)}
                      >
                        {meeting.is_cancelled ? (
                          <RotateCcw className="h-3.5 w-3.5 text-green-600" />
                        ) : (
                          <Ban className="h-3.5 w-3.5 text-destructive" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Nenhuma reunião agendada para os próximos 30 dias.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Reuniões Passadas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Histórico Recente
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pastMeetings && pastMeetings.length > 0 ? (
              <div className="space-y-3">
                {pastMeetings.map((meeting) => (
                  <div
                    key={meeting.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      {meeting.title && (
                        <p className="font-semibold text-sm">{meeting.title}</p>
                      )}
                      <p className={meeting.title ? 'text-sm text-muted-foreground' : 'font-medium'}>
                        {formatDate(meeting.meeting_date)}
                      </p>
                      {meeting.is_cancelled ? (
                        <p className="text-xs text-muted-foreground">Cancelada</p>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          {meeting.attendanceCount}{' '}
                          {meeting.attendanceCount === 1 ? 'registro' : 'registros'} de presença
                        </p>
                      )}
                    </div>
                    {meeting.is_cancelled && <Badge variant="outline">Folga</Badge>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhuma reunião no histórico.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog: Editar Reunião */}
      {editingMeeting && (
        <EditMeetingDialog
          meeting={editingMeeting}
          defaultTime={group.default_meeting_time.substring(0, 5)}
          open={!!editingMeeting}
          onOpenChange={(v) => !v && setEditingMeeting(null)}
          onSave={(updated) => {
            if (updated) {
              setMeetings((prev) =>
                prev.map((m) =>
                  m.id === editingMeeting.id ? { ...m, ...updated } : m
                )
              );
            }
            setEditingMeeting(null);
            refresh();
          }}
        />
      )}

      {/* Dialog: Configurações do Grupo */}
      <GroupSettingsDialog
        group={group}
        open={showGroupSettings}
        onOpenChange={setShowGroupSettings}
        onSave={() => {
          refresh();
          setShowGroupSettings(false);
        }}
      />
    </div>
  );
}
