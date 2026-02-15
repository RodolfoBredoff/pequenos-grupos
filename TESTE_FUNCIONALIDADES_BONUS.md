# Guia de Teste - Funcionalidades Bônus

Este guia detalha como instalar, configurar e testar as 3 funcionalidades bônus adicionadas ao sistema.

## 🎁 Funcionalidades Adicionadas

1. ✅ **Dashboard de Engajamento** - Gráficos e análises de presença
2. ✅ **Broadcast WhatsApp** - Enviar mensagens para múltiplas pessoas
3. ✅ **Modo Offline Completo** - Funciona sem internet com sync automático

---

## 📦 Passo 1: Instalar Novas Dependências

### 1.1 Instalar Node.js (Se Ainda Não Tiver)

**MacOS (Homebrew):**
```bash
brew install node
```

**Ou baixe:** https://nodejs.org (versão LTS)

**Verificar:**
```bash
node --version
npm --version
```

### 1.2 Instalar Dependências do Projeto

```bash
cd pequenos-grupos

# Instalar todas as dependências (incluindo as novas)
npm install
```

**Novas dependências adicionadas:**
- `recharts` - Biblioteca de gráficos React
- `dexie` - Wrapper do IndexedDB
- `dexie-react-hooks` - Hooks React para Dexie

### 1.3 Verificar Instalação

```bash
npm list recharts dexie dexie-react-hooks
```

Você deve ver as versões instaladas.

---

## 🚀 Passo 2: Executar Localmente

### 2.1 Iniciar Servidor

```bash
npm run dev
```

Acesse: http://localhost:3000

### 2.2 Fazer Login

Use o sistema de Magic Link para fazer login (veja SETUP.md se ainda não configurou).

---

## 📊 Funcionalidade 1: Dashboard de Engajamento

### O Que Foi Adicionado

- **Nova página:** `/engajamento`
- **Novo item no menu:** "Engajamento" (ícone de gráfico)
- **Componentes:**
  - Gráfico de linha: Taxa de presença mensal
  - Gráfico de barras: Presentes vs Ausentes
  - Top 5 mais presentes
  - Top 5 mais ausentes
  - Membros com 100% de presença

### Como Testar

#### Passo 1: Acessar a Página

1. No menu lateral (desktop) ou inferior (mobile), clique em **Engajamento** (ícone 📈)
2. Ou acesse diretamente: http://localhost:3000/engajamento

#### Passo 2: Verificar Conteúdo

Se **não houver dados ainda:**
- Você verá: "Sem dados de presença ainda"
- Solução: Registre algumas presenças primeiro (veja abaixo)

Se **houver dados:**
- ✅ Estatísticas resumidas (taxa média, membros destaque)
- ✅ Gráfico de tendência mensal
- ✅ Gráfico de presentes vs ausentes
- ✅ Rankings de presença

#### Passo 3: Gerar Dados de Teste

Para visualizar os gráficos, você precisa de histórico de presenças:

```sql
-- No SQL Editor do Supabase, execute:

-- 1. Criar reuniões passadas (último mês)
INSERT INTO meetings (group_id, meeting_date, is_cancelled)
SELECT 
  'SEU-GROUP-ID-AQUI',
  CURRENT_DATE - (n || ' days')::interval,
  false
FROM generate_series(7, 28, 7) n;

-- 2. Registrar presenças aleatórias
-- (Execute após ter membros cadastrados)
INSERT INTO attendance (meeting_id, member_id, is_present)
SELECT 
  m.id,
  mem.id,
  CASE WHEN random() > 0.3 THEN true ELSE false END
FROM meetings m
CROSS JOIN members mem
WHERE m.group_id = 'SEU-GROUP-ID-AQUI'
  AND mem.group_id = 'SEU-GROUP-ID-AQUI'
  AND m.meeting_date < CURRENT_DATE;
```

#### Passo 4: Verificar Recursos

- [ ] **Taxa média de presença** aparece corretamente
- [ ] **Tendência** mostra seta para cima/baixo
- [ ] **Gráfico de linha** é interativo (hover mostra valores)
- [ ] **Gráfico de barras** mostra presentes (verde) e ausentes (vermelho)
- [ ] **Top 5 rankings** exibem nomes e percentuais
- [ ] **Membros destaque** (100% presença) aparecem em badge amarelo

### Troubleshooting

**Erro: "recharts is not defined"**
```bash
npm install recharts --save
```

**Gráficos não aparecem:**
- Verifique console do navegador (F12)
- Certifique-se de ter dados (últimos 6 meses)

---

## 💬 Funcionalidade 2: Broadcast WhatsApp

### O Que Foi Adicionado

- **Novo botão na página Pessoas:** "Mensagem em Grupo"
- **Dialog modal** com:
  - Filtros (Todos, Participantes, Visitantes)
  - Campo de mensagem personalizável
  - Preview de destinatários
  - Barra de progresso durante envio

### Como Testar

#### Passo 1: Acessar Broadcast

