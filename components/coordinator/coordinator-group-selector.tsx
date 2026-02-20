'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Group } from 'lucide-react';
import { EngagementClient } from '@/components/dashboard/engagement-client';

interface Group {
  id: string;
  name: string;
}

interface CoordinatorGroupSelectorProps {
  groups: Group[];
}

export function CoordinatorGroupSelector({ groups }: CoordinatorGroupSelectorProps) {
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');

  if (groups.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">Nenhum grupo cadastrado ainda.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Group className="h-4 w-4" />
            Filtrar por Grupo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <select
            value={selectedGroupId}
            onChange={(e) => setSelectedGroupId(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="">Selecione um grupo</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
          {selectedGroupId && (
            <p className="text-xs text-muted-foreground mt-2">
              Mostrando dados do grupo: <strong>{groups.find((g) => g.id === selectedGroupId)?.name}</strong>
            </p>
          )}
        </CardContent>
      </Card>
      {selectedGroupId ? (
        <EngagementClient groupId={selectedGroupId} />
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Selecione um grupo acima para visualizar os dados de engajamento.</p>
          </CardContent>
        </Card>
      )}
    </>
  );
}
