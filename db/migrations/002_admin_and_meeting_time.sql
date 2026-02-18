-- Migração 002: Suporte a administrador do sistema e horário por reunião

-- Adicionar campo is_admin em users
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Adicionar campo meeting_time nas reuniões (override do horário padrão do grupo)
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS meeting_time TIME;

-- Adicionar campo title nas reuniões (nome/tema do encontro)
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS title VARCHAR(255);

-- Índice para busca rápida de admins
CREATE INDEX IF NOT EXISTS idx_users_admin ON users(is_admin) WHERE is_admin = TRUE;

-- Comentário: Para criar um admin, execute:
-- UPDATE users SET is_admin = TRUE, password_hash = crypt('sua-senha', gen_salt('bf')) WHERE email = 'admin@seudominio.com';
-- Ou via script:
-- INSERT INTO users (email, email_verified, is_admin, password_hash) 
--   VALUES ('admin@seudominio.com', true, true, crypt('senha-segura', gen_salt('bf')))
--   ON CONFLICT (email) DO UPDATE SET is_admin = TRUE, password_hash = crypt('senha-segura', gen_salt('bf'));
