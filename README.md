# Pequenos Grupos Manager - MVP V1.0

Sistema de gestão para Pequenos Grupos de Estudo, desenvolvido como Progressive Web App (PWA) com Next.js 15 e Supabase.

## 🎯 Características Principais

- ✅ **Gestão de Pessoas**: CRUD completo com classificação (Participante/Visitante)
- ✅ **Agenda Inteligente**: Geração automática com flexibilidade manual
- ✅ **Chamada Digital**: Interface simples para registro de presença
- ✅ **Alertas Automáticos**: Notificações de faltas consecutivas e aniversários
- ✅ **Integração WhatsApp**: Links diretos para contato
- ✅ **PWA**: Funciona como app nativo, instalável em iOS/Android
- ✅ **Offline-Ready**: Service Worker para cache e melhor experiência
- ✅ **Multi-tenancy**: Suporte para múltiplos grupos e líderes
- ✅ **Segurança**: Row Level Security (RLS) do Supabase

## 🚀 Stack Tecnológica

### Frontend
- **Next.js 15** (App Router)
- **React 19**
- **TypeScript**
- **Tailwind CSS**
- **shadcn/ui** (componentes)
- **next-pwa** (PWA support)

### Backend
- **Supabase** (PostgreSQL + Auth + Edge Functions + Realtime)
- **Row Level Security (RLS)**
- **Edge Functions** (Deno)

### Deploy
- **AWS Amplify** (frontend - recomendado, custo mínimo)
- **Vercel** (frontend - alternativa)
- **Supabase Cloud** (backend)

## 📦 Pré-requisitos

