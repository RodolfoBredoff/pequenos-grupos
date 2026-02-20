'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { KeyRound, Eye, EyeOff, CheckCircle2, XCircle } from 'lucide-react';

function PasswordRequirements({ password }: { password: string }) {
  const checks = [
    { label: 'Mínimo 8 caracteres', ok: password.length >= 8 },
    { label: 'Letra maiúscula (A-Z)', ok: /[A-Z]/.test(password) },
    { label: 'Letra minúscula (a-z)', ok: /[a-z]/.test(password) },
    { label: 'Número (0-9)', ok: /[0-9]/.test(password) },
  ];

  return (
    <ul className="space-y-1 mt-2">
      {checks.map(({ label, ok }) => (
        <li key={label} className={`flex items-center gap-2 text-xs ${ok ? 'text-green-600' : 'text-muted-foreground'}`}>
          {ok
            ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
            : <XCircle className="h-3.5 w-3.5 shrink-0" />}
          {label}
        </li>
      ))}
    </ul>
  );
}

export function ChangePasswordForm({ hasExistingPassword }: { hasExistingPassword: boolean }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [currentConfirm, setCurrentConfirm] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showCurrentConfirm, setShowCurrentConfirm] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (hasExistingPassword && currentPassword !== currentConfirm) {
      setError('A confirmação da senha atual não coincide.');
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      setError('A nova senha não atende aos requisitos.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_password: hasExistingPassword ? currentPassword : undefined,
          new_password: newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Erro ao alterar senha');
      } else {
        setSuccess('Senha alterada com sucesso!');
        setCurrentPassword('');
        setCurrentConfirm('');
        setNewPassword('');
      }
    } catch {
      setError('Erro ao processar solicitação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <KeyRound className="h-4 w-4" />
          Alterar Senha
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4 max-w-sm">
          {error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-md p-3">{error}</p>
          )}
          {success && (
            <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-md p-3">{success}</p>
          )}

          {hasExistingPassword && (
            <>
              <div className="space-y-2">
                <Label htmlFor="current-password">Senha atual</Label>
                <div className="relative">
                  <Input
                    id="current-password"
                    type={showCurrent ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Digite sua senha atual"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="current-confirm">Confirmar senha atual</Label>
                <div className="relative">
                  <Input
                    id="current-confirm"
                    type={showCurrentConfirm ? 'text' : 'password'}
                    value={currentConfirm}
                    onChange={(e) => setCurrentConfirm(e.target.value)}
                    placeholder="Repita a senha atual"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentConfirm((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showCurrentConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="new-password">Nova senha</Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Digite a nova senha"
                required
              />
              <button
                type="button"
                onClick={() => setShowNew((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {newPassword.length > 0 && <PasswordRequirements password={newPassword} />}
            {newPassword.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Mínimo 8 caracteres com letra maiúscula, minúscula e número.
              </p>
            )}
          </div>

          <Button type="submit" disabled={loading}>
            {loading ? 'Salvando...' : 'Alterar Senha'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
