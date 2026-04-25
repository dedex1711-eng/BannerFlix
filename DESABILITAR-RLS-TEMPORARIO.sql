-- =====================================================
-- DESABILITAR RLS TEMPORARIAMENTE (APENAS PARA TESTE)
-- =====================================================
-- ATENÇÃO: Isso remove a segurança da tabela!
-- Use apenas para testar se o problema é RLS
-- Depois execute CORRIGIR-POLITICAS.sql para reativar
-- =====================================================

-- Desabilita RLS na tabela perfis
ALTER TABLE perfis DISABLE ROW LEVEL SECURITY;

-- Verifica se foi desabilitado
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'perfis';

-- Se rowsecurity = false, RLS está desabilitado