1. Vá para **Pessoas** no menu
2. Clique no botão **"Mensagem em Grupo"** (ícone 💬)
3. Um modal será aberto

#### Passo 2: Configurar Mensagem

1. **Escolha o filtro:**
   - "Todos" - Envia para todos os membros
   - "Participantes" - Apenas participantes
   - "Visitantes" - Apenas visitantes

2. **Escreva a mensagem:**
   ```
   Olá {nome}! Reunião amanhã às 19h. Confirma presença? 🙏
   ```
   
   **Use `{nome}` para personalizar!**
   - Será substituído pelo nome de cada pessoa

3. **Revise destinatários:**
   - Lista mostra quantas pessoas receberão
   - Cada pessoa com seu telefone

#### Passo 3: Enviar

1. Clique em **"Enviar para X"**
2. O sistema abrirá WhatsApp Web para cada pessoa
3. **Intervalo de 2 segundos** entre cada abertura
4. Barra de progresso mostra andamento
5. Você pode editar a mensagem antes de enviar cada uma

#### Passo 4: Verificar Recursos

- [ ] Filtros funcionam corretamente
- [ ] `{nome}` é substituído pelo nome real
- [ ] Aberturas têm delay de 2s
- [ ] Barra de progresso atualiza
- [ ] Mensagem pré-preenchida aparece no WhatsApp
- [ ] Modal fecha automaticamente ao terminar

### Dicas de Uso

**✅ Boas Práticas:**
- Use mensagens curtas e diretas
- Personalize com `{nome}` para melhor engajamento
- Teste primeiro com 2-3 pessoas
- Envie em horários apropriados

**⚠️ Limitações:**
- Requer popup habilitado no navegador
- WhatsApp Web deve estar logado
- Funciona melhor no Chrome/Edge
- Em mobile, abrirá o app WhatsApp

**💡 Casos de Uso:**
- Lembrar da reunião
- Avisar mudança de horário/local
- Convidar para evento especial
- Parabenizar aniversariantes em grupo

---

## 📴 Funcionalidade 3: Modo Offline Completo

### O Que Foi Adicionado

- **IndexedDB local** para cache de dados
- **Indicador de status** (canto inferior direito):
  - 🔴 "Modo Offline" - Sem conexão
  - 🟡 "X pendentes" - Dados aguardando sync
  - 🟢 "Sincronizado" - Tudo atualizado
- **Sync automático** ao voltar online
- **Chamada offline** funciona sem internet

### Como Testar

#### Passo 1: Testar Modo Offline

**Simular Offline no Chrome:**

1. Abra DevTools (F12)
2. Vá para a aba **Network**
3. No dropdown superior, selecione **Offline**
4. Ou use: Ctrl+Shift+P → "Show Network conditions" → Offline

**Verificar Indicador:**
- Badge vermelha "Modo Offline" aparece no canto inferior direito

#### Passo 2: Registrar Presença Offline

1. Com internet desconectada, vá para **Chamada**
2. Marque presenças/ausências
3. Clique em **"Salvar Offline"** (botão mudará o texto)
4. Você verá: "Presença salva localmente! Será sincronizada..."
5. Verificar:
   - [ ] Botão mostra ícone de WiFi Off
   - [ ] Aviso amarelo aparece embaixo do botão
   - [ ] Dados são salvos localmente

#### Passo 3: Verificar Pendências

1. Ainda offline, vá para qualquer página
2. Indicador mostra: "X pendente(s)"
3. Clique em "Sincronizar" (não funcionará enquanto offline)
4. Anotação: "Os dados serão sincronizados quando a conexão voltar"

#### Passo 4: Testar Sync Automático

1. **Volte online:**
   - DevTools → Network → Online
   - Ou reconecte WiFi real

2. **Observe o indicador:**
   - Automaticamente muda para "Sincronizando..."
   - Ícone de refresh gira
   - Após alguns segundos: "Sincronizado" (verde)

3. **Verificar no Supabase:**
   - Vá no Table Editor → `attendance`
   - Suas presenças offline devem estar lá!

#### Passo 5: Verificar Cache Local

**Inspecionar IndexedDB:**

1. DevTools (F12) → **Application** tab
2. Sidebar esquerda → **Storage** → **IndexedDB**
3. Expanda **PequenosGruposDB**
4. Você verá:
   - `members` - Membros em cache
   - `meetings` - Reuniões em cache
   - `attendance` - Presenças em cache
   - `pendingSync` - Fila de sincronização

**Limpar cache (se necessário):**
```javascript
// No console do navegador:
indexedDB.deleteDatabase('PequenosGruposDB');
```

### Recursos Implementados

- [x] **Detecção automática** de online/offline
- [x] **Cache local** de membros, reuniões e presenças
- [x] **Fila de sincronização** persistente
- [x] **Sync automático** ao reconectar
- [x] **Botão manual** de sincronização
- [x] **Indicadores visuais** claros
- [x] **Timestamps** de última sincronização
- [x] **Conflict resolution** automático (upsert)

### Casos de Uso

