-- Vincula o líder (pelo e-mail) a uma organização e a um grupo.
-- Use quando o setup criou usuário/líder mas o grupo não ficou salvo ou o vínculo quebrou.
--
-- 1. Substitua SEU_EMAIL@exemplo.com pelo seu e-mail em TODAS as ocorrências abaixo.
-- 2. (Opcional) Ajuste o nome da organização e do grupo.
-- 3. Execute: cat scripts/fix-leader-group.sql | docker exec -i pequenos-grupos-db psql -U postgres -d pequenos_grupos
--    Ou use sed para trocar o e-mail: sed 's/SEU_EMAIL@exemplo.com/rodolfobredoff@gmail.com/g' scripts/fix-leader-group.sql | docker exec -i pequenos-grupos-db psql -U postgres -d pequenos_grupos

-- Garantir que existe ao menos uma organização
INSERT INTO organizations (name)
SELECT 'Minha Igreja'
WHERE NOT EXISTS (SELECT 1 FROM organizations LIMIT 1);

-- Garantir que existe ao menos um grupo (vinculado à última organização)
INSERT INTO groups (organization_id, name, default_meeting_day, default_meeting_time)
SELECT (SELECT id FROM organizations ORDER BY created_at DESC LIMIT 1), 'Meu Grupo', 3, '19:00:00'
WHERE NOT EXISTS (SELECT 1 FROM groups LIMIT 1);

-- Vincular o líder a essa organização e ao grupo (pelo e-mail já cadastrado)
UPDATE leaders
SET
  organization_id = (SELECT id FROM organizations ORDER BY created_at DESC LIMIT 1),
  group_id        = (SELECT id FROM groups ORDER BY created_at DESC LIMIT 1)
WHERE email = 'SEU_EMAIL@exemplo.com';
