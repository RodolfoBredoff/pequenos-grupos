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
