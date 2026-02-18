/**
 * Stub Supabase client após migração para PostgreSQL + API própria.
 * Remove a dependência de @supabase/ssr. useOfflineSync e useRealtime
 * continuam funcionando em modo no-op (sem sync/realtime real).
 * Para reativar sync offline, implemente chamadas às APIs /api/members, etc.
 */
const empty = { data: null, error: null };
const emptyArray = { data: [], error: null };

function from(_table: string) {
  const chain = {
    eq: (_col?: string, _val?: unknown) => chain,
    gte: (_col?: string, _val?: unknown) => Promise.resolve(emptyArray),
    in: (_col?: string, _val?: unknown) => Promise.resolve(emptyArray),
    then: (r: (v: typeof emptyArray) => void) => { r(emptyArray); return Promise.resolve(emptyArray); },
  };
  return {
    select: (_cols?: string) => chain,
    insert: (_data?: unknown) => Promise.resolve(empty),
    update: (_data?: unknown) => ({ eq: (_col?: string, _val?: unknown) => Promise.resolve(empty) }),
    upsert: (_data?: unknown, _opts?: { onConflict?: string }) => Promise.resolve(empty),
  };
}

function channel(_name: string) {
  return {
    on: (_event?: string, _config?: Record<string, unknown>, _callback?: (payload: unknown) => void) => ({
      subscribe: () => null,
    }),
  };
}

export function createClient() {
  return {
    from,
    channel,
    removeChannel: (_ch: unknown) => {},
  };
}
