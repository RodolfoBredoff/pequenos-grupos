# Guia de Migração: PostgreSQL Container → Amazon RDS

Este documento explica como migrar o banco de dados PostgreSQL de um container Docker na EC2 para o Amazon RDS, mantendo zero downtime quando possível.

## 📋 Índice

1. [Por que Migrar para RDS?](#por-que-migrar-para-rds)
2. [Pré-requisitos](#pré-requisitos)
3. [Planejamento](#planejamento)
4. [Passo a Passo da Migração](#passo-a-passo-da-migração)
5. [Rollback](#rollback)
6. [Custos](#custos)
7. [Checklist](#checklist)

---

## Por que Migrar para RDS?

### Vantagens do RDS

- ✅ **Backups Automáticos:** Backups diários automáticos com retenção configurável
- ✅ **Alta Disponibilidade:** Multi-AZ deployment com failover automático
- ✅ **Escalabilidade:** Fácil upgrade de instância e storage
- ✅ **Monitoramento:** CloudWatch integrado com métricas detalhadas
- ✅ **Segurança:** Encryption at rest, VPC isolation, SSL connections
- ✅ **Manutenção:** Patches e updates automáticos
- ✅ **Snapshots:** Snapshots manuais sob demanda

### Quando Migrar?

**Migre para RDS quando:**
- Aplicação está em produção estável
- Precisa de alta disponibilidade (99.95% SLA)
- Volume de dados cresceu significativamente
- Precisa de backups automáticos
- Quer reduzir overhead de gerenciamento

**Mantenha container quando:**
- Ainda está em MVP/desenvolvimento
- Custo é crítico (Free Tier)
- Precisa de controle total sobre configuração
- Volume de dados é pequeno (< 20GB)

---

## Pré-requisitos

Antes de começar, você precisa ter:

- ✅ RDS PostgreSQL criado (mesma versão do container)
- ✅ Acesso SSH à EC2
- ✅ Acesso ao AWS Console
- ✅ Backup completo do banco atual
- ✅ Janela de manutenção (recomendado: 1-2 horas)

**Versões Suportadas:**
- PostgreSQL 13, 14, 15, 16
- Certifique-se de usar a mesma versão do container

---

## Planejamento

### 1. Escolher Instance Type

**Free Tier (12 meses):**
- `db.t3.micro` ou `db.t4g.micro`
- 1 vCPU, 1GB RAM
- 20GB storage gp3

**Produção (recomendado):**
- `db.t3.small` ou `db.t3.medium`
- 2 vCPUs, 2-4GB RAM
- 100GB+ storage gp3

### 2. Escolher Storage

- **Tipo:** gp3 (SSD) - mais barato e performático
- **Tamanho:** Comece com 20GB, pode aumentar depois
- **Auto Scaling:** Habilite para crescimento automático
- **IOPS:** 3000 IOPS base (gp3), pode aumentar se necessário

### 3. Configurações Importantes

- **Multi-AZ:** Desabilite para Free Tier, habilite em produção
- **Public Access:** Desabilite (acesso apenas via VPC)
- **VPC:** Use a mesma VPC da EC2
- **Security Group:** Crie novo ou use existente
- **Backup Retention:** 7 dias (mínimo), 30 dias (recomendado)
- **Encryption:** Habilite (obrigatório em produção)

---

## Passo a Passo da Migração

### Etapa 1: Criar RDS PostgreSQL

1. **Acessar RDS Console:**
   - AWS Console → Buscar "RDS"
   - Clique em **"Create database"**

2. **Configurações Básicas:**
   - Engine: **PostgreSQL**
   - Version: **Mesma do container** (ex: 15.4)
   - Template: **Free tier** (ou Production)

3. **Settings:**
   - DB instance identifier: `pequenos-grupos-db`
   - Master username: `postgres` (ou outro)
   - Master password: **Gere senha segura** (salve em local seguro!)

4. **Instance Configuration:**
   - Instance class: `db.t3.micro` (Free Tier) ou `db.t3.small` (Produção)

5. **Storage:**
   - Storage type: **gp3**
   - Allocated storage: **20 GB** (mínimo)
   - Enable storage autoscaling: **Sim** (recomendado)
   - Maximum storage threshold: **100 GB**

6. **Connectivity:**
   - VPC: **Mesma da EC2**
   - Subnet group: **default** (ou crie um)
   - Public access: **No** (recomendado)
   - VPC security group: **Create new** → `pequenos-grupos-rds-sg`
   - Availability Zone: **No preference**

7. **Database Authentication:**
   - Password authentication: **Sim**

8. **Additional Configuration:**
   - Initial database name: `pequenos_grupos`
   - Backup retention: **7 days** (Free Tier) ou **30 days** (Produção)
   - Enable encryption: **Sim** (recomendado)
   - Performance Insights: **Desabilitado** (Free Tier) ou **Habilitado** (Produção)

9. **Criar:**
   - Clique em **"Create database"**
   - Aguarde 5-10 minutos até status mudar para **"Available"**

10. **Anotar Endpoint:**
    - Copie o **Endpoint** (ex: `pequenos-grupos-db.xxxxx.us-east-1.rds.amazonaws.com`)
    - Porta padrão: `5432`

### Etapa 2: Configurar Security Group do RDS

1. **EC2 Console** → **Security Groups**
2. Selecione `pequenos-grupos-rds-sg`
3. **Inbound Rules:**
   - Type: **PostgreSQL**
   - Port: **5432**
   - Source: **Custom** → Selecione o Security Group da EC2 (`pequenos-grupos-sg`)
   - Descrição: `Allow PostgreSQL from EC2`

4. Clique em **"Save rules"**

### Etapa 3: Criar Snapshot do Volume EBS (Backup de Segurança)

```bash
# Na EC2, criar snapshot do volume EBS
# Via Console:
# 1. EC2 → Volumes
# 2. Selecione o volume /mnt/postgres-data
# 3. Actions → Create snapshot
# 4. Nome: pequenos-grupos-pre-migration-YYYY-MM-DD
```

### Etapa 4: Exportar Dados do Container

Conecte via SSH na EC2:

```bash
# Fazer backup completo do banco
docker-compose exec postgres pg_dump -U postgres -F c -b -v -f /tmp/backup.dump pequenos_grupos

# Copiar backup para fora do container
docker cp pequenos-grupos-postgres:/tmp/backup.dump ./backup-$(date +%Y%m%d).dump

# Verificar tamanho
ls -lh backup-*.dump

# Alternativa: Backup em SQL (mais compatível)
docker-compose exec postgres pg_dump -U postgres -F p -b -v pequenos_grupos > backup-$(date +%Y%m%d).sql
```

### Etapa 5: Instalar PostgreSQL Client na EC2 (se necessário)

```bash
# Amazon Linux
sudo yum install -y postgresql15

# Ubuntu
sudo apt-get update
sudo apt-get install -y postgresql-client-15

# Verificar
psql --version
```

### Etapa 6: Importar Dados no RDS

```bash
# Obter endpoint do RDS (do console AWS)
RDS_ENDPOINT="pequenos-grupos-db.xxxxx.us-east-1.rds.amazonaws.com"
RDS_USER="postgres"
RDS_PASSWORD="sua-senha-rds"

# Testar conexão
PGPASSWORD=$RDS_PASSWORD psql -h $RDS_ENDPOINT -U $RDS_USER -d pequenos_grupos -c "SELECT version();"

# Importar backup (formato custom)
PGPASSWORD=$RDS_PASSWORD pg_restore -h $RDS_ENDPOINT -U $RDS_USER -d pequenos_grupos -v backup-YYYYMMDD.dump

# Ou importar SQL
PGPASSWORD=$RDS_PASSWORD psql -h $RDS_ENDPOINT -U $RDS_USER -d pequenos_grupos < backup-YYYYMMDD.sql

# Verificar dados importados
PGPASSWORD=$RDS_PASSWORD psql -h $RDS_ENDPOINT -U $RDS_USER -d pequenos_grupos -c "\dt"
PGPASSWORD=$RDS_PASSWORD psql -h $RDS_ENDPOINT -U $RDS_USER -d pequenos_grupos -c "SELECT COUNT(*) FROM members;"
```

### Etapa 7: Atualizar SSM Parameter Store

```bash
# Atualizar DATABASE_URL no SSM
aws ssm put-parameter \
  --name "/pequenos-grupos/database/url" \
  --value "postgresql://postgres:SENHA@pequenos-grupos-db.xxxxx.us-east-1.rds.amazonaws.com:5432/pequenos_grupos" \
  --type "SecureString" \
  --overwrite \
  --region us-east-1

# Atualizar senha (se mudou)
aws ssm put-parameter \
  --name "/pequenos-grupos/database/password" \
  --value "nova-senha-rds" \
  --type "SecureString" \
  --overwrite \
  --region us-east-1
```

Ou via Console:
1. **Systems Manager** → **Parameter Store**
2. Edite `/pequenos-grupos/database/url`
3. Atualize com o novo endpoint do RDS

### Etapa 8: Atualizar docker-compose.yml

```yaml
# Remover serviço postgres do docker-compose.yml
# A aplicação agora conecta diretamente no RDS

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: pequenos-grupos-app
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      # Variáveis serão carregadas do SSM automaticamente
    networks:
      - app-network
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

networks:
  app-network:
    driver: bridge

# Remover:
# - serviço postgres
# - volumes postgres_data
```

### Etapa 9: Deploy da Nova Versão

```bash
# Na EC2
cd /opt/pequenos-grupos

# Pull código atualizado
git pull origin main

# Rebuild e restart
docker-compose pull
docker-compose up -d --build

# Verificar logs
docker-compose logs -f app

# Testar conexão
curl http://localhost:3000/api/health
```

### Etapa 10: Verificar Funcionamento

```bash
# Testar queries no RDS
PGPASSWORD=$RDS_PASSWORD psql -h $RDS_ENDPOINT -U $RDS_USER -d pequenos_grupos -c "SELECT COUNT(*) FROM members;"

# Verificar logs da aplicação
docker-compose logs app | grep -i "database\|postgres\|error"

# Testar endpoints da API
curl https://SEU-CLOUDFRONT-ID.cloudfront.net/api/health
```

### Etapa 11: Remover Container PostgreSQL (Opcional)

**⚠️ CUIDADO:** Só faça isso após confirmar que tudo está funcionando!

```bash
# Parar e remover container postgres
docker-compose stop postgres
docker-compose rm postgres

# Remover volume (opcional, mantenha backup)
# docker volume rm pequenos-grupos_postgres_data
```

---

## Rollback

Se algo der errado, você pode voltar ao container:

### Rollback Rápido

1. **Reverter SSM Parameters:**
```bash
aws ssm put-parameter \
  --name "/pequenos-grupos/database/url" \
  --value "postgresql://postgres:SENHA@postgres:5432/pequenos_grupos" \
  --type "SecureString" \
  --overwrite
```

2. **Restaurar docker-compose.yml original** (com serviço postgres)

3. **Restaurar dados do snapshot EBS** (se necessário)

4. **Restart containers:**
```bash
docker-compose up -d
```

### Rollback Completo

1. Parar aplicação
2. Restaurar snapshot EBS
3. Restaurar docker-compose.yml
4. Restaurar SSM Parameters
5. Restart containers
6. Verificar funcionamento

---

## Custos

### Comparativo Mensal (Estimado)

**Container na EC2 (Free Tier):**
- EC2 t2.micro: **$0** (Free Tier) ou **~$8-10** (após Free Tier)
- EBS 20GB: **$0** (Free Tier) ou **~$2** (após Free Tier)
- **Total:** $0-12/mês

**RDS (Free Tier - 12 meses):**
- db.t3.micro: **$0** (Free Tier)
- Storage 20GB: **$0** (Free Tier)
- **Total:** $0/mês

**RDS (Após Free Tier):**
- db.t3.small: **~$15-20/mês**
- Storage 20GB: **~$2-3/mês**
- Backup storage: **~$0.10/GB**
- **Total:** ~$17-25/mês

**RDS Multi-AZ (Produção):**
- db.t3.small Multi-AZ: **~$30-40/mês**
- Storage 100GB: **~$11/mês**
- **Total:** ~$41-51/mês

### Quando Vale a Pena?

- **Free Tier:** Sempre vale a pena (zero custo)
- **Produção pequena:** RDS Single-AZ é ~$20/mês vs container ~$10/mês
- **Produção crítica:** RDS Multi-AZ vale a pena pela alta disponibilidade

---

## Checklist

### Antes da Migração

- [ ] Backup completo do container criado
- [ ] Snapshot EBS criado
- [ ] RDS PostgreSQL criado e disponível
- [ ] Security Group do RDS configurado
- [ ] PostgreSQL client instalado na EC2
- [ ] Teste de conexão RDS bem-sucedido

### Durante a Migração

- [ ] Dados exportados do container
- [ ] Dados importados no RDS
- [ ] Verificação de integridade dos dados
- [ ] SSM Parameters atualizados
- [ ] docker-compose.yml atualizado
- [ ] Deploy da nova versão
- [ ] Testes de funcionalidade

### Após a Migração

- [ ] Aplicação funcionando corretamente
- [ ] Queries respondendo normalmente
- [ ] Logs sem erros de conexão
- [ ] Performance aceitável
- [ ] Backup do RDS configurado
- [ ] Monitoramento CloudWatch ativo
- [ ] Documentação atualizada

### Limpeza (Opcional)

- [ ] Container PostgreSQL removido
- [ ] Volume EBS desanexado (após período de teste)
- [ ] Snapshot EBS mantido como backup

---

## Troubleshooting

### Erro: "Connection timeout"

- Verifique Security Group do RDS
- Verifique se EC2 está na mesma VPC
- Verifique se Public Access está desabilitado (correto)

### Erro: "Authentication failed"

- Verifique usuário e senha no SSM
- Verifique se senha do RDS está correta

### Erro: "Database does not exist"

- Crie o banco manualmente no RDS
- Ou importe novamente o backup

### Performance Lenta

- Verifique instance type (considere upgrade)
- Verifique IOPS do storage
- Verifique conexões simultâneas
- Considere Connection Pooling (PgBouncer)

---

## Próximos Passos

Após migração bem-sucedida:

1. **Configurar Backups Automáticos:** Já configurado no RDS
2. **Configurar Multi-AZ:** Para alta disponibilidade (custo adicional)
3. **Configurar Read Replicas:** Para leitura distribuída (opcional)
4. **Monitoramento:** CloudWatch alarms para CPU, storage, connections
5. **Performance Insights:** Habilitar para análise de queries

---

**Dúvidas?** Consulte a [documentação oficial do RDS](https://docs.aws.amazon.com/rds/) ou abra uma issue no repositório.
