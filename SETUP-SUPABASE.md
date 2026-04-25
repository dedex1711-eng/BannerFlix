# 🚀 Configuração do Supabase

## Passo 1: Criar a Tabela de Perfis

Acesse o **SQL Editor** no painel do Supabase e execute este comando:

```sql
-- Cria a tabela de perfis dos usuários
create table perfis (
  id uuid references auth.users on delete cascade primary key,
  nome text,
  whatsapp text,
  instagram text,
  texto_extra text,
  logo_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Ativa segurança (RLS) - cada usuário só vê seu próprio perfil
alter table perfis enable row level security;

-- Política: usuário pode ver e editar apenas seu próprio perfil
create policy "Usuários gerenciam próprio perfil"
  on perfis for all
  using (auth.uid() = id)
  with check (auth.uid() = id);
```

## Passo 2: Criar o Bucket de Logos

1. Vá em **Storage** no menu lateral
2. Clique em **New Bucket**
3. Nome do bucket: `logos`
4. **Marque a opção "Public bucket"** ✅
5. Clique em **Create bucket**

### Configurar Política de Upload

Depois de criar o bucket, clique nele e vá em **Policies** → **New Policy**:

```sql
-- Permite que usuários façam upload apenas na própria pasta
create policy "Usuários podem fazer upload da própria logo"
  on storage.objects for insert
  with check (
    bucket_id = 'logos' 
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Permite que usuários atualizem apenas a própria logo
create policy "Usuários podem atualizar própria logo"
  on storage.objects for update
  using (
    bucket_id = 'logos' 
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Permite que usuários deletem apenas a própria logo
create policy "Usuários podem deletar própria logo"
  on storage.objects for delete
  using (
    bucket_id = 'logos' 
    and auth.uid()::text = (storage.foldername(name))[1]
  );
```

## Passo 3: Configurar Autenticação

1. Vá em **Authentication** → **Providers**
2. **Email** já vem ativo por padrão ✅
3. (Opcional) Desative "Confirm email" se quiser login imediato sem verificação de e-mail:
   - Vá em **Authentication** → **Settings** → **Email Auth**
   - Desmarque "Enable email confirmations"

## Passo 4: Testar

Recarregue `http://localhost:3000` e:

1. Clique em **Entrar** → **Criar Conta**
2. Preencha nome, e-mail e senha
3. Faça login
4. Clique no avatar → **Meu Perfil**
5. Preencha WhatsApp, Instagram, texto e faça upload da logo
6. Clique em **Salvar Perfil**

Os dados são salvos no Supabase e carregados automaticamente em todo login! 🎉

---

## Verificar se está funcionando

### No Supabase Dashboard:

**Tabela de perfis:**
- Vá em **Table Editor** → `perfis`
- Você deve ver seu perfil salvo com todos os dados

**Logos no Storage:**
- Vá em **Storage** → `logos`
- Você deve ver uma pasta com o ID do seu usuário contendo a logo

---

## Estrutura do Banco

```
auth.users (gerenciado pelo Supabase)
├── id (uuid)
├── email
└── user_metadata { nome }

perfis (sua tabela)
├── id (uuid) → referencia auth.users.id
├── nome
├── whatsapp
├── instagram
├── texto_extra
├── logo_url
├── created_at
└── updated_at

storage.objects (bucket: logos)
└── logos/{user_id}/logo.{ext}
```

---

## Troubleshooting

**Erro "relation perfis does not exist"**
→ Execute o SQL do Passo 1

**Erro ao fazer upload da logo**
→ Verifique se o bucket `logos` está marcado como **Public**

**Não consigo ver meu perfil salvo**
→ Verifique se as políticas RLS foram criadas corretamente

**Erro "Invalid API key"**
→ Verifique se copiou a chave `anon public` correta no arquivo `supabase-auth.js`
