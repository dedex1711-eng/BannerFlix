# Sistema de Planos e Créditos - BannerFlix

## Visão Geral

O BannerFlix agora possui um sistema completo de planos e créditos para controlar o uso da plataforma.

## Planos Disponíveis

### 1. **Teste** (Padrão)
- **Créditos**: 5
- **Preço**: Gratuito
- **Duração**: Sem expiração
- **Descrição**: Plano inicial para novos usuários testarem a plataforma

### 2. **Mensal**
- **Créditos**: Ilimitados
- **Preço**: R$ 29,90/mês
- **Duração**: 30 dias
- **Descrição**: Banners ilimitados por 30 dias

### 3. **Anual**
- **Créditos**: Ilimitados
- **Preço**: R$ 299,90/ano
- **Duração**: 365 dias
- **Descrição**: Banners ilimitados por 1 ano (economize R$ 59,00)

### 4. **Vitalício**
- **Créditos**: Ilimitados
- **Preço**: R$ 997,00 (pagamento único)
- **Duração**: Sem expiração
- **Descrição**: Banners ilimitados para sempre

## Funcionalidades

### Para Usuários

1. **Display de Créditos**: Na navbar, o usuário vê quantos créditos tem disponíveis
2. **Consumo Automático**: Cada banner gerado consome 1 crédito (exceto planos ilimitados)
3. **Modal de Upgrade**: Quando os créditos acabam, aparece um modal com opções de planos
4. **Expiração Automática**: Planos com duração expiram automaticamente e voltam para o plano Teste

### Para Administradores

1. **Painel Admin**: Acesse `/admin.html` para gerenciar usuários
2. **Estatísticas**: Veja quantos usuários tem em cada plano
3. **Editar Usuários**: Altere o plano e créditos de qualquer usuário
4. **Excluir Usuários**: Remova usuários do sistema

## Acesso ao Painel Admin

Para acessar o painel administrativo, você precisa:

1. Estar logado com um email de administrador
2. Adicionar seu email na lista de admins em `admin.js`:

```javascript
const admins = [
  'admin@bannerflix.com',
  'seu-email@exemplo.com', // Adicione aqui
];
```

3. Acessar `http://localhost:3000/admin.html`

## Armazenamento

Os dados de planos e créditos são armazenados no **localStorage** do navegador com a chave:
```
divulga_perfil_{userId}
```

Estrutura do perfil:
```json
{
  "userId": "uuid",
  "plano": "teste|mensal|anual|vitalicio",
  "creditos": 5 ou -1 (ilimitado),
  "plano_expira_em": "2026-05-01T00:00:00.000Z" ou null,
  "nome": "Nome do Usuário",
  "whatsapp": "(11) 99999-9999",
  "instagram": "@usuario",
  "site": "www.site.com",
  "mostrar_site_banner": true,
  "texto_extra": "Texto extra",
  "logo_url": "data:image/png;base64,...",
  "created_at": "2026-04-25T00:00:00.000Z",
  "updated_at": "2026-04-25T00:00:00.000Z"
}
```

## Arquivos do Sistema

- `planos-creditos.js`: Lógica de planos e créditos
- `admin.html`: Interface do painel administrativo
- `admin.js`: Lógica do painel administrativo
- `supabase-auth.js`: Autenticação (atualizado para mostrar créditos)
- `app.js`: Geração de banners (atualizado para consumir créditos)
- `index.html`: Interface principal (atualizado com modal de planos)

## Fluxo de Uso

1. **Novo Usuário**:
   - Cria conta → Recebe plano Teste com 5 créditos
   - Gera banners → Consome créditos
   - Créditos acabam → Vê modal de upgrade

2. **Upgrade de Plano**:
   - Usuário entra em contato
   - Admin acessa painel
   - Admin altera plano do usuário
   - Usuário recebe créditos ilimitados

3. **Expiração**:
   - Plano expira automaticamente
   - Usuário volta para plano Teste com 5 créditos
   - Pode fazer upgrade novamente

## Próximos Passos (Opcional)

- Integrar com gateway de pagamento (Stripe, Mercado Pago, etc.)
- Enviar emails de notificação de expiração
- Adicionar histórico de uso
- Implementar sistema de cupons de desconto
- Adicionar relatórios de faturamento
