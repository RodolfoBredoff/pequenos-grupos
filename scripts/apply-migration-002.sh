#!/bin/bash

# Script para aplicar a migração 002 (admin + meeting_time)
# Executa em bancos existentes sem apagar dados

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "======================================"
echo "  Migração 002 — Admin + Meeting Time"
echo "======================================"
echo ""

# Detectar se usa Docker ou psql local
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
    read -p "Database [pequenos_grupos]: " DB_NAME
    DB_NAME=${DB_NAME:-pequenos_grupos}
    read -p "User [postgres]: " DB_USER
    DB_USER=${DB_USER:-postgres}
    read -sp "Password: " DB_PASSWORD
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
    read -sp "Password: " DB_PASSWORD
    echo ""
fi

run_sql_file() {
    if [ "$USE_DOCKER" = true ]; then
        cat "$1" | docker exec -i "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME"
    else
        export PGPASSWORD=$DB_PASSWORD
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$1"
    fi
}

echo -e "${YELLOW}📦 Aplicando migração 002...${NC}"
MIGRATION_FILE="db/migrations/002_admin_and_meeting_time.sql"

if [ ! -f "$MIGRATION_FILE" ]; then
    echo -e "${RED}❌ Arquivo $MIGRATION_FILE não encontrado${NC}"
    exit 1
fi

if run_sql_file "$MIGRATION_FILE"; then
    echo -e "${GREEN}✅ Migração 002 aplicada com sucesso!${NC}"
else
    echo -e "${RED}❌ Erro ao aplicar migração${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}💡 Próximo passo: crie o usuário administrador${NC}"
echo ""
echo "Execute o script:"
echo "  ./scripts/create-admin.sh"
echo ""
echo "Ou manualmente no banco:"
echo "  INSERT INTO users (email, email_verified, is_admin, password_hash)"
echo "  VALUES ('admin@seudominio.com', true, true, crypt('sua-senha', gen_salt('bf')))"
echo "  ON CONFLICT (email) DO UPDATE SET is_admin = TRUE, password_hash = crypt('sua-senha', gen_salt('bf'));"
