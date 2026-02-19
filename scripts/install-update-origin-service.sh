#!/bin/bash
# =============================================================================
# install-update-origin-service.sh
# Instala o update-origin.sh e o serviço systemd na EC2 via SSM Run Command.
# Execute este script da sua máquina local (requer AWS CLI configurado).
#
# Uso:
#   ./scripts/install-update-origin-service.sh \
#     --instance-id     i-0abc1234def56789  \
#     --distribution-id EDFDVBD6EXAMPLE      \
#     --origin-id       meu-origin-ec2        \
#     [--ssm-path       /pequenos-grupos]     \
#     [--app-dir        /opt/pequenos-grupos] \
#     [--region         us-east-1]            \
#     [--run-now]
#
# --run-now: executa o update-origin.sh imediatamente após instalar (útil para testar)
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
UPDATE_SCRIPT="$SCRIPT_DIR/update-origin.sh"

# ─────────────────────────────────────────────────────────────────────────────
# Defaults
# ─────────────────────────────────────────────────────────────────────────────
INSTANCE_ID=""
DISTRIBUTION_ID=""
ORIGIN_ID=""
SSM_PATH="/pequenos-grupos"
APP_DIR="/opt/pequenos-grupos"
AWS_REGION="us-east-1"
RUN_NOW=false

# ─────────────────────────────────────────────────────────────────────────────
# Parse de argumentos
# ─────────────────────────────────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case "$1" in
    --instance-id)     INSTANCE_ID="$2";     shift 2 ;;
    --distribution-id) DISTRIBUTION_ID="$2"; shift 2 ;;
    --origin-id)       ORIGIN_ID="$2";       shift 2 ;;
    --ssm-path)        SSM_PATH="$2";        shift 2 ;;
    --app-dir)         APP_DIR="$2";         shift 2 ;;
    --region)          AWS_REGION="$2";      shift 2 ;;
    --run-now)         RUN_NOW=true;         shift   ;;
    *)
      echo "Argumento desconhecido: $1"
      echo ""
      echo "Uso: $0 --instance-id <id> --distribution-id <id> --origin-id <id> [opções]"
      echo ""
      echo "Opções:"
      echo "  --ssm-path   <path>   Prefixo SSM          (padrão: /pequenos-grupos)"
      echo "  --app-dir    <path>   Diretório na EC2      (padrão: /opt/pequenos-grupos)"
      echo "  --region     <region> Região AWS            (padrão: us-east-1)"
      echo "  --run-now            Executa o script imediatamente após instalar"
      exit 1 ;;
  esac
done

# ─────────────────────────────────────────────────────────────────────────────
# Validações
# ─────────────────────────────────────────────────────────────────────────────
ERRORS=0

[ -z "$INSTANCE_ID" ]     && echo "ERRO: --instance-id é obrigatório"     && ERRORS=$((ERRORS+1))
[ -z "$DISTRIBUTION_ID" ] && echo "ERRO: --distribution-id é obrigatório" && ERRORS=$((ERRORS+1))
[ -z "$ORIGIN_ID" ]       && echo "ERRO: --origin-id é obrigatório"       && ERRORS=$((ERRORS+1))

if [ ! -f "$UPDATE_SCRIPT" ]; then
  echo "ERRO: Arquivo não encontrado: $UPDATE_SCRIPT"
  ERRORS=$((ERRORS+1))
fi

[ $ERRORS -gt 0 ] && exit 1

for cmd in aws base64; do
  command -v "$cmd" &>/dev/null || { echo "ERRO: '$cmd' não está instalado."; exit 1; }
done

echo "============================================"
echo " Instalando update-origin.service na EC2"
echo "============================================"
echo "Instância    : $INSTANCE_ID"
echo "Distribuição : $DISTRIBUTION_ID"
echo "Origin ID    : $ORIGIN_ID"
echo "SSM Path     : $SSM_PATH"
echo "App Dir      : $APP_DIR"
echo "Região       : $AWS_REGION"
echo "Run agora    : $RUN_NOW"
echo ""

# ─────────────────────────────────────────────────────────────────────────────
# Verificar se EC2 está Online no SSM
# ─────────────────────────────────────────────────────────────────────────────
echo "Verificando conectividade SSM..."
SSM_STATUS=$(aws ssm describe-instance-information \
  --filters "Key=InstanceIds,Values=$INSTANCE_ID" \
  --region "$AWS_REGION" \
  --query "InstanceInformationList[0].PingStatus" \
  --output text 2>/dev/null || echo "None")

