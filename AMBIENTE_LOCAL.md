# Subir o ambiente localmente para testes

Guia baseado na documentação e na arquitetura do projeto (Next.js 15 + Supabase). Use este fluxo para rodar tudo em **localhost** e testar.

---

## Pré-requisitos

- **Node.js 18+** e npm  
  - macOS: `brew install node`  
  - Ou: https://nodejs.org (LTS)
- Conta no **Supabase**: https://supabase.com/dashboard

---

## 1. Clonar/abrir o projeto e instalar dependências

```bash
cd pequenos-grupos
npm install
```

---

## 2. Criar projeto no Supabase (se ainda não tiver)

1. Acesse https://supabase.com/dashboard → **New Project**
2. Nome (ex.: `pg-test`), senha do banco (guarde), região próxima
3. Aguarde o projeto ficar pronto (~2 min)

---

## 3. Configurar o banco de dados

1. No Supabase: **SQL Editor** → **New Query**
2. Copie **todo** o conteúdo de:
   - `supabase/migrations/20240101_initial_schema.sql`
3. Cole no editor e clique em **RUN**
4. Depois, execute também a migration que permite o líder ver a própria linha (necessário para o dashboard funcionar):

```sql
CREATE POLICY "leaders_select_own_row" ON leaders
  FOR SELECT USING (id = auth.uid());
```

---

## 4. Configurar autenticação (Auth)

1. **Authentication** → **Providers** → **Email**
   - ✅ Enable Email provider
   - ❌ Confirm email (recomendado para testes locais)
2. **Authentication** → **URL Configuration**
   - **Site URL:** `http://localhost:3000`
   - **Redirect URLs:** adicione `http://localhost:3000/**`
3. Salve

---

## 5. Variáveis de ambiente

1. Na raiz do projeto, crie `.env.local` (ou copie de `.env.local.example`):

```bash
cp .env.local.example .env.local
```

2. Edite `.env.local` com os valores do Supabase (**Settings** → **API**):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...   # anon public
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...        # service_role (nunca exponha no front)
CRON_SECRET=qualquer-string-secreta-123    # qualquer texto para o cron
```

- **VAPID** (Web Push): opcional; pode deixar em branco para testes.

---

## 6. Subir o app localmente

```bash
npm run dev
```

Acesse: **http://localhost:3000**

---

## 7. Criar o primeiro usuário (líder)

O app usa RLS: o usuário logado precisa existir na tabela `leaders` vinculado a uma organização e a um grupo.

1. No app: informe seu e-mail → Magic Link no e-mail → clique no link (confira o spam).
2. No Supabase: **Authentication** → **Users** → copie o **UUID** do seu usuário.
3. No Supabase: **SQL Editor** → execute (substitua os UUIDs e o e-mail):

```sql
-- 1) Organização (anote o id retornado)
INSERT INTO organizations (name) VALUES ('Minha Igreja') RETURNING id;

-- 2) Grupo (substitua UUID-DA-ORGANIZACAO pelo id acima; anote o id do grupo)
INSERT INTO groups (organization_id, name, default_meeting_day, default_meeting_time)
VALUES (
  'UUID-DA-ORGANIZACAO',
  'Meu Grupo',
  3,              -- 3 = Quarta (0=Dom, 6=Sáb)
  '19:00:00'
) RETURNING id;

-- 3) Líder (substitua UUID-DO-USUARIO pelo UUID de Authentication → Users)
INSERT INTO leaders (id, organization_id, group_id, full_name, email)
VALUES (
  'UUID-DO-USUARIO',
  'UUID-DA-ORGANIZACAO',
  'UUID-DO-GRUPO',
  'Seu Nome',
  'seu@email.com'
);
```

4. Recarregue **http://localhost:3000/dashboard** — o dashboard deve aparecer.

---

## 8. O que testar localmente

- **Dashboard:** estatísticas, alertas
- **Pessoas:** CRUD, participante/visitante, WhatsApp
- **Chamada:** marcar presença, salvar
- **Agenda:** próximas reuniões, histórico
- **Engajamento:** gráficos (com dados de reuniões/chamada)
- **Offline:** desligar a rede e usar o app (sync ao reconectar)

---

## Comandos úteis

| Ação              | Comando        |
|-------------------|----------------|
| Desenvolvimento   | `npm run dev`  |
| Build produção    | `npm run build`|
| Lint              | `npm run lint` |

---

## Referências no projeto

- **QUICKSTART.md** — versão resumida
- **README.md** — visão geral e stack
- **SETUP.md** — setup detalhado (Edge Functions, etc.)
- **COMECE_AQUI.md** — índice de guias

Edge Functions (`check-absences`, `check-birthdays`) e cron são opcionais para testes básicos; o fluxo acima é suficiente para subir o ambiente e testar no localhost.
