# Configuração do Supabase para Sistema de Planos

## Passo 1: Criar Tabelas no Supabase

Acesse o painel do Supabase (https://supabase.com) e vá em **SQL Editor**. Execute os seguintes comandos:

### 1.1 Tabela de Perfis (já existe, vamos atualizar)

```sql
-- Adiciona colunas de plano na tabela perfis
ALTER TABLE perfis 
ADD COLUMN IF NOT EXISTS plano TEXT DEFAULT 'teste',
ADD COLUMN IF NOT EXISTS creditos INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS plano_expira_em TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS site TEXT,
ADD COLUMN IF NOT EXISTS mostrar_site_banner BOOLEAN DEFAULT true;
```

### 1.2 Tabela de Histórico de Uso (opcional, para relatórios)

```sql
-- Cria tabela para registrar cada banner gerado
CREATE TABLE IF NOT EXISTS historico_banners (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  filme_nome TEXT,
  formato TEXT,
  template TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilita RLS
ALTER TABLE historico_banners ENABLE ROW LEVEL SECURITY;

-- Política: usuários podem ver apenas seu próprio histórico
CREATE POLICY "Usuários podem ver próprio histórico"
  ON historico_banners FOR SELECT
  USING (auth.uid() = user_id);

-- Política: usuários podem inserir no próprio histórico
CREATE POLICY "Usuários podem inserir próprio histórico"
  ON historico_banners FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

### 1.3 Tabela de Transações (opcional, para controle financeiro)

```sql
-- Cria tabela para registrar compras de planos
CREATE TABLE IF NOT EXISTS transacoes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plano TEXT NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pendente', -- pendente, aprovado, cancelado
  metodo_pagamento TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilita RLS
ALTER TABLE transacoes ENABLE ROW LEVEL SECURITY;

-- Política: apenas admins podem ver todas as transações
CREATE POLICY "Admins podem ver todas transações"
  ON transacoes FOR SELECT
  USING (
    auth.jwt() ->> 'email' IN (
      'dedex1711@gmail.com',
      'admin@bannerflix.com'
    )
  );

-- Política: usuários podem ver apenas suas transações
CREATE POLICY "Usuários podem ver próprias transações"
  ON transacoes FOR SELECT
  USING (auth.uid() = user_id);
```

## Passo 2: Atualizar Políticas RLS da Tabela Perfis

```sql
-- Remove políticas antigas se existirem
DROP POLICY IF EXISTS "Usuários podem ver próprio perfil" ON perfis;
DROP POLICY IF EXISTS "Usuários podem atualizar próprio perfil" ON perfis;
DROP POLICY IF EXISTS "Usuários podem inserir próprio perfil" ON perfis;

-- Política: usuários podem ver apenas seu próprio perfil
CREATE POLICY "Usuários podem ver próprio perfil"
  ON perfis FOR SELECT
  USING (auth.uid() = id);

-- Política: usuários podem atualizar apenas seu próprio perfil
CREATE POLICY "Usuários podem atualizar próprio perfil"
  ON perfis FOR UPDATE
  USING (auth.uid() = id);

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
  );
```

## Passo 3: Criar Função para Verificar Expiração Automática

```sql
-- Função que verifica e reseta planos expirados
CREATE OR REPLACE FUNCTION verificar_planos_expirados()
RETURNS void AS $$
BEGIN
  UPDATE perfis
  SET 
    plano = 'teste',
    creditos = 5,
    plano_expira_em = NULL
  WHERE 
    plano_expira_em IS NOT NULL 
    AND plano_expira_em < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cria um cron job para executar a cada hora (requer extensão pg_cron)
-- Nota: pg_cron só está disponível em planos pagos do Supabase
-- SELECT cron.schedule('verificar-planos-expirados', '0 * * * *', 'SELECT verificar_planos_expirados()');
```

## Passo 4: Criar View para Estatísticas (Admin)

```sql
-- View com estatísticas de usuários
CREATE OR REPLACE VIEW estatisticas_usuarios AS
SELECT 
  COUNT(*) as total_usuarios,
  COUNT(*) FILTER (WHERE plano = 'teste') as usuarios_teste,
  COUNT(*) FILTER (WHERE plano = 'mensal') as usuarios_mensal,
  COUNT(*) FILTER (WHERE plano = 'anual') as usuarios_anual,
  COUNT(*) FILTER (WHERE plano = 'vitalicio') as usuarios_vitalicio,
  COUNT(*) FILTER (WHERE plano_expira_em < NOW()) as planos_expirados
FROM perfis;

-- Permite que admins vejam as estatísticas
GRANT SELECT ON estatisticas_usuarios TO authenticated;
```

## Passo 5: Estrutura Final das Tabelas

### Tabela `perfis`
```
id                    UUID (PK, FK -> auth.users)
nome                  TEXT
whatsapp              TEXT
instagram             TEXT
site                  TEXT
mostrar_site_banner   BOOLEAN
texto_extra           TEXT
logo_url              TEXT
plano                 TEXT (teste, mensal, anual, vitalicio)
creditos              INTEGER
plano_expira_em       TIMESTAMPTZ
created_at            TIMESTAMPTZ
updated_at            TIMESTAMPTZ
```

### Tabela `historico_banners` (opcional)
```
id           UUID (PK)
user_id      UUID (FK -> auth.users)
filme_nome   TEXT
formato      TEXT
template     TEXT
created_at   TIMESTAMPTZ
```

### Tabela `transacoes` (opcional)
```
id                UUID (PK)
user_id           UUID (FK -> auth.users)
plano             TEXT
valor             DECIMAL
status            TEXT
metodo_pagamento  TEXT
created_at        TIMESTAMPTZ
```

## Passo 6: Testar as Tabelas

Execute no SQL Editor para verificar:

```sql
-- Ver estrutura da tabela perfis
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'perfis';

-- Ver todos os perfis (como admin)
SELECT id, nome, plano, creditos, plano_expira_em
FROM perfis;

-- Ver estatísticas
SELECT * FROM estatisticas_usuarios;
```

## Próximos Passos

Depois de criar as tabelas, você precisa:

1. ✅ Executar os comandos SQL acima no Supabase
2. ✅ Atualizar o código JavaScript para usar o Supabase ao invés do localStorage
3. ✅ Testar o sistema completo

Quer que eu crie os arquivos JavaScript atualizados para usar o Supabase?
