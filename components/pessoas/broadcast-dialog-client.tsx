'use client';

import dynamic from 'next/dynamic';

interface Member {
  id: string;
  full_name: string;
  phone: string;
  member_type: 'participant' | 'visitor';
}

const BroadcastDialogInner = dynamic(
  () => import('./broadcast-dialog').then((m) => ({ default: m.BroadcastDialog })),
  { ssr: false }
);

export function BroadcastDialogClient({ members }: { members: Member[] }) {
  return <BroadcastDialogInner members={members} />;
}
