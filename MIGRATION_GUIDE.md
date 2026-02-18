# Guia de Migração: Supabase → PostgreSQL Standalone

Este guia explica como migrar dados existentes do Supabase para o PostgreSQL standalone.

## 📋 Pré-requisitos

- Acesso ao banco Supabase atual
- PostgreSQL local ou remoto configurado
- Scripts de migração executados (`db/migrations/001_initial_schema.sql`)

## 🔄 Processo de Migração

### 1. Exportar Dados do Supabase

#### Via Supabase Dashboard (SQL Editor)

```sql
-- Exportar Organizations
COPY (
  SELECT id, name, created_at, updated_at 
  FROM organizations
) TO STDOUT WITH CSV HEADER;

-- Exportar Groups
COPY (
  SELECT id, organization_id, name, default_meeting_day, default_meeting_time, created_at, updated_at
  FROM groups
) TO STDOUT WITH CSV HEADER;

-- Exportar Users (criar a partir de auth.users)
COPY (
  SELECT 
    id,
    email,
    email_confirmed_at IS NOT NULL as email_verified,
    created_at,
    updated_at
  FROM auth.users
) TO STDOUT WITH CSV HEADER;

-- Exportar Leaders
COPY (
  SELECT id, organization_id, group_id, full_name, email, phone, created_at
  FROM leaders
) TO STDOUT WITH CSV HEADER;

-- Exportar Members
COPY (
  SELECT id, group_id, full_name, phone, birth_date, member_type, is_active, created_at, updated_at
  FROM members
) TO STDOUT WITH CSV HEADER;

-- Exportar Meetings
COPY (
  SELECT id, group_id, meeting_date, is_cancelled, notes, created_at
  FROM meetings
) TO STDOUT WITH CSV HEADER;

-- Exportar Attendance
COPY (
  SELECT id, meeting_id, member_id, is_present, created_at
  FROM attendance
) TO STDOUT WITH CSV HEADER;

-- Exportar Notifications
COPY (
  SELECT id, group_id, notification_type, member_id, message, is_read, created_at
  FROM notifications
) TO STDOUT WITH CSV HEADER;
```

#### Via pg_dump (Recomendado)

```bash
# Exportar schema e dados
pg_dump -h db.xxxxx.supabase.co \
  -U postgres \
  -d postgres \
  -t organizations \
  -t groups \
  -t leaders \
  -t members \
  -t meetings \
  -t attendance \
  -t notifications \
  --data-only \
  --column-inserts \
  > supabase_export.sql

# Ou exportar apenas dados em CSV
pg_dump -h db.xxxxx.supabase.co \
  -U postgres \
  -d postgres \
  --data-only \
  --csv \
  -t organizations \
  -t groups \
  -t leaders \
  -t members \
  -t meetings \
  -t attendance \
  -t notifications \
  > supabase_data.csv
```

### 2. Migrar Usuários (auth.users → users)

O Supabase usa `auth.users`, mas nosso schema usa `users`. Você precisa migrar:

```sql
-- No PostgreSQL de destino
INSERT INTO users (id, email, email_verified, created_at, updated_at)
SELECT 
  id,
  email,
  email_confirmed_at IS NOT NULL,
  created_at,
  updated_at
FROM auth.users;  -- Execute isso no Supabase primeiro e exporte
```

**Nota:** Se você não tem acesso direto ao `auth.users` do Supabase, você pode criar os usuários manualmente baseado nos emails dos líderes.

### 3. Importar Dados

#### Opção 1: Via psql

```bash
# Conectar ao PostgreSQL de destino
psql -h localhost -U postgres -d pequenos_grupos

# Importar dados
\i supabase_export.sql
```

#### Opção 2: Via COPY (mais rápido para grandes volumes)

```sql
-- No PostgreSQL de destino
COPY organizations (id, name, created_at, updated_at)
FROM '/caminho/para/organizations.csv' WITH CSV HEADER;

COPY groups (id, organization_id, name, default_meeting_day, default_meeting_time, created_at, updated_at)
FROM '/caminho/para/groups.csv' WITH CSV HEADER;

-- ... e assim por diante para cada tabela
```

### 4. Verificar Integridade

```sql
-- Verificar contagens
SELECT 
  'organizations' as tabela, COUNT(*) as total FROM organizations
UNION ALL
SELECT 'groups', COUNT(*) FROM groups
UNION ALL
SELECT 'leaders', COUNT(*) FROM leaders
UNION ALL
SELECT 'members', COUNT(*) FROM members
UNION ALL
SELECT 'meetings', COUNT(*) FROM meetings
UNION ALL
SELECT 'attendance', COUNT(*) FROM attendance
UNION ALL
SELECT 'notifications', COUNT(*) FROM notifications;

-- Verificar foreign keys
SELECT 
  l.id as leader_id,
  l.email,
  u.id as user_id
FROM leaders l
LEFT JOIN users u ON u.id = l.id
WHERE u.id IS NULL;  -- Deve retornar 0 linhas

-- Verificar membros órfãos
SELECT 
  m.id,
  m.full_name,
  m.group_id
FROM members m
LEFT JOIN groups g ON g.id = m.group_id
WHERE g.id IS NULL;  -- Deve retornar 0 linhas
```

### 5. Criar Sessões para Usuários Existentes

Os usuários migrados precisarão fazer login novamente (magic link), mas você pode criar sessões temporárias se necessário:

```sql
-- Isso não é recomendado, mas pode ser útil para testes
-- Os usuários devem fazer login normalmente via magic link
```

## 🔐 Migração de Autenticação

### Magic Link

O sistema agora usa Magic Link próprio. Os usuários precisarão:

1. Acessar `/login`
2. Inserir seu email
3. Receber magic link (via email ou console em dev)
4. Clicar no link para fazer login

### Sessões

As sessões do Supabase não são compatíveis. Todos os usuários precisarão fazer login novamente.

## ⚠️ Pontos de Atenção

1. **UUIDs**: Mantenha os mesmos UUIDs ao migrar para preservar relacionamentos
2. **Timestamps**: Verifique timezone (Supabase usa UTC, nosso sistema usa America/Sao_Paulo)
3. **RLS**: Não há mais Row Level Security - a segurança é feita na aplicação
4. **Realtime**: Não há mais Supabase Realtime - considere implementar polling ou WebSockets se necessário

## 🧪 Teste Pós-Migração

1. ✅ Fazer login com um usuário migrado
2. ✅ Verificar dashboard carrega corretamente
3. ✅ Verificar lista de pessoas
4. ✅ Testar criação de nova pessoa
5. ✅ Testar registro de presença
6. ✅ Verificar agenda
7. ✅ Verificar notificações

## 🔄 Rollback

Se precisar voltar ao Supabase:

1. Mantenha backup do Supabase antes da migração
2. Restaure o backup se necessário
3. Reverta as mudanças no código (git)

## 📚 Scripts Úteis

Veja `scripts/setup-database.sh` para setup inicial do banco.

Para migração de dados, você pode criar um script customizado baseado neste guia.
