# Setup Local - Pequenos Grupos Manager

Guia rápido para configurar o ambiente de desenvolvimento local.

## 📦 Pré-requisitos

- Node.js 18+ (com npm)
- PostgreSQL 15+ (local ou remoto)
- Docker e Docker Compose (opcional, para PostgreSQL)

## 🚀 Setup Rápido

### 1. Instalar Dependências

```bash
npm install
```

### 2. Configurar PostgreSQL

#### Opção A: PostgreSQL Local

```bash
# Criar banco de dados
createdb pequenos_grupos

# Executar migrações
psql -d pequenos_grupos -f db/migrations/001_initial_schema.sql
```

#### Opção B: PostgreSQL via Docker

```bash
# Iniciar PostgreSQL
docker run -d \
  --name pequenos-grupos-db \
  -e POSTGRES_PASSWORD=senha_segura \
  -e POSTGRES_DB=pequenos_grupos \
  -p 5432:5432 \
  postgres:15-alpine

# Executar migrações
docker exec -i pequenos-grupos-db psql -U postgres -d pequenos_grupos < db/migrations/001_initial_schema.sql
```

#### Opção C: Script Automatizado

```bash
# Executar script de setup
./scripts/setup-database.sh
```

### 3. Configurar Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz:

```bash
# Banco de Dados
DATABASE_URL=postgresql://postgres:senha_segura@localhost:5432/pequenos_grupos
DATABASE_USER=postgres
DATABASE_PASSWORD=senha_segura
DATABASE_NAME=pequenos_grupos

# Aplicação
APP_SECRET=sua-chave-secreta-aqui-gerar-com-openssl-rand-base64-32
NODE_ENV=development
CRON_SECRET=seu-cron-secret-aqui

# URL da aplicação (para magic links)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Gerar secrets:**

```bash
# APP_SECRET
openssl rand -base64 32

# CRON_SECRET
openssl rand -base64 32
```

### 4. Criar Primeiro Usuário e Líder

#### Via Script

```bash
./scripts/setup-database.sh
# Escolha a opção de criar dados iniciais
```

#### Via SQL Manual

```sql
-- Conectar ao banco
psql -d pequenos_grupos

-- Criar organização
INSERT INTO organizations (name) 
VALUES ('Minha Igreja') 
RETURNING id;

-- Criar grupo (substitua UUID_ORGANIZACAO)
INSERT INTO groups (organization_id, name, default_meeting_day, default_meeting_time)
VALUES (
  'UUID_ORGANIZACAO',
  'Meu Grupo',
  3, -- 3 = Quarta-feira (0=Domingo, 6=Sábado)
  '19:00:00'
)
RETURNING id;

-- Criar usuário
INSERT INTO users (email, email_verified)
VALUES ('seu@email.com', TRUE)
RETURNING id;

-- Criar líder (substitua UUIDs)
INSERT INTO leaders (id, organization_id, group_id, full_name, email)
VALUES (
  'UUID_USUARIO',
  'UUID_ORGANIZACAO',
  'UUID_GRUPO',
  'Seu Nome',
  'seu@email.com'
);
```

### 5. Executar Aplicação

```bash
# Desenvolvimento
npm run dev

# Acessar
# http://localhost:3000
```

### 6. Fazer Login

1. Acesse `http://localhost:3000/login`
2. Insira o email cadastrado
3. Em desenvolvimento, o magic link aparecerá no console do servidor
4. Copie o link e acesse no navegador
5. Você será redirecionado para o dashboard

## 🧪 Testar Funcionalidades

### Criar Primeira Pessoa

1. Vá em **Pessoas** → **Nova Pessoa**
2. Preencha os dados
3. Salve

### Registrar Presença

1. Vá em **Chamada**
2. Marque presenças/ausências
3. Salve

### Ver Agenda

1. Vá em **Agenda**
2. Veja próximas reuniões e histórico

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

## 📚 Próximos Passos

- Veja `DEPLOY_AWS_GUIDE.md` para deploy em produção
- Veja `MIGRATION_GUIDE.md` para migrar dados do Supabase
- Veja `FASE_2_PROGRESS.md` para detalhes técnicos
