'use client';

import { Button } from '@/components/ui/button';
import { getWhatsAppUrl } from '@/lib/utils';
import { MessageCircle } from 'lucide-react';

interface WhatsAppButtonProps {
  phone: string;
  name: string;
  className?: string;
}

export function WhatsAppButton({ phone, name, className }: WhatsAppButtonProps) {
  const whatsappUrl = getWhatsAppUrl(phone, name);

  return (
    <Button
      variant="default"
      size="sm"
      className={`bg-green-600 hover:bg-green-700 ${className}`}
      onClick={() => window.open(whatsappUrl, '_blank')}
    >
      <MessageCircle className="h-4 w-4" />
      WhatsApp
    </Button>
  );
}
