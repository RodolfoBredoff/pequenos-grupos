#!/bin/bash

# Script de Setup do Banco de Dados PostgreSQL
# Executa as migrações e cria dados iniciais
# Suporta: psql instalado no host OU execução via Docker (sem instalar psql)

set -e

echo "======================================"
echo "  Setup do Banco de Dados"
echo "======================================"
echo ""

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

USE_DOCKER=false
CONTAINER_NAME=""

if ! command -v psql &> /dev/null; then
    if command -v docker &> /dev/null; then
        echo -e "${YELLOW}ℹ️  psql não encontrado no sistema. Usando Docker.${NC}"
        # Detectar container PostgreSQL rodando (nomes comuns do projeto)
        for name in pequenos-grupos-db pequenos-grupos-postgres postgres; do
            if docker ps --format '{{.Names}}' 2>/dev/null | grep -q "^${name}$"; then
                CONTAINER_NAME="$name"
                break
            fi
        done
        if [ -z "$CONTAINER_NAME" ]; then
            echo -e "${YELLOW}Container PostgreSQL não detectado. Informe o nome do container:${NC}"
            read -p "Nome do container [pequenos-grupos-db]: " CONTAINER_NAME
            CONTAINER_NAME=${CONTAINER_NAME:-pequenos-grupos-db}
            if ! docker ps --format '{{.Names}}' 2>/dev/null | grep -q "^${CONTAINER_NAME}$"; then
                echo -e "${RED}❌ Container '$CONTAINER_NAME' não está rodando. Execute: docker ps${NC}"
                exit 1
            fi
        else
            echo -e "${GREEN}✅ Container detectado: $CONTAINER_NAME${NC}"
        fi
        USE_DOCKER=true
    else
        echo -e "${RED}❌ PostgreSQL client (psql) não está instalado e Docker não encontrado.${NC}"
        echo ""
        echo "Opções:"
        echo "  1. Instalar psql:"
        echo "     - MacOS: brew install postgresql"
        echo "     - Ubuntu: sudo apt-get install postgresql-client"
        echo "  2. Ou usar Docker e subir PostgreSQL (o script usará docker exec)"
        exit 1
    fi
fi

# Solicitar informações de conexão
echo ""
echo -e "${YELLOW}📝 Informe os dados de conexão PostgreSQL:${NC}"

if [ "$USE_DOCKER" = true ]; then
    DB_HOST=""
    DB_PORT=""
    read -p "Database [pequenos_grupos]: " DB_NAME
    DB_NAME=${DB_NAME:-pequenos_grupos}
    read -p "User [postgres]: " DB_USER
    DB_USER=${DB_USER:-postgres}
    read -sp "Password (interno do container): " DB_PASSWORD
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

# Funções para executar SQL (host ou Docker)
# -t (tuples only) para capturar só o valor em RETURNING id; (sem cabeçalhos/rodapé)
run_psql_cmd() {
    if [ "$USE_DOCKER" = true ]; then
        echo "$1" | docker exec -i "$CONTAINER_NAME" psql -t -U "$DB_USER" -d "$DB_NAME" 2>/dev/null
    else
        export PGPASSWORD=$DB_PASSWORD
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "$1" 2>/dev/null
    fi
}

run_psql_cmd_silent() {
    if [ "$USE_DOCKER" = true ]; then
        echo "$1" | docker exec -i "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" > /dev/null 2>&1
    else
        export PGPASSWORD=$DB_PASSWORD
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "$1" > /dev/null 2>&1
    fi
}

run_psql_file() {
    if [ "$USE_DOCKER" = true ]; then
        cat "$1" | docker exec -i "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME"
    else
        export PGPASSWORD=$DB_PASSWORD
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$1"
    fi
}

# Testar conexão
echo ""
echo -e "${YELLOW}🔌 Testando conexão...${NC}"

if run_psql_cmd_silent "SELECT 1;"; then
    echo -e "${GREEN}✅ Conexão bem-sucedida!${NC}"
