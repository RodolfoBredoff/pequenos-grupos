import { getCurrentLeader } from '@/lib/db/queries';
import { EngagementClient } from '@/components/dashboard/engagement-client';

export default async function EngajamentoPage() {
  const leader = await getCurrentLeader();

  if (!leader?.group_id) {
    return <div>Grupo não encontrado.</div>;
  }

  // O EngagementClient busca os dados por conta própria via API,
  // com suporte a filtros de período e por encontro
  return <EngagementClient />;
}
