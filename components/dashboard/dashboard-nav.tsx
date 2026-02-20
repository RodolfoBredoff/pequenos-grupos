'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LinkButton } from '@/components/ui/link-button';
import { PastoreioLogo } from '@/components/brand/PastoreioLogo';
import { Home, Users, ClipboardCheck, Calendar, LogOut, TrendingUp, Settings } from 'lucide-react';
import { logout } from '@/app/(dashboard)/actions';

type DashboardNavProps = {
  groupName: string;
  leaderDisplayName: string;
  role?: 'leader' | 'secretary' | 'coordinator';
};

export function DashboardNav({ groupName, leaderDisplayName, role = 'leader' }: DashboardNavProps) {
  const isSecretary = role === 'secretary';
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const iconPlaceholder = (className: string) => <span className={className} aria-hidden />;

  return (
    <>
      <aside className="hidden lg:flex lg:flex-col lg:w-64 border-r min-h-screen">
        <div className="p-5 border-b">
          <PastoreioLogo size={28} showWordmark wordmarkClassName="text-lg" />
          <p className="text-xs text-muted-foreground mt-2 pl-1 truncate">{groupName}</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <LinkButton href="/dashboard" variant="ghost" className="w-full justify-start">
            {mounted ? <Home className="mr-2 h-4 w-4" /> : iconPlaceholder('mr-2 inline-block h-4 w-4')}
            Dashboard
          </LinkButton>
          <LinkButton href="/pessoas" variant="ghost" className="w-full justify-start">
            {mounted ? <Users className="mr-2 h-4 w-4" /> : iconPlaceholder('mr-2 inline-block h-4 w-4')}
            Pessoas
          </LinkButton>
          <LinkButton href="/chamada" variant="ghost" className="w-full justify-start">
            {mounted ? <ClipboardCheck className="mr-2 h-4 w-4" /> : iconPlaceholder('mr-2 inline-block h-4 w-4')}
            Chamada
          </LinkButton>
          <LinkButton href="/agenda" variant="ghost" className="w-full justify-start">
            {mounted ? <Calendar className="mr-2 h-4 w-4" /> : iconPlaceholder('mr-2 inline-block h-4 w-4')}
            Agenda
          </LinkButton>
          <LinkButton href="/engajamento" variant="ghost" className="w-full justify-start">
            {mounted ? <TrendingUp className="mr-2 h-4 w-4" /> : iconPlaceholder('mr-2 inline-block h-4 w-4')}
            Engajamento
          </LinkButton>
          {!isSecretary && (
            <LinkButton href="/configuracoes" variant="ghost" className="w-full justify-start">
              {mounted ? <Settings className="mr-2 h-4 w-4" /> : iconPlaceholder('mr-2 inline-block h-4 w-4')}
              Meu Grupo
            </LinkButton>
          )}
        </nav>

        <div className="p-4 border-t">
          <p className="text-sm text-muted-foreground">{leaderDisplayName}</p>
          {isSecretary && (
            <span className="inline-block mt-1 mb-2 px-2 py-0.5 text-xs rounded-full bg-accent/15 text-accent-foreground font-medium">
              Secretário(a)
            </span>
          )}
          {!isSecretary && <div className="mb-2" />}
          <form action={logout}>
            <Button variant="outline" className="w-full" type="submit">
              {mounted ? <LogOut className="mr-2 h-4 w-4" /> : iconPlaceholder('mr-2 inline-block h-4 w-4')}
              Sair
            </Button>
          </form>
        </div>
      </aside>

      <nav className="lg:hidden fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 safe-area-pb">
        <div className="flex overflow-x-auto scrollbar-hide px-1 py-1">
          {[
            { href: '/dashboard', label: 'Início', icon: <Home className="h-5 w-5" />, placeholder: 'h-5 w-5 inline-block' },
            { href: '/pessoas', label: 'Pessoas', icon: <Users className="h-5 w-5" />, placeholder: 'h-5 w-5 inline-block' },
            { href: '/chamada', label: 'Chamada', icon: <ClipboardCheck className="h-5 w-5" />, placeholder: 'h-5 w-5 inline-block' },
            { href: '/agenda', label: 'Agenda', icon: <Calendar className="h-5 w-5" />, placeholder: 'h-5 w-5 inline-block' },
            { href: '/engajamento', label: 'Engajamento', icon: <TrendingUp className="h-5 w-5" />, placeholder: 'h-5 w-5 inline-block' },
            ...(!isSecretary ? [{ href: '/configuracoes', label: 'Meu Grupo', icon: <Settings className="h-5 w-5" />, placeholder: 'h-5 w-5 inline-block' }] : []),
          ].map(({ href, label, icon, placeholder: ph }) => (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center justify-center py-2 px-3 min-w-[64px] flex-1 rounded-lg text-muted-foreground transition-colors hover:text-primary active:text-primary shrink-0"
            >
              {mounted ? icon : iconPlaceholder(ph)}
              <span className="text-[10px] mt-1 whitespace-nowrap">{label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
