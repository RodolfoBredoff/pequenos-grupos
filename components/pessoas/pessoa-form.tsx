'use client';

import { useState, useEffect } from 'react';
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
    birth_date: string | null;
    member_type: 'participant' | 'visitor';
  };
}

const MONTHS = [
  { value: '', label: 'Mês' },
  { value: '01', label: 'Janeiro' }, { value: '02', label: 'Fevereiro' }, { value: '03', label: 'Março' },
  { value: '04', label: 'Abril' }, { value: '05', label: 'Maio' }, { value: '06', label: 'Junho' },
  { value: '07', label: 'Julho' }, { value: '08', label: 'Agosto' }, { value: '09', label: 'Setembro' },
  { value: '10', label: 'Outubro' }, { value: '11', label: 'Novembro' }, { value: '12', label: 'Dezembro' },
];

function parseBirthDate(val: string | null | undefined): { day: string; month: string; year: string } {
  if (!val || typeof val !== 'string') return { day: '', month: '', year: '' };
  const dateOnly = val.split('T')[0];
  const parts = dateOnly.split('-');
  if (parts.length < 3) return { day: '', month: '', year: '' };
  const [y, m, d] = parts;
  return {
    day: (d || '').replace(/\D/g, ''),
    month: (m || '').replace(/\D/g, ''),
    year: (y || '').replace(/\D/g, ''),
  };
}

function formatBirthDate(day: string, month: string, year: string): string | null {
  if (!day || !month || !year) return null;
  const d = day.padStart(2, '0');
  const m = month.padStart(2, '0');
  const y = year.padStart(4, '0');
  if (d.length !== 2 || m.length !== 2 || y.length !== 4) return null;
  return `${y}-${m}-${d}`;
}

export function PessoaForm({ groupId, initialData }: PessoaFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(() => {
    const parsed = parseBirthDate(initialData?.birth_date);
    return {
      full_name: initialData?.full_name || '',
      phone: initialData?.phone || '',
      birth_day: parsed.day,
      birth_month: parsed.month,
      birth_year: parsed.year,
      member_type: initialData?.member_type || MEMBER_TYPES.PARTICIPANT,
    };
  });

  useEffect(() => {
    if (initialData) {
      const parsed = parseBirthDate(initialData.birth_date);
      setFormData({
        full_name: initialData.full_name || '',
        phone: initialData.phone || '',
        birth_day: parsed.day,
        birth_month: parsed.month,
        birth_year: parsed.year,
        member_type: initialData.member_type || MEMBER_TYPES.PARTICIPANT,
      });
    }
  }, [initialData?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const birth_date = formatBirthDate(formData.birth_day, formData.birth_month, formData.birth_year);
    if (!birth_date) {
      alert('Data de nascimento é obrigatória. Preencha dia, mês e ano.');
      return;
    }
    setLoading(true);

    const payload = {
      full_name: formData.full_name,
      phone: formData.phone,
      birth_date,
      member_type: formData.member_type,
    };

    try {
      if (initialData) {
        const response = await fetch(`/api/members/${initialData.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Erro ao atualizar pessoa');
        }
      } else {
        const response = await fetch('/api/members', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
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
        <Label>Data de Nascimento *</Label>
        <p className="text-xs text-muted-foreground">
          Dia, mês e ano — o líder será notificado no dia do aniversário
        </p>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <Label htmlFor="birth_day" className="text-xs font-normal text-muted-foreground">Dia</Label>
            <Input
              id="birth_day"
              placeholder="DD"
              maxLength={2}
              value={formData.birth_day}
              onChange={(e) => setFormData({ ...formData, birth_day: e.target.value.replace(/\D/g, '') })}
            />
          </div>
          <div>
            <Label htmlFor="birth_month" className="text-xs font-normal text-muted-foreground">Mês</Label>
            <select
              id="birth_month"
              value={formData.birth_month}
              onChange={(e) => setFormData({ ...formData, birth_month: e.target.value })}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {MONTHS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="birth_year" className="text-xs font-normal text-muted-foreground">Ano</Label>
            <Input
              id="birth_year"
              placeholder="AAAA"
              maxLength={4}
              value={formData.birth_year}
              onChange={(e) => setFormData({ ...formData, birth_year: e.target.value.replace(/\D/g, '') })}
            />
          </div>
        </div>
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
