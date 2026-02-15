import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { OfflineIndicator } from '@/components/dashboard/offline-indicator';
import { DashboardNav } from '@/components/dashboard/dashboard-nav';

async function logout() {
  'use server';
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Buscar informações do líder (sem join para evitar dependência do nome da relação no Supabase)
  const { data: leader } = await supabase
    .from('leaders')
    .select('full_name, group_id')
    .eq('id', user.id)
    .single();

  let groupName = 'Meu Grupo';
  if (leader?.group_id) {
    const { data: group } = await supabase
      .from('groups')
      .select('name')
      .eq('id', leader.group_id)
      .single();
    groupName = group?.name ?? 'Meu Grupo';
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center justify-between px-4">
          <h1 className="font-semibold">{groupName}</h1>
        </div>
      </header>

      <div className="flex">
        <DashboardNav
          groupName={groupName}
          leaderDisplayName={leader?.full_name || user.email || ''}
          logoutAction={logout}
        />

        {/* Main Content */}
        <main className="flex-1">
          <div className="container max-w-7xl mx-auto p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>

      {/* Spacer for mobile bottom nav */}
      <div className="lg:hidden h-20" />

      {/* Offline Indicator */}
      <OfflineIndicator groupId={leader?.group_id || undefined} />
    </div>
  );
}
