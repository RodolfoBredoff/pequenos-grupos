import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/auth/admin-session';
import { AdminNav } from '@/components/admin/admin-nav';

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getAdminSession();

  if (!admin) {
    redirect('/admin/login');
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <AdminNav adminEmail={admin.email} />
      <main className="container max-w-7xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
