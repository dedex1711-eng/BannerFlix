# 🏗️ Arquitetura Híbrida: localStorage + Supabase

## 📊 O que é salvo onde?

### 🗄️ localStorage (Navegador)
**Dados do perfil do usuário:**
- ✅ Nome
- ✅ WhatsApp
- ✅ Instagram
- ✅ Site
- ✅ Mostrar site no banner (checkbox)
- ✅ Texto extra
- ✅ Logo (base64)

**Por quê?**
- Carregamento instantâneo
- Não depende de conexão
- Evita problemas de timeout
- Dados pessoais ficam no dispositivo do usuário

---

### ☁️ Supabase (Banco de Dados)
**Dados de autenticação e planos:**
- ✅ Email e senha (auth.users)
- ✅ Plano (teste, mensal, anual, vitalício)
- ✅ Créditos (5, -1 para ilimitado)
- ✅ Data de expiração do plano
- ✅ Histórico de banners gerados (opcional)
- ✅ Transações (opcional)

**Por quê?**
- Controle centralizado de créditos
- Admin pode gerenciar planos
- Sincronização entre dispositivos (créditos)
- Segurança (RLS)

---

## 🔄 Fluxo de Dados

### 1. Cadastro
```
1. Usuário preenche formulário
2. Supabase cria conta (auth.users)
3. Supabase cria perfil com plano teste (perfis)
4. Login automático
```

### 2. Login
```
1. Usuário faz login
2. Supabase autentica
3. localStorage carrega perfil (WhatsApp, logo, etc)
4. Supabase carrega créditos e plano
5. Interface atualizada
```

### 3. Editar Perfil
```
1. Usuário edita dados
2. Salva no localStorage
3. Interface atualizada instantaneamente
```

### 4. Gerar Banner
```
1. Usuário gera banner
2. Supabase verifica créditos
3. Se OK, consome 1 crédito
4. Supabase atualiza contador
5. Interface mostra novo saldo
```

### 5. Admin Edita Plano
```
1. Admin muda plano do usuário
2. Supabase atualiza (plano, créditos, expiração)
3. Usuário vê mudança no próximo login
```

---

## ✅ Vantagens

### localStorage:
- ⚡ Carregamento instantâneo
- 🔒 Privacidade (dados no dispositivo)
- 📴 Funciona offline (após login)
- 🚀 Sem timeout

### Supabase:
- 👑 Admin pode gerenciar usuários
- 💳 Controle de créditos centralizado
- 🔐 Autenticação segura
- 📊 Relatórios e estatísticas

---

## 🔧 Como Funciona na Prática

### Arquivo: `supabase-auth.js`
```javascript
// CARREGAR PERFIL (localStorage)
async function carregarPerfilNaTela() {
  const perfilJson = localStorage.getItem('divulga_perfil_' + usuarioAtual.id);
  const data = JSON.parse(perfilJson);
  // Preenche campos: WhatsApp, Instagram, Logo...
}

// SALVAR PERFIL (localStorage)
async function salvarPerfil() {
  const perfil = { nome, whatsapp, instagram, logo_url, ... };
  localStorage.setItem('divulga_perfil_' + usuarioAtual.id, JSON.stringify(perfil));
}
```

### Arquivo: `planos-creditos-supabase.js`
```javascript
// VERIFICAR CRÉDITOS (Supabase)
async function verificarCreditos() {
  const { data } = await sb.from('perfis').select('plano, creditos').eq('id', usuarioAtual.id);
  return { temCredito: data.creditos > 0, creditos: data.creditos };
}

// CONSUMIR CRÉDITO (Supabase)
async function consumirCredito() {
  await sb.from('perfis').update({ creditos: creditos - 1 }).eq('id', usuarioAtual.id);
}
```

---

## 🎯 Resumo

| Dado | Onde Salva | Por Quê |
|------|-----------|---------|
| Email/Senha | Supabase | Autenticação |
| Nome | localStorage | Rápido |
| WhatsApp | localStorage | Rápido |
| Instagram | localStorage | Rápido |
| Site | localStorage | Rápido |
| Logo | localStorage | Rápido |
| **Plano** | **Supabase** | **Admin controla** |
| **Créditos** | **Supabase** | **Admin controla** |
| **Expiração** | **Supabase** | **Admin controla** |

---

## 🚀 Benefícios Finais

1. ✅ **Login rápido** - Não trava esperando Supabase
2. ✅ **Perfil instantâneo** - Carrega do localStorage
3. ✅ **Créditos controlados** - Admin gerencia no Supabase
4. ✅ **Sem timeout** - localStorage sempre disponível
5. ✅ **Privacidade** - Dados pessoais no dispositivo
6. ✅ **Controle centralizado** - Planos no banco de dados

---

**Melhor dos dois mundos!** 🎉
