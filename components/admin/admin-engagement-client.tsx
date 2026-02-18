'use client';

import { useState } from 'react';
import { EngagementClient } from '@/components/dashboard/engagement-client';
import { Card, CardContent } from '@/components/ui/card';

interface Group {
  id: string;
  name: string;
}

interface AdminEngagementClientProps {
  groups: Group[];
}

export function AdminEngagementClient({ groups }: AdminEngagementClientProps) {
  const [selectedGroupId, setSelectedGroupId] = useState<string>(groups[0]?.id ?? '');

  if (groups.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg">
        <p className="text-muted-foreground">Nenhum grupo cadastrado.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <label className="text-sm font-medium block mb-2">Grupo</label>
          <select
            value={selectedGroupId}
            onChange={(e) => setSelectedGroupId(e.target.value)}
            className="flex h-10 w-full max-w-md rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      <EngagementClient groupId={selectedGroupId} />
    </div>
  );
}
