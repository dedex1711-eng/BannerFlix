// =====================================================
// PAINEL ADMINISTRATIVO
// =====================================================

let todosUsuarios = [];
let usuarioEditando = null;

// ===== CARREGAR USUÁRIOS =====
async function carregarUsuarios() {
  console.log('📂 Carregando usuários...');
  
  todosUsuarios = [];
  
  // Busca todos os perfis salvos no localStorage
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    
    // Procura apenas chaves de perfil
    if (key && key.startsWith('divulga_perfil_')) {
      try {
        const perfilJson = localStorage.getItem(key);
        const perfil = JSON.parse(perfilJson);
        
        // Extrai o userId da chave
        const userId = key.replace('divulga_perfil_', '');
        
        // Busca informações do usuário no Supabase
        const { data: userData, error } = await sb.auth.admin.getUserById(userId);
        
        let email = 'Desconhecido';
        let nome = perfil.nome || '';
        
        if (!error && userData?.user) {
          email = userData.user.email || 'Desconhecido';
          nome = userData.user.user_metadata?.nome || perfil.nome || '';
        } else {
          // Se não conseguir buscar do Supabase, tenta pegar do perfil
          // Assume que o email pode estar salvo em algum lugar
          email = perfil.email || userId.substring(0, 20) + '...';
        }
        
        todosUsuarios.push({
          id: userId,
          email: email,
          nome: nome,
          plano: perfil.plano || 'teste',
          creditos: perfil.creditos !== undefined ? perfil.creditos : 5,
          plano_expira_em: perfil.plano_expira_em,
          created_at: perfil.created_at || new Date().toISOString()
        });
      } catch (e) {
        console.error('Erro ao processar perfil:', e);
      }
    }
  }

  // Ordena por data de criação (mais recentes primeiro)
  todosUsuarios.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  if (todosUsuarios.length === 0) {
    document.getElementById('usuariosTableBody').innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center;padding:40px;color:var(--text-muted);">
          Nenhum usuário encontrado
        </td>
      </tr>
    `;
    atualizarEstatisticas();
    return;
  }

  renderizarUsuarios();
  atualizarEstatisticas();
}

// ===== RENDERIZAR USUÁRIOS =====
function renderizarUsuarios(filtro = '') {
  const tbody = document.getElementById('usuariosTableBody');
  if (!tbody) return;

  const usuariosFiltrados = todosUsuarios.filter(u => 
    u.email.toLowerCase().includes(filtro.toLowerCase()) ||
    (u.nome && u.nome.toLowerCase().includes(filtro.toLowerCase()))
  );

  if (usuariosFiltrados.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center;padding:40px;color:var(--text-muted);">
          Nenhum usuário encontrado
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = usuariosFiltrados.map(user => {
    const planoClass = `plano-${user.plano}`;
    const creditosDisplay = user.creditos === -1 ? '∞' : user.creditos;
    
    let expiraEm = '-';
    if (user.plano_expira_em) {
      const expiracao = new Date(user.plano_expira_em);
      const hoje = new Date();
      const diasRestantes = Math.ceil((expiracao - hoje) / (1000 * 60 * 60 * 24));
      
      if (diasRestantes < 0) {
        expiraEm = '<span style="color:#ef4444;">Expirado</span>';
      } else if (diasRestantes === 0) {
        expiraEm = '<span style="color:#f59e0b;">Hoje</span>';
      } else if (diasRestantes <= 7) {
        expiraEm = `<span style="color:#f59e0b;">${diasRestantes} dias</span>`;
      } else {
        expiraEm = `${diasRestantes} dias`;
      }
    }

    return `
      <tr>
        <td>${user.email}</td>
        <td>${user.nome || '-'}</td>
        <td><span class="plano-badge ${planoClass}">${user.plano}</span></td>
        <td>${creditosDisplay}</td>
        <td>${expiraEm}</td>
        <td>
          <button class="btn-action" onclick="editarUsuario('${user.id}')">✏️ Editar</button>
          <button class="btn-action btn-danger" onclick="confirmarExcluirUsuario('${user.id}', '${user.email}')">🗑️ Excluir</button>
        </td>
      </tr>
    `;
  }).join('');
}

// ===== FILTRAR USUÁRIOS =====
function filtrarUsuarios() {
  const filtro = document.getElementById('searchInput').value;
  renderizarUsuarios(filtro);
}

// ===== ATUALIZAR ESTATÍSTICAS =====
function atualizarEstatisticas() {
  const total = todosUsuarios.length;
  const teste = todosUsuarios.filter(u => u.plano === 'teste').length;
  const mensal = todosUsuarios.filter(u => u.plano === 'mensal').length;
  const anual = todosUsuarios.filter(u => u.plano === 'anual').length;
  const vitalicio = todosUsuarios.filter(u => u.plano === 'vitalicio').length;

  document.getElementById('totalUsuarios').textContent = total;
  document.getElementById('usuariosTeste').textContent = teste;
  document.getElementById('usuariosMensal').textContent = mensal;
  document.getElementById('usuariosAnual').textContent = anual;
  document.getElementById('usuariosVitalicio').textContent = vitalicio;
}

// ===== EDITAR USUÁRIO =====
function editarUsuario(userId) {
  const user = todosUsuarios.find(u => u.id === userId);
  if (!user) return;

  usuarioEditando = user;

  document.getElementById('editEmail').value = user.email;
  document.getElementById('editPlano').value = user.plano;
  document.getElementById('editCreditos').value = user.creditos === -1 ? 0 : user.creditos;

  document.getElementById('modalEditarUsuario').classList.add('open');
}

// ===== SALVAR EDIÇÃO =====
function salvarEdicaoUsuario() {
  if (!usuarioEditando) return;

  const novoPlano = document.getElementById('editPlano').value;
  const novosCreditos = parseInt(document.getElementById('editCreditos').value) || 0;

  const perfilKey = 'divulga_perfil_' + usuarioEditando.id;
  const perfilJson = localStorage.getItem(perfilKey);
  let perfil = perfilJson ? JSON.parse(perfilJson) : {};

  // Configuração do plano
  const PLANOS = {
    teste: { creditos: novosCreditos, duracao: null },
    mensal: { creditos: -1, duracao: 30 },
    anual: { creditos: -1, duracao: 365 },
    vitalicio: { creditos: -1, duracao: null }
  };

  const planoConfig = PLANOS[novoPlano];
  
  perfil.plano = novoPlano;
  perfil.creditos = planoConfig.creditos;
  perfil.updated_at = new Date().toISOString();

  // Define data de expiração
  if (planoConfig.duracao) {
    const expiracao = new Date();
    expiracao.setDate(expiracao.getDate() + planoConfig.duracao);
    perfil.plano_expira_em = expiracao.toISOString();
  } else {
    perfil.plano_expira_em = null;
  }

  localStorage.setItem(perfilKey, JSON.stringify(perfil));

  showToast('✅ Usuário atualizado!');
  fecharModal();
  carregarUsuarios();
}

// ===== EXCLUIR USUÁRIO =====
function confirmarExcluirUsuario(userId, email) {
  if (!confirm(`Tem certeza que deseja excluir o usuário ${email}?\n\nEsta ação não pode ser desfeita.`)) {
    return;
  }

  excluirUsuario(userId);
}

async function excluirUsuario(userId) {
  // Remove do localStorage
  const perfilKey = 'divulga_perfil_' + userId;
  localStorage.removeItem(perfilKey);

  // Remove do Supabase (requer permissões de admin)
  const { error } = await sb.auth.admin.deleteUser(userId);

  if (error) {
    console.error('Erro ao excluir usuário:', error);
    showToast('❌ Erro ao excluir usuário');
    return;
  }

  showToast('✅ Usuário excluído!');
  carregarUsuarios();
}

// ===== MODAL =====
function fecharModal() {
  document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('open'));
  usuarioEditando = null;
}

function fecharModalFora(e) {
  if (e.target.classList.contains('modal-overlay')) fecharModal();
}

// ===== TOAST =====
function showToast(msg, duration = 2800) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), duration);
}

// ===== VERIFICAR ACESSO ADMIN =====
async function verificarAcessoAdmin() {
  if (!usuarioAtual) {
    window.location.href = 'index.html';
    return;
  }

  // Lista de emails admin
  const admins = [
    'admin@bannerflix.com',
    'dedex1711@gmail.com',
  ];

  if (!admins.includes(usuarioAtual.email)) {
    alert('Acesso negado. Você não tem permissão para acessar o painel administrativo.');
    window.location.href = 'index.html';
    return;
  }

  // Se chegou aqui, é admin
  carregarUsuarios();
}

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', () => {
  // Aguarda o usuário ser carregado
  setTimeout(() => {
    verificarAcessoAdmin();
  }, 500);
});
