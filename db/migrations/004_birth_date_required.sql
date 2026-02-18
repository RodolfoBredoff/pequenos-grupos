-- Data de nascimento obrigatória novamente
-- Atualiza membros sem data para uma data padrão (evita erro ao tornar NOT NULL)
UPDATE members SET birth_date = '2000-01-01' WHERE birth_date IS NULL;

ALTER TABLE members ALTER COLUMN birth_date SET NOT NULL;
