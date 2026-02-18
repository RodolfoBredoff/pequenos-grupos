import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  }
  return phone;
}

export function cleanPhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

export function calculateAge(birthDate: Date | string): number {
  const birth =
    typeof birthDate === 'string'
      ? new Date(birthDate.includes('T') ? birthDate.split('T')[0] : birthDate)
      : birthDate;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
}

export function getWhatsAppUrl(phone: string, name: string = ''): string {
  const cleaned = cleanPhone(phone);
  const message = name 
    ? encodeURIComponent(`Olá ${name}! Tudo bem?`)
    : encodeURIComponent('Olá! Tudo bem?');
  return `https://wa.me/55${cleaned}?text=${message}`;
}

export function getDayOfWeekName(dayNumber: number): string {
  const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  return days[dayNumber] || '';
}

/**
 * Retorna a URL base da aplicação para uso em links/redirects no navegador.
 * Na nuvem: usa a origem da requisição (Host/X-Forwarded-*) para funcionar com IP/domínio público.
 * Em dev: substitui 0.0.0.0 por localhost.
 */
export function getAppBaseUrlForBrowser(request?: Request): string {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL;
  const isProduction = process.env.NODE_ENV === 'production';

  // Origem da requisição (Host, ou X-Forwarded-* quando atrás de proxy/load balancer)
  let requestOrigin: string | undefined;
  if (request) {
    const forwardedHost = request.headers.get('x-forwarded-host');
    const forwardedProto = request.headers.get('x-forwarded-proto');
    if (forwardedHost) {
      requestOrigin = `${forwardedProto || 'https'}://${forwardedHost}`;
    } else {
      try {
        requestOrigin = new URL(request.url).origin;
      } catch {
        requestOrigin = undefined;
      }
    }
  }

  // Prioridade: env válido (sem 0.0.0.0) > origem da requisição > localhost
  const envIsValid = envUrl && !envUrl.includes('0.0.0.0');
  let origin = envIsValid ? envUrl : (requestOrigin || envUrl || 'http://localhost:3000');

  // 0.0.0.0 é endereço de bind; em produção usar origem da requisição, em dev usar localhost
  if (origin.includes('0.0.0.0')) {
    if (isProduction && requestOrigin && !requestOrigin.includes('0.0.0.0')) {
      origin = requestOrigin;
    } else if (!isProduction) {
      try {
        const u = new URL(origin);
        origin = `${u.protocol}//localhost:${u.port || '3000'}`;
      } catch {
        origin = 'http://localhost:3000';
      }
    } else {
      origin = requestOrigin || origin;
    }
  }

  return origin.replace(/\/$/, '');
}

export function formatDistanceToNow(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'agora mesmo';
  if (diffMins < 60) return `${diffMins} min atrás`;
  if (diffHours < 24) return `${diffHours} hora${diffHours > 1 ? 's' : ''} atrás`;
  if (diffDays < 7) return `${diffDays} dia${diffDays > 1 ? 's' : ''} atrás`;
  
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}
