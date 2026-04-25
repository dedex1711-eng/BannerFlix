-- =====================================================
-- COMANDOS SQL PARA EXECUTAR NO SUPABASE
-- =====================================================
-- Acesse: https://supabase.com/dashboard
-- Vá em: SQL Editor
-- Cole e execute este código
-- =====================================================

-- 1. CRIAR TABELA PERFIS (se não existir)
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

-- Habilita RLS na tabela perfis
ALTER TABLE perfis ENABLE ROW LEVEL SECURITY;

-- 2. ADICIONAR COLUNAS SE A TABELA JÁ EXISTIA (caso já tenha criado antes)
ALTER TABLE perfis 
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS plano TEXT DEFAULT 'teste',
ADD COLUMN IF NOT EXISTS creditos INTEGER DEFAULT 50,
ADD COLUMN IF NOT EXISTS plano_expira_em TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS site TEXT,
ADD COLUMN IF NOT EXISTS mostrar_site_banner BOOLEAN DEFAULT true;

-- 3. CRIAR TABELA DE HISTÓRICO DE BANNERS (opcional)
CREATE TABLE IF NOT EXISTS historico_banners (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  filme_nome TEXT,
  formato TEXT,
  template TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE historico_banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver próprio histórico"
  ON historico_banners FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir próprio histórico"
  ON historico_banners FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 4. CRIAR TABELA DE TRANSAÇÕES (opcional)
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

-- 5. CRIAR POLÍTICAS RLS DA TABELA PERFIS
DROP POLICY IF EXISTS "Usuários podem ver próprio perfil" ON perfis;
DROP POLICY IF EXISTS "Usuários podem atualizar próprio perfil" ON perfis;
DROP POLICY IF EXISTS "Usuários podem inserir próprio perfil" ON perfis;
DROP POLICY IF EXISTS "Admins podem ver todos perfis" ON perfis;
DROP POLICY IF EXISTS "Admins podem atualizar todos perfis" ON perfis;

-- Política: usuários podem ver apenas seu próprio perfil
CREATE POLICY "Usuários podem ver próprio perfil"
  ON perfis FOR SELECT
  USING (auth.uid() = id);

-- Política: usuários podem atualizar apenas seu próprio perfil
CREATE POLICY "Usuários podem atualizar próprio perfil"
  ON perfis FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Política: usuários podem inserir apenas seu próprio perfil
CREATE POLICY "Usuários podem inserir próprio perfil"
  ON perfis FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Política: admins podem ver todos os perfis
CREATE POLICY "Admins podem ver todos perfis"
  ON perfis FOR SELECT
  USING (
    auth.jwt() ->> 'email' IN (
      'dedex1711@gmail.com',
      'admin@bannerflix.com'
    )
  );

-- Política: admins podem atualizar todos os perfis
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

-- Política: admins podem inserir perfis para qualquer usuário
CREATE POLICY "Admins podem inserir perfis"
  ON perfis FOR INSERT
  WITH CHECK (
    auth.jwt() ->> 'email' IN (
      'dedex1711@gmail.com',
      'admin@bannerflix.com'
    )
  );

-- Política: permitir DELETE para o próprio usuário
CREATE POLICY "Usuários podem deletar próprio perfil"
  ON perfis FOR DELETE
  USING (auth.uid() = id);

-- Política: admins podem deletar qualquer perfil
CREATE POLICY "Admins podem deletar perfis"
  ON perfis FOR DELETE
  USING (
    auth.jwt() ->> 'email' IN (
      'dedex1711@gmail.com',
      'admin@bannerflix.com'
    )
  );

-- 6. VERIFICAR SE TUDO FOI CRIADO CORRETAMENTE
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'perfis'
ORDER BY ordinal_position;

-- =====================================================
-- PRONTO! Agora os arquivos JavaScript podem ser atualizados
-- =====================================================
