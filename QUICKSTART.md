# 🚀 Quick Start - Pequenos Grupos Manager

Guia rápido para começar a usar o sistema em **5 minutos** (local) ou **30 minutos** (AWS).

---

## 📍 Índice Rápido

- [✅ Setup Local (5-10 min)](#-setup-local-5-10-minutos)
- [☁️ Setup AWS (30-60 min)](#️-setup-aws-30-60-minutos)
- [🐛 Troubleshooting Rápido](#-troubleshooting-rápido)

---

## ✅ Setup Local (5-10 minutos)

### Pré-requisitos

- ✅ Node.js 18+ instalado
- ✅ Docker instalado (ou PostgreSQL local)

### Passo 1: Instalar Dependências

```bash
npm install
```

### Passo 2: Iniciar PostgreSQL (Docker)

```bash
# Criar e iniciar container PostgreSQL
docker run -d \
  --name pequenos-grupos-db \
  -e POSTGRES_PASSWORD=senha_segura \
  -e POSTGRES_DB=pequenos_grupos \
  -p 5432:5432 \
  postgres:15-alpine

# Aguardar 5 segundos para inicialização
sleep 5
```

### Passo 3: Executar Migrações

```bash
# Executar schema inicial
docker exec -i pequenos-grupos-db psql -U postgres -d pequenos_grupos < db/migrations/001_initial_schema.sql
```

### Passo 4: Configurar Variáveis de Ambiente

```bash
# Copiar template
cp .env.example .env.local
```

**Edite `.env.local` com:**

```bash
# Banco de Dados
DATABASE_URL=postgresql://postgres:senha_segura@localhost:5432/pequenos_grupos
DATABASE_USER=postgres
DATABASE_PASSWORD=senha_segura
DATABASE_NAME=pequenos_grupos

# Aplicação (gerar secrets)
APP_SECRET=$(openssl rand -base64 32)
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Cron (opcional)
CRON_SECRET=$(openssl rand -base64 32)
```

**💡 Dica:** Execute `openssl rand -base64 32` duas vezes e copie os valores para `APP_SECRET` e `CRON_SECRET`.

### Passo 5: Criar Primeiro Usuário (Automático)

```bash
# Executar script interativo
chmod +x scripts/setup-database.sh
./scripts/setup-database.sh
```

**Quando perguntado:**
- Host: `localhost` (ou pressione Enter)
- Port: `5432` (ou pressione Enter)
- Database: `pequenos_grupos` (ou pressione Enter)
- User: `postgres` (ou pressione Enter)
- Password: `senha_segura` (a mesma do Docker)
- Criar dados iniciais: **`s`** (sim)

**Informe:**
- Nome da organização: `Minha Igreja`
- Nome do grupo: `Grupo Central`
- Dia da semana: `3` (Quarta-feira)
- Horário: `19:00:00`
- Email do líder: `seu@email.com`
- Nome completo: `Seu Nome`

### Passo 6: Iniciar Aplicação

```bash
npm run dev
```

### Passo 7: Fazer Login

1. Abra: http://localhost:3000/login
2. Digite o email cadastrado (`seu@email.com`)
3. **No terminal**, você verá o magic link:
   ```
   🔗 Magic Link (DEV): http://localhost:3000/api/auth/verify?token=...
   ```
4. Copie o link completo e cole no navegador
5. Você será redirecionado para o dashboard ✅

---

## ☁️ Setup AWS (30-60 minutos)

### Pré-requisitos

- ✅ Conta AWS ativa (Free Tier)
- ✅ Repositório GitHub configurado
- ✅ Domínio próprio (opcional, mas recomendado)

### Checklist Rápido

- [ ] EC2 criada (t2.micro Free Tier)
- [ ] IAM Role configurada para EC2
- [ ] Docker instalado na EC2
- [ ] EBS Volume criado e montado
- [ ] Security Group configurado
- [ ] SSM Parameter Store configurado
- [ ] CloudFront configurado
- [ ] GitHub Actions OIDC configurado
- [ ] Primeiro deploy executado

### Passo 1: Criar EC2 Instance

1. AWS Console → **EC2** → **Launch Instance**
2. **Nome:** `pequenos-grupos-app`
3. **AMI:** Amazon Linux 2023 ou Ubuntu 22.04
4. **Instance Type:** `t2.micro` (Free Tier)
5. **Key Pair:** Criar novo (`pequenos-grupos-key`)
6. **Security Group:** Criar novo
   - SSH (22) → **My IP**
   - HTTP (80) → **0.0.0.0/0**
   - HTTPS (443) → **0.0.0.0/0**
7. **Storage:** 8 GB gp3 (Free Tier)
8. Clique em **Launch Instance**

**📝 Anote:**
- Public IPv4 DNS: `ec2-xxx-xxx-xxx-xxx.compute-1.amazonaws.com`
- Instance ID: `i-xxxxxxxxxxxxx`

### Passo 2: Configurar IAM Role para EC2

1. AWS Console → **IAM** → **Roles** → **Create role**
2. **Trusted entity:** EC2
3. **Permissions:** Adicionar políticas:
   - `AmazonSSMManagedInstanceCore`
   - `AmazonEC2ContainerRegistryReadOnly`
4. **Role name:** `pequenos-grupos-ec2-role`
5. **Attach role to EC2:**
   - EC2 → Instância → **Actions** → **Security** → **Modify IAM role**
   - Selecione `pequenos-grupos-ec2-role`

### Passo 3: Instalar Docker na EC2

**Via SSM Session Manager (recomendado):**

1. AWS Console → **Systems Manager** → **Session Manager**
2. Clique em **Start session**
3. Selecione sua instância EC2
4. Execute:

```bash
# Amazon Linux 2023
sudo yum update -y
sudo yum install -y docker
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ec2-user

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verificar instalação
docker --version
docker-compose --version
```

**Ou via script automatizado:**

```bash
# Fazer upload do script para EC2
scp scripts/setup-ec2.sh ec2-user@SEU_EC2_DNS:/home/ec2-user/

# Conectar via SSM e executar
chmod +x setup-ec2.sh
bash setup-ec2.sh
```

### Passo 4: Criar e Montar Volume EBS

1. EC2 → **Volumes** → **Create volume**
2. **Size:** 20 GB (gp3)
3. **Availability Zone:** Mesma da EC2
4. **Volume Type:** gp3
5. Clique em **Create**
6. **Attach volume** à instância EC2
7. **Device:** `/dev/xvdf` (ou `/dev/nvme1n1`)

**Montar volume:**

```bash
# Conectar via SSM Session Manager
# Criar diretório de montagem
sudo mkdir -p /mnt/postgres-data

# Formatar volume (apenas primeira vez)
sudo mkfs -t xfs /dev/xvdf  # ou /dev/nvme1n1

# Montar volume
sudo mount /dev/xvdf /mnt/postgres-data  # ou /dev/nvme1n1

# Tornar permanente (editar /etc/fstab)
echo '/dev/xvdf /mnt/postgres-data xfs defaults,nofail 0 2' | sudo tee -a /etc/fstab
```

### Passo 5: Configurar SSM Parameter Store

1. AWS Console → **Systems Manager** → **Parameter Store**
2. Criar parâmetros (tipo **SecureString**):

```
/pequenos-grupos/database/url
Valor: postgresql://postgres:SENHA_AQUI@localhost:5432/pequenos_grupos

/pequenos-grupos/database/user
Valor: postgres

/pequenos-grupos/database/password
Valor: SENHA_AQUI (SecureString)

/pequenos-grupos/app/secret
Valor: $(openssl rand -base64 32) (SecureString)

/pequenos-grupos/app/node-env
Valor: production
```

**💡 Dica:** Use `openssl rand -base64 32` para gerar secrets seguros.

### Passo 6: Configurar CloudFront

1. AWS Console → **CloudFront** → **Create distribution**
2. **Origin Domain:** Seu EC2 Public DNS (`ec2-xxx-xxx-xxx-xxx.compute-1.amazonaws.com`)
3. **Origin Protocol:** HTTP
4. **Viewer Protocol Policy:** Redirect HTTP to HTTPS
5. **Allowed HTTP Methods:** GET, HEAD, OPTIONS, PUT, POST, PATCH, DELETE
6. **Cache Policy:** CachingDisabled (para desenvolvimento) ou Managed-CachingDisabled
7. **Price Class:** Use All Edge Locations
8. Clique em **Create distribution**

**📝 Anote:** Distribution Domain Name (`d1234567890.cloudfront.net`)

**Configurar SSL (opcional, mas recomendado):**

1. **ACM (Certificate Manager)** → **Request certificate**
2. **Domain:** Seu domínio (`app.seudominio.com`)
3. **Validation:** DNS ou Email
4. Volte ao CloudFront → Editar distribution → **Custom SSL Certificate** → Selecione seu certificado

### Passo 7: Configurar GitHub Actions OIDC

1. AWS Console → **IAM** → **Identity providers** → **Add provider**
2. **Provider type:** OpenID Connect
3. **Provider URL:** `https://token.actions.githubusercontent.com`
4. **Audience:** `sts.amazonaws.com`
5. Clique em **Add provider**

6. **IAM** → **Roles** → **Create role**
7. **Trusted entity:** Web Identity
8. **Provider:** `token.actions.githubusercontent.com`
9. **Audience:** `sts.amazonaws.com`
10. **Conditions:**
    ```json
    {
      "StringEquals": {
        "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
      },
      "StringLike": {
        "token.actions.githubusercontent.com:sub": "repo:SEU_USUARIO/pequenos-grupos:*"
      }
    }
    ```
11. **Permissions:** Adicionar políticas:
    - `AmazonEC2ContainerRegistryFullAccess` (ou apenas read)
    - `AmazonSSMFullAccess` (ou apenas Parameter Store read)
    - `AmazonEC2FullAccess` (ou apenas para SSM SendCommand)
12. **Role name:** `pequenos-grupos-github-actions-role`
13. **Anote o ARN:** `arn:aws:iam::ACCOUNT_ID:role/pequenos-grupos-github-actions-role`

14. **GitHub** → Repositório → **Settings** → **Secrets and variables** → **Actions**
15. Adicionar secret:
    - **Name:** `AWS_ROLE_ARN`
    - **Value:** `arn:aws:iam::ACCOUNT_ID:role/pequenos-grupos-github-actions-role`

### Passo 8: Primeiro Deploy

1. **Configurar GitHub Actions workflow:**

Edite `.github/workflows/deploy-aws.yml` e verifique:
- `AWS_REGION`: sua região (ex: `us-east-1`)

2. **Configurar secrets no GitHub** (Settings → Secrets and variables → Actions):
- `AWS_ROLE_ARN`: ARN da IAM Role do GitHub Actions OIDC
- `EC2_INSTANCE_ID`: ID da sua instância EC2 (ex: `i-0123456789abcdef0`)

**Nota:** O nome da imagem no GHCR é obtido automaticamente do repositório (em minúsculas)

3. **Commit e push:**

```bash
git add .
git commit -m "feat: initial AWS deployment setup"
git push origin main
```

4. **Monitorar deploy:**

- GitHub → **Actions** → Veja o workflow rodando
- Aguarde conclusão (5-10 minutos)

5. **Verificar aplicação:**

- Acesse: `https://SEU_DISTRIBUTION_ID.cloudfront.net`
- Ou: `http://SEU_EC2_DNS:3000` (se CloudFront não estiver pronto)

### Passo 9: Setup Inicial do Banco na EC2

**Conectar via SSM Session Manager:**

```bash
# Executar migrações (na ordem)
docker exec -i pequenos-grupos-postgres psql -U postgres -d pequenos_grupos < db/migrations/001_initial_schema.sql
docker exec -i pequenos-grupos-postgres psql -U postgres -d pequenos_grupos < db/migrations/002_admin_and_meeting_time.sql

# Criar dados iniciais e usuário admin (opcional)
# Use o script setup-database.sh ou create-admin.sh adaptado para EC2
```

---

## 🐛 Troubleshooting Rápido

### Local

**Erro: "DATABASE_URL não configurada"**
```bash
# Verificar arquivo .env.local existe
ls -la .env.local

# Verificar variáveis
cat .env.local | grep DATABASE_URL

# Reiniciar servidor
npm run dev
```

**Erro: "Connection refused"**
```bash
# Verificar PostgreSQL rodando
docker ps | grep pequenos-grupos-db

# Verificar porta 5432
lsof -i :5432

# Reiniciar container
docker restart pequenos-grupos-db
```

**Erro: "relation does not exist"**
```bash
# Executar migrações novamente
docker exec -i pequenos-grupos-db psql -U postgres -d pequenos_grupos < db/migrations/001_initial_schema.sql
```

**Magic Link não aparece no console**
```bash
# Verificar NEXT_PUBLIC_APP_URL no .env.local
echo $NEXT_PUBLIC_APP_URL

# Verificar logs do servidor
# O link deve aparecer após solicitar magic link
```

### AWS

**EC2 não conecta via SSM**
- Verificar IAM Role anexada à EC2
- Verificar política `AmazonSSMManagedInstanceCore` no role
- Aguardar 2-3 minutos após criar role

**Docker não inicia na EC2**
```bash
# Verificar status
sudo systemctl status docker

# Reiniciar
sudo systemctl restart docker

# Verificar permissões
sudo usermod -aG docker ec2-user
# Desconectar e reconectar via SSM
```

**CloudFront retorna 502/503**
- Verificar Security Group permite HTTP (80) de `0.0.0.0/0`
- Verificar aplicação rodando na EC2: `curl http://localhost:3000/api/health`
- Verificar CloudFront Origin aponta para EC2 Public DNS correto

**GitHub Actions falha no deploy**
- Verificar `AWS_ROLE_ARN` secret configurado
- Verificar OIDC provider configurado no IAM
- Verificar condições do IAM Role (repo correto)
- Verificar permissões do role (SSM, ECR)

**Aplicação não acessa SSM Parameter Store**
- Verificar IAM Role da EC2 tem permissão `ssm:GetParameter`
- Verificar nomes dos parâmetros no SSM (case-sensitive)
- Verificar região AWS (deve ser mesma do SSM)

---

## 📚 Documentação Completa

- **Setup Local Detalhado:** [`SETUP_LOCAL.md`](./SETUP_LOCAL.md)
- **Deploy AWS Completo:** [`DEPLOY_AWS_GUIDE.md`](./DEPLOY_AWS_GUIDE.md)
- **Migração de Dados:** [`MIGRATION_GUIDE.md`](./MIGRATION_GUIDE.md)

---

## ✅ Checklist Final

### Local
- [ ] PostgreSQL rodando
- [ ] Migrações executadas
- [ ] `.env.local` configurado
- [ ] Primeiro usuário criado
- [ ] `npm run dev` funcionando
- [ ] Login via magic link funcionando

### AWS
- [ ] EC2 criada e rodando
- [ ] IAM Role anexada à EC2
- [ ] Docker instalado na EC2
- [ ] EBS Volume montado
- [ ] SSM Parameters criados
- [ ] CloudFront configurado
- [ ] GitHub Actions OIDC configurado
- [ ] Primeiro deploy concluído
- [ ] Aplicação acessível via CloudFront

---

**🎉 Pronto!** Você está configurado para desenvolvimento local ou produção na AWS.
