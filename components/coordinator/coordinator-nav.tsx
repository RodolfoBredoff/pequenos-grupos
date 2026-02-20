'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LinkButton } from '@/components/ui/link-button';
import { PastoreioLogo } from '@/components/brand/PastoreioLogo';
import { Home, Users, Group, LogOut, TrendingUp, Building2 } from 'lucide-react';
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
    { href: '/org/dashboard', label: 'Dashboard', icon: <Home className="mr-2 h-4 w-4" />, ph: 'mr-2 inline-block h-4 w-4' },
    { href: '/org/grupos', label: 'Grupos', icon: <Group className="mr-2 h-4 w-4" />, ph: 'mr-2 inline-block h-4 w-4' },
    { href: '/org/lideres', label: 'Líderes', icon: <Users className="mr-2 h-4 w-4" />, ph: 'mr-2 inline-block h-4 w-4' },
    { href: '/org/engajamento', label: 'Engajamento', icon: <TrendingUp className="mr-2 h-4 w-4" />, ph: 'mr-2 inline-block h-4 w-4' },
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

        <div className="p-4 border-t">
          <p className="text-sm text-muted-foreground">{coordinatorName}</p>
          <span className="inline-block mt-1 mb-2 px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700 font-medium">
            Coordenador(a)
          </span>
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
          {navItems.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center justify-center py-2 px-3 min-w-[64px] flex-1 rounded-lg text-muted-foreground transition-colors hover:text-primary active:text-primary shrink-0"
            >
              <span className="text-[10px] mt-1 whitespace-nowrap">{label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
