'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Award, CalendarSearch, Loader2, Users, CheckCircle, XCircle, Star, List } from 'lucide-react';

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Period = 'weekly' | 'monthly' | 'quarterly' | 'semiannual' | 'yearly';

type MemberFilter = 'total' | 'participants' | 'visitors';

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
  meeting_type?: string;
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

interface TitleGroup {
  title: string;
  count: number;
  latest_date: string;
}

// ─── Configuração dos filtros de período ──────────────────────────────────────

const PERIOD_OPTIONS: { value: Period; label: string; desc: string }[] = [
  { value: 'weekly', label: 'Semanal', desc: 'Últimas 8 semanas' },
  { value: 'monthly', label: 'Mensal', desc: 'Últimos 6 meses' },
  { value: 'quarterly', label: 'Trimestral', desc: 'Últimos 4 trimestres' },
  { value: 'semiannual', label: 'Semestral', desc: 'Últimos 4 semestres' },
  { value: 'yearly', label: 'Anual', desc: 'Últimos 3 anos' },
];

const MEMBER_FILTER_OPTIONS: { value: MemberFilter; label: string }[] = [
  { value: 'total', label: 'Total' },
  { value: 'participants', label: 'Participantes' },
  { value: 'visitors', label: 'Visitantes' },
];

// ─── Componentes internos ─────────────────────────────────────────────────────

function MemberFilterSelector({
  value,
  onChange,
}: {
  value: MemberFilter;
  onChange: (v: MemberFilter) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-muted-foreground mr-1">Tipo:</span>
      {MEMBER_FILTER_OPTIONS.map((opt) => (
        <Button
          key={opt.value}
          variant={value === opt.value ? 'default' : 'outline'}
          size="sm"
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </Button>
      ))}
    </div>
  );
}

function PeriodSelector({
  selected,
  onChange,
  titleFilter,
  onTitleFilterChange,
}: {
  selected: Period | 'meeting' | 'title_group';
  onChange: (v: Period | 'meeting' | 'title_group') => void;
  titleFilter?: string;
  onTitleFilterChange?: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {PERIOD_OPTIONS.map((opt) => (
          <Button key={opt.value} variant={selected === opt.value ? 'default' : 'outline'} size="sm"
            onClick={() => onChange(opt.value)} className="flex flex-col h-auto py-1.5 px-3">
            <span className="font-medium">{opt.label}</span>
            <span className="text-xs font-normal opacity-70 hidden sm:block">{opt.desc}</span>
          </Button>
        ))}
        <Button variant={selected === 'meeting' ? 'default' : 'outline'} size="sm"
          onClick={() => onChange('meeting')} className="flex flex-col h-auto py-1.5 px-3">
          <span className="font-medium flex items-center gap-1.5">
            <CalendarSearch className="h-3.5 w-3.5" />
            Por Encontro
          </span>
          <span className="text-xs font-normal opacity-70 hidden sm:block">Detalhe por data</span>
        </Button>
        <Button variant={selected === 'title_group' ? 'default' : 'outline'} size="sm"
          onClick={() => onChange('title_group')} className="flex flex-col h-auto py-1.5 px-3">
          <span className="font-medium flex items-center gap-1.5">
            <List className="h-3.5 w-3.5" />
            Por Nome
          </span>
          <span className="text-xs font-normal opacity-70 hidden sm:block">Vários do mesmo nome</span>
        </Button>
      </div>
      {onTitleFilterChange && selected !== 'meeting' && selected !== 'title_group' && (
        <div className="flex items-center gap-2">
          <input type="text" placeholder="Filtrar por título do encontro"
            value={titleFilter ?? ''} onChange={(e) => onTitleFilterChange(e.target.value)}
            className="flex h-9 w-full sm:max-w-xs rounded-md border border-input bg-background px-3 py-1 text-sm" />
        </div>
      )}
    </div>
  );
}

