-- =====================================================
-- CORRIGIR POLÍTICAS RLS - Execute este SQL
-- =====================================================
-- Este script corrige o erro de "row-level security policy"
-- =====================================================

-- Remove políticas antigas
DROP POLICY IF EXISTS "Usuários podem ver próprio perfil" ON perfis;
DROP POLICY IF EXISTS "Usuários podem atualizar próprio perfil" ON perfis;
DROP POLICY IF EXISTS "Usuários podem inserir próprio perfil" ON perfis;
DROP POLICY IF EXISTS "Usuários podem deletar próprio perfil" ON perfis;
DROP POLICY IF EXISTS "Admins podem ver todos perfis" ON perfis;
DROP POLICY IF EXISTS "Admins podem atualizar todos perfis" ON perfis;
DROP POLICY IF EXISTS "Admins podem inserir perfis" ON perfis;
DROP POLICY IF EXISTS "Admins podem deletar perfis" ON perfis;

-- Cria políticas corretas com WITH CHECK
CREATE POLICY "Usuários podem ver próprio perfil"
  ON perfis FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Usuários podem atualizar próprio perfil"
  ON perfis FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Usuários podem inserir próprio perfil"
  ON perfis FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Usuários podem deletar próprio perfil"
  ON perfis FOR DELETE
  USING (auth.uid() = id);

CREATE POLICY "Admins podem ver todos perfis"
  ON perfis FOR SELECT
  USING (
    auth.jwt() ->> 'email' IN (
      'dedex1711@gmail.com',
      'admin@bannerflix.com'
    )
  );

CREATE POLICY "Admins podem atualizar todos perfis"
  ON perfis FOR UPDATE
  USING (
    auth.jwt() ->> 'email' IN (
      'dedex1711@gmail.com',
      'admin@bannerflix.com'
    )
  )
  WITH CHECK (
    auth.jwt() ->> 'email' IN (
      'dedex1711@gmail.com',
      'admin@bannerflix.com'
    )
  );

CREATE POLICY "Admins podem inserir perfis"
  ON perfis FOR INSERT
  WITH CHECK (
    auth.jwt() ->> 'email' IN (
      'dedex1711@gmail.com',
      'admin@bannerflix.com'
    )
  );

CREATE POLICY "Admins podem deletar perfis"
  ON perfis FOR DELETE
  USING (
    auth.jwt() ->> 'email' IN (
      'dedex1711@gmail.com',
      'admin@bannerflix.com'
    )
  );

-- Verifica se as políticas foram criadas
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename = 'perfis';
