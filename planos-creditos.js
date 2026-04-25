// =====================================================
// SISTEMA DE PLANOS E CRÉDITOS
// =====================================================

// Definição dos planos
const PLANOS = {
  teste: {
    nome: 'Teste',
    creditos: 5,
    preco: 0,
    duracao: null, // Não expira
    cor: '#6b7280'
  },
  mensal: {
    nome: 'Mensal',
    creditos: -1, // Ilimitado
    preco: 29.90,
    duracao: 30, // dias
    cor: '#7c3aed'
  },
  anual: {
    nome: 'Anual',
    creditos: -1, // Ilimitado
    preco: 299.90,
    duracao: 365, // dias
    cor: '#2563eb'
  },
  vitalicio: {
    nome: 'Vitalício',
    creditos: -1, // Ilimitado
    preco: 997.00,
    duracao: null, // Não expira
    cor: '#eab308'
  }
};

// ===== VERIFICAR CRÉDITOS DO USUÁRIO =====
async function verificarCreditos() {
  if (!usuarioAtual) return { temCredito: false, plano: null, creditos: 0 };

  const perfilKey = 'divulga_perfil_' + usuarioAtual.id;
  const perfilJson = localStorage.getItem(perfilKey);
  
  if (!perfilJson) {
    // Primeiro acesso - criar perfil com plano teste
    const perfil = {
      userId: usuarioAtual.id,
      plano: 'teste',
      creditos: 5,
      plano_expira_em: null,
      created_at: new Date().toISOString()
    };
    localStorage.setItem(perfilKey, JSON.stringify(perfil));
    return { temCredito: true, plano: 'teste', creditos: 5 };
  }

  const perfil = JSON.parse(perfilJson);
  
  // Verifica se o plano expirou
  if (perfil.plano_expira_em) {
    const expiracao = new Date(perfil.plano_expira_em);
    if (expiracao < new Date()) {
      // Plano expirado - volta para teste
      perfil.plano = 'teste';
      perfil.creditos = 5;
      perfil.plano_expira_em = null;
      localStorage.setItem(perfilKey, JSON.stringify(perfil));
      return { temCredito: true, plano: 'teste', creditos: 5 };
    }
  }

  // Planos ilimitados (-1)
  if (perfil.creditos === -1) {
    return { temCredito: true, plano: perfil.plano, creditos: -1 };
  }

  // Planos com créditos limitados
  return { 
    temCredito: perfil.creditos > 0, 
    plano: perfil.plano, 
    creditos: perfil.creditos 
  };
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
  if (creditos === -1) return true;

  // Desconta 1 crédito
  const perfilKey = 'divulga_perfil_' + usuarioAtual.id;
  const perfilJson = localStorage.getItem(perfilKey);
  const perfil = JSON.parse(perfilJson);
  
  perfil.creditos = creditos - 1;
  perfil.updated_at = new Date().toISOString();
  
  localStorage.setItem(perfilKey, JSON.stringify(perfil));
  
  atualizarDisplayCreditos();
  
  return true;
}

// ===== ATUALIZAR PLANO =====
async function atualizarPlano(novoPlano) {
  if (!usuarioAtual) return false;
  if (!PLANOS[novoPlano]) return false;

  const perfilKey = 'divulga_perfil_' + usuarioAtual.id;
  const perfilJson = localStorage.getItem(perfilKey);
  const perfil = perfilJson ? JSON.parse(perfilJson) : {};

  const planoConfig = PLANOS[novoPlano];
  
  perfil.plano = novoPlano;
  perfil.creditos = planoConfig.creditos;
  perfil.updated_at = new Date().toISOString();
  
  // Define data de expiração se o plano tiver duração
  if (planoConfig.duracao) {
    const expiracao = new Date();
    expiracao.setDate(expiracao.getDate() + planoConfig.duracao);
    perfil.plano_expira_em = expiracao.toISOString();
  } else {
    perfil.plano_expira_em = null;
  }

  localStorage.setItem(perfilKey, JSON.stringify(perfil));
  
  atualizarDisplayCreditos();
  
  return true;
}

// ===== ATUALIZAR DISPLAY DE CRÉDITOS =====
async function atualizarDisplayCreditos() {
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
        <span style="font-size: 0.85rem; color: var(--text-muted);">Plano ${planoNome}</span>
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
// Aguarda o usuário ser carregado antes de atualizar créditos
if (typeof sb !== 'undefined') {
  sb.auth.onAuthStateChange(async (event, session) => {
    if (session?.user) {
      // Aguarda um pouco para garantir que usuarioAtual foi definido
      setTimeout(async () => {
        if (typeof usuarioAtual !== 'undefined' && usuarioAtual) {
          await atualizarDisplayCreditos();
        }
      }, 200);
    }
  });
}

// Também tenta atualizar quando a página carrega
window.addEventListener('load', async () => {
  setTimeout(async () => {
    if (typeof usuarioAtual !== 'undefined' && usuarioAtual) {
      await atualizarDisplayCreditos();
    }
  }, 500);
});