if [ "$SSM_STATUS" != "Online" ]; then
  echo "ERRO: Instância $INSTANCE_ID não está Online no SSM (status: $SSM_STATUS)."
  echo "Verifique: a EC2 está rodando e o SSM agent está ativo?"
  exit 1
fi
echo "SSM: Online ✓"
echo ""

# ─────────────────────────────────────────────────────────────────────────────
# Codificar update-origin.sh em base64 (compatível com macOS e Linux)
# ─────────────────────────────────────────────────────────────────────────────
if base64 --version 2>&1 | grep -q GNU; then
  ENCODED_SCRIPT=$(base64 -w0 "$UPDATE_SCRIPT")
else
  # macOS
  ENCODED_SCRIPT=$(base64 "$UPDATE_SCRIPT" | tr -d '\n')
fi

SCRIPTS_DIR="${APP_DIR}/scripts"
SERVICE_FILE="/etc/systemd/system/update-origin.service"

# ─────────────────────────────────────────────────────────────────────────────
# Montar o script de instalação completo que vai rodar na EC2
# ─────────────────────────────────────────────────────────────────────────────
# Variáveis são interpoladas aqui (na máquina local) antes de enviar para EC2.
# O heredoc usa 'EOF' com aspas para evitar interpolação no lado da EC2.

INSTALL_SCRIPT=$(cat <<EOF
#!/bin/bash
set -euo pipefail

echo "=== Iniciando instalação do update-origin.service ==="

# 1. Instalar jq se não estiver disponível
if ! command -v jq &>/dev/null; then
  echo "Instalando jq..."
  if command -v dnf &>/dev/null; then
    dnf install -y -q jq
  elif command -v apt-get &>/dev/null; then
    DEBIAN_FRONTEND=noninteractive apt-get install -y -q jq
  else
    echo "ERRO: Não foi possível instalar jq — gerenciador de pacotes não reconhecido."
    exit 1
  fi
  echo "jq instalado: \$(jq --version)"
else
  echo "jq já disponível: \$(jq --version)"
fi

# 2. Criar diretório de scripts da aplicação
mkdir -p "${SCRIPTS_DIR}"
echo "Diretório criado: ${SCRIPTS_DIR}"

# 3. Gravar update-origin.sh (decodificado do base64)
echo "${ENCODED_SCRIPT}" | base64 -d > "${SCRIPTS_DIR}/update-origin.sh"
chmod +x "${SCRIPTS_DIR}/update-origin.sh"
echo "Script gravado: ${SCRIPTS_DIR}/update-origin.sh"

# 4. Criar arquivo de serviço systemd
cat > "${SERVICE_FILE}" <<'SYSTEMD_EOF'
[Unit]
Description=Atualiza CloudFront origin e SSM apos EC2 iniciar
After=network-online.target
Wants=network-online.target

[Service]
Type=oneshot
Environment=CLOUDFRONT_DISTRIBUTION_ID=${DISTRIBUTION_ID}
Environment=CLOUDFRONT_ORIGIN_ID=${ORIGIN_ID}
Environment=SSM_PATH=${SSM_PATH}
Environment=AWS_REGION=${AWS_REGION}
ExecStart=${SCRIPTS_DIR}/update-origin.sh
RemainAfterExit=yes
StandardOutput=journal
StandardError=journal
TimeoutStartSec=120

[Install]
WantedBy=multi-user.target
SYSTEMD_EOF

echo "Serviço criado: ${SERVICE_FILE}"

# 5. Recarregar systemd e habilitar serviço
systemctl daemon-reload
systemctl enable update-origin.service
echo "Serviço habilitado para inicialização automática."

# 6. Criar arquivo de log com as permissões corretas
touch /var/log/update-origin.log
chmod 644 /var/log/update-origin.log

echo ""
echo "=== Instalação concluída com sucesso ==="
echo "O serviço será executado automaticamente no próximo boot da EC2."
EOF
)

# Adicionar execução imediata se --run-now
if [ "$RUN_NOW" = true ]; then
  INSTALL_SCRIPT="${INSTALL_SCRIPT}

