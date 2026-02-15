import { createClient } from '@/lib/supabase/server';
import { PessoaForm } from '@/components/pessoas/pessoa-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default async function NovaPessoaPage() {
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

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Nova Pessoa</h1>
        <p className="text-muted-foreground">Adicionar novo membro ao grupo</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações da Pessoa</CardTitle>
        </CardHeader>
        <CardContent>
          <PessoaForm groupId={leader.group_id} />
        </CardContent>
      </Card>
    </div>
  );
}
