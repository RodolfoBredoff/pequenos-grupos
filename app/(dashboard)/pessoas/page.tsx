import { createClient } from '@/lib/supabase/server';
import { PessoaCard } from '@/components/pessoas/pessoa-card';
import { BroadcastDialog } from '@/components/pessoas/broadcast-dialog';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { UserPlus, Users } from 'lucide-react';

export default async function PessoasPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data: leader } = await supabase
    .from('leaders')
    .select('group_id')
    .eq('id', user!.id)
    .single();

  if (!leader?.group_id) {
    return <div>Grupo não encontrado.</div>;
  }

  const { data: members } = await supabase
    .from('members')
    .select('*')
    .eq('group_id', leader.group_id)
    .eq('is_active', true)
    .order('full_name');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Pessoas</h1>
          <p className="text-muted-foreground">
            {members?.length || 0} {members?.length === 1 ? 'pessoa' : 'pessoas'} no grupo
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          {members && members.length > 0 && (
            <BroadcastDialog members={members} />
          )}
          <Link href="/pessoas/novo" className="w-full sm:w-auto">
            <Button className="w-full">
              <UserPlus className="mr-2 h-4 w-4" />
              Nova Pessoa
            </Button>
          </Link>
        </div>
      </div>

      {members && members.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {members.map((member) => (
            <PessoaCard key={member.id} member={member} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border rounded-lg">
          <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhuma pessoa cadastrada</h3>
          <p className="text-muted-foreground mb-4">
            Comece adicionando membros ao seu grupo
          </p>
          <Link href="/pessoas/novo">
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Cadastrar Primeira Pessoa
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
