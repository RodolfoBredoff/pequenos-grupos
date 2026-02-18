'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Mail } from 'lucide-react';

function LoginForm() {
  const searchParams = useSearchParams();
  const reason = useMemo(() => searchParams.get('reason'), [searchParams]);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [magicLinkUrl, setMagicLinkUrl] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMagicLinkUrl(null);

    try {
      const response = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        const msg = data.details || data.error || 'Erro ao enviar link de acesso';
        throw new Error(msg);
      }

      if (data.magicLink) {
        setMagicLinkUrl(data.magicLink);
        console.log('🔗 Magic Link (DEV):', data.magicLink);
      }

      setSent(true);
    } catch (error: unknown) {
      console.error('Login error:', error);
      const msg = error instanceof Error ? error.message : 'Erro desconhecido';
      alert('Erro ao enviar link: ' + msg);
    } finally {
      setLoading(false);
    }
  };

  const copyMagicLink = () => {
    if (magicLinkUrl) {
      navigator.clipboard.writeText(magicLinkUrl);
      alert('Link copiado! Cole no navegador para fazer login.');
    }
  };

  if (sent) {
    return (
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
            {mounted ? <Mail className="h-6 w-6 text-green-600" /> : <span className="h-6 w-6" />}
          </div>
          <CardTitle>Verifique seu e-mail</CardTitle>
          <CardDescription>
            Enviamos um link de acesso para <strong>{email}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center mb-4">
            Clique no link no e-mail para fazer login. O link expira em 1 hora.
          </p>

          {magicLinkUrl && (
            <div className="mb-4 p-3 rounded-lg bg-muted border text-center">
              <p className="text-xs text-muted-foreground mb-2">Use o link abaixo para fazer login (expira em 1 hora):</p>
              <a
                href={magicLinkUrl}
                className="text-sm text-primary underline break-all block mb-2"
              >
                {magicLinkUrl}
              </a>
              <Button type="button" variant="secondary" size="sm" onClick={copyMagicLink}>
                Copiar link
              </Button>
            </div>
          )}

          <Button
            variant="outline"
            className="w-full"
            onClick={() => { setSent(false); setMagicLinkUrl(null); }}
          >
            Usar outro e-mail
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Pequenos Grupos</CardTitle>
        <CardDescription>
          Entre com seu e-mail para receber um link de acesso
        </CardDescription>
      </CardHeader>
      <CardContent>
        {reason === 'no-leader' && (
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-3 mb-4">
            Sua conta ainda não está cadastrada como líder de um grupo. Execute o setup inicial ou peça ao administrador para vincular seu e-mail a um grupo.
          </p>
        )}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (
              <>
                {mounted ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <span className="mr-2 inline-block h-4 w-4" />}
                Enviando...
              </>
            ) : (
              <>
                {mounted ? <Mail className="mr-2 h-4 w-4" /> : <span className="mr-2 inline-block h-4 w-4" />}
                Enviar Link de Acesso
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    }>
      <LoginForm />
    </Suspense>
  );
}
