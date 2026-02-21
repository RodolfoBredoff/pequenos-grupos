# Pequenos Grupos Manager

Sistema de gestão para Pequenos Grupos de Estudo, desenvolvido como Progressive Web App (PWA) com Next.js 15 e PostgreSQL.

## 🎯 Características Principais

- ✅ **Gestão de Pessoas**: CRUD completo com classificação (Participante/Visitante)
- ✅ **Visitantes não cadastrados**: Na chamada, registrar nome e telefone (opcional); contam como presença; conversão em membro após mais de um encontro
- ✅ **Agenda**: Geração automática, edição manual, tipos (regular/evento especial), histórico com contagem de presenças (membros + visitantes)
- ✅ **Chamada Digital**: Lista de membros + lista de visitantes não cadastrados; contadores de presentes/ausentes; salvar em lote
- ✅ **Engajamento**: Gráficos por período, por encontro ou por nome; filtro por tipo (Total / Participantes / Visitantes); contagem inclui visitantes não cadastrados
- ✅ **Alertas**: Notificações de faltas consecutivas e aniversários (cron)
- ✅ **Integração WhatsApp**: Links diretos para contato
- ✅ **PWA**: Instalável em iOS/Android; navbar mobile com ícones maiores e rolagem horizontal
- ✅ **Multi-tenancy**: Múltiplos grupos, líderes, organizações
- ✅ **Roles**: Líder (grupo), Secretário (somente leitura/ chamada), Coordenador (organização), Admin (sistema)
- ✅ **Segurança**: Autenticação com JWT, Magic Link e login com senha; cookies httpOnly

## 🚀 Stack Tecnológica

### Frontend
- **Next.js 15** (App Router)
- **React 19**
- **TypeScript**
- **Tailwind CSS**
- **shadcn/ui**
- **next-pwa** (PWA)
- **Recharts** (gráficos de engajamento)

### Backend
- **PostgreSQL 15+**
- **Node.js**
- **JWT** + **Magic Link** + senha (troca de senha na conta)

### Deploy (AWS)
- **EC2** (t2.micro/t3.micro – Free Tier)
- **CloudFront** (CDN + SSL)
- **PostgreSQL em Docker** (EC2)
- **AWS SSM Parameter Store** (secrets)
- **GitHub Actions** (CI/CD com OIDC)

## 📦 Pré-requisitos

- Node.js 18+
- PostgreSQL 15+ (local ou remoto)
- Docker e Docker Compose (opcional, para PostgreSQL local)
- Conta AWS (para deploy em produção)

## 🚀 Quick Start

**📖 Guia rápido:** [`QUICKSTART.md`](./QUICKSTART.md)

### Resumo (local)

```bash
# 1. Dependências
npm install

# 2. PostgreSQL (Docker)
docker run -d --name pequenos-grupos-db \
  -e POSTGRES_PASSWORD=senha_segura \
  -e POSTGRES_DB=pequenos_grupos \
  -p 5432:5432 postgres:15-alpine

# 3. Migrações (em ordem: 001 depois 002…009)
docker exec -i pequenos-grupos-db psql -U postgres -d pequenos_grupos < db/migrations/001_initial_schema.sql
docker exec -i pequenos-grupos-db psql -U postgres -d pequenos_grupos < db/migrations/002_admin_and_meeting_time.sql
# ... 003 a 008 conforme necessário ...
docker exec -i pequenos-grupos-db psql -U postgres -d pequenos_grupos < db/migrations/009_guest_visitors.sql

# 4. Configurar ambiente
cp .env.example .env.local
# Ajuste DATABASE_*, APP_SECRET, e opcionalmente NEXT_PUBLIC_APP_URL

# 5. Primeiro usuário (líder + grupo)
./scripts/setup-database.sh

# 6. Rodar
npm run dev
```

Acesse: http://localhost:3000

## ⚙️ Configuração (.env.local)

Copie `.env.example` para `.env.local`. Principais variáveis:

