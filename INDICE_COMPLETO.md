# 📑 Índice Completo do Projeto

## 📖 Documentação Principal

| Arquivo | Descrição | Quando Usar |
|---------|-----------|-------------|
| **[COMECE_AQUI.md](./COMECE_AQUI.md)** | 🚀 Ponto de entrada principal | **COMECE POR AQUI** |
| **[README.md](./README.md)** | Documentação completa do projeto | Referência geral |
| **[QUICKSTART.md](./QUICKSTART.md)** | Guia rápido (15 minutos) | Testar localmente RÁPIDO |
| **[SETUP.md](./SETUP.md)** | Setup completo passo-a-passo | Configuração detalhada |
| **[PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md)** | Resumo técnico do MVP | Entender arquitetura |

---

## 🚀 Deploy e Infraestrutura

### Deploy AWS (Recomendado)

| Arquivo | Descrição |
|---------|-----------|
| **[DEPLOY_AWS.md](./DEPLOY_AWS.md)** | 📘 Guia completo de deploy na AWS |
| **[CUSTOS_COMPARACAO.md](./CUSTOS_COMPARACAO.md)** | 💰 Comparação AWS vs Vercel |
| **[CHANGELOG_AWS.md](./CHANGELOG_AWS.md)** | 📝 Histórico de mudanças AWS |

### Deploy Vercel (Alternativa)

| Arquivo | Descrição |
|---------|-----------|
| **[DEPLOY.md](./DEPLOY.md)** | Guia de deploy no Vercel |

---

## 📦 Configurações e Scripts

### Configuração AWS

| Arquivo | Descrição |
|---------|-----------|
| `amplify.yml` | Configuração de build AWS Amplify |
| `aws/iam-policies.json` | Políticas IAM detalhadas |
| `aws/terraform/main.tf` | Infraestrutura como código (Terraform) |
| `aws/terraform/variables.tf` | Variáveis Terraform |
| `aws/terraform/outputs.tf` | Outputs Terraform |
| `aws/terraform/terraform.tfvars.example` | Template de variáveis Terraform |
| `aws/terraform/README.md` | Documentação Terraform |

### Scripts de Utilidade

| Arquivo | Descrição | Como Usar |
|---------|-----------|-----------|
| `scripts/setup-aws.sh` | Setup automático AWS | `./scripts/setup-aws.sh` |
| `scripts/rollback-aws.sh` | Rollback de deployments | `./scripts/rollback-aws.sh` |
| `scripts/monitor-costs.sh` | Monitoramento de custos | `./scripts/monitor-costs.sh` |
| `scripts/validate-security.sh` | Validação de segurança | `./scripts/validate-security.sh` |
| `install-and-run.sh` | Instalação e execução local | `./install-and-run.sh` |

### CI/CD (GitHub Actions)

| Arquivo | Descrição |
|---------|-----------|
| `.github/workflows/deploy.yml` | Pipeline de deploy principal |
| `.github/workflows/preview.yml` | Preview deploys em PRs |

---

## 🎁 Funcionalidades Bonus

| Arquivo | Descrição |
|---------|-----------|
| **[TESTE_FUNCIONALIDADES_BONUS.md](./TESTE_FUNCIONALIDADES_BONUS.md)** | Guia de teste das 3 features bonus |
| **[FUNCIONALIDADES_COMPLETAS.md](./FUNCIONALIDADES_COMPLETAS.md)** | Lista completa de features |
| **[CHANGELOG.md](./CHANGELOG.md)** | Histórico de mudanças MVP |

---

## 🏗️ Estrutura do Código-Fonte

### Configuração do Projeto

```
pequenos-grupos/
├── package.json                 # Dependências e scripts
├── tsconfig.json               # TypeScript config
├── next.config.js              # Next.js config (com PWA)
├── tailwind.config.ts          # Tailwind CSS config
├── postcss.config.mjs          # PostCSS config
├── .env.local.example          # Template de env vars
├── .gitignore                  # Git ignore (inclui Terraform)
├── .eslintrc.json              # ESLint config
├── vercel.json                 # Vercel config (cron jobs)
└── amplify.yml                 # AWS Amplify config
```

