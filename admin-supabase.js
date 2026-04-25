// =====================================================
// PAINEL ADMINISTRATIVO - VERSÃO SUPABASE
// =====================================================

let todosUsuarios = [];
let usuarioEditando = null;

// ===== CARREGAR USUÁRIOS =====
async function carregarUsuarios() {
  console.log('📂 Carregando usuários do Supabase...');

  try {
    // Busca todos os perfis do Supabase
    const { data: perfis, error } = await sb
      .from('perfis')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao carregar perfis:', error);
      showToast('❌ Erro ao carregar usuários');
      document.getElementById('usuariosTableBody').innerHTML = `
        <tr>
          <td colspan="6" style="text-align:center;padding:40px;color:#ef4444;">
            ❌ Erro ao carregar usuários: ${error.message}
          </td>
        </tr>
      `;
      return;
    }

    if (!perfis || perfis.length === 0) {
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

    // Monta lista de usuários
    todosUsuarios = perfis.map(perfil => ({
      id: perfil.id,
      email: perfil.email || 'Sem email',
      nome: perfil.nome || '',
      plano: perfil.plano || 'teste',
      creditos: perfil.creditos !== undefined ? perfil.creditos : 5,
      plano_expira_em: perfil.plano_expira_em,
      created_at: perfil.created_at
    }));

    renderizarUsuarios();
    atualizarEstatisticas();
  } catch (err) {
    console.error('Erro inesperado:', err);
    showToast('❌ Erro inesperado ao carregar usuários');
  }
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
async function salvarEdicaoUsuario() {
  if (!usuarioEditando) return;

  const novoPlano = document.getElementById('editPlano').value;
  const novosCreditos = parseInt(document.getElementById('editCreditos').value) || 0;

  // Configuração do plano
  const PLANOS = {
    teste: { creditos: novosCreditos, duracao: null },
    mensal: { creditos: -1, duracao: 30 },
    anual: { creditos: -1, duracao: 365 },
    vitalicio: { creditos: -1, duracao: null }
  };

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

  // Atualiza no Supabase
  const { error } = await sb
    .from('perfis')
    .update(updates)
    .eq('id', usuarioEditando.id);

  if (error) {
    console.error('Erro ao atualizar usuário:', error);
    showToast('❌ Erro ao atualizar usuário');
    return;
  }

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
  // Remove perfil do Supabase
  const { error: perfilError } = await sb
    .from('perfis')
    .delete()
    .eq('id', userId);

  if (perfilError) {
    console.error('Erro ao excluir perfil:', perfilError);
    showToast('❌ Erro ao excluir perfil');
    return;
  }

  // Remove usuário do auth (requer permissões de admin)
  const { error: authError } = await sb.auth.admin.deleteUser(userId);

  if (authError) {
    console.error('Erro ao excluir usuário do auth:', authError);
    showToast('⚠️ Perfil excluído, mas erro ao remover autenticação');
  } else {
    showToast('✅ Usuário excluído completamente!');
  }

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
  setTimeout(() => {
    verificarAcessoAdmin();
  }, 500);
});
