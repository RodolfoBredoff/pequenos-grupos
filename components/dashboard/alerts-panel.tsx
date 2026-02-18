'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, Cake, Check, CalendarDays, Users } from 'lucide-react';
import { NOTIFICATION_TYPES } from '@/lib/constants';
import { formatDate, isTodayBirthday } from '@/lib/utils';

interface Notification {
  id: string;
  notification_type: 'absence_alert' | 'birthday';
  message: string;
  is_read: boolean;
  created_at: string;
}

interface UpcomingMeeting {
  id: string;
  meeting_date: string;
  title: string | null;
  meeting_time: string | null;
}

interface UpcomingBirthday {
  id: string;
  full_name: string;
  birth_date: string;
  member_type: string;
}

interface AlertsPanelProps {
  notifications: Notification[];
  upcomingMeetings?: UpcomingMeeting[];
  upcomingBirthdays?: UpcomingBirthday[];
}

export function AlertsPanel({
  notifications: initialNotifications,
  upcomingMeetings = [],
  upcomingBirthdays = [],
}: AlertsPanelProps) {
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

  const hasContent =
    notifications.length > 0 ||
    upcomingMeetings.length > 0 ||
    upcomingBirthdays.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Alertas e Notificações</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {!hasContent && (
          <p className="text-sm text-muted-foreground">
            Nenhuma notificação no momento.
          </p>
        )}

        {/* Próximos encontros */}
        {upcomingMeetings.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              <CalendarDays className="h-4 w-4" />
              Próximos Encontros
            </div>
            <div className="space-y-2">
              {upcomingMeetings.map((meeting) => (
                <div
                  key={meeting.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-background"
                >
                  <div>
                    {meeting.title && (
                      <p className="text-sm font-medium">{meeting.title}</p>
                    )}
                    <p className={`text-sm ${meeting.title ? 'text-muted-foreground' : 'font-medium'}`}>
                      {formatDate(meeting.meeting_date)}
                    </p>
                    {meeting.meeting_time && (
                      <p className="text-xs text-muted-foreground">
                        {meeting.meeting_time.substring(0, 5)}
                      </p>
                    )}
                  </div>
                  <Badge variant="outline" className="text-xs shrink-0">
                    Confirmado
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Próximos aniversariantes */}
        {upcomingBirthdays.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              <Users className="h-4 w-4" />
              Próximos Aniversariantes
            </div>
            <div className="space-y-2">
              {upcomingBirthdays.map((person) => {
                const isToday = isTodayBirthday(person.birth_date);
                return (
                  <div
                    key={person.id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      isToday ? 'bg-yellow-50 border-yellow-200' : 'bg-background'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Cake className={`h-4 w-4 shrink-0 ${isToday ? 'text-yellow-500' : 'text-muted-foreground'}`} />
                      <div>
                        <p className="text-sm font-medium">
                          {person.full_name}
                          {isToday && <span className="ml-2 text-yellow-600">🎉 Hoje!</span>}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {person.birth_date
                            ? (() => {
                                const parts = person.birth_date.split('T')[0].split('-');
                                return `${parts[2]}/${parts[1]}`;
                              })()
                            : ''}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={person.member_type === 'participant' ? 'default' : 'secondary'}
                      className="text-xs shrink-0"
                    >
                      {person.member_type === 'participant' ? 'Participante' : 'Visitante'}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Notificações do sistema (faltas + aniversários do dia) */}
        {notifications.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              <AlertCircle className="h-4 w-4" />
              Notificações
            </div>
            <div className="space-y-3">
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
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
