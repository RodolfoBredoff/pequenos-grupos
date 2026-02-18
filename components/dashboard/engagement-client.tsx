'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Award, CalendarSearch, Loader2, Users, CheckCircle, XCircle } from 'lucide-react';

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Period = 'weekly' | 'monthly' | 'quarterly' | 'semiannual' | 'yearly';

interface PeriodDataPoint {
  period: string;
  periodStart: string;
  presentes: number;
  ausentes: number;
  meetingCount: number;
  taxa: number;
}

interface MemberStat {
  name: string;
  type: string;
  presences: number;
  absences: number;
  taxa: number;
}

interface MeetingItem {
  id: string;
  meeting_date: string;
  title: string | null;
  label: string;
}

interface MeetingAttendance {
  member_id: string;
  member_name: string;
  member_type: string;
  is_present: boolean;
}

interface MeetingSummary {
  total: number;
  present: number;
  absent: number;
  rate: number;
}

interface MeetingDetail {
  id: string;
  meeting_date: string;
  title: string | null;
  meeting_time: string | null;
  is_cancelled: boolean;
}

// ─── Configuração dos filtros de período ──────────────────────────────────────

const PERIOD_OPTIONS: { value: Period; label: string; desc: string }[] = [
  { value: 'weekly', label: 'Semanal', desc: 'Últimas 8 semanas' },
  { value: 'monthly', label: 'Mensal', desc: 'Últimos 6 meses' },
  { value: 'quarterly', label: 'Trimestral', desc: 'Últimos 4 trimestres' },
  { value: 'semiannual', label: 'Semestral', desc: 'Últimos 4 semestres' },
  { value: 'yearly', label: 'Anual', desc: 'Últimos 3 anos' },
];

// ─── Componentes internos ─────────────────────────────────────────────────────

function PeriodSelector({
  selected,
  onChange,
  titleFilter,
  onTitleFilterChange,
}: {
  selected: Period | 'meeting';
  onChange: (v: Period | 'meeting') => void;
  titleFilter?: string;
  onTitleFilterChange?: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
    <div className="flex flex-wrap gap-2">
      {PERIOD_OPTIONS.map((opt) => (
        <Button
          key={opt.value}
          variant={selected === opt.value ? 'default' : 'outline'}
          size="sm"
          onClick={() => onChange(opt.value)}
          className="flex flex-col h-auto py-1.5 px-3"
        >
          <span className="font-medium">{opt.label}</span>
          <span className="text-xs font-normal opacity-70 hidden sm:block">{opt.desc}</span>
        </Button>
      ))}
      <Button
        variant={selected === 'meeting' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onChange('meeting')}
        className="flex flex-col h-auto py-1.5 px-3"
      >
        <span className="font-medium flex items-center gap-1.5">
          <CalendarSearch className="h-3.5 w-3.5" />
          Por Encontro
        </span>
        <span className="text-xs font-normal opacity-70 hidden sm:block">Detalhe por data</span>
      </Button>
    </div>
    {onTitleFilterChange && (
      <div className="flex items-center gap-2">
        <input
          type="text"
          placeholder="Filtrar por título do encontro (ex: comunhão)"
          value={titleFilter ?? ''}
          onChange={(e) => onTitleFilterChange(e.target.value)}
          className="flex h-9 w-full max-w-xs rounded-md border border-input bg-background px-3 py-1 text-sm"
        />
      </div>
    )}
    </div>
  );
}

