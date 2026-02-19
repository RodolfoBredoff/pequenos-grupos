'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { UserPlus, Trash2, Mail, Phone, ShieldCheck } from 'lucide-react';
import { formatPhone } from '@/lib/utils';

interface Secretary {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  created_at: string;
}

interface SecretarySectionProps {
  initialSecretaries: Secretary[];
}

function AddSecretaryDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: (s: Secretary) => void;
}) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  function reset() {
    setFullName('');
    setEmail('');
    setPhone('');
    setError('');
  }

  async function handleSubmit() {
    if (!fullName.trim() || !email.trim()) {
      setError('Nome e e-mail são obrigatórios.');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      const res = await fetch('/api/secretaries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: fullName, email, phone: phone || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao criar secretário');
      onCreated(data);
      onOpenChange(false);
      reset();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao criar secretário');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar Secretário(a)</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-md p-2">{error}</p>
          )}
          <div className="space-y-2">
            <Label htmlFor="sec-name">Nome completo *</Label>
            <Input
              id="sec-name"
              placeholder="Ex: Maria Silva"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sec-email">E-mail *</Label>
            <Input
              id="sec-email"
              type="email"
              placeholder="maria@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              O secretário usará este e-mail para acessar o app via link mágico.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="sec-phone">Telefone (opcional)</Label>
            <Input
              id="sec-phone"
              type="tel"
              placeholder="(11) 99999-9999"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={isLoading}>Cancelar</Button>
          </DialogClose>
          <Button onClick={handleSubmit} isLoading={isLoading}>
            {!isLoading && <UserPlus className="h-4 w-4" />}
            Adicionar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function SecretarySection({ initialSecretaries }: SecretarySectionProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [secretaries, setSecretaries] = useState<Secretary[]>(initialSecretaries);
  const [showAdd, setShowAdd] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    setSecretaries(initialSecretaries);
  }, [initialSecretaries]);

  async function handleDelete() {
    if (!deletingId) return;
    const res = await fetch(`/api/secretaries/${deletingId}`, { method: 'DELETE' });
    if (!res.ok) {
      const d = await res.json();
      setDeleteError(d.error || 'Erro ao remover secretário');
      throw new Error(d.error);
    }
    setSecretaries((prev) => prev.filter((s) => s.id !== deletingId));
    startTransition(() => router.refresh());
  }

  const deletingSecretary = secretaries.find((s) => s.id === deletingId);

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <CardTitle>Secretários</CardTitle>
          </div>
          <Button size="sm" onClick={() => setShowAdd(true)}>
            <UserPlus className="h-4 w-4" />
            Adicionar
          </Button>
        </CardHeader>
        <CardContent>
          {secretaries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ShieldCheck className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Nenhum secretário cadastrado.</p>
              <p className="text-xs mt-1">
                Secretários podem fazer chamadas, cadastrar pessoas e ver o engajamento.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {secretaries.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between p-3 border rounded-lg gap-3"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{s.full_name}</p>
                    <div className="flex flex-wrap items-center gap-x-3 mt-0.5">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Mail className="h-3 w-3" /> {s.email}
                      </span>
                      {s.phone && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Phone className="h-3 w-3" /> {formatPhone(s.phone)}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                    title="Remover secretário"
                    onClick={() => { setDeleteError(''); setDeletingId(s.id); }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {deleteError && (
            <p className="text-sm text-destructive mt-3">{deleteError}</p>
          )}
        </CardContent>
      </Card>

      <AddSecretaryDialog
        open={showAdd}
        onOpenChange={setShowAdd}
        onCreated={(s) => {
          setSecretaries((prev) => [...prev, s]);
          startTransition(() => router.refresh());
        }}
      />

      <ConfirmDialog
        open={!!deletingId}
        onOpenChange={(v) => { if (!v) setDeletingId(null); }}
        title="Remover secretário(a)?"
        description={
          deletingSecretary
            ? `${deletingSecretary.full_name} perderá acesso ao grupo imediatamente.`
            : undefined
        }
        confirmLabel="Remover"
        onConfirm={handleDelete}
        isDestructive
      />
    </>
  );
}