echo ''
echo '=== Executando update-origin.sh agora (--run-now) ==='
systemctl start update-origin.service || true
sleep 3
echo ''
echo '--- Status do serviço ---'
systemctl status update-origin.service --no-pager || true
echo ''
echo '--- Log do update-origin.sh ---'
cat /var/log/update-origin.log || true"
fi

# ─────────────────────────────────────────────────────────────────────────────
# Codificar o script de instalação em base64 e enviar via SSM
# Estratégia: enviar o script como base64, decodificar e executar na EC2.
# Isso evita todos os problemas de escaping de caracteres especiais no JSON.
# ─────────────────────────────────────────────────────────────────────────────
if base64 --version 2>&1 | grep -q GNU; then
  ENCODED_INSTALL=$(echo "$INSTALL_SCRIPT" | base64 -w0)
else
  ENCODED_INSTALL=$(echo "$INSTALL_SCRIPT" | base64 | tr -d '\n')
fi

echo "Enviando script de instalação via SSM Run Command..."

COMMAND_ID=$(aws ssm send-command \
  --instance-ids "$INSTANCE_ID" \
  --document-name "AWS-RunShellScript" \
  --parameters "{\"commands\":[\"echo '${ENCODED_INSTALL}' | base64 -d | bash\"]}" \
  --timeout-seconds 180 \
  --region "$AWS_REGION" \
  --output text \
  --query "Command.CommandId")

echo "Command ID: $COMMAND_ID"
echo ""
echo "Aguardando execução na EC2..."

# ─────────────────────────────────────────────────────────────────────────────
# Polling do status (máx. 3 minutos)
# ─────────────────────────────────────────────────────────────────────────────
for i in $(seq 1 36); do
  STATUS=$(aws ssm get-command-invocation \
    --command-id "$COMMAND_ID" \
    --instance-id "$INSTANCE_ID" \
    --region "$AWS_REGION" \
    --query "Status" \
    --output text 2>/dev/null || echo "InProgress")

  if [ "$STATUS" = "Success" ] || [ "$STATUS" = "Failed" ] || [ "$STATUS" = "Cancelled" ]; then
    break
  fi
  echo "  Status: $STATUS ($i/36)..."
  sleep 5
done

# ─────────────────────────────────────────────────────────────────────────────
# Exibir output
# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo "=== Output da EC2 (stdout) ==="
aws ssm get-command-invocation \
  --command-id "$COMMAND_ID" \
  --instance-id "$INSTANCE_ID" \
  --region "$AWS_REGION" \
  --query "StandardOutputContent" \
  --output text 2>/dev/null || true

STDERR_OUTPUT=$(aws ssm get-command-invocation \
  --command-id "$COMMAND_ID" \
  --instance-id "$INSTANCE_ID" \
  --region "$AWS_REGION" \
  --query "StandardErrorContent" \
  --output text 2>/dev/null || true)

if [ -n "$STDERR_OUTPUT" ]; then
  echo ""
  echo "=== Output da EC2 (stderr) ==="
  echo "$STDERR_OUTPUT"
fi

# ─────────────────────────────────────────────────────────────────────────────
# Resultado final
# ─────────────────────────────────────────────────────────────────────────────
echo ""
if [ "$STATUS" = "Success" ]; then
  echo "============================================"
  echo " Instalação concluída com sucesso!"
  echo "============================================"
  echo ""
  echo "O serviço 'update-origin.service' será executado automaticamente"
  echo "em todo boot da EC2."
  echo ""
  echo "Para verificar o log via SSM a qualquer momento:"
  echo ""
  echo "  aws ssm send-command \\"
  echo "    --instance-ids $INSTANCE_ID \\"
  echo "    --document-name AWS-RunShellScript \\"
  echo "    --parameters 'commands=[\"cat /var/log/update-origin.log\"]' \\"
  echo "    --region $AWS_REGION"
  echo ""
  echo "Para executar o script manualmente (re-teste) via SSM:"
  echo ""
  echo "  aws ssm send-command \\"
  echo "    --instance-ids $INSTANCE_ID \\"
  echo "    --document-name AWS-RunShellScript \\"
  echo "    --parameters 'commands=[\"systemctl restart update-origin.service\"]' \\"
  echo "    --region $AWS_REGION"
else
  echo "ERRO: Instalação falhou com status '$STATUS'."
  echo "Verifique o output acima para detalhes."
  exit 1
fi