**📶 Grupo em local sem sinal:**
1. Líder chega em casa sem WiFi
2. Abre o app (já está em cache)
3. Registra presença offline
4. Ao chegar em casa com WiFi, sync automático

**🏠 Reunião em casa sem internet:**
1. Reunião acontece
2. Líder registra presença no celular (offline)
3. Dados salvos localmente
4. Ao sair e pegar sinal, tudo sincroniza

**✈️ Viagem/Túnel:**
1. Conexão instável
2. Sistema detecta e ativa modo offline
3. Usuário continua usando normalmente
4. Sync ocorre assim que possível

### Troubleshooting

**IndexedDB não funciona:**
- Verifique se está em HTTPS ou localhost
- Alguns navegadores bloqueiam em HTTP
- Tente em modo anônimo

**Sync não acontece automaticamente:**
- Verifique console de erros (F12)
- Certifique-se que variáveis de ambiente estão corretas
- Teste sync manual (botão "Sincronizar")

**Dados duplicados:**
- O sistema usa `upsert` para evitar duplicatas
- Se ocorrer, limpe IndexedDB e recarregue

---

## 🧪 Checklist Completo de Testes

### Dashboard de Engajamento
- [ ] Página carrega sem erros
- [ ] Gráficos renderizam corretamente
- [ ] Dados são calculados com precisão
- [ ] Responsivo (desktop + mobile)
- [ ] Rankings ordenam corretamente
- [ ] Badges de destaque aparecem

### Broadcast WhatsApp
- [ ] Modal abre ao clicar no botão
- [ ] Filtros funcionam
- [ ] `{nome}` é substituído
- [ ] WhatsApp Web/App abre
- [ ] Delay de 2s entre aberturas
- [ ] Progresso atualiza corretamente
- [ ] Modal fecha ao terminar

### Modo Offline
- [ ] Indicador aparece ao desconectar
- [ ] Chamada salva offline
- [ ] Pendências são registradas
- [ ] Sync automático funciona
- [ ] Dados aparecem no Supabase após sync
- [ ] IndexedDB armazena corretamente
- [ ] Indicador verde aparece ao sincronizar

---

## 📊 Dados de Teste Recomendados

Para testar completamente, recomendo:

**Membros:** Mínimo 10 pessoas (mix participantes/visitantes)
**Reuniões:** 4-6 semanas de histórico
**Presenças:** Variadas (60-90% de taxa)

**Script SQL Completo:**

```sql
-- Execute no SQL Editor do Supabase

-- 1. Criar reuniões das últimas 6 semanas (quartas às 19h)
INSERT INTO meetings (group_id, meeting_date, is_cancelled)
SELECT 
  'SEU-GROUP-ID',
  CURRENT_DATE - (n || ' days')::interval,
  false
FROM generate_series(7, 42, 7) n;

-- 2. Popular presenças (80% de taxa média)
INSERT INTO attendance (meeting_id, member_id, is_present)
SELECT 
  m.id,
  mem.id,
  CASE WHEN random() > 0.2 THEN true ELSE false END -- 80% presente
FROM meetings m
CROSS JOIN members mem
WHERE m.group_id = 'SEU-GROUP-ID'
  AND mem.group_id = 'SEU-GROUP-ID'
  AND m.meeting_date < CURRENT_DATE
  AND m.is_cancelled = false;
```

---

## 🎯 Performance e Limitações

### Dashboard de Engajamento
- **Performance:** Excelente até 1000 registros
- **Cache:** Dados carregam do servidor a cada acesso
- **Limitação:** Últimos 6 meses apenas

### Broadcast WhatsApp
- **Performance:** Limitado por rate do WhatsApp Web
- **Delay:** 2 segundos entre cada mensagem
- **Limitação:** 
  - Popups devem estar habilitados
  - WhatsApp Web deve estar logado
  - Máximo ~50 pessoas por vez (recomendado)

### Modo Offline
- **Performance:** Instantâneo (IndexedDB é rápido)
- **Storage:** ~5-10MB para 100 membros + 3 meses dados
- **Limitação:**
  - Cache apenas últimos 30 dias
  - Sync pode demorar se muitas pendências
  - Conflitos resolvidos via "último ganha"

---

## 🚀 Próximos Passos

Após testar localmente com sucesso:

1. **Deploy em Produção** (veja DEPLOY.md)
2. **Testar em dispositivos reais** (iOS/Android)
3. **Coletar feedback** dos líderes
4. **Ajustar configurações** conforme necessário

---

## 📞 Suporte

**Problemas comuns:**

1. **Gráficos não aparecem:**
   ```bash
   npm install recharts --force
   npm run dev
   ```

2. **IndexedDB erro de permissão:**
   - Use HTTPS ou localhost
   - Desabilite extensões que bloqueiam storage

3. **WhatsApp não abre:**
   - Habilite popups no navegador
   - Faça login no WhatsApp Web primeiro

---

**Funcionalidades Bônus Prontas! 🎉**

Aproveite os gráficos, broadcast e modo offline do seu sistema!
