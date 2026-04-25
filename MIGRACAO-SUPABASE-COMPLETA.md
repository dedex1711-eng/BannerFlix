# 🚀 Migração Completa para Supabase

## ✅ O que foi feito

Todos os arquivos foram atualizados para usar o Supabase ao invés do localStorage:

### Arquivos Atualizados:
1. ✅ `index.html` - Agora carrega `planos-creditos-supabase.js`
2. ✅ `admin.html` - Agora carrega `admin-supabase.js`
3. ✅ `supabase-auth.js` - Salva e carrega perfis do Supabase
4. ✅ `EXECUTAR-NO-SUPABASE.sql` - Comandos SQL prontos para executar

---

## 📋 Próximos Passos (VOCÊ PRECISA FAZER)

### Passo 1: Executar SQL no Supabase

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **SQL Editor** (menu lateral esquerdo)
4. Abra o arquivo `EXECUTAR-NO-SUPABASE.sql`
5. Copie TODO o conteúdo
6. Cole no SQL Editor do Supabase
7. Clique em **RUN** (ou pressione Ctrl+Enter)

**IMPORTANTE:** Execute TODO o código de uma vez. Ele vai:
- Adicionar colunas de plano na tabela `perfis`
- Criar tabela `historico_banners` (opcional)
- Criar tabela `transacoes` (opcional)
- Atualizar políticas RLS para permitir acesso admin
- Verificar se tudo foi criado corretamente

### Passo 2: Verificar se funcionou

Após executar o SQL, execute esta query para verificar:

```sql
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_name = 'perfis'
ORDER BY ordinal_position;
```

Você deve ver estas colunas:
- `id`
- `nome`
- `whatsapp`
- `instagram`
- `texto_extra`
- `logo_url`
- `created_at`
- `updated_at`
- **`plano`** ← NOVA
- **`creditos`** ← NOVA
- **`plano_expira_em`** ← NOVA
- **`site`** ← NOVA
- **`mostrar_site_banner`** ← NOVA

---

## 🧪 Testando o Sistema

### Teste 1: Criar nova conta
1. Abra `index.html` no navegador
2. Clique em "Criar Conta"
3. Preencha os dados e crie a conta
4. Verifique no Supabase (Table Editor → perfis) se o usuário foi criado com:
   - `plano = 'teste'`
   - `creditos = 5`

### Teste 2: Editar perfil
1. Faça login
2. Clique no avatar → "Meu Perfil"
3. Preencha WhatsApp, Instagram, Site, Logo
4. Salve
5. Verifique no Supabase se os dados foram salvos

### Teste 3: Consumir crédito
1. Busque um filme
2. Gere um banner
3. Verifique se o contador de créditos diminuiu de 5 para 4
4. Verifique no Supabase se `creditos = 4`

### Teste 4: Painel Admin
1. Faça login com `dedex1711@gmail.com`
2. Acesse `admin.html`
3. Você deve ver todos os usuários cadastrados
4. Tente editar um usuário:
   - Mude o plano para "Mensal"
   - Salve
   - Verifique se o usuário agora tem créditos ilimitados (∞)

---

## 🔧 Diferenças entre localStorage e Supabase

### ANTES (localStorage):
- ❌ Dados salvos apenas no navegador
- ❌ Admin não conseguia ver outros usuários
- ❌ Dados perdidos ao limpar cache
- ❌ Não funciona em múltiplos dispositivos

### AGORA (Supabase):
- ✅ Dados salvos no banco de dados
- ✅ Admin pode ver e editar todos os usuários
- ✅ Dados persistem mesmo limpando cache
- ✅ Funciona em qualquer dispositivo

---

## 🐛 Possíveis Erros e Soluções

### Erro: "Erro ao carregar usuários" no Admin
**Causa:** Políticas RLS não foram criadas corretamente  
**Solução:** Execute novamente o SQL do Passo 1

### Erro: "Erro ao salvar perfil"
**Causa:** Colunas não foram adicionadas na tabela perfis  
**Solução:** Execute novamente o SQL do Passo 1

