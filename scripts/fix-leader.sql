-- Corrige o vínculo líder quando o setup-database.sh gravou IDs errados (ex.: modo Docker sem -t).
-- Substitua 'SEU_EMAIL@exemplo.com' pelo e-mail que você usou no cadastro.

-- Remove possível linha incorreta de líder com esse e-mail
DELETE FROM leaders WHERE email = 'SEU_EMAIL@exemplo.com';

-- Cria o vínculo correto: id do líder = id do usuário em users
INSERT INTO leaders (id, organization_id, group_id, full_name, email)
SELECT u.id,
  (SELECT id FROM organizations ORDER BY created_at DESC LIMIT 1),
  (SELECT id FROM groups ORDER BY created_at DESC LIMIT 1),
  'Líder',
  u.email
FROM users u
WHERE u.email = 'SEU_EMAIL@exemplo.com'
ON CONFLICT (id) DO NOTHING;