### Aplicação Next.js

```
app/
├── layout.tsx                  # Root layout (PWA metadata)
├── page.tsx                    # Redirect para /dashboard
├── globals.css                 # Global styles
│
├── (auth)/                     # Rotas de autenticação
│   ├── layout.tsx             # Layout auth
│   └── login/
│       └── page.tsx           # Login com Magic Link
│
├── (dashboard)/               # Rotas protegidas
│   ├── layout.tsx            # Layout com sidebar/bottom nav
│   ├── dashboard/
│   │   └── page.tsx          # Dashboard principal
│   ├── pessoas/
│   │   ├── page.tsx          # Lista de pessoas
│   │   ├── novo/page.tsx     # Adicionar pessoa
│   │   └── [id]/page.tsx     # Editar pessoa
│   ├── chamada/
│   │   └── page.tsx          # Registro de presença
│   ├── agenda/
│   │   └── page.tsx          # Lista de reuniões
│   └── engajamento/          # BONUS
│       └── page.tsx          # Dashboard de engajamento
│
└── api/
    └── webhooks/
        └── cron/
            └── route.ts       # Webhook para Vercel Cron
```

### Componentes

```
components/
├── ui/                        # shadcn/ui components
│   ├── button.tsx
│   ├── input.tsx
│   ├── label.tsx
│   ├── checkbox.tsx
│   ├── card.tsx
│   ├── badge.tsx
│   ├── select.tsx
│   ├── textarea.tsx
│   └── dialog.tsx
│
├── pessoas/
│   ├── pessoa-card.tsx       # Card de pessoa
│   ├── pessoa-form.tsx       # Formulário CRUD
│   ├── whatsapp-button.tsx  # Botão WhatsApp
│   └── broadcast-dialog.tsx # BONUS: Broadcast WhatsApp
│
├── chamada/
│   └── presence-checklist.tsx # Checklist de presença (com offline)
│
└── dashboard/
    ├── stats-cards.tsx        # Cards de estatísticas
    ├── alerts-panel.tsx       # Painel de alertas
    ├── engagement-chart.tsx   # BONUS: Gráficos Recharts
    └── offline-indicator.tsx  # BONUS: Indicador offline
```

### Bibliotecas e Utilidades

```
lib/
├── supabase/
│   ├── client.ts             # Client-side Supabase
│   ├── server.ts             # Server-side Supabase
│   └── middleware.ts         # Auth middleware
├── utils.ts                   # Funções utilitárias
├── constants.ts               # Constantes da aplicação
└── offline-db.ts             # BONUS: Dexie.js (IndexedDB)
```

### Hooks Customizados

```
hooks/
├── use-notifications.ts       # Web Push Notifications
├── use-realtime.ts           # Supabase Realtime
└── use-offline-sync.ts       # BONUS: Sincronização offline
```

### Tipos TypeScript

```
types/
└── database.types.ts          # Tipos gerados do Supabase
```

---

## 🗄️ Banco de Dados (Supabase)

```
supabase/
├── migrations/
│   └── 20240101_initial_schema.sql  # Schema completo
│
└── functions/                 # Edge Functions (Deno)
    ├── check-absences/
    │   └── index.ts          # Verificar faltas consecutivas
    └── check-birthdays/
        └── index.ts          # Verificar aniversariantes
```

### Tabelas Criadas

- `organizations` - Multi-tenancy
- `groups` - Grupos de estudo
- `leaders` - Líderes (vinculado a auth.users)
- `members` - Participantes e visitantes
- `meetings` - Reuniões/agenda
- `attendance` - Presença/ausência
- `notifications` - Alertas e notificações

---

## 🎨 Assets e PWA

