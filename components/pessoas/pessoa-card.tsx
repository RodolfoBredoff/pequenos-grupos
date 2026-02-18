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
  // #region agent log
  try {
    fetch('http://127.0.0.1:7243/ingest/68b58dbd-8e78-48cd-8fa2-18d1de18a7f6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'pessoa-card.tsx:render',message:'PessoaCard render',data:{memberId:member?.id,birthDateType:typeof member?.birth_date,birthDateVal:member?.birth_date?String(member.birth_date).slice(0,30):null,phoneType:typeof member?.phone},timestamp:Date.now(),hypothesisId:'H1'})}).catch(()=>{});
  } catch (_) {}
  // #endregion
  let age: number | null = null;
  try {
    age = member.birth_date ? calculateAge(member.birth_date) : null;
  } catch (e) {
    fetch('http://127.0.0.1:7243/ingest/68b58dbd-8e78-48cd-8fa2-18d1de18a7f6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'pessoa-card.tsx:calculateAge',message:'calculateAge threw',data:{error:String(e),birthDate:member?.birth_date},timestamp:Date.now(),hypothesisId:'H2'})}).catch(()=>{});
    throw e;
  }
  const today = new Date();
  let birthDate: Date | null = null;
  try {
    birthDate = member.birth_date ? new Date(typeof member.birth_date === 'string' ? member.birth_date.split('T')[0] : member.birth_date) : null;
  } catch (e) {
    fetch('http://127.0.0.1:7243/ingest/68b58dbd-8e78-48cd-8fa2-18d1de18a7f6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'pessoa-card.tsx:birthDate',message:'birthDate parse threw',data:{error:String(e)},timestamp:Date.now(),hypothesisId:'H3'})}).catch(()=>{});
    throw e;
  }
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
              {MEMBER_TYPE_LABELS[member.member_type]}
            </Badge>
          </div>
        </div>
        
        <div className="space-y-1 text-sm text-muted-foreground mb-4">
          <p>{member.phone ? formatPhone(member.phone) : '-'}</p>
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