| Variável | Obrigatório | Descrição |
|----------|-------------|-----------|
| `DATABASE_URL` | Sim | `postgresql://user:password@host:port/pequenos_grupos` |
| `APP_SECRET` | Sim | Chave para JWT/sessões (ex.: `openssl rand -base64 32`) |
| `NODE_ENV` | Sim | `development` ou `production` |
| `NEXT_PUBLIC_APP_URL` | Produção | URL pública (Magic Link, redirects) |
| `CRON_SECRET` | Cron | Proteção da rota `/api/cron/check-alerts` |
| `AWS_*` | Deploy | SSM/SES conforme [`DEPLOY_AWS_GUIDE.md`](./DEPLOY_AWS_GUIDE.md) |

Em produção na EC2, a app pode ler parâmetros do **AWS SSM Parameter Store** (ver guia de deploy).

## 📊 Banco de Dados

### Migrações (`db/migrations/`)

| Arquivo | Conteúdo |
|---------|----------|
| `001_initial_schema.sql` | Schema inicial (users, sessions, leaders, groups, members, meetings, attendance, notifications) |
| `002_admin_and_meeting_time.sql` | Admin, organizações, meeting_time em meetings |
| `003_*`, `004_*`, `007_*` | birth_date (opcional/obrigatório) |
| `005_secretary_role.sql` | Papel secretário |
| `006_coordinator_role.sql` | Papel coordenador, organization_id em leaders |
| `008_meeting_type.sql` | meeting_type (regular / special_event) |
| `009_guest_visitors.sql` | Visitantes não cadastrados: `guest_visitors`, `attendance_guests` |

### Esquema resumido

```
users, sessions, magic_link_tokens
organizations
groups (default_meeting_day, default_meeting_time)
leaders (group_id, organization_id, role: leader|secretary|coordinator)
members (group_id, full_name, phone, birth_date, member_type: participant|visitor)
meetings (group_id, meeting_date, title, meeting_time, meeting_type, is_cancelled)
attendance (meeting_id, member_id, is_present)
guest_visitors (group_id, full_name, phone)        ← 009
attendance_guests (meeting_id, guest_id)           ← 009
notifications (group_id, ...)
```

## 🎯 Funcionalidades

### 1. Dashboard (líder/secretário)
- Total de pessoas, participantes, visitantes
- Alertas de faltas consecutivas (2+)
- Aniversariantes
- Próximos encontros

### 2. Pessoas
- CRUD: nome, telefone, data de nascimento, tipo (Participante/Visitante)
- Aniversariante do dia
- Botão WhatsApp
- Estatísticas de presença por membro

### 3. Chamada
- Seletor de encontro (por data/título)
- Lista de membros: checkbox presente/ausente
- **Visitante não cadastrado**: nome (obrigatório), telefone (opcional); adicionar à lista do encontro
- Contagem: presentes = membros marcados + visitantes adicionados
- Salvar em lote (membros + visitantes)
- **Converter em membro**: para visitante já salvo (com mais de um encontro), criar membro tipo visitante

### 4. Agenda
- Próximas reuniões (30 dias)
- Histórico (10 últimas) com **contagem de presenças** (membros + visitantes)
- Edição: data, hora, título, notas, tipo (regular/evento especial)
- Configuração do grupo (dia/horário padrão) – só líder

### 5. Engajamento
- **Filtros**: por período (semanal/mensal/trimestral/semestral/anual), por encontro, por nome de encontro
- **Subfiltro por tipo**: Total | Participantes | Visitantes (em todos os modos)
- Gráficos e taxas consideram visitantes não cadastrados quando aplicável
- Top presentes/ausentes, 100% presença
- Coordenador e admin podem filtrar por grupo

### 6. Notificações e cron
- **Faltas consecutivas** (2+)
- **Aniversários** (dia do aniversário)
- Cron: `GET /api/webhooks/cron` (ou `/api/cron/check-alerts` com `CRON_SECRET`)

### 7. Conta
- Troca de senha
- Dados do perfil

### 8. Admin
- Organizações, grupos, líderes
- Criar admin, vincular líder a grupo
- Visualização de engajamento por grupo

### 9. Coordenador
- Dashboard da organização
- Grupos e líderes da organização
- Engajamento por grupo

