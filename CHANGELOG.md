# Changelog - Pequenos Grupos Manager

Todas as mudanças notáveis do projeto serão documentadas aqui.

## [1.1.0] - 2026-02-12

### ✨ Novas Funcionalidades (Bônus)

#### 📊 Dashboard de Engajamento
- **Nova página `/engajamento`** com análises visuais de presença
- **Gráficos interativos:**
  - Gráfico de linha: Taxa de presença mensal (últimos 6 meses)
  - Gráfico de barras: Presentes vs Ausentes por mês
- **Rankings:**
  - Top 5 Mais Presentes
  - Top 5 Mais Ausentes
  - Membros com 100% de presença (destaque especial)
- **Estatísticas:**
  - Taxa média de presença
  - Tendência (comparação mês a mês)
  - Total de registros de presença
- **Tecnologias:** Recharts para visualização de dados
- **Item no menu:** Novo link "Engajamento" no sidebar e bottom navigation

#### 💬 Broadcast WhatsApp
- **Botão na página Pessoas:** "Mensagem em Grupo"
- **Modal intuitivo** com recursos:
  - Filtros: Todos, Participantes, Visitantes
  - Campo de mensagem personalizável
  - Placeholder `{nome}` substituído automaticamente
  - Preview de destinatários com telefones
  - Barra de progresso durante envio
- **Funcionalidades:**
  - Envio em massa com delay de 2s entre mensagens
  - Abertura automática do WhatsApp Web/App
  - Mensagens personalizadas por pessoa
  - Contador de envio em tempo real
- **UX:** Modal fecha automaticamente ao concluir

#### 📴 Modo Offline Completo
- **IndexedDB local** para armazenamento:
  - Cache de membros, reuniões e presenças
  - Fila de sincronização persistente
  - Timestamps de última sync
- **Sincronização inteligente:**
  - Detecção automática de online/offline
  - Sync automático ao reconectar
  - Botão manual de sincronização
  - Conflict resolution via upsert
- **Indicadores visuais:**
  - Badge "Modo Offline" (vermelho) quando desconectado
  - Badge "X pendentes" (amarelo) com dados aguardando sync
  - Badge "Sincronizado" (verde) quando tudo atualizado
  - Timestamp de última sincronização
- **Chamada offline:**
  - Registro de presença funciona sem internet
  - Botão muda para "Salvar Offline"
  - Aviso claro de modo offline ativo
  - Dados enviados ao Supabase quando reconectar
- **Tecnologias:** Dexie.js (wrapper do IndexedDB)

### 🔧 Melhorias Técnicas

- **Dependências adicionadas:**
  - `recharts@^2.13.3` - Gráficos React
  - `dexie@^4.0.10` - IndexedDB wrapper
  - `dexie-react-hooks@^1.1.7` - React hooks para Dexie
- **Novos componentes:**
  - `EngagementChart` - Dashboard de análises
  - `BroadcastDialog` - Modal de envio em massa
  - `OfflineIndicator` - Indicador de status de conexão
  - `Dialog` (UI) - Modal do Radix UI
- **Novos hooks:**
  - `useOfflineSync` - Gerenciamento de sync offline
- **Novos utilitários:**
  - `formatDistanceToNow` - Formatar tempo relativo
  - Database offline (`lib/offline-db.ts`)

### 📝 Documentação

- **TESTE_FUNCIONALIDADES_BONUS.md** criado
  - Guia completo de instalação e teste
  - Instruções passo-a-passo para cada funcionalidade
  - Troubleshooting e dicas de uso
  - Scripts SQL para dados de teste
- **CHANGELOG.md** criado (este arquivo)

### 🎨 UI/UX

- Layout do menu atualizado com novo item "Engajamento"
- Página de Pessoas redesenhada com botão de broadcast
- Indicador flutuante de status offline
- Mensagens de feedback mais claras
- Responsividade mantida em todas as novas telas

### 🐛 Correções

- Import de `Users` icon adicionado em `pessoas/page.tsx`
- `formatDistanceToNow` adicionado ao `lib/utils.ts`

---

## [1.0.0] - 2026-02-12

### 🎉 Lançamento Inicial (MVP)

#### Funcionalidades Core

##### 👥 Gestão de Pessoas
- CRUD completo (Criar, Ler, Atualizar, Deletar)
- Campos obrigatórios: Nome, Telefone, Data de Nascimento
- Classificação: Participante ou Visitante
- Cálculo automático de idade
- Badge de aniversariante do dia
- Botão WhatsApp em cada card
- Lista responsiva (grid mobile-first)

##### 📅 Gestão de Agenda
- Configuração de dia/hora padrão das reuniões
- Geração automática de encontros
- Suporte a "semanas de folga" (reuniões canceladas)
- Visualização de próximas reuniões (30 dias)
- Histórico de reuniões passadas (10 últimas)
- Contagem de presenças por reunião

