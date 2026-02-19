#!/bin/bash
# =============================================================================
# update-origin.sh
# Atualiza o origin do CloudFront e os parâmetros do SSM com o novo IP público
# da EC2 a cada boot. Executado automaticamente pelo systemd (update-origin.service).
#
# Requer (instalados pelo install-update-origin-service.sh):
#   - aws-cli v2
#   - jq
#   - curl
#
# Variáveis de ambiente (definidas no arquivo de serviço systemd):
#   CLOUDFRONT_DISTRIBUTION_ID  — ID da distribuição CloudFront
#   CLOUDFRONT_ORIGIN_ID        — ID do origin a atualizar
#   SSM_PATH                    — Prefixo dos parâmetros no SSM (ex: /pequenos-grupos)
#   AWS_REGION                  — Região AWS (ex: us-east-1)
# =============================================================================

set -euo pipefail

LOG_FILE="/var/log/update-origin.log"
exec >> "$LOG_FILE" 2>&1

echo ""
echo "=========================================="
echo " $(date '+%Y-%m-%d %H:%M:%S') — update-origin.sh iniciado"
echo "=========================================="

# Validar variáveis obrigatórias
: "${CLOUDFRONT_DISTRIBUTION_ID:?Variável CLOUDFRONT_DISTRIBUTION_ID não definida}"
: "${CLOUDFRONT_ORIGIN_ID:?Variável CLOUDFRONT_ORIGIN_ID não definida}"
SSM_PATH="${SSM_PATH:-/pequenos-grupos}"
AWS_REGION="${AWS_REGION:-us-east-1}"

echo "Distribuição CloudFront : $CLOUDFRONT_DISTRIBUTION_ID"
echo "Origin ID               : $CLOUDFRONT_ORIGIN_ID"
echo "SSM Path                : $SSM_PATH"
echo "Região                  : $AWS_REGION"

# ─────────────────────────────────────────────────────────────────────────────
# 1. Obter DNS e IP público via IMDSv2
# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo "[1/4] Obtendo metadados IMDSv2..."

IMDS_BASE="http://169.254.169.254/latest"

TOKEN=$(curl -sf -X PUT "${IMDS_BASE}/api/token" \
  -H "X-aws-ec2-metadata-token-ttl-seconds: 60")

PUBLIC_DNS=$(curl -sf -H "X-aws-ec2-metadata-token: $TOKEN" \
  "${IMDS_BASE}/meta-data/public-hostname")

PUBLIC_IP=$(curl -sf -H "X-aws-ec2-metadata-token: $TOKEN" \
  "${IMDS_BASE}/meta-data/public-ipv4")

if [ -z "$PUBLIC_DNS" ] || [ -z "$PUBLIC_IP" ]; then
  echo "ERRO: Não foi possível obter DNS/IP público via IMDSv2. A instância tem IP público?"
  exit 1
fi

echo "DNS público : $PUBLIC_DNS"
echo "IP público  : $PUBLIC_IP"

# ─────────────────────────────────────────────────────────────────────────────
# 2. Atualizar origin do CloudFront
# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo "[2/4] Atualizando origin do CloudFront..."

# CloudFront é um serviço global — não usa --region
DIST_RESPONSE=$(aws cloudfront get-distribution-config \
  --id "$CLOUDFRONT_DISTRIBUTION_ID" \
  --output json)

ETAG=$(echo "$DIST_RESPONSE" | jq -r '.ETag')
DIST_CONFIG=$(echo "$DIST_RESPONSE" | jq '.DistributionConfig')

echo "ETag atual: $ETAG"

# Verificar se o origin existe
ORIGIN_EXISTS=$(echo "$DIST_CONFIG" | \
  jq --arg id "$CLOUDFRONT_ORIGIN_ID" \
  '[.Origins.Items[] | select(.Id == $id)] | length')

if [ "$ORIGIN_EXISTS" -eq 0 ]; then
  echo "ERRO: Origin com Id='$CLOUDFRONT_ORIGIN_ID' não encontrado na distribuição."
  echo "Origins disponíveis:"
  echo "$DIST_CONFIG" | jq -r '.Origins.Items[].Id'
  exit 1
fi

# Substituir DomainName do origin específico
UPDATED_CONFIG=$(echo "$DIST_CONFIG" | jq \
  --arg origin_id "$CLOUDFRONT_ORIGIN_ID" \
  --arg new_dns   "$PUBLIC_DNS" \
  '.Origins.Items = (.Origins.Items | map(
    if .Id == $origin_id then .DomainName = $new_dns else . end
  ))')

aws cloudfront update-distribution \
  --id "$CLOUDFRONT_DISTRIBUTION_ID" \
  --if-match "$ETAG" \
  --distribution-config "$UPDATED_CONFIG" \
  --output json > /dev/null

echo "CloudFront origin atualizado para: $PUBLIC_DNS"

# ─────────────────────────────────────────────────────────────────────────────
# 3. Atualizar parâmetros no SSM Parameter Store
# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo "[3/4] Atualizando SSM Parameter Store..."

aws ssm put-parameter \
  --name "${SSM_PATH}/app/ec2-dns" \
  --value "$PUBLIC_DNS" \
  --type "String" \
  --overwrite \
  --region "$AWS_REGION" > /dev/null

aws ssm put-parameter \
  --name "${SSM_PATH}/app/ec2-ip" \
  --value "$PUBLIC_IP" \
  --type "String" \
  --overwrite \
  --region "$AWS_REGION" > /dev/null

echo "SSM atualizado: ${SSM_PATH}/app/ec2-dns = $PUBLIC_DNS"
echo "SSM atualizado: ${SSM_PATH}/app/ec2-ip  = $PUBLIC_IP"

# ─────────────────────────────────────────────────────────────────────────────
# 4. Criar invalidação CloudFront para limpar cache de erros
# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo "[4/4] Criando invalidação CloudFront..."

CALLER_REF="boot-$(date +%s)"
INVALIDATION_ID=$(aws cloudfront create-invalidation \
  --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" \
  --paths "/*" \
  --output json | jq -r '.Invalidation.Id')

echo "Invalidação criada: $INVALIDATION_ID"

echo ""
echo "=========================================="
echo " $(date '+%Y-%m-%d %H:%M:%S') — Concluído com sucesso"
echo "=========================================="
