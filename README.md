# Pequenos Grupos Manager - MVP V1.0

Sistema de gestão para Pequenos Grupos de Estudo, desenvolvido como Progressive Web App (PWA) com Next.js 15 e PostgreSQL.

## 🎯 Características Principais

- ✅ **Gestão de Pessoas**: CRUD completo com classificação (Participante/Visitante)
- ✅ **Agenda Inteligente**: Geração automática com flexibilidade manual
- ✅ **Chamada Digital**: Interface simples para registro de presença
- ✅ **Alertas Automáticos**: Notificações de faltas consecutivas e aniversários
- ✅ **Integração WhatsApp**: Links diretos para contato
- ✅ **PWA**: Funciona como app nativo, instalável em iOS/Android
- ✅ **Offline-Ready**: Service Worker para cache e melhor experiência
- ✅ **Multi-tenancy**: Suporte para múltiplos grupos e líderes
- ✅ **Segurança**: Autenticação própria com JWT e Magic Link

## 🚀 Stack Tecnológica

### Frontend
- **Next.js 15** (App Router)
- **React 19**
- **TypeScript**
- **Tailwind CSS**
- **shadcn/ui** (componentes)
- **next-pwa** (PWA support)

### Backend
- **PostgreSQL 15+** (banco de dados)
- **Node.js** (runtime)
- **JWT** (autenticação)
- **Magic Link** (login sem senha)

### Deploy (Fase 1 - Infraestrutura AWS)
- **AWS EC2** (t2.micro/t3.micro - Free Tier)
- **AWS CloudFront** (CDN + SSL gratuito)
- **PostgreSQL em Docker** (container na EC2)
- **AWS SSM Parameter Store** (gerenciamento de secrets)
- **GitHub Actions** (CI/CD com OIDC)

## 📦 Pré-requisitos

- Node.js 18+ (com npm)
- PostgreSQL 15+ (local ou remoto)
- Docker e Docker Compose (opcional, para PostgreSQL)
- Conta AWS (para deploy em produção)

## 🚀 Quick Start

**📖 Comece aqui:** [`QUICKSTART.md`](./QUICKSTART.md)

Guia rápido para:
- ✅ Setup local em **5-10 minutos**
- ☁️ Setup AWS em **30-60 minutos**
- 🐛 Troubleshooting rápido

### Resumo Ultra-Rápido (Local)

```bash
# 1. Instalar dependências
npm install

# 2. Iniciar PostgreSQL (Docker)
docker run -d --name pequenos-grupos-db \
  -e POSTGRES_PASSWORD=senha_segura \
  -e POSTGRES_DB=pequenos_grupos \
  -p 5432:5432 postgres:15-alpine

# 3. Executar migrações
docker exec -i pequenos-grupos-db psql -U postgres -d pequenos_grupos < db/migrations/001_initial_schema.sql

# 4. Configurar .env.local (copie de .env.example e ajuste)

# 5. Criar primeiro usuário
./scripts/setup-database.sh

# 6. Rodar aplicação
npm run dev
```

Acesse: http://localhost:3000

## 🎨 Criar Primeiro Usuário (Leader)

Veja [`SETUP_LOCAL.md`](./SETUP_LOCAL.md) para instruções detalhadas.

Resumo:
1. Execute o script de setup: `./scripts/setup-database.sh`
2. Escolha criar dados iniciais
3. Use o email cadastrado para fazer login

## 📱 Deploy em Produção (AWS)

**Para deploy com custo zero (Free Tier) e máxima segurança:**

📖 **Veja o guia completo passo a passo:** [`DEPLOY_AWS_GUIDE.md`](./DEPLOY_AWS_GUIDE.md)

### Arquitetura de Deploy

```
CloudFront (SSL/HTTPS)
    ↓
EC2 (t2.micro Free Tier)
    ├── Next.js App (Docker)
    └── PostgreSQL (Docker + EBS Volume)
```

### Resumo Rápido

1. **Siga o guia completo:** [`DEPLOY_AWS_GUIDE.md`](./DEPLOY_AWS_GUIDE.md)
   - Criação de EC2, Security Groups, IAM Roles
   - Configuração de CloudFront e SSL
   - Setup de SSM Parameter Store
   - Configuração de GitHub Actions OIDC

2. **Deploy via GitHub Actions:**
   - Push para `main` = deploy automático
   - CI/CD com OIDC (sem Access Keys)

3. **Benefícios:**
   - ✅ $0/mês (Free Tier)
   - ✅ CI/CD gratuito (GitHub Actions)
   - ✅ Secrets no AWS SSM Parameter Store
   - ✅ CloudFront CDN global + SSL gratuito
   - ✅ IAM Roles only (zero Access Keys)
   - ✅ PostgreSQL com persistência EBS

### Migração Futura

📖 **Guia de migração para RDS:** [`DB_MIGRATION.md`](./DB_MIGRATION.md)

📖 **Guia de migração de dados do Supabase:** [`MIGRATION_GUIDE.md`](./MIGRATION_GUIDE.md)

## 🔒 Segurança

