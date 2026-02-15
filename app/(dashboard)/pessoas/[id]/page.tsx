import { createClient } from '@/lib/supabase/server';
import { PessoaForm } from '@/components/pessoas/pessoa-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { notFound } from 'next/navigation';

export default async function EditarPessoaPage({
  params,
}: {
  params: { id: string };
}) {
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

  const { data: member } = await supabase
    .from('members')
    .select('*')
    .eq('id', params.id)
    .eq('group_id', leader.group_id)
    .single();

  if (!member) {
    notFound();
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Editar Pessoa</h1>
        <p className="text-muted-foreground">{member.full_name}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações da Pessoa</CardTitle>
        </CardHeader>
        <CardContent>
          <PessoaForm groupId={leader.group_id} initialData={member} />
        </CardContent>
      </Card>
    </div>
  );
}
