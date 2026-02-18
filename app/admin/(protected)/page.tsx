import { queryOne } from '@/lib/db/postgres';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Group, Building2, ClipboardCheck } from 'lucide-react';
import Link from 'next/link';

export default async function AdminDashboardPage() {
  const stats = await queryOne<{
    total_groups: number;
    total_leaders: number;
    total_members: number;
    total_organizations: number;
    active_members: number;
    total_meetings: number;
  }>(
    `SELECT
       (SELECT COUNT(*) FROM groups)::int as total_groups,
       (SELECT COUNT(*) FROM leaders)::int as total_leaders,
       (SELECT COUNT(*) FROM members WHERE is_active = TRUE)::int as active_members,
       (SELECT COUNT(*) FROM members)::int as total_members,
       (SELECT COUNT(*) FROM organizations)::int as total_organizations,
       (SELECT COUNT(*) FROM meetings WHERE meeting_date >= CURRENT_DATE - INTERVAL '30 days')::int as total_meetings`
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Visão Geral do Sistema</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie todos os grupos, líderes e participantes do sistema.
        </p>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Organizações
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats?.total_organizations ?? 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Grupos
            </CardTitle>
            <Group className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats?.total_groups ?? 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Líderes
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats?.total_leaders ?? 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Membros Ativos
            </CardTitle>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats?.active_members ?? 0}</p>
            <p className="text-xs text-muted-foreground mt-1">
              de {stats?.total_members ?? 0} total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Atalhos */}
      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/admin/grupos">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Group className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-base">Gerenciar Grupos</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Ver e editar todos os grupos, líderes e configurações
                  </p>
                </div>
              </div>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/admin/lideres">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <Users className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-base">Gerenciar Líderes</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Cadastrar, editar e vincular líderes a grupos
                  </p>
                </div>
              </div>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/admin/organizacoes">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-base">Organizações</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Gerenciar organizações do sistema
                  </p>
                </div>
              </div>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  );
}
