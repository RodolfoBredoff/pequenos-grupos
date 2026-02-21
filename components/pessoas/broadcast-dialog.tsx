'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { MessageCircle, Send, Loader2 } from 'lucide-react';
import { getWhatsAppUrl } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

interface Member {
  id: string;
  full_name: string;
  phone: string;
  member_type: 'participant' | 'visitor';
}

interface BroadcastDialogProps {
  members: Member[];
}

export function BroadcastDialog({ members }: BroadcastDialogProps) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('Olá! Tudo bem?');
  const [filter, setFilter] = useState<'all' | 'participant' | 'visitor'>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState(0);

  // Quando abrir o dialog ou mudar o filtro, atualizar seleção
  useEffect(() => {
    if (!open) return;
    const filtered = members.filter((m) => {
      if (filter === 'all') return true;
      return m.member_type === filter;
    });
    setSelectedIds(new Set(filtered.filter((m) => m.phone).map((m) => m.id)));
  }, [open, filter, members]);

  const filteredBySearch = members.filter((m) =>
    m.full_name.toLowerCase().includes(search.toLowerCase().trim())
  );

  const selectedMembers = filteredBySearch.filter((m) => selectedIds.has(m.id) && m.phone);

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllFiltered = () => {
    const withPhone = filteredBySearch.filter((m) => m.phone).map((m) => m.id);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      withPhone.forEach((id) => next.add(id));
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleBroadcast = async () => {
    if (selectedMembers.length === 0) return;
    setSending(true);
    setProgress(0);

    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    for (let i = 0; i < selectedMembers.length; i++) {
      const member = selectedMembers[i];
      const url = getWhatsAppUrl(member.phone, member.full_name);
      const customUrl = url.replace(
        encodeURIComponent(`Olá ${member.full_name}! Tudo bem?`),
        encodeURIComponent(message.replace(/{nome}/g, member.full_name))
      );

      window.open(customUrl, '_blank');
      setProgress(Math.round(((i + 1) / selectedMembers.length) * 100));

      if (i < selectedMembers.length - 1) {
        await delay(2000);
      }
    }

    setSending(false);
    setTimeout(() => {
      setOpen(false);
      setProgress(0);
    }, 1000);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full sm:w-auto">
          <MessageCircle className="mr-2 h-4 w-4" />
          Mensagem em Grupo
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Enviar Mensagem via WhatsApp</DialogTitle>
          <DialogDescription>
            Selecione as pessoas que receberão a mensagem. Use {'{nome}'} para personalizar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Filtro rápido */}
          <div className="space-y-2">
            <Label>Filtro rápido:</Label>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                Todos ({members.length})
              </Button>
              <Button
                type="button"
                variant={filter === 'participant' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('participant')}
              >
                Participantes ({members.filter(m => m.member_type === 'participant').length})
              </Button>
              <Button
                type="button"
                variant={filter === 'visitor' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('visitor')}
              >
                Visitantes ({members.filter(m => m.member_type === 'visitor').length})
              </Button>
            </div>
          </div>

          {/* Busca */}
          <div className="space-y-1">
            <Label htmlFor="search-members">Buscar por nome</Label>
            <Input
              id="search-members"
              placeholder="Digite o nome..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9"
            />
          </div>

          {/* Seleção de pessoas */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Selecionar pessoas ({selectedMembers.length} com telefone):</Label>
              <div className="flex gap-1">
                <Button type="button" variant="ghost" size="sm" onClick={selectAllFiltered}>
                  Marcar todos
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={clearSelection}>
                  Desmarcar
                </Button>
              </div>
            </div>
            <div className="max-h-40 overflow-y-auto border rounded-md p-2 space-y-1">
              {filteredBySearch.map((member) => {
                const hasPhone = !!member.phone;
                return (
                  <label
                    key={member.id}
                    className={`flex items-center gap-3 py-2 px-2 rounded-md cursor-pointer hover:bg-muted/50 ${!hasPhone ? 'opacity-60' : ''}`}
                  >
                    <Checkbox
                      checked={selectedIds.has(member.id)}
                      onCheckedChange={() => hasPhone && toggleOne(member.id)}
                      disabled={!hasPhone}
                    />
                    <span className="text-sm flex-1 truncate">{member.full_name}</span>
                    <Badge variant="secondary" className="text-xs shrink-0">
                      {member.member_type === 'participant' ? 'Part.' : 'Visit.'}
                    </Badge>
                    {!hasPhone && <span className="text-xs text-muted-foreground shrink-0">Sem tel.</span>}
                  </label>
                );
              })}
            </div>
          </div>

          {/* Mensagem */}
          <div className="space-y-2">
            <Label htmlFor="message">Mensagem</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Digite sua mensagem aqui... Use {nome} para personalizar."
              rows={4}
              disabled={sending}
            />
            <p className="text-xs text-muted-foreground">
              Use {'{nome}'} para o nome da pessoa. Ex.: &quot;Oi {'{nome}'}, não te vimos no último encontro.&quot;
            </p>
          </div>

          {/* Progresso */}
          {sending && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Enviando...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={sending}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleBroadcast}
            disabled={sending || selectedMembers.length === 0 || !message.trim()}
          >
            {sending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Enviar para {selectedMembers.length}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
