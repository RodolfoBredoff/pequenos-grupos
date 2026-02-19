import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserCheck, UserPlus, TrendingUp, Cake } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardsProps {
  totalMembers: number;
  totalParticipants: number;
  weekAttendancePercent?: number;
  birthdayCount?: number;
}

function AttendanceRing({ percent }: { percent: number }) {
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  const ringColor =
    percent >= 75
      ? 'text-status-present'
      : percent >= 50
      ? 'text-status-risk'
      : 'text-status-absent';

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="44" height="44" className="-rotate-90">
        <circle
          cx="22"
          cy="22"
          r={radius}
          stroke="currentColor"
          strokeWidth="4"
          fill="none"
          className="text-muted/40"
        />
        <circle
          cx="22"
          cy="22"
          r={radius}
          stroke="currentColor"
          strokeWidth="4"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={cn('transition-all duration-500', ringColor)}
        />
      </svg>
      <span className={cn('absolute text-[10px] font-bold', ringColor)}>
        {percent}%
      </span>
    </div>
  );
}

export function StatsCards({
  totalMembers,
  totalParticipants,
  weekAttendancePercent,
  birthdayCount,
}: StatsCardsProps) {
  const totalVisitors = totalMembers - totalParticipants;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Pessoas</CardTitle>
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
            <Users className="h-4 w-4 text-primary" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalMembers}</div>
          <p className="text-xs text-muted-foreground">Ativos no grupo</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Participantes</CardTitle>
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
            <UserCheck className="h-4 w-4 text-primary" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalParticipants}</div>
          <p className="text-xs text-muted-foreground">Membros regulares</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Visitantes</CardTitle>
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-accent/15">
            <UserPlus className="h-4 w-4 text-accent" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalVisitors}</div>
          <p className="text-xs text-muted-foreground">Primeiras visitas</p>
        </CardContent>
      </Card>

      {weekAttendancePercent !== undefined && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Presença Semanal</CardTitle>
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="flex items-center gap-3">
            <AttendanceRing percent={weekAttendancePercent} />
            <p className="text-xs text-muted-foreground">da última reunião</p>
          </CardContent>
        </Card>
      )}

      {birthdayCount !== undefined && birthdayCount > 0 && (
        <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-800/40 dark:bg-amber-900/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-amber-700 dark:text-amber-400">
              Aniversariantes
            </CardTitle>
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30">
              <Cake className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-700 dark:text-amber-400">
              {birthdayCount}
            </div>
            <p className="text-xs text-amber-600/70 dark:text-amber-500/70">este mês</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
