# Deploy AWS - Configuração

## Secrets obrigatórios (GitHub → Settings → Secrets → Actions)

| Secret | Descrição |
|--------|-----------|
| `AWS_ROLE_ARN` | ARN da IAM Role do GitHub Actions (OIDC) |
| `EC2_INSTANCE_ID` | ID da instância EC2 (ex: `i-0123456789abcdef0`) |

## Secret opcional

| Secret | Descrição | Padrão |
|--------|-----------|--------|
| `APP_DIR` | Diretório do app na EC2 | `/opt/pequenos-grupos` |

## Permissões IAM obrigatórias

A IAM Role do GitHub Actions precisa permitir **SSM SendCommand** para executar comandos na EC2.

**Opção 1:** Anexar a política gerenciada `AmazonSSMFullAccess`

**Opção 2:** Criar política customizada a partir de `iam-policy-github-actions.json`:

1. IAM → Policies → Create policy
2. JSON → Cole o conteúdo de `iam-policy-github-actions.json`
3. Anexe a política à role do GitHub Actions

## Erro AccessDeniedException ssm:SendCommand

Se o deploy falhar com `User is not authorized to perform: ssm:SendCommand`:

1. Acesse IAM → Roles → sua role do GitHub Actions
2. Add permissions → Attach policies
3. Selecione `AmazonSSMFullAccess` ou a política customizada
4. Salve e execute o workflow novamente

## Status Pending (comando nunca executa)

Se o status ficar em **Pending** por vários minutos e stdout/stderr vazios, a EC2 não está recebendo comandos SSM.

**Causa comum: CPU 100%** – Em t2.micro (1 vCPU, 1GB), Next.js + PostgreSQL podem saturar a CPU; o SSM agent fica irresponsivo. O role IAM está correto, mas a instância não responde.

**Solução imediata:** Reboot da EC2 (AWS Console → EC2 → Instance state → Reboot). Aguardar 2–3 min e rodar o deploy novamente.

**Solução definitiva:** Upgrade para **t3.small** (2 vCPU, 2GB RAM) – EC2 → Actions → Instance settings → Change instance type.

**Outras verificações:**
1. **IAM Role na EC2** – A instância precisa da role com `AmazonSSMManagedInstanceCore`
2. **SSM Agent** – Na EC2: `sudo systemctl status amazon-ssm-agent` (deve estar active)
3. **Fleet Manager** – AWS Console → Systems Manager → Fleet Manager → a instância deve aparecer como **Online**
4. **Rede** – A EC2 precisa de acesso aos endpoints SSM (internet ou VPC endpoint)

## Deploy falha na EC2 (status: Failed)

Quando o comando SSM é executado mas falha na EC2, o workflow exibe o output (stdout/stderr). Causas comuns:

| Erro | Solução |
|------|---------|
| `Directory ... not found` | Crie o secret `APP_DIR` com o caminho correto. Ubuntu: `/home/ubuntu/pequenos-grupos`. Amazon Linux: `/opt/pequenos-grupos` |
| `docker-compose: command not found` | Execute o `setup-ec2.sh` na EC2 para instalar Docker e Docker Compose |
| `Error response from daemon: pull access denied` | Verifique se o repositório GHCR é público ou se o GITHUB_TOKEN tem permissão `packages: read` |
| `no such file or directory .env` | Crie o arquivo `.env` na EC2 com DATABASE_URL, DATABASE_PASSWORD, APP_SECRET |
| `mount point does not exist` | Monte o volume EBS em `/mnt/postgres-data` (ver QUICKSTART Passo 4) |
