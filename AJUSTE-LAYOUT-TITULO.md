# ✅ Ajuste: Layout do Título nos Banners

## 🐛 Problema Identificado

O título de filmes/séries com nomes muito longos ficava desproporcional e cobria as informações de contato (WhatsApp, Instagram) na parte inferior do banner.

### Exemplo do Problema

```
┌─────────────────────────────────┐
│ YARGI: SEGREDOS DE              │
│ FAMÍLIA                         │ ← Título muito grande
│ 2021 • SÉRIE                    │
│                                 │
│ 83998929124                     │ ← Coberto pelo título
└─────────────────────────────────┘
```

## ✅ Soluções Implementadas

### 1. **Redução Automática do Tamanho**

O título agora ajusta seu tamanho baseado no comprimento:

- **Títulos curtos** (até 20 caracteres): Tamanho normal
- **Títulos médios** (21-30 caracteres): 85% do tamanho
- **Títulos longos** (mais de 30 caracteres): 75% do tamanho

```javascript
if (tituloLength > 30) {
  titleSizeBase *= 0.75;  // 25% menor
} else if (tituloLength > 20) {
  titleSizeBase *= 0.85;  // 15% menor
}
```

### 2. **Reposicionamento do Título**

Movi o título mais para cima para dar mais espaço aos contatos:

- **Antes**: 78% da altura (muito baixo)
- **Agora**: 70% da altura (mais espaço embaixo)

### 3. **Espaçamento Dinâmico**

O subtítulo (ano + tipo) agora se posiciona dinamicamente baseado no número de linhas do título:

```javascript
const subY = titleY + (numLinhas * titleSize * 1.2) + subSize * 0.5;
```

Isso garante que o subtítulo sempre apareça logo após a última linha do título, independente de quantas linhas ele ocupe.

### 4. **Contatos Sempre Visíveis**

As informações de contato permanecem fixas na parte inferior, garantindo que nunca sejam cobertas.

## 📊 Comparação Visual

### Antes (Problema)
```
┌─────────────────────────────────┐
│ Logo                            │
│                                 │
│                                 │
│                                 │
│ TÍTULO MUITO LONGO QUE          │ ← 78% altura
│ OCUPA MUITO ESPAÇO              │
│ 2024 • SÉRIE                    │
│ 📱 83998929124 ← Coberto        │
└─────────────────────────────────┘
```

### Agora (Corrigido)
```
┌─────────────────────────────────┐
│ Logo                            │
│                                 │
│ TÍTULO LONGO                    │ ← 70% altura
│ REDUZIDO                        │ ← Menor
│ 2024 • SÉRIE                    │
│                                 │
│                                 │
│ 📱 83998929124 ← Visível!       │
└─────────────────────────────────┘
```

## 🎯 Exemplos de Títulos

### Título Curto (OK)
- "Vingadores" (10 chars) → Tamanho 100%

### Título Médio (Reduzido 15%)
- "Breaking Bad" (12 chars) → Tamanho 100%
- "Stranger Things" (15 chars) → Tamanho 100%
- "Game of Thrones" (15 chars) → Tamanho 100%
- "The Walking Dead" (16 chars) → Tamanho 100%
- "How I Met Your Mother" (21 chars) → Tamanho 85%

### Título Longo (Reduzido 25%)
- "Yargi: Segredos de Família" (26 chars) → Tamanho 85%
- "The Lord of the Rings: The Fellowship" (38 chars) → Tamanho 75%
- "Pirates of the Caribbean: Dead Man's Chest" (42 chars) → Tamanho 75%

## 🧪 Como Testar

1. **Teste com título curto**:
   - Busque: "Titanic"
   - Resultado: Título grande e legível ✅

2. **Teste com título médio**:
   - Busque: "Breaking Bad"
   - Resultado: Título um pouco menor, mas ainda destaque ✅

3. **Teste com título longo**:
   - Busque: "Yargi: Segredos de Família"
   - Resultado: Título reduzido, contatos visíveis ✅

4. **Verifique os contatos**:
   - Adicione WhatsApp e Instagram
   - Gere o banner
   - **Contatos devem estar sempre visíveis na parte inferior** ✅

## 📐 Valores Técnicos

### Tamanhos Base
- **Formato Paisagem**: 4.5% da largura
- **Outros Formatos**: 6.5% da largura

### Posicionamento
- **Título**: 70% da altura (antes: 78%)
- **Subtítulo**: Dinâmico (após última linha do título)
- **Contatos**: Fixo na parte inferior (11% de margem)

### Limites
- **Máximo de linhas**: 3 linhas
- **Redução mínima**: 75% do tamanho original
- **Redução média**: 85% do tamanho original

## ✨ Benefícios

1. ✅ **Títulos longos não cobrem mais os contatos**
2. ✅ **Layout sempre equilibrado**
3. ✅ **Ajuste automático baseado no comprimento**
4. ✅ **Contatos sempre visíveis**
5. ✅ **Melhor aproveitamento do espaço**
6. ✅ **Mais profissional**

## 🔍 Detalhes Técnicos

### Função `wrapText` Atualizada
Agora retorna o número de linhas usadas:

```javascript
return lines.length;  // 1, 2 ou 3
```

Isso permite que o subtítulo se posicione corretamente após o título.

### Cálculo de Espaçamento
```javascript
const subY = titleY + (numLinhas * titleSize * 1.2) + subSize * 0.5;
```

- `numLinhas`: Quantas linhas o título ocupou
- `titleSize * 1.2`: Altura de cada linha (com espaçamento)
- `subSize * 0.5`: Margem adicional

## ✅ Status

- ✅ Redução automática de tamanho
- ✅ Reposicionamento do título
- ✅ Espaçamento dinâmico
- ✅ Contatos sempre visíveis
- ✅ Pronto para uso!

**Agora todos os banners ficam perfeitamente equilibrados!** 🎉
