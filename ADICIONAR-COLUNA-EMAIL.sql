-- =====================================================
-- ADICIONAR COLUNA EMAIL NA TABELA PERFIS
-- =====================================================

-- Adiciona coluna email
ALTER TABLE perfis 
ADD COLUMN IF NOT EXISTS email TEXT;

-- Atualiza emails dos usuários existentes (pega do auth.users)
UPDATE perfis p
SET email = (
  SELECT email 
  FROM auth.users u 
  WHERE u.id = p.id
)
WHERE email IS NULL;

-- Verifica se funcionou
SELECT id, email, nome, plano, creditos 
FROM perfis 
LIMIT 10;