##### ✅ Chamada Digital
- Interface simples de checklist
- Marcação binária: Presente ou Ausente
- Contadores visuais (presentes/ausentes)
- Auto-criação de reunião do dia
- Salvamento em lote (upsert)
- Feedback visual ao salvar

##### 🔔 Alertas Automáticos
- **Faltas Consecutivas:**
  - Alerta após 3 faltas seguidas
  - Notificação no dashboard
  - Sugestão de contato com o membro
  - Prevenção de duplicatas (7 dias)
- **Aniversários:**
  - Notificação no dia do aniversário
  - Badge visual no card da pessoa
  - Alerta no dashboard
- **Execução:**
  - Vercel Cron Job diário (8h AM)
  - Edge Functions (Deno) no Supabase

##### 💬 Integração WhatsApp
- Links `wa.me` diretos
- Mensagem pré-preenchida personalizada
- Botão em cada card de pessoa
- Abre WhatsApp Web ou App
- Suporte a código de país (+55)

##### 🏠 Dashboard
- Estatísticas do grupo:
  - Total de pessoas
  - Total de participantes
  - Total de visitantes
- Painel de alertas e notificações:
  - Filtro de não lidas
  - Marcação de lida
  - Tipos: Faltas e Aniversários
  - Ordenação cronológica

#### 🔐 Autenticação & Segurança

- **Magic Link (OTP):** Login sem senha via e-mail
- **Row Level Security (RLS):** Isolamento total de dados por grupo
- **Multi-tenancy:** organizations → groups → leaders
- **Middleware:** Proteção automática de rotas
- **Cookies seguros:** httpOnly, sameSite
- **Service Role Key:** Nunca exposta ao cliente

#### 📱 PWA (Progressive Web App)

- **Manifest.json:** Configuração completa
- **Service Worker:** Cache automático
- **Instalável:** iOS, Android, Desktop
- **Offline-ready:** Cache de assets estáticos
- **Ícones:** Suporte a 192x192 e 512x512
- **Standalone mode:** Comporta-se como app nativo

#### 🗄️ Database (Supabase)

- **7 Tabelas:**
  - organizations
  - groups
  - leaders
  - members
  - meetings
  - attendance
  - notifications
- **RLS Policies:** Uma por tabela
- **Índices:** Otimização de queries
- **Funções Helper:**
  - get_consecutive_absences
  - get_birthdays_today

#### ⚡ Backend (Edge Functions)

- **check-absences:** Verifica faltas consecutivas
- **check-birthdays:** Identifica aniversariantes
- **Tecnologia:** Deno runtime
- **Execução:** Diária via Vercel Cron

#### 🎨 Frontend

- **Framework:** Next.js 15 (App Router)
- **React:** 19.0.0 (Server Components)
- **TypeScript:** Type-safe completo
- **Styling:** Tailwind CSS + shadcn/ui
- **Componentes UI:** 8 base (Button, Input, etc.)
- **Componentes Custom:** 6 específicos do domínio
- **Layouts:**
  - Desktop: Sidebar navegação
  - Mobile: Bottom navigation
  - Responsivo: Mobile-first

#### 📚 Documentação

- **README.md:** Documentação principal
- **SETUP.md:** Guia de setup passo-a-passo
- **DEPLOY.md:** Guia de deploy em produção
- **QUICKSTART.md:** Começar em 15 minutos
- **PROJECT_SUMMARY.md:** Resumo técnico completo

#### 🛠️ DevOps & Infraestrutura

- **Vercel:** Deploy frontend (free tier)
- **Supabase:** Backend completo (free tier)
- **Cron Jobs:** Execução diária de tarefas
- **Environment Variables:** Template incluído
- **CI/CD:** Automático via Vercel
- **Preview Deploys:** Para cada branch

#### 📦 Dependências Core

- Next.js 15.1.4
- React 19.0.0
- Supabase JS 2.45.6
- Tailwind CSS 3.4.17
- Radix UI (componentes acessíveis)
- Lucide React (ícones)
- next-pwa 5.6.0

---

## Roadmap Futuro

### 🔮 Possíveis Melhorias (V2.0)

- [ ] **Relatórios em PDF** - Exportar dados de presença
- [ ] **Multi-idioma** - i18n (PT-BR, EN, ES)
- [ ] **Temas** - Dark mode
- [ ] **Notificações E-mail** - Além de push
- [ ] **Calendário Interativo** - Drag & drop de reuniões
- [ ] **Grupos Privados** - Código de acesso
- [ ] **Chat Interno** - Comunicação entre líderes
- [ ] **Integração Google Calendar** - Sync de eventos
- [ ] **Backup Automático** - Export para Google Drive
- [ ] **Analytics Avançado** - Insights com IA

---

## Versionamento

Este projeto segue [Semantic Versioning](https://semver.org/):
- **MAJOR:** Mudanças incompatíveis de API
- **MINOR:** Novas funcionalidades (compatível)
- **PATCH:** Correções de bugs (compatível)

---

**Última atualização:** 12 de Fevereiro de 2026
