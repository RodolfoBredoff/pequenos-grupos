'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home, Users, ClipboardCheck, Calendar, LogOut, TrendingUp } from 'lucide-react';

const DEBUG_LOG_ENDPOINT = 'http://127.0.0.1:7242/ingest/a57e1808-337a-4c6d-85b0-c37698065cde';

type DashboardNavProps = {
  groupName: string;
  leaderDisplayName: string;
  logoutAction: () => void;
};

export function DashboardNav({ groupName, leaderDisplayName, logoutAction }: DashboardNavProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const hasDarkReader =
      typeof document !== 'undefined' &&
      (document.documentElement.hasAttribute('data-darkreader-mode') ||
        !!document.querySelector('[data-darkreader-inline-stroke]'));
    fetch(DEBUG_LOG_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location: 'components/dashboard/dashboard-nav.tsx:useEffect',
        message: 'Dashboard nav mount',
        data: { hasDarkReader, mounted: true },
        timestamp: Date.now(),
        hypothesisId: 'H5',
      }),
    }).catch(() => {});
  }, []);

  const iconPlaceholder = (className: string) => <span className={className} aria-hidden />;

  return (
    <>
      <aside className="hidden lg:flex lg:flex-col lg:w-64 border-r min-h-screen">
        <div className="p-6 border-b">
          <h1 className="text-xl font-bold">Pequenos Grupos</h1>
          <p className="text-sm text-muted-foreground mt-1">{groupName}</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <Link href="/dashboard">
            <Button variant="ghost" className="w-full justify-start">
              {mounted ? <Home className="mr-2 h-4 w-4" /> : iconPlaceholder('mr-2 inline-block h-4 w-4')}
              Dashboard
            </Button>
          </Link>
          <Link href="/pessoas">
            <Button variant="ghost" className="w-full justify-start">
              {mounted ? <Users className="mr-2 h-4 w-4" /> : iconPlaceholder('mr-2 inline-block h-4 w-4')}
              Pessoas
            </Button>
          </Link>
          <Link href="/chamada">
            <Button variant="ghost" className="w-full justify-start">
              {mounted ? <ClipboardCheck className="mr-2 h-4 w-4" /> : iconPlaceholder('mr-2 inline-block h-4 w-4')}
              Chamada
            </Button>
          </Link>
          <Link href="/agenda">
            <Button variant="ghost" className="w-full justify-start">
              {mounted ? <Calendar className="mr-2 h-4 w-4" /> : iconPlaceholder('mr-2 inline-block h-4 w-4')}
              Agenda
            </Button>
          </Link>
          <Link href="/engajamento">
            <Button variant="ghost" className="w-full justify-start">
              {mounted ? <TrendingUp className="mr-2 h-4 w-4" /> : iconPlaceholder('mr-2 inline-block h-4 w-4')}
              Engajamento
            </Button>
          </Link>
        </nav>

        <div className="p-4 border-t">
          <p className="text-sm text-muted-foreground mb-2">{leaderDisplayName}</p>
          <form action={logoutAction}>
            <Button variant="outline" className="w-full" type="submit">
              {mounted ? <LogOut className="mr-2 h-4 w-4" /> : iconPlaceholder('mr-2 inline-block h-4 w-4')}
              Sair
            </Button>
          </form>
        </div>
      </aside>

      <nav className="lg:hidden fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="grid grid-cols-4 gap-1 p-2">
          <Link href="/dashboard" className="flex flex-col items-center py-2">
            {mounted ? <Home className="h-5 w-5" /> : iconPlaceholder('h-5 w-5 inline-block')}
            <span className="text-xs mt-1">Início</span>
          </Link>
          <Link href="/pessoas" className="flex flex-col items-center py-2">
            {mounted ? <Users className="h-5 w-5" /> : iconPlaceholder('h-5 w-5 inline-block')}
            <span className="text-xs mt-1">Pessoas</span>
          </Link>
          <Link href="/chamada" className="flex flex-col items-center py-2">
            {mounted ? <ClipboardCheck className="h-5 w-5" /> : iconPlaceholder('h-5 w-5 inline-block')}
            <span className="text-xs mt-1">Chamada</span>
          </Link>
          <Link href="/agenda" className="flex flex-col items-center py-2">
            {mounted ? <Calendar className="h-5 w-5" /> : iconPlaceholder('h-5 w-5 inline-block')}
            <span className="text-xs mt-1">Agenda</span>
          </Link>
        </div>
      </nav>
    </>
  );
}
