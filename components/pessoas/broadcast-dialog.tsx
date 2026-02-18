'use client';

import { useState } from 'react';
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
import { getWhatsAppUrl, cleanPhone } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

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
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState(0);

  const filteredMembers = members.filter((m) => {
    if (filter === 'all') return true;
    return m.member_type === filter;
  });

  const handleBroadcast = async () => {
    setSending(true);
    setProgress(0);

    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    for (let i = 0; i < filteredMembers.length; i++) {
      const member = filteredMembers[i];
      const url = getWhatsAppUrl(member.phone, member.full_name);
      const customUrl = url.replace(
        encodeURIComponent(`Olá ${member.full_name}! Tudo bem?`),
        encodeURIComponent(message.replace('{nome}', member.full_name))
      );

      // Abrir WhatsApp em nova aba
      window.open(customUrl, '_blank');

      // Atualizar progresso
      setProgress(Math.round(((i + 1) / filteredMembers.length) * 100));

      // Delay de 2 segundos entre cada abertura
      if (i < filteredMembers.length - 1) {
        await delay(2000);
      }
    }

    setSending(false);
    
    // Fechar diálogo após 1 segundo
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
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Enviar Mensagem via WhatsApp</DialogTitle>
          <DialogDescription>
            Envia mensagens individuais via WhatsApp para múltiplas pessoas.
            Use {'{nome}'} para personalizar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Filtro */}
          <div className="space-y-2">
            <Label>Enviar para:</Label>
            <div className="flex gap-2">
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

          {/* Mensagem */}
          <div className="space-y-2">
            <Label htmlFor="message">Mensagem</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Digite sua mensagem aqui... Use {nome} para personalizar."
              rows={5}
              disabled={sending}
            />
            <p className="text-xs text-muted-foreground">
              Exemplo: &quot;Oi {'{nome}'}, não te vimos no último encontro. Está tudo bem?&quot;
            </p>
          </div>

          {/* Preview */}
          {filteredMembers.length > 0 && (
            <div className="space-y-2">
              <Label>Pessoas que receberão ({filteredMembers.length}):</Label>
              <div className="max-h-32 overflow-y-auto border rounded p-2 space-y-1">
                {filteredMembers.map((member) => (
                  <div key={member.id} className="text-sm flex items-center justify-between">
                    <span>{member.full_name}</span>
                    <Badge variant="outline" className="text-xs">
                      {member.phone}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

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
            disabled={sending || filteredMembers.length === 0 || !message.trim()}
          >
            {sending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Enviar para {filteredMembers.length}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
