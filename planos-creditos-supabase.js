// =====================================================
// SISTEMA DE PLANOS E CRÉDITOS - VERSÃO SUPABASE
// =====================================================

// Definição dos planos
const PLANOS = {
  teste: {
    nome: 'Teste',
    creditos: 50,
    preco: 0,
    duracao: null,
    cor: '#6b7280'
  },
  mensal: {
    nome: 'Mensal',
    creditos: -1,
    preco: 29.90,
    duracao: 30,
    cor: '#7c3aed'
  },
  anual: {
    nome: 'Anual',
    creditos: -1,
    preco: 299.90,
    duracao: 365,
    cor: '#2563eb'
  },
  vitalicio: {
    nome: 'Vitalício',
    creditos: -1,
    preco: 997.00,
    duracao: null,
    cor: '#eab308'
  }
};

// ===== VERIFICAR CRÉDITOS DO USUÁRIO =====
async function verificarCreditos() {
  if (!usuarioAtual) return { temCredito: false, plano: null, creditos: 0 };

  try {
    // Busca perfil do Supabase
    const { data, error } = await sb
      .from('perfis')
      .select('plano, creditos, plano_expira_em')
      .eq('id', usuarioAtual.id)
      .single();

    if (error) {
      console.error('Erro ao verificar créditos:', error);
      return { temCredito: false, plano: 'teste', creditos: 0 };
    }

    if (!data) {
      // Primeiro acesso - criar perfil
      await criarPerfilInicial();
      return { temCredito: true, plano: 'teste', creditos: 50 };
    }

    // Verifica se o plano expirou
    if (data.plano_expira_em) {
      const expiracao = new Date(data.plano_expira_em);
      if (expiracao < new Date()) {
        // Plano expirado - reseta para teste
        await resetarParaTeste();
        return { temCredito: true, plano: 'teste', creditos: 50 };
      }
    }

    // Planos ilimitados
    if (data.creditos === -1) {
      return { temCredito: true, plano: data.plano, creditos: -1 };
    }

    // Planos com créditos limitados
    return {
      temCredito: data.creditos > 0,
      plano: data.plano,
      creditos: data.creditos
    };
  } catch (err) {
    console.error('Erro ao verificar créditos:', err);
    return { temCredito: false, plano: 'teste', creditos: 0 };
  }
}

// ===== CRIAR PERFIL INICIAL =====
async function criarPerfilInicial() {
  const { error } = await sb
    .from('perfis')
    .upsert({
      id: usuarioAtual.id,
      plano: 'teste',
      creditos: 50,
      plano_expira_em: null
    });

  if (error) {
    console.error('Erro ao criar perfil inicial:', error);
  }
}

// ===== RESETAR PARA TESTE =====
async function resetarParaTeste() {
  const { error } = await sb
    .from('perfis')
    .update({
      plano: 'teste',
      creditos: 50,
      plano_expira_em: null
    })
    .eq('id', usuarioAtual.id);

  if (error) {
    console.error('Erro ao resetar plano:', error);
  }
}

// ===== CONSUMIR CRÉDITO =====
async function consumirCredito() {
  if (!usuarioAtual) return false;

  const { temCredito, plano, creditos } = await verificarCreditos();

  if (!temCredito) {
    mostrarModalSemCreditos();
    return false;
  }

  // Se for ilimitado, não desconta
  if (creditos === -1) {
    // Registra no histórico (opcional)
    await registrarBannerGerado();
    return true;
  }

  // Desconta 1 crédito
  const { error } = await sb
    .from('perfis')
    .update({ creditos: creditos - 1 })
    .eq('id', usuarioAtual.id);

  if (error) {
    console.error('Erro ao consumir crédito:', error);
    showToast('❌ Erro ao consumir crédito');
    return false;
  }

  // Registra no histórico (opcional)
  await registrarBannerGerado();

  // Atualiza display
  await atualizarDisplayCreditos();

  return true;
}

// ===== REGISTRAR BANNER GERADO (OPCIONAL) =====
async function registrarBannerGerado() {
  if (!filmeAtual) return;

  const formato = document.querySelector('input[name="formato"]:checked')?.value || 'whatsapp';
  const template = document.querySelector('input[name="template"]:checked')?.value || 'simples';

  const { error } = await sb
    .from('historico_banners')
    .insert({
      user_id: usuarioAtual.id,
      filme_nome: filmeAtual.title,
      formato: formato,
      template: template
    });

  if (error) {
    console.error('Erro ao registrar histórico:', error);
  }
}

// ===== ATUALIZAR PLANO =====
async function atualizarPlano(novoPlano) {
  if (!usuarioAtual) return false;
  if (!PLANOS[novoPlano]) return false;

  const planoConfig = PLANOS[novoPlano];

  const updates = {
    plano: novoPlano,
    creditos: planoConfig.creditos
  };

  // Define data de expiração
  if (planoConfig.duracao) {
    const expiracao = new Date();
    expiracao.setDate(expiracao.getDate() + planoConfig.duracao);
    updates.plano_expira_em = expiracao.toISOString();
  } else {
    updates.plano_expira_em = null;
  }

  const { error } = await sb
    .from('perfis')
    .update(updates)
    .eq('id', usuarioAtual.id);

  if (error) {
    console.error('Erro ao atualizar plano:', error);
    return false;
  }

  await atualizarDisplayCreditos();
  return true;
}

// ===== ATUALIZAR DISPLAY DE CRÉDITOS =====
async function atualizarDisplayCreditos() {
  if (!usuarioAtual) return;

  const { temCredito, plano, creditos } = await verificarCreditos();

  const displayEl = document.getElementById('creditosDisplay');
  if (!displayEl) return;

  const planoConfig = PLANOS[plano];
  const planoNome = planoConfig?.nome || 'Teste';
  const planoCor = planoConfig?.cor || '#6b7280';

  if (creditos === -1) {
    displayEl.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="color: ${planoCor}; font-weight: 700;">∞</span>
        <span style="font-size: 0.85rem; color: var(--text-muted);">créditos</span>
      </div>
    `;
  } else {
    displayEl.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="color: ${planoCor}; font-weight: 700;">${creditos}</span>
        <span style="font-size: 0.85rem; color: var(--text-muted);">créditos</span>
      </div>
    `;
  }
}

// ===== MODAL SEM CRÉDITOS =====
function mostrarModalSemCreditos() {
  const modal = document.getElementById('modalSemCreditos');
  if (modal) {
    modal.classList.add('open');
  }
}

// ===== INICIALIZAÇÃO =====
if (typeof sb !== 'undefined') {
  sb.auth.onAuthStateChange(async (event, session) => {
    if (session?.user) {
      setTimeout(async () => {
        if (typeof usuarioAtual !== 'undefined' && usuarioAtual) {
          await atualizarDisplayCreditos();
        }
      }, 200);
    }
  });
}

window.addEventListener('load', async () => {
  setTimeout(async () => {
    if (typeof usuarioAtual !== 'undefined' && usuarioAtual) {
      await atualizarDisplayCreditos();
    }
  }, 500);
});
