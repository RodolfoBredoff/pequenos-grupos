-- Data de nascimento opcional para participantes
ALTER TABLE members ALTER COLUMN birth_date DROP NOT NULL;

-- Atualizar função de aniversários para ignorar membros sem data
CREATE OR REPLACE FUNCTION get_birthdays_today(group_uuid UUID)
RETURNS TABLE (
  id UUID,
  full_name VARCHAR,
  phone VARCHAR,
  birth_date DATE
) AS $$
BEGIN
  RETURN QUERY
  SELECT m.id, m.full_name, m.phone, m.birth_date
  FROM members m
  WHERE m.group_id = group_uuid
    AND m.birth_date IS NOT NULL
    AND EXTRACT(MONTH FROM m.birth_date) = EXTRACT(MONTH FROM CURRENT_DATE)
    AND EXTRACT(DAY FROM m.birth_date) = EXTRACT(DAY FROM CURRENT_DATE)
    AND m.is_active = TRUE;
END;
$$ LANGUAGE plpgsql;
