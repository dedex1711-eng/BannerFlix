# 🎬 Divulga Fácil

Plataforma completa para criar banners profissionais de filmes e séries para divulgação em redes sociais.

## ✨ Funcionalidades

- 🔍 **Busca de filmes/séries** — Banco de dados TMDB com milhões de títulos em português
- 🎨 **Upload de logo personalizada** — Sua marca em todos os banners
- 📱 **3 formatos otimizados** — Stories (9:16), Feed (4:5), Paisagem (16:9)
- 🎭 **5 estilos de overlay** — Escuro, Roxo, Azul, Vermelho ou Sem overlay
- 📝 **Resumo automático** — Texto pronto para copiar e colar nas redes sociais
- 💾 **Sistema de contas** — Salva logo, WhatsApp, Instagram e texto automaticamente
- ⬇️ **Download em alta resolução** — PNG pronto para publicar
- 📤 **Compartilhamento direto** — Web Share API para mobile

## 🚀 Como Usar

### 1. Instalar dependências

Nenhuma dependência local necessária! Apenas Node.js para rodar o servidor.

### 2. Configurar Supabase (5 minutos)

Siga as instruções em **[SETUP-SUPABASE.md](SETUP-SUPABASE.md)** para:
- Criar a tabela de perfis
- Configurar o bucket de logos
- Ativar autenticação

### 3. Rodar o servidor

```bash
node server.js
```

Acesse: **http://localhost:3000**

## 📁 Estrutura do Projeto

```
.
├── index.html           # Estrutura da página
├── style.css            # Design completo (tema escuro)
├── app.js               # Lógica de busca e geração de banners
├── supabase-auth.js     # Sistema de autenticação e perfis
├── server.js            # Servidor local simples
├── README.md            # Este arquivo
└── SETUP-SUPABASE.md    # Instruções de configuração do banco
```

## 🎨 Tecnologias

- **Frontend:** HTML5, CSS3, JavaScript (Vanilla)
- **API de Filmes:** [TMDB](https://www.themoviedb.org/)
- **Backend:** [Supabase](https://supabase.com) (Auth + Database + Storage)
- **Canvas API:** Geração de banners em tempo real

## 🔑 Configuração da API TMDB

A chave pública já está no código para testes. Para produção:

1. Crie conta em [themoviedb.org](https://www.themoviedb.org/settings/api)
2. Gere uma API Key gratuita
3. Substitua em `app.js`:
```javascript
const TMDB_API_KEY = 'SUA_CHAVE_AQUI';
```

## 💡 Como Funciona

1. **Busque** um filme ou série pelo nome
2. **Selecione** nos resultados
3. **Faça upload** da sua logo (salva na conta)
4. **Preencha** WhatsApp, Instagram e texto extra (salvos na conta)
5. **Escolha** o formato e estilo
6. **Gere** o banner
7. **Copie** o resumo pronto para redes sociais
8. **Baixe** ou compartilhe direto

## 🔐 Sistema de Contas

- **Cadastro/Login** com e-mail e senha
- **Perfil salvo** no Supabase (logo, contatos, texto)
- **Carregamento automático** em todo login
- **Segurança RLS** — cada usuário vê apenas seus dados

## 📱 Responsivo

Interface otimizada para desktop, tablet e mobile.

## 🎯 Casos de Uso

- Revendedores de IPTV/streaming
- Divulgadores de conteúdo
- Páginas de filmes/séries
- Marketing de entretenimento

## 📄 Licença

Projeto de código aberto para fins educacionais.

---

**Desenvolvido com ❤️ para facilitar a vida de revendedores**