function StatsCards({
  periodData,
  perfectAttendance,
  memberStats,
}: {
  periodData: PeriodDataPoint[];
  perfectAttendance: string[];
  memberStats: MemberStat[];
}) {
  const avgRate = periodData.length > 0
    ? (periodData.reduce((s, d) => s + d.taxa, 0) / periodData.length).toFixed(1)
    : '0';

  const trend = periodData.length >= 2
    ? periodData[periodData.length - 1].taxa - periodData[periodData.length - 2].taxa
    : 0;

  const totalRecords = periodData.reduce((s, d) => s + d.presentes + d.ausentes, 0);

  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Taxa Média</CardTitle>
          {trend > 0 ? (
            <TrendingUp className="h-4 w-4 text-green-600" />
          ) : trend < 0 ? (
            <TrendingDown className="h-4 w-4 text-red-600" />
          ) : null}
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{avgRate}%</p>
          <p className="text-xs text-muted-foreground mt-1">
            {trend > 0 && <span className="text-green-600">+{trend.toFixed(1)}% no último período</span>}
            {trend < 0 && <span className="text-red-600">{trend.toFixed(1)}% no último período</span>}
            {trend === 0 && 'Estável'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">100% Presença</CardTitle>
          <Award className="h-4 w-4 text-yellow-600" />
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{perfectAttendance.length}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {perfectAttendance.length === 1 ? 'Membro destaque' : 'Membros destaque'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Membros</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{memberStats.length}</p>
          <p className="text-xs text-muted-foreground mt-1">com registros no período</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Registros</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{totalRecords}</p>
          <p className="text-xs text-muted-foreground mt-1">presenças registradas</p>
        </CardContent>
      </Card>
    </div>
  );
}

function PeriodCharts({
  data,
  periodLabel,
}: {
  data: PeriodDataPoint[];
  periodLabel: string;
}) {
  if (data.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg">
        <p className="text-muted-foreground">Sem dados para o período selecionado.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Gráfico de linha – taxa de presença */}
      <Card>
        <CardHeader>
          <CardTitle>Taxa de Presença — {periodLabel}</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v: number) => `${v}%`} />
              <Legend />
              <Line
                type="monotone"
                dataKey="taxa"
                stroke="#4f46e5"
                strokeWidth={2}
                name="Taxa (%)"
                dot={{ fill: '#4f46e5', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gráfico de barras – presentes vs ausentes */}
      <Card>
        <CardHeader>
          <CardTitle>Presentes × Ausentes — {periodLabel}</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="presentes" fill="#10b981" name="Presentes" radius={[3, 3, 0, 0]} />
              <Bar dataKey="ausentes" fill="#ef4444" name="Ausentes" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

function MemberRankings({
  topPresent,
  topAbsent,
  perfectAttendance,
}: {
  topPresent: MemberStat[];
  topAbsent: MemberStat[];
  perfectAttendance: string[];
}) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        {/* Top 5 mais presentes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Top 5 Mais Presentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {topPresent.length > 0 ? (
                topPresent.map((m, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg border">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex items-center justify-center w-7 h-7 rounded-full bg-green-100 text-green-700 font-bold text-sm shrink-0">
                        {i + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{m.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {m.presences} presença{m.presences !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-green-600 shrink-0">{m.taxa}%</Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Sem dados suficientes</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top 5 mais ausentes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingDown className="h-5 w-5 text-red-600" />
              Top 5 Mais Ausentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {topAbsent.length > 0 ? (
                topAbsent.map((m, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg border">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex items-center justify-center w-7 h-7 rounded-full bg-red-100 text-red-700 font-bold text-sm shrink-0">
                        {i + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{m.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {m.absences} falta{m.absences !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <Badge variant="destructive" className="shrink-0">{m.taxa}%</Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Sem dados suficientes</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Membros destaque */}
      {perfectAttendance.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <Award className="h-5 w-5" />
              Membros Destaque (100% de Presença)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {perfectAttendance.map((name, i) => (
                <Badge key={i} variant="secondary" className="bg-yellow-200 text-yellow-800">
                  {name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function MeetingDetailView({
  meetings,
}: {
  meetings: MeetingItem[];
}) {
  const [selectedId, setSelectedId] = useState<string>(meetings[0]?.id ?? '');
  const [detail, setDetail] = useState<{
    meeting: MeetingDetail;
    attendance: MeetingAttendance[];
    summary: MeetingSummary;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchDetail = useCallback(async (id: string) => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/engagement?meeting_id=${id}`);
      if (res.ok) {
        const data = await res.json();
        setDetail(data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedId) {
      fetchDetail(selectedId);
    }
  }, [selectedId, fetchDetail]);

  if (meetings.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg">
        <p className="text-muted-foreground">Nenhum encontro com presenças registradas.</p>
      </div>
    );
  }

  const present = detail?.attendance.filter((a) => a.is_present) ?? [];
  const absent = detail?.attendance.filter((a) => !a.is_present) ?? [];

  return (
    <div className="space-y-6">
      {/* Seletor de encontro */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarSearch className="h-5 w-5" />
            Selecionar Encontro
          </CardTitle>
        </CardHeader>
        <CardContent>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {meetings.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {!loading && detail && (
        <>
          {/* Cabeçalho do encontro */}
          <div className="rounded-lg border p-4 bg-muted/30">
            <h3 className="font-semibold text-lg">
              {detail.meeting.title ?? `Encontro de ${new Date(detail.meeting.meeting_date + 'T12:00:00Z').toLocaleDateString('pt-BR')}`}
            </h3>
            <p className="text-sm text-muted-foreground">
              {new Date(detail.meeting.meeting_date + 'T12:00:00Z').toLocaleDateString('pt-BR', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
              })}
              {detail.meeting.meeting_time && ` às ${detail.meeting.meeting_time.substring(0, 5)}`}
            </p>
          </div>

          {/* Cards de resumo */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold text-green-600">{detail.summary.present}</p>
                <p className="text-sm text-muted-foreground mt-1">Presentes</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold text-red-600">{detail.summary.absent}</p>
                <p className="text-sm text-muted-foreground mt-1">Ausentes</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold text-indigo-600">{detail.summary.rate}%</p>
                <p className="text-sm text-muted-foreground mt-1">Taxa</p>
              </CardContent>
            </Card>
          </div>

          {/* Gráfico de pizza simplificado (barra horizontal) */}
          {detail.summary.total > 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium">Presença</span>
                  <span className="text-sm text-muted-foreground ml-auto">
                    {detail.summary.present}/{detail.summary.total}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                  <div
                    className="h-3 rounded-full bg-green-500 transition-all"
                    style={{ width: `${detail.summary.rate}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span className="text-green-600">{detail.summary.rate}% presentes</span>
                  <span className="text-red-600">{100 - detail.summary.rate}% ausentes</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Lista detalhada */}
          {detail.attendance.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {/* Presentes */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm text-green-700">
                    <CheckCircle className="h-4 w-4" />
                    Presentes ({present.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1.5">
                    {present.length > 0 ? (
                      present.map((a) => (
                        <div key={a.member_id} className="flex items-center justify-between py-1 border-b last:border-0">
                          <p className="text-sm">{a.member_name}</p>
                          <Badge variant="secondary" className="text-xs">
                            {a.member_type === 'participant' ? 'Membro' : 'Visitante'}
                          </Badge>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">Nenhum presente registrado</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Ausentes */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm text-red-700">
                    <XCircle className="h-4 w-4" />
                    Ausentes ({absent.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1.5">
                    {absent.length > 0 ? (
                      absent.map((a) => (
                        <div key={a.member_id} className="flex items-center justify-between py-1 border-b last:border-0">
                          <p className="text-sm">{a.member_name}</p>
                          <Badge variant="secondary" className="text-xs">
                            {a.member_type === 'participant' ? 'Membro' : 'Visitante'}
                          </Badge>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">Nenhuma falta registrada</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-8 border rounded-lg">
              <p className="text-muted-foreground">Nenhuma presença registrada para este encontro.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

interface EngagementClientProps {
  groupId?: string | null;
}

export function EngagementClient({ groupId }: EngagementClientProps = {}) {
  const [view, setView] = useState<Period | 'meeting'>('monthly');
  const [titleFilter, setTitleFilter] = useState('');
  const [periodData, setPeriodData] = useState<PeriodDataPoint[]>([]);
  const [memberStats, setMemberStats] = useState<MemberStat[]>([]);
  const [meetingList, setMeetingList] = useState<MeetingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasData, setHasData] = useState(false);

  const fetchPeriodData = useCallback(async (period: Period, title?: string) => {
    setLoading(true);
    try {
      let url = `/api/engagement?period=${period}`;
      if (groupId) url += `&group_id=${groupId}`;
      if (title?.trim()) url += `&title_filter=${encodeURIComponent(title.trim())}`;
      const res = await fetch(url);
      if (!res.ok) return;
      const data = await res.json();
      setPeriodData(data.periodData ?? []);
      setMemberStats(data.memberStats ?? []);
      setMeetingList(data.meetingList ?? []);
      setHasData((data.periodData ?? []).length > 0 || (data.meetingList ?? []).length > 0);
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  const [debouncedTitle, setDebouncedTitle] = useState(titleFilter);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedTitle(titleFilter), 400);
    return () => clearTimeout(t);
  }, [titleFilter]);

  useEffect(() => {
    if (view !== 'meeting') {
      fetchPeriodData(view as Period, debouncedTitle);
    } else {
      fetchPeriodData('monthly', debouncedTitle);
    }
  }, [view, fetchPeriodData, debouncedTitle]);

  const periodLabel = PERIOD_OPTIONS.find((o) => o.value === view)?.label ?? '';

  const topPresent = [...memberStats]
    .filter((m) => m.presences + m.absences > 0)
    .sort((a, b) => b.presences - a.presences)
    .slice(0, 5);

  const topAbsent = [...memberStats]
    .filter((m) => m.absences > 0)
    .sort((a, b) => b.absences - a.absences)
    .slice(0, 5);

  const perfectAttendance = memberStats
    .filter((m) => m.presences > 0 && m.absences === 0)
    .map((m) => m.name);

  return (
    <div className="space-y-6">
      {/* Header e seletor */}
      <div className="space-y-3">
        <div>
          <h1 className="text-3xl font-bold">Dashboard de Engajamento</h1>
          <p className="text-muted-foreground mt-1">Análise de presença por período ou encontro</p>
        </div>
        <PeriodSelector
          selected={view}
          onChange={setView}
          titleFilter={titleFilter}
          onTitleFilterChange={setTitleFilter}
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : !hasData && view !== 'meeting' ? (
        <div className="text-center py-16 border rounded-lg">
          <p className="text-lg text-muted-foreground">Sem dados de presença no período.</p>
          <p className="text-sm text-muted-foreground mt-1">
            Registre presenças na página de Chamada para ver as análises aqui.
          </p>
        </div>
      ) : view === 'meeting' ? (
        <MeetingDetailView meetings={meetingList} />
      ) : (
        <>
          <StatsCards
            periodData={periodData}
            perfectAttendance={perfectAttendance}
            memberStats={memberStats}
          />
          <PeriodCharts data={periodData} periodLabel={periodLabel} />
          <MemberRankings
            topPresent={topPresent}
            topAbsent={topAbsent}
            perfectAttendance={perfectAttendance}
          />
        </>
      )}
    </div>
  );
}
