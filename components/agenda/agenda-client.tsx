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
import { Calendar as CalendarIcon, Clock, Pencil, Settings, Ban, RotateCcw, PlusCircle } from 'lucide-react';
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
  readOnly?: boolean;
}

// Converte qualquer valor de data para string "YYYY-MM-DD" compatível com <input type="date">
function toInputDate(val: string | Date | null | undefined): string {
  if (!val) return '';
  if (typeof val === 'string') return val.split('T')[0];
  return val.toISOString().split('T')[0];
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
  const [date, setDate] = useState(toInputDate(meeting.meeting_date));
  const [time, setTime] = useState(meeting.meeting_time ?? defaultTime);
  const [title, setTitle] = useState(meeting.title ?? '');
  const [notes, setNotes] = useState(meeting.notes ?? '');

  useEffect(() => {
    if (meeting) {
      setDate(toInputDate(meeting.meeting_date));
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
// Dialog de geração em lote de encontros
// ============================================================

function generateDates(startDate: string, endDate: string, weekDay: number): string[] {
  const dates: string[] = [];
  if (!startDate || !endDate) return dates;

  const start = new Date(startDate + 'T00:00:00');
  const end = new Date(endDate + 'T00:00:00');
  if (start > end) return dates;

  // Avança até o primeiro dia da semana desejado
  const current = new Date(start);
  const diff = (weekDay - current.getDay() + 7) % 7;
  current.setDate(current.getDate() + diff);

  while (current <= end) {
    const y = current.getFullYear();
    const m = String(current.getMonth() + 1).padStart(2, '0');
    const d = String(current.getDate()).padStart(2, '0');
    dates.push(`${y}-${m}-${d}`);
    current.setDate(current.getDate() + 7);
  }

  return dates;
}

function BulkMeetingDialog({
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
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const in3Months = new Date(today);
  in3Months.setMonth(in3Months.getMonth() + 3);
  const in3MonthsStr = `${in3Months.getFullYear()}-${String(in3Months.getMonth() + 1).padStart(2, '0')}-${String(in3Months.getDate()).padStart(2, '0')}`;

  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(in3MonthsStr);
  const [weekDay, setWeekDay] = useState(String(group.default_meeting_day));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const preview = generateDates(startDate, endDate, parseInt(weekDay));

  const handleCreate = async () => {
    if (preview.length === 0) {
      setError('Nenhuma data gerada com os parâmetros informados.');
      return;
    }
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const res = await fetch('/api/meetings/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dates: preview }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Erro ao criar encontros');
      }
      const data = await res.json();
      setSuccess(`${data.created} encontro(s) criado(s) com sucesso!`);
      onSave();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao criar encontros');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Gerar Encontros em Lote</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-md p-2">{error}</p>
          )}
          {success && (
            <p className="text-sm text-green-700 bg-green-50 rounded-md p-2">{success}</p>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="bulk-start">Data inicial</Label>
              <Input
                id="bulk-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bulk-end">Data final</Label>
              <Input
                id="bulk-end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="bulk-weekday">Dia da semana</Label>
            <select
              id="bulk-weekday"
              value={weekDay}
              onChange={(e) => setWeekDay(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {DAY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {preview.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">
                {preview.length} encontro(s) a criar:
              </p>
              <div className="max-h-40 overflow-y-auto rounded-md border p-2 space-y-1">
                {preview.map((d) => (
                  <p key={d} className="text-sm text-muted-foreground">
                    {formatDate(d)}
                  </p>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Datas já existentes serão ignoradas automaticamente.
              </p>
            </div>
          )}

          {preview.length === 0 && startDate && endDate && (
            <p className="text-sm text-muted-foreground">
              Nenhuma data encontrada para o período selecionado.
            </p>
          )}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={loading}>Cancelar</Button>
          </DialogClose>
          <Button onClick={handleCreate} disabled={loading || preview.length === 0}>
            {loading ? 'Criando...' : `Criar ${preview.length} encontro(s)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// Componente principal
// ============================================================

export function AgendaClient({ meetings: initialMeetings, pastMeetings, group: initialGroup, readOnly = false }: AgendaClientProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [meetings, setMeetings] = useState(initialMeetings);
  const [group, setGroup] = useState(initialGroup);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  const [showBulkCreate, setShowBulkCreate] = useState(false);

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
        {!readOnly && (
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="default"
              size="sm"
              onClick={() => setShowBulkCreate(true)}
              className="flex items-center gap-2"
            >
              <PlusCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Gerar Encontros</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowGroupSettings(true)}
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Configurações</span>
            </Button>
          </div>
        )}
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
                      {!readOnly && (
                        <>
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
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Nenhuma reunião agendada para os próximos 30 dias.
                </p>
                {!readOnly && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowBulkCreate(true)}
                    className="flex items-center gap-2"
                  >
                    <PlusCircle className="h-4 w-4" />
                    Gerar encontros
                  </Button>
                )}
              </div>
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

      {/* Dialog: Gerar Encontros em Lote */}
      <BulkMeetingDialog
        group={group}
        open={showBulkCreate}
        onOpenChange={setShowBulkCreate}
        onSave={() => {
          refresh();
          setShowBulkCreate(false);
        }}
      />

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