- Node.js 18+ (com npm)
- Conta no [Supabase](https://supabase.com)
- Conta no [Vercel](https://vercel.com) (para deploy)

## 🛠️ Setup Local

### 1. Instalar Dependências

```bash
cd pequenos-grupos
npm install
```

### 2. Configurar Supabase

1. Crie um projeto no [Supabase Dashboard](https://supabase.com/dashboard)

2. Execute o schema SQL:
   - Vá em `SQL Editor` no dashboard
   - Copie e cole o conteúdo de `supabase/migrations/20240101_initial_schema.sql`
   - Execute o script

3. Configure as Edge Functions:
   ```bash
   # Instalar Supabase CLI
   npm install -g supabase
   
   # Login
   supabase login
   
   # Link ao projeto
   supabase link --project-ref seu-project-ref
   
   # Deploy functions
   supabase functions deploy check-absences
   supabase functions deploy check-birthdays
   ```

### 3. Configurar Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key

# Cron Job
CRON_SECRET=gere-uma-string-aleatoria-aqui

# Web Push (opcional)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=sua-vapid-public-key
VAPID_PRIVATE_KEY=sua-vapid-private-key
```

Para obter as chaves do Supabase:
- `NEXT_PUBLIC_SUPABASE_URL`: Settings → API → Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Settings → API → anon public
- `SUPABASE_SERVICE_ROLE_KEY`: Settings → API → service_role (⚠️ Mantenha secreta!)

### 4. Configurar Autenticação no Supabase

1. Vá em `Authentication` → `Providers` → `Email`
2. Ative "Enable Email provider"
3. Desative "Confirm email" (para desenvolvimento)
4. Configure o "Site URL" para `http://localhost:3000`
5. Adicione `http://localhost:3000/**` em "Redirect URLs"

### 5. Executar Localmente

```bash
npm run dev
```

Acesse: http://localhost:3000

## 🎨 Criar Primeiro Usuário (Leader)

Como o sistema usa Row Level Security, você precisa criar um líder manualmente via SQL:

```sql
-- 1. Criar organização
INSERT INTO organizations (name) VALUES ('Minha Igreja')
RETURNING id;

-- 2. Criar grupo (substitua organization_id pelo ID retornado acima)
INSERT INTO groups (organization_id, name, default_meeting_day, default_meeting_time)
VALUES (
  'uuid-da-organizacao',
  'Pequeno Grupo Central',
  3, -- 3 = Quarta-feira (0=Domingo, 6=Sábado)
  '19:00:00'
)
RETURNING id;

-- 3. Criar líder (após fazer login pela primeira vez)
-- Pegue o auth.uid do usuário logado em: Authentication → Users
INSERT INTO leaders (id, organization_id, group_id, full_name, email)
VALUES (
  'uuid-do-usuario-auth',
  'uuid-da-organizacao',
  'uuid-do-grupo',
  'João Silva',
  'joao@email.com'
);
```

## 📱 Deploy em Produção

### Deploy Frontend (Vercel)

1. Instale a Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Deploy:
   ```bash
   vercel --prod
   ```

3. Configure as variáveis de ambiente no dashboard da Vercel (mesmas do `.env.local`)

4. Configure o Cron Job:
   - O arquivo `vercel.json` já está configurado
   - Vercel executará `/api/webhooks/cron` diariamente às 8h AM

### Deploy Frontend (AWS Amplify) - **RECOMENDADO**

**Para deploy com custo mínimo (~$0-5/mês) e alta segurança:**

📖 **Veja o guia completo:** [`DEPLOY_AWS.md`](./DEPLOY_AWS.md)

**Resumo rápido:**

1. **Setup automatizado:**
   ```bash
   ./scripts/setup-aws.sh
   ```

2. **Ou via Terraform (IaC):**
   ```bash
   cd aws/terraform
   terraform init
   terraform apply
   ```

3. **Deploy via GitHub Actions:**
   - Push para `main` = deploy automático
   - Pull Request = preview deploy

**Benefícios:**
- ✅ $0-5/mês (vs $20+/mês no Vercel após free tier)
- ✅ CI/CD gratuito (GitHub Actions)
- ✅ Secrets no AWS SSM Parameter Store
- ✅ CloudWatch monitoring incluído
- ✅ CloudFront CDN global
- ✅ IAM security best practices

### Configurar Supabase para Produção

1. No Supabase Dashboard → Authentication:
   - Atualize "Site URL" para `https://main.xxx.amplifyapp.com` (AWS) ou `https://seu-dominio.vercel.app` (Vercel)
   - Adicione a URL em "Redirect URLs"

2. Configure o CRON_SECRET:
   - Adicione a mesma variável no AWS SSM (via `setup-aws.sh`) ou Vercel

## 🔒 Segurança

- ✅ Autenticação via Magic Link (OTP por e-mail)
- ✅ Row Level Security (RLS) em todas as tabelas
- ✅ Líderes só acessam dados do próprio grupo
- ✅ Service Role Key nunca exposta ao cliente
- ✅ HTTPS obrigatório em produção

## 📊 Estrutura do Banco de Dados

```
organizations (multi-tenancy)
├── groups (grupos de estudo)
│   ├── leaders (líderes vinculados ao auth.users)
│   ├── members (participantes e visitantes)
│   ├── meetings (agenda de encontros)
│   │   └── attendance (presença/falta)
│   └── notifications (alertas e avisos)
```

## 🎯 Funcionalidades

### 1. Dashboard
- Estatísticas do grupo (total, participantes, visitantes)
- Alertas de faltas consecutivas (3+)
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

### 5. Notificações Automáticas
- **Faltas Consecutivas**: Alerta após 3 faltas seguidas
- **Aniversários**: Notificação no dia do aniversário
- Execução diária via Vercel Cron (8h AM)

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
│   ├── supabase/         # Clientes Supabase
│   ├── utils.ts          # Funções auxiliares
│   └── constants.ts      # Constantes
├── hooks/                 # React hooks
├── types/                 # TypeScript types
├── supabase/             # Supabase config
│   ├── functions/        # Edge Functions
│   └── migrations/       # SQL migrations
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

# Deploy Vercel
vercel --prod

# Deploy Supabase Functions
supabase functions deploy check-absences
supabase functions deploy check-birthdays
```

## 🐛 Troubleshooting

### Erro: "Row Level Security policy violation"
- Certifique-se de que o líder foi inserido corretamente na tabela `leaders`
- Verifique se `group_id` está preenchido
- Confirme que o `id` do líder corresponde ao `auth.uid`

### Notificações não funcionam
- Verifique se o `CRON_SECRET` está configurado no Vercel e Supabase
- Confirme que as Edge Functions foram deployadas
- Teste manualmente: `curl https://seu-app.vercel.app/api/webhooks/cron -H "Authorization: Bearer SEU_CRON_SECRET"`

### PWA não instala
- Confirme que está usando HTTPS (obrigatório para PWA)
- Verifique se `manifest.json` está acessível
- Certifique-se de que os ícones estão em `public/icons/`

## 📚 Recursos Adicionais

- [Documentação Next.js](https://nextjs.org/docs)
- [Documentação Supabase](https://supabase.com/docs)
- [shadcn/ui](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com/docs)

## 🎁 Funcionalidades Bônus Sugeridas

1. **Dashboard de Engajamento**: Gráficos de presença mensal
2. **Broadcast WhatsApp**: Enviar mensagem para todos via links
3. **Modo Offline Completo**: Sync automático com IndexedDB

## 📝 Licença

Este projeto foi desenvolvido como MVP. Adapte conforme necessário para seu uso.

## 🤝 Contribuindo

Para sugestões ou melhorias, abra uma issue ou pull request no repositório.

---

Desenvolvido com ❤️ para comunidades de Pequenos Grupos
