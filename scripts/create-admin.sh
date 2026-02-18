#!/bin/bash

# Script para criar ou promover um usuário como administrador do sistema
# Pode criar um novo usuário admin ou promover um usuário existente

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

echo "======================================"
echo "  Criar Administrador do Sistema"
echo "======================================"
echo ""

# Detectar Docker ou psql local
USE_DOCKER=false
CONTAINER_NAME=""

if ! command -v psql &> /dev/null; then
    if command -v docker &> /dev/null; then
        for name in pequenos-grupos-db pequenos-grupos-postgres postgres; do
            if docker ps --format '{{.Names}}' 2>/dev/null | grep -q "^${name}$"; then
                CONTAINER_NAME="$name"
                break
            fi
        done
        if [ -z "$CONTAINER_NAME" ]; then
            read -p "Nome do container PostgreSQL: " CONTAINER_NAME
        fi
        USE_DOCKER=true
    fi
fi

# Credenciais
if [ "$USE_DOCKER" = true ]; then
    echo -e "${YELLOW}Container detectado: $CONTAINER_NAME${NC}"
    read -p "Database [pequenos_grupos]: " DB_NAME
    DB_NAME=${DB_NAME:-pequenos_grupos}
    read -p "User [postgres]: " DB_USER
    DB_USER=${DB_USER:-postgres}
    read -sp "Password do banco: " DB_PASSWORD
    echo ""
else
    read -p "Host [localhost]: " DB_HOST
    DB_HOST=${DB_HOST:-localhost}
    read -p "Port [5432]: " DB_PORT
    DB_PORT=${DB_PORT:-5432}
    read -p "Database [pequenos_grupos]: " DB_NAME
    DB_NAME=${DB_NAME:-pequenos_grupos}
    read -p "User [postgres]: " DB_USER
    DB_USER=${DB_USER:-postgres}
    read -sp "Password do banco: " DB_PASSWORD
    echo ""
fi

run_sql() {
    if [ "$USE_DOCKER" = true ]; then
        echo "$1" | docker exec -i "$CONTAINER_NAME" psql -t -U "$DB_USER" -d "$DB_NAME" 2>/dev/null
    else
        export PGPASSWORD=$DB_PASSWORD
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "$1" 2>/dev/null
    fi
}

# Dados do admin
echo ""
echo -e "${CYAN}📝 Dados do administrador:${NC}"
read -p "E-mail do administrador: " ADMIN_EMAIL
if [ -z "$ADMIN_EMAIL" ]; then
    echo -e "${RED}❌ E-mail é obrigatório${NC}"
    exit 1
fi

read -sp "Senha do administrador: " ADMIN_PASSWORD
echo ""
if [ -z "$ADMIN_PASSWORD" ]; then
    echo -e "${RED}❌ Senha é obrigatória${NC}"
    exit 1
fi

read -sp "Confirme a senha: " ADMIN_PASSWORD_CONFIRM
echo ""
if [ "$ADMIN_PASSWORD" != "$ADMIN_PASSWORD_CONFIRM" ]; then
    echo -e "${RED}❌ As senhas não conferem${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}🔧 Criando/atualizando admin...${NC}"

# Criar usuário ou promover existente
SQL="INSERT INTO users (email, email_verified, is_admin, password_hash)
     VALUES ('$ADMIN_EMAIL', true, true, crypt('$ADMIN_PASSWORD', gen_salt('bf')))
     ON CONFLICT (email) DO UPDATE 
     SET is_admin = TRUE, 
         password_hash = crypt('$ADMIN_PASSWORD', gen_salt('bf')),
         email_verified = TRUE
     RETURNING id;"

RESULT=$(run_sql "$SQL")

if [ -n "$RESULT" ]; then
    echo -e "${GREEN}✅ Administrador criado/atualizado com sucesso!${NC}"
    echo ""
    echo -e "${CYAN}Acesse o painel em:${NC}"
    echo "  http://localhost:3000/admin/login"
    echo ""
    echo -e "${CYAN}Credenciais:${NC}"
    echo "  E-mail: $ADMIN_EMAIL"
    echo "  Senha: [a que você definiu]"
else
    echo -e "${RED}❌ Erro ao criar administrador${NC}"
    echo "Verifique se a migração 002 foi aplicada: ./scripts/apply-migration-002.sh"
    exit 1
fi
