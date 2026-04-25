-- =====================================================
-- MIGRAR USUÁRIOS EXISTENTES PARA TABELA PERFIS
-- =====================================================
-- Este SQL copia usuários de auth.users para perfis
-- =====================================================

-- Insere todos os usuários do auth.users na tabela perfis
INSERT INTO perfis (id, email, nome, plano, creditos, created_at)
SELECT 
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'nome', ''),
  'teste',
  50,
  u.created_at
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM perfis p WHERE p.id = u.id
);

-- Verifica quantos usuários foram migrados
SELECT COUNT(*) as total_usuarios FROM perfis;

-- Mostra os usuários migrados
SELECT id, email, nome, plano, creditos, created_at 
FROM perfis 
ORDER BY created_at DESC;
