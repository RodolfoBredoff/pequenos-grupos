-- Permite que um líder leia a própria linha na tabela leaders.
-- A política original "leaders_same_group" só permite ver outros líderes do mesmo grupo,
-- mas para isso o app precisa primeiro ler o próprio líder (id = auth.uid()), e isso
-- estava bloqueado. Esta política corrige isso.
CREATE POLICY "leaders_select_own_row" ON leaders
  FOR SELECT USING (id = auth.uid());
