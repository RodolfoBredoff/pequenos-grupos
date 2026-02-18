import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { getCurrentLeader } from '@/lib/db/queries';
import { queryMany, queryOne } from '@/lib/db/postgres';

export type Period = 'weekly' | 'monthly' | 'quarterly' | 'semiannual' | 'yearly';

function getPeriodConfig(period: Period): { interval: string; truncate: string; limit: number } {
  switch (period) {
    case 'weekly':
      return { interval: '8 weeks', truncate: 'week', limit: 8 };
    case 'monthly':
      return { interval: '6 months', truncate: 'month', limit: 6 };
    case 'quarterly':
      return { interval: '12 months', truncate: 'quarter', limit: 4 };
    case 'semiannual':
      return { interval: '24 months', truncate: 'month', limit: 4 }; // 4 semestres = agrupar 6 meses
    case 'yearly':
      return { interval: '3 years', truncate: 'year', limit: 3 };
  }
}

function formatPeriodLabel(dateStr: string, period: Period): string {
  const date = new Date(dateStr + 'T12:00:00Z');
  switch (period) {
    case 'weekly': {
      const day = date.getUTCDate().toString().padStart(2, '0');
      const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
      return `${day}/${month}`;
    }
    case 'monthly':
      return date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit', timeZone: 'UTC' });
    case 'quarterly': {
      const quarter = Math.floor(date.getUTCMonth() / 3) + 1;
      const year = date.getUTCFullYear().toString().slice(-2);
      return `T${quarter}/${year}`;
    }
    case 'semiannual': {
      const sem = date.getUTCMonth() < 6 ? 1 : 2;
      const year = date.getUTCFullYear().toString().slice(-2);
      return `S${sem}/${year}`;
    }
    case 'yearly':
      return String(date.getUTCFullYear());
  }
}

/**
 * GET /api/engagement
 *
 * Modos:
 *  1. ?period=weekly|monthly|quarterly|semiannual|yearly  → dados agrupados por período
 *  2. ?meeting_id=uuid                                    → presença detalhada de um encontro
 *  3. ?group_id=uuid (admin)                              → dados de um grupo específico
 *  4. ?title_filter=texto                                 → filtrar encontros por título (com outros filtros)
 */
