-- =====================================================
-- SETUP COMPLETO E LIMPO - Execute este SQL
-- =====================================================
-- Remove políticas antigas e cria tudo do zero
-- =====================================================

-- 1. CRIAR/ATUALIZAR TABELA PERFIS
CREATE TABLE IF NOT EXISTS perfis (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  nome TEXT,
  whatsapp TEXT,
  instagram TEXT,
  site TEXT,
  mostrar_site_banner BOOLEAN DEFAULT true,
  texto_extra TEXT,
  logo_url TEXT,
  plano TEXT DEFAULT 'teste',
  creditos INTEGER DEFAULT 50,
  plano_expira_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Adiciona colunas se já existir
ALTER TABLE perfis ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE perfis ADD COLUMN IF NOT EXISTS plano TEXT DEFAULT 'teste';
ALTER TABLE perfis ADD COLUMN IF NOT EXISTS creditos INTEGER DEFAULT 50;
ALTER TABLE perfis ADD COLUMN IF NOT EXISTS plano_expira_em TIMESTAMPTZ;
ALTER TABLE perfis ADD COLUMN IF NOT EXISTS site TEXT;
ALTER TABLE perfis ADD COLUMN IF NOT EXISTS mostrar_site_banner BOOLEAN DEFAULT true;

-- Atualiza emails dos usuários existentes
UPDATE perfis p
SET email = (SELECT email FROM auth.users u WHERE u.id = p.id)
WHERE email IS NULL;

-- Habilita RLS
ALTER TABLE perfis ENABLE ROW LEVEL SECURITY;

-- 2. REMOVER POLÍTICAS ANTIGAS DA TABELA PERFIS
DROP POLICY IF EXISTS "Usuários podem ver próprio perfil" ON perfis;
DROP POLICY IF EXISTS "Usuários podem atualizar próprio perfil" ON perfis;
DROP POLICY IF EXISTS "Usuários podem inserir próprio perfil" ON perfis;
DROP POLICY IF EXISTS "Usuários podem deletar próprio perfil" ON perfis;
DROP POLICY IF EXISTS "Admins podem ver todos perfis" ON perfis;
DROP POLICY IF EXISTS "Admins podem atualizar todos perfis" ON perfis;
DROP POLICY IF EXISTS "Admins podem inserir perfis" ON perfis;
DROP POLICY IF EXISTS "Admins podem deletar perfis" ON perfis;

-- 3. CRIAR POLÍTICAS DA TABELA PERFIS
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

-- 4. CRIAR TABELA HISTORICO_BANNERS (OPCIONAL)
CREATE TABLE IF NOT EXISTS historico_banners (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  filme_nome TEXT,
  formato TEXT,
  template TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE historico_banners ENABLE ROW LEVEL SECURITY;

-- Remove políticas antigas
DROP POLICY IF EXISTS "Usuários podem ver próprio histórico" ON historico_banners;
DROP POLICY IF EXISTS "Usuários podem inserir próprio histórico" ON historico_banners;

-- Cria políticas
CREATE POLICY "Usuários podem ver próprio histórico"
  ON historico_banners FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir próprio histórico"
  ON historico_banners FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 5. CRIAR TABELA TRANSACOES (OPCIONAL)
CREATE TABLE IF NOT EXISTS transacoes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plano TEXT NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pendente',
  metodo_pagamento TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE transacoes ENABLE ROW LEVEL SECURITY;

-- Remove políticas antigas
DROP POLICY IF EXISTS "Admins podem ver todas transações" ON transacoes;
DROP POLICY IF EXISTS "Usuários podem ver próprias transações" ON transacoes;

-- Cria políticas
CREATE POLICY "Admins podem ver todas transações"
  ON transacoes FOR SELECT
  USING (
    auth.jwt() ->> 'email' IN (
      'dedex1711@gmail.com',
      'admin@bannerflix.com'
    )
  );

CREATE POLICY "Usuários podem ver próprias transações"
  ON transacoes FOR SELECT
  USING (auth.uid() = user_id);

-- 6. VERIFICAR SE TUDO FOI CRIADO
SELECT 
  'perfis' as tabela,
  column_name, 
  data_type
FROM information_schema.columns
WHERE table_name = 'perfis'
ORDER BY ordinal_position;

-- =====================================================
-- PRONTO! Tudo configurado
-- =====================================================
