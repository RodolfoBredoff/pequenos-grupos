import { WhatsAppButton } from './whatsapp-button';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { calculateAge, formatPhone } from '@/lib/utils';
import { MEMBER_TYPE_LABELS } from '@/lib/constants';
import { Pencil, Cake } from 'lucide-react';

interface Member {
  id: string;
  full_name: string;
  phone: string;
  birth_date: string;
  member_type: 'participant' | 'visitor';
}

interface PessoaCardProps {
  member: Member;
}

export function PessoaCard({ member }: PessoaCardProps) {
  const age = calculateAge(member.birth_date);
  const today = new Date();
  const birthDate = new Date(member.birth_date);
  const isBirthday = 
    birthDate.getMonth() === today.getMonth() && 
    birthDate.getDate() === today.getDate();
  
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
          <p>{formatPhone(member.phone)}</p>
          <p>{age} anos</p>
        </div>
      </CardContent>
      
      <CardFooter className="p-4 pt-0 flex gap-2">
        <WhatsAppButton phone={member.phone} name={member.full_name} className="flex-1" />
        <Link href={`/pessoas/${member.id}`} className="flex-1">
          <Button variant="outline" size="sm" className="w-full">
            <Pencil className="h-4 w-4" />
            Editar
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