export async function GET(request: Request) {
  try {
    await requireAuth();
    const leader = await getCurrentLeader();
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') as Period | null;
    const meetingId = searchParams.get('meeting_id');
    const groupIdParam = searchParams.get('group_id');
    const titleFilter = searchParams.get('title_filter')?.trim() || null;

    let groupId: string | null = leader?.group_id ?? null;
    if (groupIdParam) {
      const { getAdminSession } = await import('@/lib/auth/admin-session');
      const admin = await getAdminSession();
      if (admin) {
        groupId = groupIdParam;
      }
    }

    if (!groupId) {
      return NextResponse.json({ error: 'Líder não vinculado a um grupo' }, { status: 400 });
    }

    // ─── Modo: encontro específico ─────────────────────────────────────────
    if (meetingId) {
      // Verificar que o encontro pertence ao grupo
      const meeting = await queryOne<{
        id: string;
        meeting_date: string;
        title: string | null;
        meeting_time: string | null;
        is_cancelled: boolean;
      }>(
        `SELECT id, meeting_date, title, meeting_time, is_cancelled
         FROM meetings WHERE id = $1 AND group_id = $2`,
        [meetingId, groupId]
      );

      if (!meeting) {
        return NextResponse.json({ error: 'Encontro não encontrado' }, { status: 404 });
      }

      const attendance = await queryMany<{
        member_id: string;
        member_name: string;
        member_type: string;
        is_present: boolean;
      }>(
        `SELECT a.member_id, m.full_name as member_name, m.member_type, a.is_present
         FROM attendance a
         JOIN members m ON m.id = a.member_id
         WHERE a.meeting_id = $1
         ORDER BY m.full_name ASC`,
        [meetingId]
      );

      const present = attendance.filter((a) => a.is_present);
      const absent = attendance.filter((a) => !a.is_present);

      return NextResponse.json({
        mode: 'meeting',
        meeting,
        attendance,
        summary: {
          total: attendance.length,
          present: present.length,
          absent: absent.length,
          rate: attendance.length > 0
            ? Math.round((present.length / attendance.length) * 100)
            : 0,
        },
      });
    }

    // ─── Modo: período ─────────────────────────────────────────────────────
    const effectivePeriod: Period = period && ['weekly', 'monthly', 'quarterly', 'semiannual', 'yearly'].includes(period)
      ? period
      : 'monthly';

    const { interval, truncate } = getPeriodConfig(effectivePeriod);

    const periodStartExpr = effectivePeriod === 'semiannual'
      ? `(CASE WHEN EXTRACT(MONTH FROM meeting_date) < 7 
           THEN (EXTRACT(YEAR FROM meeting_date)::text || '-01-01') 
           ELSE (EXTRACT(YEAR FROM meeting_date)::text || '-07-01') 
         END)::date::text`
      : `date_trunc($1, meeting_date)::date::text`;

    const titleCond = titleFilter
      ? (effectivePeriod === 'semiannual' ? ` AND title ILIKE $3` : ` AND title ILIKE $4`)
      : '';
    const queryParams: unknown[] = effectivePeriod === 'semiannual'
      ? [groupId, interval, ...(titleFilter ? [`%${titleFilter}%`] : [])]
      : [truncate, groupId, interval, ...(titleFilter ? [`%${titleFilter}%`] : [])];

    const meetingsQuery = effectivePeriod === 'semiannual'
      ? `SELECT id, meeting_date, title, ${periodStartExpr} as period_start
         FROM meetings 
         WHERE group_id = $1 AND is_cancelled = FALSE
           AND meeting_date >= (CURRENT_DATE - $2::interval)
           AND meeting_date <= CURRENT_DATE${titleCond}
         ORDER BY meeting_date ASC`
      : `SELECT id, meeting_date, title, ${periodStartExpr} as period_start
         FROM meetings 
         WHERE group_id = $2 AND is_cancelled = FALSE
           AND meeting_date >= (CURRENT_DATE - $3::interval)
           AND meeting_date <= CURRENT_DATE${titleCond}
         ORDER BY meeting_date ASC`;

    const meetings = await queryMany<{
      id: string;
      meeting_date: string;
      title: string | null;
      period_start: string;
    }>(meetingsQuery, queryParams as string[]);

    if (meetings.length === 0) {
      return NextResponse.json({
        mode: 'period',
        period: effectivePeriod,
        periodData: [],
        memberStats: [],
        meetingList: [],
      });
    }

    const meetingIds = meetings.map((m) => m.id);

    // Buscar todas as presenças
    const attendance = await queryMany<{
      meeting_id: string;
      member_id: string;
      member_name: string;
      member_type: string;
      is_present: boolean;
    }>(
      `SELECT 
         a.meeting_id, a.member_id,
         m.full_name as member_name, m.member_type,
         a.is_present
       FROM attendance a
       JOIN members m ON m.id = a.member_id
       WHERE a.meeting_id = ANY($1::uuid[])`,
      [meetingIds]
    );

    // Agrupar por período
    const periodMap = new Map<string, { presentes: number; ausentes: number; meetingCount: number }>();

    for (const meeting of meetings) {
      const key = meeting.period_start;
      if (!periodMap.has(key)) {
        periodMap.set(key, { presentes: 0, ausentes: 0, meetingCount: 0 });
      }
      periodMap.get(key)!.meetingCount++;

      const meetingAtt = attendance.filter((a) => a.meeting_id === meeting.id);
      for (const att of meetingAtt) {
        if (att.is_present) {
          periodMap.get(key)!.presentes++;
        } else {
          periodMap.get(key)!.ausentes++;
        }
      }
    }

    // Construir array de dados por período, ordenado
    const periodData = Array.from(periodMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([periodStart, data]) => ({
        period: formatPeriodLabel(periodStart, effectivePeriod),
        periodStart,
        presentes: data.presentes,
        ausentes: data.ausentes,
        meetingCount: data.meetingCount,
        taxa: data.presentes + data.ausentes > 0
          ? Math.round((data.presentes / (data.presentes + data.ausentes)) * 100)
          : 0,
      }));

    // Estatísticas por membro (todo o período)
    const memberMap = new Map<string, { name: string; type: string; presences: number; absences: number }>();

    for (const att of attendance) {
      if (!memberMap.has(att.member_id)) {
        memberMap.set(att.member_id, {
          name: att.member_name,
          type: att.member_type,
          presences: 0,
          absences: 0,
        });
      }
      if (att.is_present) {
        memberMap.get(att.member_id)!.presences++;
      } else {
        memberMap.get(att.member_id)!.absences++;
      }
    }

    const memberStats = Array.from(memberMap.values())
      .filter((m) => m.presences + m.absences > 0)
      .map((m) => ({
        ...m,
        taxa: Math.round((m.presences / (m.presences + m.absences)) * 100),
      }))
      .sort((a, b) => b.presences - a.presences);

    // Lista de encontros para o seletor de filtro
    const meetingList = meetings.map((m) => ({
      id: m.id,
      meeting_date: m.meeting_date,
      title: m.title,
      label: m.title
        ? `${m.title} — ${new Date(m.meeting_date + 'T12:00:00Z').toLocaleDateString('pt-BR')}`
        : new Date(m.meeting_date + 'T12:00:00Z').toLocaleDateString('pt-BR'),
    })).reverse(); // mais recente primeiro

    return NextResponse.json({
      mode: 'period',
      period: effectivePeriod,
      periodData,
      memberStats,
      meetingList,
    });
  } catch (error) {
    console.error('Erro ao buscar dados de engajamento:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
