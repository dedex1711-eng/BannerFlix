-- =====================================================
-- ATUALIZAR CRÉDITOS DO PLANO TESTE PARA 50
-- =====================================================

-- Atualiza todos os usuários com plano teste para 50 créditos
UPDATE perfis
SET creditos = 50
WHERE plano = 'teste';

-- Verifica quantos foram atualizados
SELECT COUNT(*) as usuarios_atualizados
FROM perfis
WHERE plano = 'teste' AND creditos = 50;

-- Mostra os usuários atualizados
SELECT id, email, nome, plano, creditos
FROM perfis
WHERE plano = 'teste'
ORDER BY created_at DESC;
