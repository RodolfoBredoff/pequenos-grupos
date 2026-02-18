'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, X } from 'lucide-react';

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<{ prompt: () => Promise<{ outcome: string }> } | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const isI = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setIsIOS(isI);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as unknown as { prompt: () => Promise<{ outcome: string }> });
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    const wasDismissed = sessionStorage.getItem('pwa-install-dismissed');
    if (wasDismissed) setDismissed(true);
    if (isI && !wasDismissed && !window.matchMedia('(display-mode: standalone)').matches) {
      setShowBanner(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      setShowBanner(false);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setDismissed(true);
    sessionStorage.setItem('pwa-install-dismissed', '1');
  };

  if (!showBanner || dismissed || window.matchMedia('(display-mode: standalone)').matches) {
    return null;
  }

  return (
    <div className="fixed bottom-20 lg:bottom-4 left-4 right-4 lg:left-auto lg:right-4 lg:max-w-sm z-50 bg-card border rounded-lg shadow-lg p-4 flex items-start gap-3">
      <Download className="h-5 w-5 text-primary shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">Instalar App</p>
        {isIOS ? (
          <p className="text-xs text-muted-foreground mt-0.5">
            Toque em <strong>Compartilhar</strong> e depois em <strong>Adicionar à Tela de Início</strong>
          </p>
        ) : (
          <p className="text-xs text-muted-foreground mt-0.5">
            Instale para acessar mais rápido pelo celular
          </p>
        )}
      </div>
      <div className="flex flex-col gap-1 shrink-0">
        {!isIOS && deferredPrompt && (
          <Button size="sm" onClick={handleInstall}>
            Instalar
          </Button>
        )}
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleDismiss}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
