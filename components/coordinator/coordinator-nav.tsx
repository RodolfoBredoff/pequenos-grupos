'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LinkButton } from '@/components/ui/link-button';
import { PastoreioLogo } from '@/components/brand/PastoreioLogo';
import { Home, Users, Group, LogOut, TrendingUp, Building2, UserCircle } from 'lucide-react';
import { logout } from '@/app/(dashboard)/actions';

type CoordinatorNavProps = {
  orgName: string;
  coordinatorName: string;
};

export function CoordinatorNav({ orgName, coordinatorName }: CoordinatorNavProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const iconPlaceholder = (className: string) => <span className={className} aria-hidden />;

  const navItems = [
    { href: '/org/dashboard', label: 'Dashboard', icon: <Home className="h-5 w-5" />, ph: 'h-5 w-5 inline-block' },
    { href: '/org/grupos', label: 'Grupos', icon: <Group className="h-5 w-5" />, ph: 'h-5 w-5 inline-block' },
    { href: '/org/lideres', label: 'Líderes', icon: <Users className="h-5 w-5" />, ph: 'h-5 w-5 inline-block' },
    { href: '/org/engajamento', label: 'Engajamento', icon: <TrendingUp className="h-5 w-5" />, ph: 'h-5 w-5 inline-block' },
  ];

  return (
    <>
      <aside className="hidden lg:flex lg:flex-col lg:w-64 border-r min-h-screen">
        <div className="p-5 border-b">
          <PastoreioLogo size={28} showWordmark wordmarkClassName="text-lg" />
          <div className="flex items-center gap-1 mt-2 pl-1">
            <Building2 className="h-3 w-3 text-muted-foreground shrink-0" />
            <p className="text-xs text-muted-foreground truncate">{orgName}</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ href, label, icon, ph }) => (
            <LinkButton key={href} href={href} variant="ghost" className="w-full justify-start">
              {mounted ? icon : iconPlaceholder(ph)}
              {label}
            </LinkButton>
          ))}
        </nav>

        <div className="p-4 border-t space-y-2">
          <p className="text-sm text-muted-foreground truncate">{coordinatorName}</p>
          <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700 font-medium">
            Coordenador(a)
          </span>
          <LinkButton href="/org/conta" variant="ghost" className="w-full justify-start">
            {mounted ? <UserCircle className="mr-2 h-4 w-4" /> : iconPlaceholder('mr-2 inline-block h-4 w-4')}
            Minha Conta
          </LinkButton>
          <form action={logout}>
            <Button variant="outline" className="w-full" type="submit">
              {mounted ? <LogOut className="mr-2 h-4 w-4" /> : iconPlaceholder('mr-2 inline-block h-4 w-4')}
              Sair
            </Button>
          </form>
        </div>
      </aside>

      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 safe-area-pb">
        <div className="flex justify-around items-stretch min-h-14 px-0.5 py-1">
          {[
            { href: '/org/dashboard', label: 'Início', icon: <Home className="h-5 w-5 shrink-0" /> },
            { href: '/org/grupos', label: 'Grupos', icon: <Group className="h-5 w-5 shrink-0" /> },
            { href: '/org/lideres', label: 'Líderes', icon: <Users className="h-5 w-5 shrink-0" /> },
            { href: '/org/engajamento', label: 'Engaj.', icon: <TrendingUp className="h-5 w-5 shrink-0" /> },
            { href: '/org/conta', label: 'Conta', icon: <UserCircle className="h-5 w-5 shrink-0" /> },
          ].map(({ href, label, icon }) => (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center justify-center flex-1 min-w-0 py-1.5 px-0.5 rounded-lg text-muted-foreground transition-colors hover:text-primary hover:bg-accent active:text-primary"
            >
              {mounted ? icon : <span className="h-5 w-5 inline-block shrink-0" aria-hidden />}
              <span className="text-[10px] font-medium mt-0.5 truncate max-w-full">{label}</span>
            </Link>
          ))}
          <form action={logout} className="flex flex-1 min-w-0">
            <button
              type="submit"
              className="flex flex-col items-center justify-center flex-1 min-w-0 py-1.5 px-0.5 text-muted-foreground hover:text-destructive transition-colors rounded-lg"
            >
              {mounted ? <LogOut className="h-5 w-5 shrink-0" /> : <span className="h-5 w-5 inline-block shrink-0" aria-hidden />}
              <span className="text-[10px] font-medium mt-0.5">Sair</span>
            </button>
          </form>
        </div>
      </nav>
    </>
  );
}
