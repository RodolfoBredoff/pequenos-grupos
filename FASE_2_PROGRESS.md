# Fase 2 - Progresso da Migração Backend

## ✅ Concluído

### 1. Migrações PostgreSQL
- ✅ Schema completo adaptado do Supabase
- ✅ Tabelas de autenticação (users, sessions, magic_link_tokens)
- ✅ Tabelas de negócio (organizations, groups, leaders, members, meetings, attendance, notifications)
- ✅ Funções helper do banco (get_consecutive_absences, get_birthdays_today)
- ✅ Triggers e índices otimizados
- 📁 `db/migrations/001_initial_schema.sql`

### 2. Cliente PostgreSQL
- ✅ Pool de conexões configurado
- ✅ Integração com SSM Parameter Store
- ✅ Funções helper (query, queryOne, queryMany, transaction)
- 📁 `lib/db/postgres.ts`

### 3. Sistema de Autenticação
- ✅ JWT tokens para sessões
- ✅ Magic Link (login sem senha)
- ✅ Gerenciamento de sessões no banco
- ✅ Cookies seguros (httpOnly, secure)
- 📁 `lib/auth/session.ts`
- 📁 `lib/auth/magic-link.ts`

### 4. API Routes de Autenticação
- ✅ POST `/api/auth/magic-link` - Solicitar magic link
- ✅ GET `/api/auth/verify` - Validar token e criar sessão
- ✅ POST `/api/auth/logout` - Encerrar sessão

### 5. Funções Helper para Queries
- ✅ Queries de líderes (getCurrentLeader, getLeaderById)
- ✅ Queries de membros (CRUD completo)
- ✅ Queries de reuniões (getUpcomingMeetings, getPastMeetings, upsertMeeting)
- ✅ Queries de presença (getAttendanceByMeeting, saveAttendance)
- ✅ Queries de notificações (getUnreadNotifications, markNotificationAsRead)
- ✅ Queries de estatísticas (getGroupStats)
- 📁 `lib/db/queries.ts`

### 6. Lógica de Agenda Automática
- ✅ Geração de reuniões futuras baseada em configuração do grupo
- ✅ Suporte para semanas de folga
- 📁 `lib/agenda/generator.ts`

### 7. Lógica de Alertas
- ✅ Verificação de faltas consecutivas (threshold: 2 faltas)
- ✅ Verificação de aniversariantes do dia
- ✅ Criação automática de notificações
- 📁 `lib/alerts/checker.ts`

### 8. API Routes de Webhooks
- ✅ GET `/api/webhooks/cron` - Executa verificações automáticas (faltas, aniversários)
- ✅ Autenticação via CRON_SECRET

## ⏳ Pendente

### Migração de Páginas e Componentes

As seguintes páginas ainda precisam ser migradas do Supabase para PostgreSQL:

1. **`app/(auth)/login/page.tsx`**
   - Substituir `supabase.auth.signInWithOtp()` por chamada a `/api/auth/magic-link`
   - Atualizar fluxo de login

2. **`app/(dashboard)/dashboard/page.tsx`**
   - Substituir queries Supabase por `getGroupStats()`, `getUnreadNotifications()`
   - Usar `getCurrentLeader()` ao invés de `supabase.auth.getUser()`

3. **`app/(dashboard)/pessoas/page.tsx`**
   - Substituir por `getMembersByLeaderGroup()`

4. **`app/(dashboard)/pessoas/novo/page.tsx`**
   - Substituir por `createMember()`

5. **`app/(dashboard)/pessoas/[id]/page.tsx`**
   - Substituir por `getMemberById()`, `updateMember()`

6. **`app/(dashboard)/chamada/page.tsx`**
   - Substituir por `getMeetingByDate()`, `getAttendanceByMeeting()`, `saveAttendance()`

7. **`app/(dashboard)/agenda/page.tsx`**
   - Substituir por `getUpcomingMeetings()`, `getPastMeetings()`, `upsertMeeting()`
   - Integrar `generateUpcomingMeetings()`

