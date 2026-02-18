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
    eq: () => chain,
    gte: () => Promise.resolve(emptyArray),
    in: () => Promise.resolve(emptyArray),
    then: (r: (v: typeof emptyArray) => void) => { r(emptyArray); return Promise.resolve(emptyArray); },
  };
  return {
    select: () => chain,
    insert: () => Promise.resolve(empty),
    update: () => ({ eq: () => Promise.resolve(empty) }),
    upsert: () => Promise.resolve(empty),
  };
}

function channel(_name: string) {
  return {
    on: () => ({ subscribe: () => null }),
  };
}

export function createClient() {
  return {
    from,
    channel,
    removeChannel: (_ch: unknown) => {},
  };
}