## 🔒 Segurança

- Autenticação: Magic Link, login com senha, JWT em cookie (httpOnly, secure em produção)
- Líder/secretário só acessam o próprio grupo; coordenador, organização; admin, sistema
- HTTPS em produção; secrets no SSM em deploy AWS

## 🔧 Desenvolvimento

### Estrutura principal

```
pequenos-grupos/
├── app/
│   ├── (auth)/           # Login (magic link, senha)
│   ├── (dashboard)/      # Líder/secretário: dashboard, pessoas, chamada, agenda, engajamento, conta, configurações
│   ├── (coordinator)/    # Coordenador: org/dashboard, grupos, líderes, engajamento, conta
│   ├── admin/            # Admin: login, organizações, grupos, líderes, engajamento
│   └── api/               # API routes (auth, members, meetings, attendance, guests, engagement, cron, …)
├── components/            # UI (dashboard, chamada, pessoas, agenda, admin, coordinator, account, pwa, …)
├── lib/
│   ├── db/               # postgres.ts, queries.ts
│   ├── auth/             # session, admin-session, coordinator-session, magic-link, permissions
│   ├── agenda/           # generator
│   ├── alerts/           # checker
│   ├── aws/              # ssm-client
│   └── supabase/         # client stub (offline/no-op)
├── hooks/                 # use-offline-sync, use-realtime
├── db/migrations/         # 001…009
├── scripts/               # setup-database.sh, create-admin.sh, setup-ec2.sh, fix-app-url.sh, …
└── public/               # manifest, icons
```

### Scripts úteis

| Script | Uso |
|--------|-----|
| `./scripts/setup-database.sh` | Criar primeiro líder, grupo e dados iniciais |
| `./scripts/create-admin.sh` | Criar usuário admin |
| `./scripts/setup-ec2.sh` | Setup inicial da EC2 (Docker, etc.) – ver deploy |
| `./scripts/apply-migration-002.sh` | Aplicar migração 002 |
| `./scripts/fix-app-url.sh` | Ajustar URL da app em produção |
| `./scripts/install-update-origin-service.sh` | Atualizar serviço na EC2 |
| `./scripts/update-origin.sh` | Atualizar imagem/origin |
| `fix-leader-group.sql` / `fix-leader.sql` | Ajustes manuais de vínculo líder-grupo |

### Comandos

```bash
npm run dev      # Desenvolvimento
npm run build    # Build produção
npm run start    # Start produção
npm run lint     # Lint
```

## 📱 Deploy (AWS)

📖 **[`DEPLOY_AWS_GUIDE.md`](./DEPLOY_AWS_GUIDE.md)** – passo a passo (EC2, CloudFront, SSM, GitHub Actions).

- Push em `main` dispara deploy (GitHub Actions + OIDC).
- Secrets em SSM; sem Access Keys no repo.

## 🐛 Troubleshooting

- **DATABASE_URL**: conferir `.env.local` e reiniciar o servidor.
- **relation does not exist**: rodar migrações em ordem (001 → 009).
- **Magic Link**: conferir `NEXT_PUBLIC_APP_URL`; em dev o link pode aparecer no console.
- **Visitantes não aparecem na chamada/engajamento**: garantir que a migração `009_guest_visitors.sql` foi aplicada.

## 📚 Documentação

- **[`QUICKSTART.md`](./QUICKSTART.md)** – comece aqui (setup local e AWS)
- [`SETUP_LOCAL.md`](./SETUP_LOCAL.md) – setup local
- [`DEPLOY_AWS_GUIDE.md`](./DEPLOY_AWS_GUIDE.md) – deploy AWS
- [`DB_MIGRATION.md`](./DB_MIGRATION.md) – migração de dados e RDS
- [`MIGRATION_GUIDE.md`](./MIGRATION_GUIDE.md) – migração a partir do Supabase
- [`FASE_2_PROGRESS.md`](./FASE_2_PROGRESS.md) – detalhes técnicos da migração

---

Desenvolvido para comunidades de Pequenos Grupos