### Erro: "permission denied for table perfis"
**Causa:** Políticas RLS bloqueando acesso  
**Solução:** Verifique se seu email está na lista de admins:
```sql
-- Adicione seu email como admin
CREATE POLICY "Admins podem ver todos perfis"
  ON perfis FOR SELECT
  USING (
    auth.jwt() ->> 'email' IN (
      'dedex1711@gmail.com',  -- SEU EMAIL AQUI
      'admin@bannerflix.com'
    )
  );
```

### Admin não consegue ver usuários
**Causa:** Você não está logado com email de admin  
**Solução:** Faça login com `dedex1711@gmail.com`

---

## 📊 Estrutura Final do Banco

### Tabela `perfis`
```
id                    UUID (PK)
nome                  TEXT
whatsapp              TEXT
instagram             TEXT
site                  TEXT
mostrar_site_banner   BOOLEAN
texto_extra           TEXT
logo_url              TEXT (base64)
plano                 TEXT (teste, mensal, anual, vitalicio)
creditos              INTEGER (-1 = ilimitado)
plano_expira_em       TIMESTAMPTZ
created_at            TIMESTAMPTZ
updated_at            TIMESTAMPTZ
```

### Tabela `historico_banners` (opcional)
```
id           UUID (PK)
user_id      UUID (FK)
filme_nome   TEXT
formato      TEXT
template     TEXT
created_at   TIMESTAMPTZ
```

### Tabela `transacoes` (opcional)
```
id                UUID (PK)
user_id           UUID (FK)
plano             TEXT
valor             DECIMAL
status            TEXT
metodo_pagamento  TEXT
created_at        TIMESTAMPTZ
```

---

## 🎯 Funcionalidades Implementadas

### Sistema de Créditos
- ✅ Plano Teste: 5 créditos
- ✅ Plano Mensal: Ilimitado (30 dias)
- ✅ Plano Anual: Ilimitado (365 dias)
- ✅ Plano Vitalício: Ilimitado (sem expiração)
- ✅ Consumo de 1 crédito por banner gerado
- ✅ Modal quando créditos acabam
- ✅ Display de créditos na navbar

### Painel Admin
- ✅ Ver todos os usuários
- ✅ Buscar usuários por email/nome
- ✅ Editar plano de qualquer usuário
- ✅ Editar créditos (apenas plano teste)
- ✅ Excluir usuários
- ✅ Estatísticas (total por plano)
- ✅ Ver dias restantes até expiração

### Perfil do Usuário
- ✅ Salvar WhatsApp, Instagram, Site
- ✅ Upload de logo (comprimida para 400x400px)
- ✅ Texto extra personalizado
- ✅ Checkbox para mostrar/ocultar site no banner
- ✅ Dados sincronizados com Supabase

---

## 🔐 Segurança (RLS)

As políticas RLS garantem que:
- ✅ Usuários só veem seus próprios dados
- ✅ Usuários só podem editar seus próprios dados
- ✅ Admins podem ver e editar todos os dados
- ✅ Histórico de banners é privado por usuário
- ✅ Transações são visíveis apenas para o dono e admins

---

## 📞 Suporte

Se encontrar algum erro:
1. Abra o Console do navegador (F12)
2. Vá na aba "Console"
3. Copie as mensagens de erro
4. Me envie para análise

---

## ✨ Próximas Melhorias Sugeridas

1. **Integração com pagamento**
   - Mercado Pago / Stripe
   - Atualização automática de plano após pagamento

2. **Dashboard do usuário**
   - Ver histórico de banners criados
   - Estatísticas de uso

3. **Notificações**
   - Email quando plano está perto de expirar
   - Email quando créditos acabam

4. **Exportação de dados**
   - Admin pode exportar lista de usuários em CSV
   - Relatórios de uso

---

**IMPORTANTE:** Não esqueça de executar o SQL no Supabase antes de testar!
