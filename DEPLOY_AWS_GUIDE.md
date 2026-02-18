# Guia Completo de Deploy AWS - Pequenos Grupos Manager

Este guia passo a passo te ajudará a configurar toda a infraestrutura AWS do zero, mesmo sem experiência prévia com AWS.

## 📋 Índice

1. [Pré-requisitos](#pré-requisitos)
2. [Criar EC2 Instance](#1-criar-ec2-instance)
3. [Configurar IAM Role para EC2](#2-configurar-iam-role-para-ec2)
4. [Instalar Docker na EC2](#3-instalar-docker-na-ec2)
5. [Configurar Volume EBS para PostgreSQL](#4-configurar-volume-ebs-para-postgresql)
6. [Configurar Security Group](#5-configurar-security-group)
7. [Configurar SSM Parameter Store](#6-configurar-ssm-parameter-store)
8. [Configurar CloudFront](#7-configurar-cloudfront)
9. [Configurar GitHub Actions OIDC](#8-configurar-github-actions-oidc)
10. [Deploy Inicial](#9-deploy-inicial)
11. [Troubleshooting](#10-troubleshooting)

---

## Pré-requisitos

Antes de começar, você precisa ter:

- ✅ Conta AWS ativa (Free Tier disponível)
- ✅ Repositório GitHub com o código do projeto
- ✅ Domínio próprio (opcional, mas recomendado)
- ✅ Conhecimento básico de terminal/SSH

**Custo Estimado:** $0-5/mês (dentro do Free Tier)

---

## 1. Criar EC2 Instance

### 1.1 Acessar o Console EC2

1. Faça login no [AWS Console](https://console.aws.amazon.com)
2. Na barra de busca, digite "EC2" e clique em **EC2**
3. Certifique-se de estar na região **us-east-1** (N. Virginia) - importante para CloudFront

### 1.2 Lançar Instância

1. Clique em **"Launch Instance"** (Lançar Instância)

2. **Nome da Instância:**
   - Nome: `pequenos-grupos-app`

3. **AMI (Amazon Machine Image):**
   - Escolha: **Amazon Linux 2023 AMI** ou **Ubuntu Server 22.04 LTS**
   - Arquitetura: `x86_64`

4. **Instance Type:**
   - Escolha: **t2.micro** ou **t3.micro** (Free Tier elegível)
   - vCPUs: 1-2, RAM: 1GB

5. **Key Pair:**
   - Se não tiver, clique em **"Create new key pair"**
   - Nome: `pequenos-grupos-key`
   - Tipo: `RSA`
   - Formato: `.pem` (para Linux/Mac) ou `.ppk` (para Windows/PuTTY)
   - **⚠️ IMPORTANTE:** Baixe e guarde a chave em local seguro!

6. **Network Settings:**
   - VPC: Deixe o padrão
   - Subnet: Deixe o padrão
   - Auto-assign Public IP: **Enable**
   - Security Group: **Create new security group**
     - Nome: `pequenos-grupos-sg`
     - Descrição: `Security group for Pequenos Grupos Manager`
     - Inbound Rules:
       - Tipo: SSH, Porta: 22, Origem: **My IP** (seu IP atual)
     - Outbound Rules: Deixe **All traffic**

7. **Configure Storage:**
   - Volume 1 (Root): 8 GB, gp3 (Free Tier)
   - Clique em **"Add new volume"** para adicionar volume EBS depois (ou faça isso separadamente)

8. **Advanced Details (Opcional):**
   - User Data: Deixe vazio por enquanto

9. **Review:**
   - Revise todas as configurações
   - Clique em **"Launch Instance"**

10. **Aguardar:**
    - Aguarde alguns minutos até o status mudar para **"Running"**
    - Anote o **Public IPv4 DNS** (ex: `ec2-54-123-45-67.compute-1.amazonaws.com`)

---

## 2. Configurar IAM Role para EC2

A EC2 precisa de permissões para acessar SSM Parameter Store e fazer pull de imagens Docker.

### 2.1 Criar IAM Role

1. No AWS Console, busque por **"IAM"**
2. No menu lateral, clique em **"Roles"**
3. Clique em **"Create role"**

4. **Trusted entity type:**
   - Selecione **"AWS service"**

5. **Use case:**
   - Selecione **"EC2"**
   - Clique em **"Next"**

6. **Permissions:**
   - Adicione as seguintes políticas:
     - `AmazonSSMReadOnlyAccess` (para SSM Parameter Store)
     - `AmazonEC2ContainerRegistryReadOnly` (para ECR/GHCR - opcional)
     - `CloudWatchAgentServerPolicy` (para logs - opcional)

7. **Role name:**
   - Nome: `pequenos-grupos-ec2-role`
   - Descrição: `Role for Pequenos Grupos EC2 instance`

8. Clique em **"Create role"**

### 2.2 Anexar Role à EC2

1. Volte para o **EC2 Console**
2. Selecione sua instância
3. Clique em **"Actions"** → **"Security"** → **"Modify IAM role"**
4. Selecione a role `pequenos-grupos-ec2-role`
5. Clique em **"Update IAM role"**

---

## 3. Instalar Docker na EC2

### 3.1 Conectar via SSH

**Linux/Mac:**
```bash
chmod 400 pequenos-grupos-key.pem
ssh -i pequenos-grupos-key.pem ec2-user@SEU-PUBLIC-DNS
# Para Ubuntu, use: ssh -i pequenos-grupos-key.pem ubuntu@SEU-PUBLIC-DNS
```

**Windows (PowerShell):**
```powershell
ssh -i pequenos-grupos-key.pem ec2-user@SEU-PUBLIC-DNS
```

### 3.2 Executar Script de Setup

**Opção 1: Usar o script fornecido (recomendado)**

```bash
# Baixar o script
curl -O https://raw.githubusercontent.com/SEU-USER/pequenos-grupos/main/scripts/setup-ec2.sh
# Ou copiar o conteúdo do arquivo scripts/setup-ec2.sh manualmente

# Tornar executável
chmod +x setup-ec2.sh

# Executar
./setup-ec2.sh
```

**Opção 2: Instalação manual**

**Para Amazon Linux 2023:**
```bash
sudo yum update -y
sudo yum install -y docker
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ec2-user

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
docker-compose --version

# Fazer logout e login novamente para aplicar mudanças de grupo
exit
```

**Para Ubuntu 22.04:**
```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg lsb-release
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ubuntu

# Fazer logout e login novamente
exit
```

### 3.3 Verificar Instalação

Reconecte via SSH e verifique:

```bash
docker --version
docker-compose --version
docker ps
```

---

## 4. Configurar Volume EBS para PostgreSQL

O PostgreSQL precisa de um volume persistente para não perder dados se o container reiniciar.

### 4.1 Criar Volume EBS

1. No **EC2 Console**, clique em **"Volumes"** no menu lateral
2. Clique em **"Create volume"**
3. Configurações:
   - Volume type: **gp3**
   - Size: **20 GB** (recomendado, mas pode usar menos)
   - Availability Zone: **Mesma da sua EC2** (verifique na instância)
   - Encryption: Opcional (recomendado)
4. Clique em **"Create volume"**

### 4.2 Anexar Volume à EC2

1. Selecione o volume criado
2. Clique em **"Actions"** → **"Attach volume"**
3. Instance: Selecione sua instância `pequenos-grupos-app`
4. Device: Deixe o padrão (`/dev/xvdf` ou `/dev/nvme1n1`)
5. Clique em **"Attach"**

### 4.3 Formatar e Montar Volume

Conecte via SSH na EC2:

```bash
# Listar dispositivos disponíveis
lsblk

# Identificar o novo volume (geralmente xvdf ou nvme1n1)
# Formatar (CUIDADO: isso apaga dados!)
sudo mkfs -t ext4 /dev/xvdf
# Ou se for nvme: sudo mkfs -t ext4 /dev/nvme1n1

# Criar diretório de montagem
sudo mkdir -p /mnt/postgres-data

# Montar volume
sudo mount /dev/xvdf /mnt/postgres-data
# Ou: sudo mount /dev/nvme1n1 /mnt/postgres-data

# Verificar
df -h /mnt/postgres-data

# Configurar permissões
sudo chown -R 999:999 /mnt/postgres-data  # 999 é o UID padrão do PostgreSQL no container
sudo chmod 755 /mnt/postgres-data
```

### 4.4 Configurar Montagem Automática

```bash
# Obter UUID do volume
sudo blkid /dev/xvdf
# Ou: sudo blkid /dev/nvme1n1

# Editar /etc/fstab
sudo nano /etc/fstab

# Adicionar linha (substitua UUID pelo valor real):
UUID=seu-uuid-aqui /mnt/postgres-data ext4 defaults,nofail 0 2

# Testar montagem
sudo mount -a
```

---

## 5. Configurar Security Group

O Security Group controla o tráfego de rede da EC2.

### 5.1 Atualizar Regras de Entrada

1. No **EC2 Console**, clique em **"Security Groups"**
2. Selecione `pequenos-grupos-sg`
3. Clique na aba **"Inbound rules"**
4. Clique em **"Edit inbound rules"**

5. **Adicionar regras:**

   **Regra 1: SSH (já existe)**
   - Type: SSH
   - Port: 22
   - Source: **My IP** (seu IP atual)

   **Regra 2: HTTP do CloudFront**
   - Type: Custom TCP
   - Port: 80
   - Source: **Custom** → Cole os IP ranges do CloudFront:
     ```
     Baixe de: https://d7uri8nf7uskq.cloudfront.net/tools/list-cloudfront-ips
     Ou use: 0.0.0.0/0 temporariamente (não recomendado para produção)
     ```

   **Regra 3: HTTPS do CloudFront**
   - Type: Custom TCP
   - Port: 443
   - Source: Mesmo do HTTP

   **⚠️ IMPORTANTE:** Para MVP, você pode temporariamente permitir `0.0.0.0/0` nas portas 80/443, mas depois configure apenas os IPs do CloudFront.

6. Clique em **"Save rules"**

---

## 6. Configurar SSM Parameter Store

O SSM Parameter Store armazena secrets de forma segura.

### 6.1 Criar Parâmetros

1. No AWS Console, busque por **"Systems Manager"**
2. No menu lateral, clique em **"Parameter Store"**
3. Clique em **"Create parameter"**

**Criar os seguintes parâmetros:**

**1. Database URL:**
- Name: `/pequenos-grupos/database/url`
- Type: **SecureString**
- Value: `postgresql://postgres:SENHA_AQUI@postgres:5432/pequenos_grupos`
- Description: `PostgreSQL connection string`

**2. Database User:**
- Name: `/pequenos-grupos/database/user`
- Type: **String**
- Value: `postgres`
- Description: `PostgreSQL username`

**3. Database Password:**
- Name: `/pequenos-grupos/database/password`
- Type: **SecureString**
- Value: `sua-senha-segura-aqui` (gere com: `openssl rand -base64 32`)
- Description: `PostgreSQL password`

**4. App Secret:**
- Name: `/pequenos-grupos/app/secret`
- Type: **SecureString**
- Value: `sua-chave-jwt-aqui` (gere com: `openssl rand -base64 32`)
- Description: `JWT secret for application`

**5. Node Environment:**
- Name: `/pequenos-grupos/app/node-env`
- Type: **String**
- Value: `production`
- Description: `Node.js environment`

### 6.2 Verificar Permissões

Certifique-se de que a IAM Role da EC2 tem permissão `ssm:GetParameter` e `ssm:GetParametersByPath`.

---

## 7. Configurar CloudFront

O CloudFront gerencia HTTPS/SSL e faz cache de arquivos estáticos.

### 7.1 Solicitar Certificado SSL (ACM)

1. No AWS Console, busque por **"Certificate Manager"**
2. **⚠️ IMPORTANTE:** Certifique-se de estar na região **us-east-1** (N. Virginia)
3. Clique em **"Request a certificate"**
4. Tipo: **Request a public certificate**
5. Domain name:
   - Se tiver domínio: `seu-dominio.com` e `*.seu-dominio.com`
   - Se não tiver: Use o domínio do CloudFront (será gerado automaticamente)
6. Validation method: **DNS validation** (recomendado)
7. Clique em **"Request"**
8. Siga as instruções para validar o domínio (adicionar registro CNAME no DNS)

### 7.2 Criar Distribuição CloudFront

1. No AWS Console, busque por **"CloudFront"**
2. Clique em **"Create distribution"**

3. **Origin settings:**
   - Origin domain: Cole o **Public IPv4 DNS** da sua EC2 (ex: `ec2-54-123-45-67.compute-1.amazonaws.com`)
   - Origin path: Deixe vazio
   - Name: Será preenchido automaticamente
   - Origin protocol policy: **HTTP only** (SSL será no CloudFront)
   - HTTP port: `80`
   - HTTPS port: `443`

4. **Default cache behavior:**
   - Viewer protocol policy: **Redirect HTTP to HTTPS**
   - Allowed HTTP methods: **GET, HEAD, OPTIONS, PUT, POST, PATCH, DELETE**
   - Cache policy: **CachingOptimized** (para arquivos estáticos)
   - Origin request policy: **CORS-S3Origin** ou **AllViewerExceptHostHeader**

5. **Settings:**
   - Price class: **Use only North America and Europe** (mais barato)
   - Alternate domain names (CNAMEs): Se tiver domínio, adicione aqui
   - SSL certificate: Selecione o certificado criado no ACM
   - Default root object: `index.html`
   - Custom error responses: Opcional

6. Clique em **"Create distribution"**

7. **Aguardar:** Aguarde 10-15 minutos até o status mudar para **"Deployed"**

8. **Anotar:** Copie o **Distribution domain name** (ex: `d1234abcd5678.cloudfront.net`)

### 7.3 Atualizar Security Group da EC2

Agora que você tem o CloudFront, atualize o Security Group para permitir apenas tráfego do CloudFront:

1. Baixe os IP ranges do CloudFront: https://d7uri8nf7uskq.cloudfront.net/tools/list-cloudfront-ips
2. Atualize as regras do Security Group conforme seção 5

---

## 8. Configurar GitHub Actions OIDC

Configure autenticação sem Access Keys usando OIDC.

### 8.1 Criar IAM Identity Provider (GitHub)

1. No **IAM Console**, clique em **"Identity providers"**
2. Clique em **"Add provider"**
3. Provider type: **OpenID Connect**
4. Provider URL: `https://token.actions.githubusercontent.com`
5. Audience: `sts.amazonaws.com`
6. Clique em **"Add"**

### 8.2 Criar IAM Role para GitHub Actions

1. No **IAM Console**, clique em **"Roles"**
2. Clique em **"Create role"**
3. Trusted entity type: **Web identity**
4. Identity provider: Selecione o GitHub OIDC criado
5. Audience: `sts.amazonaws.com`
6. Clique em **"Next"**

7. **Permissions:**
   - Adicione políticas:
     - `AmazonEC2ContainerRegistryPowerUser` (para push de imagens)
     - `AmazonSSMFullAccess` (para Session Manager)
     - `AmazonEC2ReadOnlyAccess` (para verificar instância)

8. **Role name:** `pequenos-grupos-github-actions-role`
9. Clique em **"Create role"**

10. **Editar Trust Policy:**
    - Clique na role criada
    - Aba **"Trust relationships"**
    - Clique em **"Edit trust policy"**
    - Substitua por:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::SUA-CONTA-ID:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:SEU-USER/pequenos-grupos:*"
        }
      }
    }
  ]
}
```

Substitua:
- `SUA-CONTA-ID`: Seu Account ID da AWS (encontre em IAM → Account settings)
- `SEU-USER`: Seu usuário/organização do GitHub
- `pequenos-grupos`: Nome do repositório

### 8.3 Configurar Secrets no GitHub

1. No seu repositório GitHub, vá em **Settings** → **Secrets and variables** → **Actions**
2. Clique em **"New repository secret"**

**Criar os seguintes secrets:**

- `AWS_ROLE_ARN`: `arn:aws:iam::SUA-CONTA-ID:role/pequenos-grupos-github-actions-role`
- `EC2_INSTANCE_ID`: ID da sua instância EC2 (ex: `i-0123456789abcdef0`)

---

## 9. Deploy Inicial

### 9.1 Preparar EC2

Conecte via SSH na EC2:

```bash
# Criar diretório da aplicação
sudo mkdir -p /opt/pequenos-grupos
# Para Ubuntu: sudo mkdir -p /home/ubuntu/pequenos-grupos
sudo chown ec2-user:ec2-user /opt/pequenos-grupos
# Para Ubuntu: sudo chown ubuntu:ubuntu /home/ubuntu/pequenos-grupos

cd /opt/pequenos-grupos
# Ou: cd /home/ubuntu/pequenos-grupos

# Clonar repositório (ou fazer upload dos arquivos)
git clone https://github.com/SEU-USER/pequenos-grupos.git .
# Ou fazer upload manual do docker-compose.yml
```

### 9.2 Criar .env Local (Temporário)

```bash
# Criar arquivo .env
nano .env
```

Conteúdo (valores temporários, serão substituídos por SSM depois):

```env
DATABASE_URL=postgresql://postgres:senha@postgres:5432/pequenos_grupos
DATABASE_USER=postgres
DATABASE_PASSWORD=senha_temporaria
APP_SECRET=secret_temporario
NODE_ENV=production
```

### 9.3 Primeiro Deploy Manual

```bash
# Fazer login no GitHub Container Registry (se necessário)
echo $GITHUB_TOKEN | docker login ghcr.io -u SEU-USER --password-stdin

# Pull e start dos containers
docker-compose pull
docker-compose up -d

# Verificar status
docker-compose ps
docker-compose logs -f app
```

### 9.4 Verificar Aplicação

```bash
# Testar localmente na EC2
curl http://localhost:3000/api/health

# Testar via CloudFront (aguarde alguns minutos para propagação)
curl https://SEU-DISTRIBUTION-ID.cloudfront.net/api/health
```

---

## 10. Troubleshooting

### Problemas Comuns

**1. Container não inicia:**
```bash
docker-compose logs -f app
docker-compose logs -f postgres
```

**2. Erro de conexão com banco:**
- Verifique se o PostgreSQL está rodando: `docker-compose ps`
- Verifique logs: `docker-compose logs postgres`
- Teste conexão: `docker-compose exec postgres psql -U postgres -d pequenos_grupos`

**3. Erro ao buscar SSM Parameters:**
- Verifique IAM Role da EC2
- Teste manualmente: `aws ssm get-parameter --name /pequenos-grupos/database/url --region us-east-1`

**4. CloudFront retorna 502/503:**
- Verifique Security Group (portas 80/443 abertas)
- Verifique se aplicação está rodando: `curl http://localhost:3000/api/health`
- Verifique logs do CloudFront em CloudWatch

**5. GitHub Actions falha no deploy:**
- Verifique OIDC trust policy
- Verifique secrets no GitHub
- Verifique permissões da IAM Role

**6. Volume EBS não monta:**
- Verifique se está anexado: `lsblk`
- Verifique `/etc/fstab` para erros de sintaxe
- Teste montagem manual: `sudo mount -a`

### Comandos Úteis

```bash
# Reiniciar containers
docker-compose restart

# Rebuild e restart
docker-compose up -d --build

# Ver uso de recursos
docker stats

# Backup do PostgreSQL
docker-compose exec postgres pg_dump -U postgres pequenos_grupos > backup.sql

# Restaurar backup
docker-compose exec -T postgres psql -U postgres pequenos_grupos < backup.sql

# Limpar recursos não utilizados
docker system prune -a
```

---

## ✅ Checklist Final

- [ ] EC2 criada e rodando
- [ ] IAM Role anexada à EC2
- [ ] Docker instalado e funcionando
- [ ] Volume EBS criado, formatado e montado
- [ ] Security Group configurado
- [ ] SSM Parameters criados
- [ ] CloudFront distribuído e funcionando
- [ ] GitHub Actions OIDC configurado
- [ ] Deploy inicial bem-sucedido
- [ ] Health check respondendo
- [ ] Aplicação acessível via CloudFront

---

## 📚 Próximos Passos

Após completar este guia:

1. **Fase 2:** Migrar backend do Supabase para PostgreSQL direto
2. **Fase 3:** Ajustar frontend para remover dependências Supabase
3. **Monitoramento:** Configurar CloudWatch alarms
4. **Backups:** Automatizar backups do PostgreSQL

---

**Dúvidas?** Consulte a documentação oficial da AWS ou abra uma issue no repositório.