function StatsCards({
  periodData, perfectAttendance, memberStats,
}: { periodData: PeriodDataPoint[]; perfectAttendance: string[]; memberStats: MemberStat[] }) {
  const avgRate = periodData.length > 0
    ? (periodData.reduce((s, d) => s + d.taxa, 0) / periodData.length).toFixed(1) : '0';
  const trend = periodData.length >= 2
    ? periodData[periodData.length - 1].taxa - periodData[periodData.length - 2].taxa : 0;
  const totalRecords = periodData.reduce((s, d) => s + d.presentes + d.ausentes, 0);

  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Taxa Média</CardTitle>
          {trend > 0 ? <TrendingUp className="h-4 w-4 text-green-600" /> : trend < 0 ? <TrendingDown className="h-4 w-4 text-red-600" /> : null}
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
          <p className="text-xs text-muted-foreground mt-1">{perfectAttendance.length === 1 ? 'Membro destaque' : 'Membros destaque'}</p>
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

function PeriodCharts({ data, periodLabel }: { data: PeriodDataPoint[]; periodLabel: string }) {
  if (data.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg">
        <p className="text-muted-foreground">Sem dados para o período selecionado.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="text-base sm:text-lg">Taxa de Presença — {periodLabel}</CardTitle></CardHeader>
        <CardContent className="px-2 sm:px-6">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
              <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 10 }} width={40} />
              <Tooltip formatter={(v: number) => `${v}%`} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="taxa" stroke="hsl(145, 55%, 30%)" strokeWidth={2} name="Taxa (%)"
                dot={{ fill: 'hsl(145, 55%, 30%)', r: 3 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-base sm:text-lg">Presentes × Ausentes — {periodLabel}</CardTitle></CardHeader>
        <CardContent className="px-2 sm:px-6">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10 }} width={40} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="presentes" fill="#10b981" name="Presentes" radius={[3, 3, 0, 0]} />
              <Bar dataKey="ausentes" fill="#ef4444" name="Ausentes" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

function MemberRankings({ topPresent, topAbsent, perfectAttendance }: {
  topPresent: MemberStat[]; topAbsent: MemberStat[]; perfectAttendance: string[];
}) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-5 w-5 text-green-600" />Top 5 Mais Presentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {topPresent.length > 0 ? topPresent.map((m, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-lg border">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex items-center justify-center w-7 h-7 rounded-full bg-green-100 text-green-700 font-bold text-sm shrink-0">{i + 1}</div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{m.name}</p>
                      <p className="text-xs text-muted-foreground">{m.presences} presença{m.presences !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <Badge className="bg-green-600 shrink-0">{m.taxa}%</Badge>
                </div>
              )) : <p className="text-sm text-muted-foreground">Sem dados suficientes</p>}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingDown className="h-5 w-5 text-red-600" />Top 5 Mais Ausentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {topAbsent.length > 0 ? topAbsent.map((m, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-lg border">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex items-center justify-center w-7 h-7 rounded-full bg-red-100 text-red-700 font-bold text-sm shrink-0">{i + 1}</div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{m.name}</p>
                      <p className="text-xs text-muted-foreground">{m.absences} falta{m.absences !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <Badge variant="destructive" className="shrink-0">{m.taxa}%</Badge>
                </div>
              )) : <p className="text-sm text-muted-foreground">Sem dados suficientes</p>}
            </div>
          </CardContent>
        </Card>
      </div>
      {perfectAttendance.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <Award className="h-5 w-5" />Membros Destaque (100% de Presença)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {perfectAttendance.map((name, i) => (
                <Badge key={i} variant="secondary" className="bg-yellow-200 text-yellow-800">{name}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Visualização por encontro individual ─────────────────────────────────────

interface MeetingDetailResponse {
  meeting: MeetingDetail;
  attendance: MeetingAttendance[];
  guests?: { full_name: string; phone: string | null }[];
  summary: MeetingSummary;
}

function MeetingDetailView({ meetings, memberFilter }: { meetings: MeetingItem[]; memberFilter: MemberFilter }) {
  const [selectedId, setSelectedId] = useState<string>(meetings[0]?.id ?? '');
  const [detail, setDetail] = useState<MeetingDetailResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchDetail = useCallback(async (id: string) => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/engagement?meeting_id=${id}&member_filter=${memberFilter}`);
      if (res.ok) setDetail(await res.json());
    } finally { setLoading(false); }
  }, [memberFilter]);

  useEffect(() => { if (selectedId) fetchDetail(selectedId); }, [selectedId, fetchDetail]);

  if (meetings.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg">
        <p className="text-muted-foreground">Nenhum encontro com presenças registradas.</p>
      </div>
    );
  }

  const present = detail?.attendance.filter((a) => a.is_present) ?? [];
  const absent = detail?.attendance.filter((a) => !a.is_present) ?? [];
  const guests = detail?.guests ?? [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarSearch className="h-5 w-5" />Selecionar Encontro
          </CardTitle>
        </CardHeader>
        <CardContent>
          <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
            {meetings.map((m) => (
              <option key={m.id} value={m.id}>
                {m.meeting_type === 'special_event' ? '⭐ ' : ''}{m.label}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>
      {loading && <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}
      {!loading && detail && (
        <>
          <div className="rounded-lg border p-4 bg-muted/30">
            <h3 className="font-semibold text-lg">
              {detail.meeting.title ?? `Encontro de ${new Date(detail.meeting.meeting_date + 'T12:00:00Z').toLocaleDateString('pt-BR')}`}
            </h3>
            <p className="text-sm text-muted-foreground">
              {new Date(detail.meeting.meeting_date + 'T12:00:00Z').toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              {detail.meeting.meeting_time && ` às ${detail.meeting.meeting_time.substring(0, 5)}`}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Card><CardContent className="pt-6 text-center"><p className="text-3xl font-bold text-green-600">{detail.summary.present}</p><p className="text-sm text-muted-foreground mt-1">Presentes</p></CardContent></Card>
            <Card><CardContent className="pt-6 text-center"><p className="text-3xl font-bold text-red-600">{detail.summary.absent}</p><p className="text-sm text-muted-foreground mt-1">Ausentes</p></CardContent></Card>
            <Card><CardContent className="pt-6 text-center"><p className="text-3xl font-bold text-indigo-600">{detail.summary.rate}%</p><p className="text-sm text-muted-foreground mt-1">Taxa</p></CardContent></Card>
          </div>
          {detail.summary.total > 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium">Presença</span>
                  <span className="text-sm text-muted-foreground ml-auto">{detail.summary.present}/{detail.summary.total}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                  <div className="h-3 rounded-full bg-green-500 transition-all" style={{ width: `${detail.summary.rate}%` }} />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span className="text-green-600">{detail.summary.rate}% presentes</span>
                  <span className="text-red-600">{100 - detail.summary.rate}% ausentes</span>
                </div>
              </CardContent>
            </Card>
          )}
          {(detail.attendance.length > 0 || guests.length > 0) ? (
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2 text-sm text-green-700"><CheckCircle className="h-4 w-4" />Presentes ({detail.summary.present})</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-1.5">
                    {present.length > 0 ? present.map((a) => (
                      <div key={a.member_id} className="flex items-center justify-between py-1 border-b last:border-0">
                        <p className="text-sm">{a.member_name}</p>
                        <Badge variant="secondary" className="text-xs">{a.member_type === 'participant' ? 'Membro' : 'Visitante'}</Badge>
                      </div>
                    )) : null}
                    {guests.length > 0 ? guests.map((g, i) => (
                      <div key={`guest-${i}`} className="flex items-center justify-between py-1 border-b last:border-0">
                        <p className="text-sm">{g.full_name}{g.phone ? ` — ${g.phone}` : ''}</p>
                        <Badge variant="outline" className="text-xs">Visitante não cadastrado</Badge>
                      </div>
                    )) : null}
                    {present.length === 0 && guests.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum presente registrado</p> : null}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2 text-sm text-red-700"><XCircle className="h-4 w-4" />Ausentes ({absent.length})</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-1.5">
                    {absent.length > 0 ? absent.map((a) => (
                      <div key={a.member_id} className="flex items-center justify-between py-1 border-b last:border-0">
                        <p className="text-sm">{a.member_name}</p>
                        <Badge variant="secondary" className="text-xs">{a.member_type === 'participant' ? 'Membro' : 'Visitante'}</Badge>
                      </div>
                    )) : <p className="text-sm text-muted-foreground">Nenhuma falta registrada</p>}
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

// ─── Visualização por nome de encontro (multi-ocorrência) ─────────────────────

function TitleGroupView({ groupId, memberFilter }: { groupId?: string | null; memberFilter: MemberFilter }) {
  const [titleGroups, setTitleGroups] = useState<TitleGroup[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [selectedTitle, setSelectedTitle] = useState<string | null>(null);
  const [groupDetail, setGroupDetail] = useState<{
    title: string;
    meetings: MeetingItem[];
    memberStats: MemberStat[];
    summary: { total: number; totalPresent: number; totalAbsent: number; avgRate: number };
  } | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    setLoadingGroups(true);
    let url = '/api/engagement?mode=title_groups';
    if (groupId) url += `&group_id=${groupId}`;
    fetch(url)
      .then((r) => {
        if (!r.ok) {
          console.error('Erro ao buscar títulos:', r.status, r.statusText);
          return { titleGroups: [] };
        }
        return r.json();
      })
      .then((d) => {
        setTitleGroups(d.titleGroups ?? []);
        setLoadingGroups(false);
      })
      .catch((err) => {
        console.error('Erro ao buscar títulos de encontros:', err);
        setTitleGroups([]);
        setLoadingGroups(false);
      });
  }, [groupId]);

  const fetchGroupDetail = useCallback(async (title: string) => {
    setLoadingDetail(true);
    setSelectedTitle(title);
    try {
      let url = `/api/engagement?title_group=${encodeURIComponent(title)}&member_filter=${memberFilter}`;
      if (groupId) url += `&group_id=${groupId}`;
      const res = await fetch(url);
      if (!res.ok) {
        console.error('Erro ao buscar detalhes do título:', res.status, res.statusText);
        const errorData = await res.json().catch(() => ({}));
        console.error('Detalhes do erro:', errorData);
        setGroupDetail(null);
        return;
      }
      const data = await res.json();
      setGroupDetail(data);
    } catch (err) {
      console.error('Erro ao buscar detalhes do título de encontro:', err);
      setGroupDetail(null);
    } finally {
      setLoadingDetail(false);
    }
  }, [groupId, memberFilter]);

  useEffect(() => {
    if (selectedTitle) fetchGroupDetail(selectedTitle);
  }, [memberFilter]);

  if (loadingGroups) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  if (titleGroups.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg">
        <p className="text-muted-foreground">Nenhum encontro com nome definido no período.</p>
        <p className="text-xs text-muted-foreground mt-1">Dê nomes aos encontros na página de Agenda para usar este filtro.</p>
      </div>
    );
  }

  const topPresent = groupDetail ? [...groupDetail.memberStats].sort((a, b) => b.presences - a.presences).slice(0, 5) : [];
  const topAbsent = groupDetail ? [...groupDetail.memberStats].filter((m) => m.absences > 0).sort((a, b) => b.absences - a.absences).slice(0, 5) : [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <List className="h-5 w-5" />
            Selecionar Nome de Encontro
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {titleGroups.map((tg) => (
              <button key={tg.title} onClick={() => fetchGroupDetail(tg.title)}
                className={`w-full text-left flex items-center justify-between p-3 rounded-lg border transition-colors ${selectedTitle === tg.title ? 'bg-primary/10 border-primary/30' : 'hover:bg-muted/50'}`}>
                <div>
                  <p className="text-sm font-medium">{tg.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {tg.count} encontro{tg.count !== 1 ? 's' : ''} • Último: {new Date(tg.latest_date + 'T12:00:00Z').toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <Badge variant="secondary" className="text-xs shrink-0">{tg.count}x</Badge>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {loadingDetail && <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}

      {!loadingDetail && groupDetail && (
        <>
          <div className="rounded-lg border p-4 bg-muted/30">
            <h3 className="font-semibold text-lg">{groupDetail.title}</h3>
            <p className="text-sm text-muted-foreground">
              {groupDetail.meetings.length} encontro{groupDetail.meetings.length !== 1 ? 's' : ''} no total
              {groupDetail.meetings.length > 0 && ` · ${new Date(groupDetail.meetings[groupDetail.meetings.length - 1].meeting_date + 'T12:00:00Z').toLocaleDateString('pt-BR')} a ${new Date(groupDetail.meetings[0].meeting_date + 'T12:00:00Z').toLocaleDateString('pt-BR')}`}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Card><CardContent className="pt-6 text-center"><p className="text-3xl font-bold text-green-600">{groupDetail.summary.totalPresent}</p><p className="text-sm text-muted-foreground mt-1">Presenças</p></CardContent></Card>
            <Card><CardContent className="pt-6 text-center"><p className="text-3xl font-bold text-red-600">{groupDetail.summary.totalAbsent}</p><p className="text-sm text-muted-foreground mt-1">Faltas</p></CardContent></Card>
            <Card><CardContent className="pt-6 text-center"><p className="text-3xl font-bold text-indigo-600">{groupDetail.summary.avgRate}%</p><p className="text-sm text-muted-foreground mt-1">Taxa Média</p></CardContent></Card>
          </div>

          {groupDetail.memberStats.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2 text-base"><TrendingUp className="h-5 w-5 text-green-600" />Top 5 Mais Presentes</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {topPresent.map((m, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded-lg border">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-green-100 text-green-700 font-bold text-sm shrink-0">{i + 1}</div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{m.name}</p>
                            <p className="text-xs text-muted-foreground">{m.presences} presença{m.presences !== 1 ? 's' : ''}</p>
                          </div>
                        </div>
                        <Badge className="bg-green-600 shrink-0">{m.taxa}%</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2 text-base"><TrendingDown className="h-5 w-5 text-red-600" />Top 5 Mais Ausentes</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {topAbsent.map((m, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded-lg border">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-red-100 text-red-700 font-bold text-sm shrink-0">{i + 1}</div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{m.name}</p>
                            <p className="text-xs text-muted-foreground">{m.absences} falta{m.absences !== 1 ? 's' : ''}</p>
                          </div>
                        </div>
                        <Badge variant="destructive" className="shrink-0">{m.taxa}%</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {groupDetail.meetings.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Encontros incluídos</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {groupDetail.meetings.map((m) => (
                    <div key={m.id} className="flex items-center gap-2 py-1.5 border-b last:border-0">
                      {m.meeting_type === 'special_event' && <Star className="h-3 w-3 text-amber-500 shrink-0" />}
                      <p className="text-sm">{new Date(m.meeting_date + 'T12:00:00Z').toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
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
  const [view, setView] = useState<Period | 'meeting' | 'title_group'>('monthly');
  const [memberFilter, setMemberFilter] = useState<MemberFilter>('total');
  const [titleFilter, setTitleFilter] = useState('');
  const [periodData, setPeriodData] = useState<PeriodDataPoint[]>([]);
  const [memberStats, setMemberStats] = useState<MemberStat[]>([]);
  const [meetingList, setMeetingList] = useState<MeetingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasData, setHasData] = useState(false);

  const fetchPeriodData = useCallback(async (period: Period, title?: string) => {
    setLoading(true);
    try {
      let url = `/api/engagement?period=${period}&member_filter=${memberFilter}`;
      if (groupId) url += `&group_id=${groupId}`;
      if (title?.trim()) url += `&title_filter=${encodeURIComponent(title.trim())}`;
      const res = await fetch(url);
      if (!res.ok) return;
      const data = await res.json();
      setPeriodData(data.periodData ?? []);
      setMemberStats(data.memberStats ?? []);
      setMeetingList(data.meetingList ?? []);
      setHasData((data.periodData ?? []).length > 0 || (data.meetingList ?? []).length > 0);
    } finally { setLoading(false); }
  }, [groupId, memberFilter]);

  const [debouncedTitle, setDebouncedTitle] = useState(titleFilter);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedTitle(titleFilter), 400);
    return () => clearTimeout(t);
  }, [titleFilter]);

  useEffect(() => {
    if (view !== 'meeting' && view !== 'title_group') {
      fetchPeriodData(view as Period, debouncedTitle);
    } else if (view === 'meeting') {
      fetchPeriodData('monthly', debouncedTitle);
    }
  }, [view, fetchPeriodData, debouncedTitle]);

  const periodLabel = PERIOD_OPTIONS.find((o) => o.value === view)?.label ?? '';
  const topPresent = [...memberStats].filter((m) => m.presences + m.absences > 0).sort((a, b) => b.presences - a.presences).slice(0, 5);
  const topAbsent = [...memberStats].filter((m) => m.absences > 0).sort((a, b) => b.absences - a.absences).slice(0, 5);
  const perfectAttendance = memberStats.filter((m) => m.presences > 0 && m.absences === 0).map((m) => m.name);

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Engajamento</h1>
          <p className="text-muted-foreground mt-1 text-sm">Análise de presença por período ou encontro</p>
        </div>
        <PeriodSelector
          selected={view}
          onChange={setView}
          titleFilter={titleFilter}
          onTitleFilterChange={setTitleFilter}
        />
        <MemberFilterSelector value={memberFilter} onChange={setMemberFilter} />
      </div>

      {view === 'title_group' ? (
        <TitleGroupView groupId={groupId} memberFilter={memberFilter} />
      ) : loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : !hasData && view !== 'meeting' ? (
        <div className="text-center py-16 border rounded-lg">
          <p className="text-lg text-muted-foreground">Sem dados de presença no período.</p>
          <p className="text-sm text-muted-foreground mt-1">Registre presenças na página de Chamada para ver as análises aqui.</p>
        </div>
      ) : view === 'meeting' ? (
        <MeetingDetailView meetings={meetingList} memberFilter={memberFilter} />
      ) : (
        <>
          <StatsCards periodData={periodData} perfectAttendance={perfectAttendance} memberStats={memberStats} />
          <PeriodCharts data={periodData} periodLabel={periodLabel} />
          <MemberRankings topPresent={topPresent} topAbsent={topAbsent} perfectAttendance={perfectAttendance} />
        </>
      )}
    </div>
  );
}
