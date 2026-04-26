# 🎬 BannerFlix - Criador de Banners Profissionais

Ferramenta para criar banners profissionais para filmes e séries em segundos, com suporte a múltiplos formatos de rede social.

## 🚀 Quick Start

### 1. Instalar Dependências
```bash
npm install
```

### 2. Iniciar o Servidor
```bash
npm start
```

Ou no Windows, execute o arquivo:
```bash
iniciar-servidor.bat
```

### 3. Acessar a Aplicação
Abra seu navegador e acesse:
```
http://localhost:3000
```

## 📋 Requisitos

- **Node.js** 14+ (para rodar o servidor)
- **Navegador moderno** (Chrome, Firefox, Safari, Edge)
- **Conexão com internet** (para buscar dados de filmes/séries)

## 🎨 Funcionalidades

- ✅ Busca de filmes e séries via TMDB
- ✅ Upload de logo personalizada
- ✅ Múltiplos formatos: WhatsApp, Stories, Feed, Paisagem
- ✅ Estilos de banner: Simples e Promocional
- ✅ Geração de resumos automáticos
- ✅ Download em alta resolução
- ✅ Sistema de autenticação com LicenseAuth

## 📁 Estrutura de Arquivos

```
bannerflix-producao/
├── index.html                 # Página principal
├── style.css                  # Estilos
├── app.js                     # Lógica principal
├── licenseauth-lib.js         # Biblioteca de autenticação
├── auth-licenseauth-js.js     # Sistema de autenticação
├── server-simples.js          # Servidor Node.js
├── iniciar-servidor.bat       # Script para Windows
├── package.json               # Dependências
├── README.md                  # Este arquivo
└── .gitignore                 # Arquivos ignorados no Git
```

## 🔐 Autenticação

O BannerFlix usa o sistema **LicenseAuth** para autenticação. Para usar:

1. Acesse a aplicação
2. Clique em "Entrar"
3. Digite sua chave de licença
4. Pronto! Você está autenticado

## 🎯 Como Usar

1. **Buscar Filme/Série**: Digite o nome na barra de busca
2. **Adicionar Logo**: Faça upload da sua logo em PNG
3. **Configurar Contatos**: Adicione WhatsApp, Instagram e Site
4. **Escolher Formato**: Selecione o formato desejado
5. **Gerar Banner**: Clique em "Gerar Banner"
6. **Baixar**: Clique em "Baixar Banner" para salvar

## 🛠️ Desenvolvimento

### Modificar Estilos
Edite o arquivo `style.css` para customizar cores e layouts.

### Adicionar Funcionalidades
Edite o arquivo `app.js` para adicionar novas features.

### Configurar API
A chave da API TMDB está em `app.js`. Para usar sua própria chave:
1. Acesse https://www.themoviedb.org/settings/api
2. Copie sua chave
3. Substitua em `app.js` na linha: `const TMDB_API_KEY = 'sua-chave-aqui'`

## 📦 Dependências

- **Node.js**: Runtime JavaScript
- **TMDB API**: Banco de dados de filmes/séries
- **LicenseAuth**: Sistema de autenticação

## 🐛 Troubleshooting

### Porta 3000 já está em uso
```bash
# Use uma porta diferente
node server-simples.js 3001
```

### Erro ao buscar filmes
- Verifique sua conexão com internet
- Verifique se a chave da API TMDB está correta

### Logo não aparece no banner
- Certifique-se que o arquivo é PNG
- Tente com uma imagem menor (< 2MB)

## 📝 Licença

MIT License - Veja LICENSE para detalhes

## 🤝 Suporte

Para suporte, entre em contato através do WhatsApp ou Instagram configurado na aplicação.

---

**Desenvolvido com ❤️ para criadores de conteúdo**
