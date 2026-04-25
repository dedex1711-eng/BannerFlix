# ✅ Checklist de Migração para Supabase

## 📦 Arquivos Atualizados (Já feito por mim)

- [x] `index.html` → Usa `planos-creditos-supabase.js`
- [x] `admin.html` → Usa `admin-supabase.js`
- [x] `supabase-auth.js` → Salva no Supabase
- [x] `EXECUTAR-NO-SUPABASE.sql` → Comandos SQL prontos

---

## 🎯 O que VOCÊ precisa fazer

### Passo 1: Supabase SQL
- [ ] Acessar https://supabase.com/dashboard
- [ ] Ir em SQL Editor
- [ ] Abrir arquivo `EXECUTAR-NO-SUPABASE.sql`
- [ ] Copiar TODO o conteúdo
- [ ] Colar no SQL Editor
- [ ] Clicar em RUN
- [ ] Ver mensagem "Success"

### Passo 2: Verificar Tabelas
- [ ] Executar query de verificação:
```sql
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'perfis';
```
- [ ] Confirmar que existem as colunas:
  - [ ] `plano`
  - [ ] `creditos`
  - [ ] `plano_expira_em`
  - [ ] `site`
  - [ ] `mostrar_site_banner`

### Passo 3: Testar Cadastro
- [ ] Abrir `index.html` no navegador
- [ ] Criar nova conta de teste
- [ ] Fazer login
- [ ] Verificar no Supabase (Table Editor → perfis) se usuário foi criado
- [ ] Confirmar que `plano = 'teste'` e `creditos = 5`

### Passo 4: Testar Perfil
- [ ] Clicar no avatar → "Meu Perfil"
- [ ] Preencher WhatsApp
- [ ] Preencher Instagram
- [ ] Fazer upload de logo
- [ ] Salvar
- [ ] Verificar no Supabase se dados foram salvos

### Passo 5: Testar Créditos
- [ ] Buscar um filme
- [ ] Gerar um banner
- [ ] Ver créditos diminuírem de 5 para 4
- [ ] Verificar no Supabase se `creditos = 4`
- [ ] Gerar mais 4 banners até zerar
- [ ] Ver modal "Créditos Esgotados"

### Passo 6: Testar Admin
- [ ] Fazer logout
- [ ] Fazer login com `dedex1711@gmail.com`
- [ ] Acessar `admin.html`
- [ ] Ver lista de todos os usuários
- [ ] Clicar em "Editar" em um usuário
- [ ] Mudar plano para "Mensal"
- [ ] Salvar
- [ ] Verificar que créditos mudaram para ∞
- [ ] Verificar no Supabase se `plano = 'mensal'` e `creditos = -1`

### Passo 7: Testar Expiração (Opcional)
- [ ] No Supabase, editar um usuário manualmente
- [ ] Definir `plano_expira_em` para uma data passada
- [ ] Fazer login com esse usuário
- [ ] Verificar se voltou para plano teste automaticamente

---

## 🎉 Conclusão

Quando todos os checkboxes estiverem marcados:
- ✅ Sistema 100% migrado para Supabase
- ✅ localStorage não é mais usado
- ✅ Admin funcional
- ✅ Créditos funcionando
- ✅ Planos configurados

---

## 📊 Status Atual

```
Arquivos atualizados:     ✅ 100%
SQL executado:            ⏳ Aguardando você
Testes realizados:        ⏳ Aguardando você
Sistema funcionando:      ⏳ Aguardando você
```

---

## 🚨 Erros Comuns

| Erro | Causa | Solução |
|------|-------|---------|
| "Erro ao carregar usuários" | SQL não executado | Execute `EXECUTAR-NO-SUPABASE.sql` |
| "permission denied" | Não é admin | Login com `dedex1711@gmail.com` |
| "column does not exist" | Colunas não criadas | Execute SQL novamente |
| "Erro ao salvar perfil" | Políticas RLS incorretas | Execute SQL novamente |

---

## 📞 Precisa de Ajuda?

Se algum passo falhar:
1. Abra o Console (F12)
2. Copie o erro
3. Me envie junto com:
   - Qual passo você está
   - Print da tela
   - Mensagem de erro completa

---

**IMPORTANTE:** Não pule nenhum passo! Siga na ordem.