- ✅ Autenticação via Magic Link (login sem senha)
- ✅ JWT tokens para sessões
- ✅ Cookies seguros (httpOnly, secure)
- ✅ Líderes só acessam dados do próprio grupo (verificação na aplicação)
- ✅ HTTPS obrigatório em produção
- ✅ Secrets no AWS SSM Parameter Store

## 📊 Estrutura do Banco de Dados

```
users (autenticação)
├── sessions (sessões ativas)
├── magic_link_tokens (tokens temporários)
└── leaders (líderes vinculados)
    └── groups (grupos de estudo)
        ├── members (participantes e visitantes)
        ├── meetings (agenda de encontros)
        │   └── attendance (presença/falta)
        └── notifications (alertas e avisos)
```

## 🎯 Funcionalidades

### 1. Dashboard
- Estatísticas do grupo (total, participantes, visitantes)
- Alertas de faltas consecutivas (2+)
- Notificações de aniversários

### 2. Gestão de Pessoas
- Cadastro: Nome, Telefone, Data de Nascimento, Tipo
- Edição e listagem
- Badge de aniversariante do dia
- Botão de WhatsApp em cada pessoa

### 3. Chamada
- Lista de membros ativos
- Checkbox de presença/ausência
- Contadores de presentes/ausentes
- Salvar em lote

### 4. Agenda
- Próximas reuniões (30 dias)
- Histórico recente (10 últimas)
- Configuração do grupo (dia/horário)
- Suporte para marcar "semanas de folga"

### 5. Dashboard de Engajamento
- Gráficos de presença mensal (últimos 6 meses)
- Top 5 mais presentes
- Top 5 mais ausentes
- Membros com 100% de presença

### 6. Notificações Automáticas
- **Faltas Consecutivas**: Alerta após 2 faltas seguidas
- **Aniversários**: Notificação no dia do aniversário
- Execução diária via cron job (`/api/webhooks/cron`)

## 🔧 Desenvolvimento

### Estrutura de Pastas

```
pequenos-grupos/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Rotas de autenticação
│   ├── (dashboard)/       # Rotas protegidas
│   ├── api/               # API routes
│   └── globals.css        # Estilos globais
├── components/            # Componentes React
│   ├── ui/               # shadcn/ui components
│   ├── pessoas/          # Componentes de pessoas
│   ├── chamada/          # Componentes de chamada
│   └── dashboard/        # Componentes do dashboard
├── lib/                   # Utilitários
│   ├── db/               # Cliente PostgreSQL e queries
│   ├── auth/             # Autenticação (JWT, sessions)
│   ├── agenda/           # Geração de agenda
│   ├── alerts/           # Verificação de alertas
│   ├── aws/              # Clientes AWS (SSM)
│   ├── utils.ts          # Funções auxiliares
│   └── constants.ts      # Constantes
├── hooks/                 # React hooks
├── types/                 # TypeScript types
├── db/                    # Migrações PostgreSQL
│   └── migrations/
└── public/               # Arquivos estáticos
```

### Comandos Úteis

```bash
# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Start produção local
npm run start

# Linting
npm run lint

# Setup do banco de dados
./scripts/setup-database.sh

# Deploy via GitHub Actions (automático no push para main)
git push origin main
```

## 🐛 Troubleshooting

### Erro: "DATABASE_URL não configurada"
- Verifique se `.env.local` existe
- Verifique se as variáveis estão corretas
- Reinicie o servidor de desenvolvimento

### Erro: "Connection refused"
- Verifique se PostgreSQL está rodando
- Verifique host, porta e credenciais
- Teste conexão: `psql -h localhost -U postgres -d pequenos_grupos`

### Erro: "relation does not exist"
- Execute as migrações: `psql -d pequenos_grupos -f db/migrations/001_initial_schema.sql`

### Magic Link não funciona
- Verifique `NEXT_PUBLIC_APP_URL` no `.env.local`
- Em desenvolvimento, o link aparece no console
- Verifique se o token não expirou (1 hora)

## 📚 Documentação

### 🚀 Início Rápido
- **[`QUICKSTART.md`](./QUICKSTART.md)** ⭐ - **Comece aqui!** Guia rápido para setup local e AWS

### 📖 Guias Detalhados
- [`SETUP_LOCAL.md`](./SETUP_LOCAL.md) - Guia completo de setup local
- [`DEPLOY_AWS_GUIDE.md`](./DEPLOY_AWS_GUIDE.md) - Guia completo passo a passo de deploy AWS
- [`DB_MIGRATION.md`](./DB_MIGRATION.md) - Guia de migração para RDS
- [`MIGRATION_GUIDE.md`](./MIGRATION_GUIDE.md) - Guia de migração de dados do Supabase
- [`FASE_2_PROGRESS.md`](./FASE_2_PROGRESS.md) - Detalhes técnicos da migração

## 📝 Licença

Este projeto foi desenvolvido como MVP. Adapte conforme necessário para seu uso.

## 🤝 Contribuindo

Para sugestões ou melhorias, abra uma issue ou pull request no repositório.

---

Desenvolvido com ❤️ para comunidades de Pequenos Grupos
