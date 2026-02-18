'use client';

import { WhatsAppButton } from './whatsapp-button';
import { LinkButton } from '@/components/ui/link-button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { calculateAge, formatPhone } from '@/lib/utils';
import { MEMBER_TYPE_LABELS } from '@/lib/constants';
import { Pencil, Cake } from 'lucide-react';

interface Member {
  id: string;
  full_name: string;
  phone: string;
  birth_date: string | null;
  member_type: 'participant' | 'visitor';
}

interface PessoaCardProps {
  member: Member;
}

export function PessoaCard({ member }: PessoaCardProps) {
  let age: number | null = null;
  let birthDate: Date | null = null;
  if (member.birth_date) {
    try {
      const bdStr = typeof member.birth_date === 'string' ? member.birth_date.split('T')[0] : String(member.birth_date);
      birthDate = new Date(bdStr);
      if (!isNaN(birthDate.getTime())) {
        age = calculateAge(member.birth_date);
      }
    } catch {
      age = null;
      birthDate = null;
    }
  }
  const today = new Date();
  const isBirthday = birthDate
    ? birthDate.getMonth() === today.getMonth() && birthDate.getDate() === today.getDate()
    : false;
  
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-semibold text-lg leading-tight mb-2">
              {member.full_name}
              {isBirthday && <Cake className="inline-block ml-2 h-4 w-4 text-yellow-500" />}
            </h3>
            <Badge 
              variant={member.member_type === 'participant' ? 'default' : 'secondary'}
              className="mb-2"
            >
              {MEMBER_TYPE_LABELS[member.member_type as keyof typeof MEMBER_TYPE_LABELS] ?? member.member_type ?? 'Membro'}
            </Badge>
          </div>
        </div>
        
        <div className="space-y-1 text-sm text-muted-foreground mb-4">
          <p>{member.phone ? formatPhone(String(member.phone)) : '-'}</p>
          {age !== null && <p>{age} anos</p>}
          {isBirthday && (
            <p className="text-yellow-600 font-medium">🎂 Aniversariante do dia!</p>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="p-4 pt-0 flex gap-2">
        <WhatsAppButton phone={member.phone} name={member.full_name} className="flex-1" />
        <LinkButton href={`/pessoas/${member.id}`} variant="outline" size="sm" className="flex-1 w-full">
          <Pencil className="h-4 w-4" />
          Editar
        </LinkButton>
      </CardFooter>
    </Card>
  );
}
