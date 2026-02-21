import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { getCurrentLeader } from '@/lib/db/queries';
import { queryOne } from '@/lib/db/postgres';
import { OfflineIndicator } from '@/components/dashboard/offline-indicator';
import { DashboardNav } from '@/components/dashboard/dashboard-nav';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSession();

  if (!user) {
    redirect('/api/auth/clear-session?to=/login');
  }

  // Buscar informações do líder
  const leader = await getCurrentLeader();

  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/68b58dbd-8e78-48cd-8fa2-18d1de18a7f6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/(dashboard)/layout.tsx',message:'getCurrentLeader result',data:{leaderFound:!!leader,leaderId:leader?.id ?? null,role:leader?.role ?? null,group_id:leader?.group_id ?? null,userId:user.id},timestamp:Date.now(),hypothesisId:'H3'})}).catch(()=>{});
  // #endregion

  if (!leader) {
    redirect('/api/auth/clear-session?to=/login&reason=no-leader');
  }

  // Coordinators have their own layout under /org
  if (leader.role === 'coordinator') {
    redirect('/org/dashboard');
  }

  let groupName = 'Meu Grupo';
  if (leader.group_id) {
    const group = await queryOne<{ name: string }>(
      `SELECT name FROM groups WHERE id = $1`,
      [leader.group_id]
    );
    groupName = group?.name ?? 'Meu Grupo';
  }

  return (
    <div className="min-h-screen bg-background" suppressHydrationWarning>
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
          role={leader.role}
        />

        {/* Main Content */}
        <main className="flex-1 min-w-0 w-full">
          <div className="container max-w-7xl mx-auto px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8 pb-24 lg:pb-8">
            {children}
          </div>
        </main>
      </div>

      {/* Spacer for mobile bottom nav */}
      <div className="lg:hidden h-16 flex-shrink-0" />

      {/* Offline Indicator */}
      <OfflineIndicator groupId={leader?.group_id || undefined} />
    </div>
  );
}
