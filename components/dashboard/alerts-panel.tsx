'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, Cake, Check } from 'lucide-react';
import { NOTIFICATION_TYPES } from '@/lib/constants';

interface Notification {
  id: string;
  notification_type: 'absence_alert' | 'birthday';
  message: string;
  is_read: boolean;
  created_at: string;
}

interface AlertsPanelProps {
  notifications: Notification[];
}

export function AlertsPanel({ notifications: initialNotifications }: AlertsPanelProps) {
  const [notifications, setNotifications] = useState(initialNotifications);

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PUT',
      });

      if (!response.ok) {
        throw new Error('Erro ao marcar notificação como lida');
      }

      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === notificationId ? { ...notif, is_read: true } : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  if (notifications.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Alertas e Notificações</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Nenhuma notificação no momento.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Alertas e Notificações</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`p-4 rounded-lg border flex items-start gap-3 ${
              !notification.is_read ? 'bg-accent' : 'bg-background'
            }`}
          >
            <div className="mt-0.5">
              {notification.notification_type === NOTIFICATION_TYPES.ABSENCE_ALERT ? (
                <AlertCircle className="h-5 w-5 text-red-500" />
              ) : (
                <Cake className="h-5 w-5 text-yellow-500" />
              )}
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm">{notification.message}</p>
                {!notification.is_read && (
                  <Badge variant="default" className="shrink-0">
                    Novo
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {new Date(notification.created_at).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
              {!notification.is_read && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => markAsRead(notification.id)}
                  className="h-7 text-xs"
                >
                  <Check className="h-3 w-3 mr-1" />
                  Marcar como lida
                </Button>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
