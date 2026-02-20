import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { getCoordinatorSession } from '@/lib/auth/coordinator-session';
import { queryOne } from '@/lib/db/postgres';
import { CoordinatorNav } from '@/components/coordinator/coordinator-nav';

export default async function CoordinatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSession();

  if (!user) {
    redirect('/login');
  }

  const coordinator = await getCoordinatorSession();

  if (!coordinator) {
    redirect('/dashboard');
  }

  const org = await queryOne<{ name: string }>(
    `SELECT name FROM organizations WHERE id = $1`,
    [coordinator.organization_id]
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="lg:hidden sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center justify-between px-4">
          <h1 className="font-semibold">{org?.name ?? 'Minha Organização'}</h1>
        </div>
      </header>

      <div className="flex">
        <CoordinatorNav
          orgName={org?.name ?? 'Minha Organização'}
          coordinatorName={coordinator.full_name || user.email || ''}
        />

        <main className="flex-1">
          <div className="container max-w-7xl mx-auto p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>

      <div className="lg:hidden h-20" />
    </div>
  );
}