8. **`app/(dashboard)/layout.tsx`**
   - Substituir `supabase.auth.getUser()` por `getSession()`

9. **`middleware.ts`**
   - Substituir `updateSession()` do Supabase por verificação de sessão própria

### Middleware de Autenticação

- ⏳ Criar novo middleware que usa `getSession()` ao invés de Supabase
- ⏳ Atualizar proteção de rotas

### Componentes

- ⏳ Atualizar componentes que usam Supabase client
- ⏳ Remover hooks do Supabase (`use-realtime.ts` pode ser removido ou adaptado)

## 📝 Próximos Passos

1. **Migrar página de login** (`app/(auth)/login/page.tsx`)
2. **Migrar middleware** (`middleware.ts`)
3. **Migrar layout do dashboard** (`app/(dashboard)/layout.tsx`)
4. **Migrar páginas do dashboard** (uma por vez)
5. **Testar fluxo completo**
6. **Remover dependências do Supabase** (quando tudo estiver migrado)

## 🔧 Como Testar

### 1. Executar Migrações

```bash
# Conectar ao PostgreSQL
psql -h localhost -U postgres -d pequenos_grupos

# Executar migração
\i db/migrations/001_initial_schema.sql
```

### 2. Configurar Variáveis de Ambiente

```bash
# .env.local
DATABASE_URL=postgresql://postgres:senha@localhost:5432/pequenos_grupos
APP_SECRET=sua-chave-secreta-aqui
CRON_SECRET=seu-cron-secret-aqui
```

### 3. Criar Primeiro Usuário e Líder

```sql
-- Criar usuário
INSERT INTO users (email, email_verified) 
VALUES ('seu@email.com', TRUE) 
RETURNING id;

-- Criar organização
INSERT INTO organizations (name) 
VALUES ('Minha Igreja') 
RETURNING id;

-- Criar grupo
INSERT INTO groups (organization_id, name, default_meeting_day, default_meeting_time)
VALUES ('uuid-organizacao', 'Meu Grupo', 3, '19:00:00')
RETURNING id;

-- Criar líder
INSERT INTO leaders (id, organization_id, group_id, full_name, email)
VALUES ('uuid-usuario', 'uuid-organizacao', 'uuid-grupo', 'Seu Nome', 'seu@email.com');
```

### 4. Testar Autenticação

```bash
# Solicitar magic link
curl -X POST http://localhost:3000/api/auth/magic-link \
  -H "Content-Type: application/json" \
  -d '{"email": "seu@email.com"}'

# Verificar token (usar token retornado)
curl http://localhost:3000/api/auth/verify?token=TOKEN_AQUI
```

## 📚 Arquivos Criados

- `db/migrations/001_initial_schema.sql` - Schema completo
- `lib/db/postgres.ts` - Cliente PostgreSQL
- `lib/db/queries.ts` - Funções helper de queries
- `lib/auth/session.ts` - Gerenciamento de sessões
- `lib/auth/magic-link.ts` - Magic Link tokens
- `lib/agenda/generator.ts` - Geração de agenda automática
- `lib/alerts/checker.ts` - Verificação de alertas
- `app/api/auth/magic-link/route.ts` - API de magic link
- `app/api/auth/verify/route.ts` - API de verificação
- `app/api/auth/logout/route.ts` - API de logout
- `app/api/webhooks/cron/route.ts` - Webhook de cron

## 🔄 Dependências Adicionadas

- `pg` - Cliente PostgreSQL
- `jsonwebtoken` - JWT tokens
- `bcryptjs` - Hash de senhas (para futuro)
- `@types/pg`, `@types/jsonwebtoken`, `@types/bcryptjs` - Types

## ⚠️ Notas Importantes

1. **Timezone**: O sistema deve operar no Horário de Brasília (America/Sao_Paulo)
2. **Magic Link**: Em produção, implementar envio de email real
3. **Sessões**: Tokens expiram em 7 dias, mas podem ser renovados
4. **Segurança**: Todos os tokens são hasheados antes de armazenar no banco
5. **Pool de Conexões**: Configurado para máximo de 20 conexões simultâneas
