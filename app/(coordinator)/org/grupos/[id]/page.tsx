'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Group, Users, ArrowLeft, Pencil, Trash2 } from 'lucide-react';

const DAY_OPTIONS = [
  { value: 0, label: 'Domingo' }, { value: 1, label: 'Segunda-feira' },
  { value: 2, label: 'Terça-feira' }, { value: 3, label: 'Quarta-feira' },
  { value: 4, label: 'Quinta-feira' }, { value: 5, label: 'Sexta-feira' },
  { value: 6, label: 'Sábado' },
];

interface GroupDetail {
  group: { id: string; name: string; default_meeting_day: number; default_meeting_time: string };
  leaders: { id: string; full_name: string; email: string; phone: string | null; role: string }[];
  members: { id: string; full_name: string; member_type: string; is_active: boolean }[];
}

export default function CoordinatorGroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [data, setData] = useState<GroupDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDay, setEditDay] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  const fetchData = async () => {
    const res = await fetch(`/api/coordinator/groups/${id}`);
    if (res.ok) {
      const d = await res.json();
      setData(d);
      setEditName(d.group.name);
      setEditDay(String(d.group.default_meeting_day));
      setEditTime(d.group.default_meeting_time.substring(0, 5));
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [id]);

  const handleEditSave = async () => {
    setEditError('');
    setEditLoading(true);
    try {
      const res = await fetch(`/api/coordinator/groups/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName, default_meeting_day: parseInt(editDay), default_meeting_time: editTime }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Erro ao salvar'); }
      setEditOpen(false);
      fetchData();
    } catch (e) {
      setEditError(e instanceof Error ? e.message : 'Erro ao salvar');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja remover este grupo? Esta ação é irreversível.')) return;
    const res = await fetch(`/api/coordinator/groups/${id}`, { method: 'DELETE' });
    if (res.ok) router.push('/org/grupos');
  };

  if (loading) return <p className="text-muted-foreground">Carregando...</p>;
  if (!data) return <p className="text-destructive">Grupo não encontrado.</p>;

  const { group, leaders, members } = data;
  const activeMembers = members.filter((m) => m.is_active);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push('/org/grupos')}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
        </Button>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{group.name}</h1>
          <p className="text-muted-foreground mt-1">
            {DAY_OPTIONS.find((d) => d.value === group.default_meeting_day)?.label}s, {group.default_meeting_time.substring(0, 5)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <Pencil className="h-4 w-4 mr-1" /> Editar
          </Button>
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-1" /> Remover
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Líderes e Secretários ({leaders.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {leaders.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum líder vinculado.</p>
            ) : (
              <div className="space-y-2">
                {leaders.map((l) => (
                  <div key={l.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="text-sm font-medium">{l.full_name}</p>
                      <p className="text-xs text-muted-foreground">{l.email}</p>
                    </div>
                    <Badge variant={l.role === 'leader' ? 'default' : 'secondary'} className="text-xs shrink-0">
                      {l.role === 'leader' ? 'Líder' : 'Secretário'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Group className="h-5 w-5" />
              Membros ({activeMembers.length} ativos)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeMembers.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum membro ativo.</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {activeMembers.map((m) => (
                  <div key={m.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <p className="text-sm">{m.full_name}</p>
                    <Badge variant={m.member_type === 'participant' ? 'default' : 'secondary'} className="text-xs shrink-0">
                      {m.member_type === 'participant' ? 'Participante' : 'Visitante'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Grupo</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            {editError && <p className="text-sm text-destructive bg-destructive/10 rounded-md p-2">{editError}</p>}
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Dia padrão</Label>
              <select value={editDay} onChange={(e) => setEditDay(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                {DAY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Horário</Label>
              <Input type="time" value={editTime} onChange={(e) => setEditTime(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline" disabled={editLoading}>Cancelar</Button></DialogClose>
            <Button onClick={handleEditSave} disabled={editLoading}>{editLoading ? 'Salvando...' : 'Salvar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
