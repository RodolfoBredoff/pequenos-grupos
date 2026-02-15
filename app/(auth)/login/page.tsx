'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Mail } from 'lucide-react';

const DEBUG_LOG_ENDPOINT = 'http://127.0.0.1:7242/ingest/a57e1808-337a-4c6d-85b0-c37698065cde';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [mounted, setMounted] = useState(false);
  const supabase = createClient();

  // #region agent log
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
        location: 'app/(auth)/login/page.tsx:useEffect',
        message: 'Login mount - extension check',
        data: { hasDarkReader, mounted: true },
        timestamp: Date.now(),
        hypothesisId: 'H1',
      }),
    }).catch(() => {});
  }, []);
  // #endregion

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { 
          emailRedirectTo: `${window.location.origin}/dashboard` 
        }
      });

      if (error) throw error;
      setSent(true);
    } catch (error: any) {
      console.error('Login error:', error);
      const msg = error?.message ?? '';
      const isRateLimit = /rate limit|too many requests|429/i.test(msg);
      if (isRateLimit) {
        alert(
          'Limite de envio de e-mails atingido. O Supabase restringe quantos links podem ser enviados em um período.\n\nAguarde alguns minutos e tente novamente.'
        );
      } else {
        alert('Erro ao enviar link: ' + msg);
      }
    } finally {
      setLoading(false);
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
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setSent(false)}
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