```
public/
├── manifest.json              # Web App Manifest
├── sw.js                      # Service Worker (Web Push)
├── icons/                     # Icons PWA (criar)
│   ├── icon-192x192.png
│   ├── icon-512x512.png
│   └── README.md
└── ... (outros assets)
```

---

## 📊 Resumo de Arquivos por Categoria

| Categoria | Quantidade | Descrição |
|-----------|------------|-----------|
| **Documentação** | 12 | Guias, READMEs, changelogs |
| **Configuração** | 12 | package.json, configs, env |
| **Código-fonte** | 45+ | Pages, components, hooks, libs |
| **Banco de Dados** | 3 | Schema SQL, Edge Functions |
| **Scripts** | 5 | Setup, deploy, monitoramento |
| **CI/CD** | 2 | GitHub Actions workflows |
| **Terraform** | 5 | Infraestrutura como código |
| **TOTAL** | **84+** | Arquivos no projeto |

---

## 🎯 Fluxo de Navegação Recomendado

### 1️⃣ Primeiro Contato (5 min)
```
COMECE_AQUI.md
```

### 2️⃣ Setup Local (15-45 min)
```
QUICKSTART.md  (rápido)
ou
SETUP.md       (completo)
```

### 3️⃣ Entender o Projeto (15-30 min)
```
README.md
PROJECT_SUMMARY.md
FUNCIONALIDADES_COMPLETAS.md
```

### 4️⃣ Testar Features Bonus (30 min)
```
TESTE_FUNCIONALIDADES_BONUS.md
```

### 5️⃣ Deploy (1-2 horas)
```
DEPLOY_AWS.md          (recomendado, custo mínimo)
CUSTOS_COMPARACAO.md   (decisão AWS vs Vercel)
ou
DEPLOY.md              (Vercel, mais rápido)
```

### 6️⃣ Manutenção e Evolução
```
CHANGELOG.md           (histórico MVP)
CHANGELOG_AWS.md       (histórico AWS)
scripts/monitor-costs.sh    (monitorar custos)
scripts/validate-security.sh (segurança)
```

---

## 🔗 Links Externos Úteis

### Serviços
- [Supabase Dashboard](https://supabase.com/dashboard)
- [Vercel Dashboard](https://vercel.com/dashboard)
- [AWS Amplify Console](https://console.aws.amazon.com/amplify)
- [AWS Cost Explorer](https://console.aws.amazon.com/cost-management/home)

### Documentação Técnica
- [Next.js 15 Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [AWS Amplify Docs](https://docs.aws.amazon.com/amplify/)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [shadcn/ui Components](https://ui.shadcn.com)

### Ferramentas
- [Recharts](https://recharts.org)
- [Dexie.js (IndexedDB)](https://dexie.org)
- [Tailwind CSS](https://tailwindcss.com)

---

## 📞 Suporte e Contribuição

**Dúvidas Frequentes:**
1. "Por onde começar?" → `COMECE_AQUI.md`
2. "Como fazer deploy?" → `DEPLOY_AWS.md` (custo mínimo) ou `DEPLOY.md` (Vercel)
3. "Quanto vai custar?" → `CUSTOS_COMPARACAO.md`
4. "O que foi implementado?" → `FUNCIONALIDADES_COMPLETAS.md`
5. "Como testar offline?" → `TESTE_FUNCIONALIDADES_BONUS.md`

**Estrutura de Pastas:**
- `/app` - Código Next.js
- `/components` - Componentes React
- `/lib` - Bibliotecas e utils
- `/hooks` - React hooks
- `/supabase` - Database schema e functions
- `/scripts` - Scripts de automação
- `/aws` - Configuração AWS (Terraform, IAM)
- `/.github` - CI/CD (GitHub Actions)

**Documentação Completa:** Todos os arquivos `.md` estão na raiz do projeto.

---

**Última Atualização:** Fevereiro 2026  
**Versão do Projeto:** V1.2.0 (MVP + Bonus + AWS Deploy)