else
    echo -e "${RED}❌ Erro ao conectar ao banco de dados${NC}"
    echo "Verifique as credenciais e o container (docker ps)."
    exit 1
fi

# Executar migração
echo ""
echo -e "${YELLOW}📦 Executando migração...${NC}"

MIGRATION_FILE="db/migrations/001_initial_schema.sql"
if [ ! -f "$MIGRATION_FILE" ]; then
    echo -e "${RED}❌ Arquivo de migração não encontrado: $MIGRATION_FILE${NC}"
    echo "Execute o script na raiz do projeto: ./scripts/setup-database.sh"
    exit 1
fi

if run_psql_file "$MIGRATION_FILE"; then
    echo -e "${GREEN}✅ Migração executada com sucesso!${NC}"
else
    echo -e "${RED}❌ Erro ao executar migração${NC}"
    exit 1
fi

# Perguntar se deseja criar dados iniciais
echo ""
read -p "Deseja criar dados iniciais (organização, grupo, usuário, líder)? [s/N]: " CREATE_INITIAL
CREATE_INITIAL=${CREATE_INITIAL:-n}

if [[ "$CREATE_INITIAL" =~ ^[Ss]$ ]]; then
    echo ""
    echo -e "${YELLOW}📝 Criando dados iniciais...${NC}"
    
    read -p "Nome da organização: " ORG_NAME
    read -p "Nome do grupo: " GROUP_NAME
    read -p "Dia da semana padrão (0=Domingo, 6=Sábado) [3]: " MEETING_DAY
    MEETING_DAY=${MEETING_DAY:-3}
    read -p "Horário padrão (HH:MM:SS) [19:00:00]: " MEETING_TIME
    MEETING_TIME=${MEETING_TIME:-19:00:00}
    read -p "Email do líder: " LEADER_EMAIL
    read -p "Nome completo do líder: " LEADER_NAME
    
    # Escapar aspas simples para SQL
    ORG_NAME_ESC="${ORG_NAME//\'/\'\'}"
    GROUP_NAME_ESC="${GROUP_NAME//\'/\'\'}"
    LEADER_EMAIL_ESC="${LEADER_EMAIL//\'/\'\'}"
    LEADER_NAME_ESC="${LEADER_NAME//\'/\'\'}"
    
    ORG_ID=$(run_psql_cmd "INSERT INTO organizations (name) VALUES ('$ORG_NAME_ESC') RETURNING id;" | xargs)
    echo -e "${GREEN}✅ Organização criada: $ORG_ID${NC}"
    
    GROUP_ID=$(run_psql_cmd "INSERT INTO groups (organization_id, name, default_meeting_day, default_meeting_time) VALUES ('$ORG_ID', '$GROUP_NAME_ESC', $MEETING_DAY, '$MEETING_TIME') RETURNING id;" | xargs)
    echo -e "${GREEN}✅ Grupo criado: $GROUP_ID${NC}"
    
    USER_ID=$(run_psql_cmd "INSERT INTO users (email, email_verified) VALUES ('$LEADER_EMAIL_ESC', TRUE) RETURNING id;" | xargs)
    echo -e "${GREEN}✅ Usuário criado: $USER_ID${NC}"
    
    run_psql_cmd_silent "INSERT INTO leaders (id, organization_id, group_id, full_name, email) VALUES ('$USER_ID', '$ORG_ID', '$GROUP_ID', '$LEADER_NAME_ESC', '$LEADER_EMAIL_ESC');"
    echo -e "${GREEN}✅ Líder criado${NC}"
    
    echo ""
    echo -e "${GREEN}✅ Dados iniciais criados com sucesso!${NC}"
    echo ""
    echo "Próximos passos:"
    echo "1. Use o email '$LEADER_EMAIL' para fazer login"
    echo "2. Solicite um magic link em /login"
fi

echo ""
echo -e "${GREEN}✅ Setup concluído!${NC}"
