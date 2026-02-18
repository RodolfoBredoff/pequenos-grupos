'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MEMBER_TYPES, MEMBER_TYPE_LABELS } from '@/lib/constants';
import { Loader2 } from 'lucide-react';

interface PessoaFormProps {
  groupId: string;
  initialData?: {
    id: string;
    full_name: string;
    phone: string;
    birth_date: string;
    member_type: 'participant' | 'visitor';
  };
}

export function PessoaForm({ groupId, initialData }: PessoaFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: initialData?.full_name || '',
    phone: initialData?.phone || '',
    birth_date: initialData?.birth_date || '',
    member_type: initialData?.member_type || MEMBER_TYPES.PARTICIPANT,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (initialData) {
        // Update existing member
        const response = await fetch(`/api/members/${initialData.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Erro ao atualizar pessoa');
        }
      } else {
        // Create new member
        const response = await fetch('/api/members', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Erro ao criar pessoa');
        }
      }

      router.push('/pessoas');
      router.refresh();
    } catch (error: any) {
      console.error('Error saving member:', error);
      alert('Erro ao salvar pessoa: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="full_name">Nome Completo *</Label>
        <Input
          id="full_name"
          value={formData.full_name}
          onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
          required
          placeholder="João da Silva"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Telefone (com DDD) *</Label>
        <Input
          id="phone"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          required
          placeholder="(11) 98765-4321"
          type="tel"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="birth_date">Data de Nascimento *</Label>
        <Input
          id="birth_date"
          value={formData.birth_date}
          onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
          required
          type="date"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="member_type">Tipo *</Label>
        <Select
          value={formData.member_type}
          onValueChange={(value) =>
            setFormData({ ...formData, member_type: value as 'participant' | 'visitor' })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={MEMBER_TYPES.PARTICIPANT}>
              {MEMBER_TYPE_LABELS[MEMBER_TYPES.PARTICIPANT]}
            </SelectItem>
            <SelectItem value={MEMBER_TYPES.VISITOR}>
              {MEMBER_TYPE_LABELS[MEMBER_TYPES.VISITOR]}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-4 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
          className="flex-1"
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={loading} className="flex-1">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData ? 'Atualizar' : 'Cadastrar'}
        </Button>
      </div>
    </form>
  );
}
