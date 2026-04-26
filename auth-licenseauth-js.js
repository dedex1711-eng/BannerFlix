// =====================================================
// SISTEMA DE AUTENTICAÇÃO COM LICENSEAUTH (JavaScript)
// =====================================================

let usuarioAtual = null;

// Credenciais do BannerFlix
const LICENSEAUTH_CONFIG = {
  appName: "BannerFllix",
  ownerid: "Ob03SfvdAh",
  secret: "0bd6cd1719ffb6bd9e85caa9e68ab1a5536f02e59d5ee921d9bbb9120b3bab7b",
  version: "1.0"
};

// ===== INICIALIZAR LICENSEAUTH =====
let LicenseAuthApp = null;

function inicializarLicenseAuth() {
  try {
    if (typeof LicenseAuth === 'undefined') {
      console.error('❌ Biblioteca LicenseAuth não carregada!');
      mostrarErro('loginErro', 'Erro ao carregar sistema de autenticação');
      return false;
    }

    LicenseAuthApp = new LicenseAuth(
      LICENSEAUTH_CONFIG.appName,
      LICENSEAUTH_CONFIG.ownerid,
      LICENSEAUTH_CONFIG.secret,
      LICENSEAUTH_CONFIG.version
    );

    console.log('✅ LicenseAuth inicializado com sucesso');
    return true;
  } catch (err) {
    console.error('❌ Erro ao inicializar LicenseAuth:', err);
    return false;
  }
}

// ===== FAZER LOGIN COM CHAVE =====
async function fazerLoginComChave() {
  const licenseKey = document.getElementById('licenseKeyInput').value.trim();
  limparErros();

  if (!licenseKey) {
    mostrarErro('loginErro', 'Digite sua chave de licença.');
    return;
  }

  setBtnLoading('btnLoginChave', true, 'Verificando...');

  try {
    // Inicializa LicenseAuth se não estiver
    if (!LicenseAuthApp) {
      if (!inicializarLicenseAuth()) {
        setBtnLoading('btnLoginChave', false, 'Entrar');
        return;
      }
    }

    // Tenta fazer login com a chave
    console.log('🔑 Tentando login com chave:', licenseKey);

    // Usar o método de login do LicenseAuth
    LicenseAuthApp.login(licenseKey, (response) => {
      console.log('📨 Resposta do LicenseAuth:', response);

      if (response.success) {
        // Sucesso! Pega os dados do usuário
        const userData = response.user || {};

        // Salva dados do usuário
        usuarioAtual = {
          id: userData.username || licenseKey,
          email: userData.email || '',
          nome: userData.username || 'Usuário',
          plano: userData.subscription || 'teste',
          creditos: -1, // LicenseAuth não controla créditos
          token: response.token || licenseKey,
          userData: userData
        };

        // Salva no localStorage
        localStorage.setItem('bannerflix_user', JSON.stringify(usuarioAtual));
        localStorage.setItem('bannerflix_token', usuarioAtual.token);

        console.log('✅ Login realizado com sucesso!', usuarioAtual);

        // Atualiza interface
        atualizarNavbar();
        fecharTodosModais();
        showToast('✅ Login realizado com sucesso!');

        // Carrega perfil
        carregarPerfilDoUsuario(userData);

        setBtnLoading('btnLoginChave', false, 'Entrar');
      } else {
        console.error('❌ Erro no login:', response.message);
        mostrarErro('loginErro', response.message || 'Chave de licença inválida');
        setBtnLoading('btnLoginChave', false, 'Entrar');
      }
    });

  } catch (err) {
    setBtnLoading('btnLoginChave', false, 'Entrar');
    console.error('❌ Erro no login:', err);
    mostrarErro('loginErro', 'Erro de conexão. Verifique sua internet.');
  }
}

// ===== CARREGAR PERFIL DO USUÁRIO =====
function carregarPerfilDoUsuario(userData) {
  // Primeiro tenta carregar do localStorage
  const perfilKey = 'bannerflix_perfil_' + usuarioAtual.id;
  const perfilJson = localStorage.getItem(perfilKey);

  if (perfilJson) {
    try {
      const data = JSON.parse(perfilJson);
      console.log('✅ Perfil carregado do localStorage:', data);

      const set = (id, val) => {
        const el = document.getElementById(id);
        if (el && val) el.value = val;
      };

      set('inputWhatsapp', data.whatsapp);
      set('inputInstagram', data.instagram);
      set('inputSite', data.site);
      set('inputTexto', data.texto_extra);

      const checkSite = document.getElementById('checkMostrarSiteBanner');
      if (checkSite && data.mostrar_site_banner !== undefined) {
        checkSite.checked = data.mostrar_site_banner;
      }

      if (data.logo_url) {
        carregarLogoDeUrl(data.logo_url);
      }
      return;
    } catch (err) {
      console.error('❌ Erro ao carregar perfil do localStorage:', err);
    }
  }

  // Se não tem no localStorage, usa dados do servidor
  const set = (id, val) => {
    const el = document.getElementById(id);
    if (el && val) el.value = val;
  };

  set('inputWhatsapp', userData.whatsapp || '');
  set('inputInstagram', userData.instagram || '');
  set('inputSite', userData.site || '');
  set('inputTexto', userData.texto_extra || '');

  const checkSite = document.getElementById('checkMostrarSiteBanner');
  if (checkSite && userData.mostrar_site_banner !== undefined) {
    checkSite.checked = userData.mostrar_site_banner;
  }

  if (userData.logo_url) {
    carregarLogoDeUrl(userData.logo_url);
  }
}

// ===== VERIFICAR CRÉDITOS =====
async function verificarCreditos() {
  if (!usuarioAtual) return { temCredito: false, plano: null, creditos: 0 };

  // Para planos ilimitados
  if (usuarioAtual.creditos === -1) {
    return { temCredito: true, plano: usuarioAtual.plano, creditos: -1 };
  }

  // Para planos com créditos limitados
  return {
    temCredito: usuarioAtual.creditos > 0,
    plano: usuarioAtual.plano,
    creditos: usuarioAtual.creditos
  };
}

// ===== CONSUMIR CRÉDITO =====
async function consumirCredito() {
  if (!usuarioAtual) return false;

  const { temCredito, creditos } = await verificarCreditos();

  if (!temCredito) {
    mostrarModalSemCreditos();
    return false;
  }

  // Se for ilimitado, não desconta
  if (creditos === -1) return true;

  // Desconta 1 crédito localmente
  usuarioAtual.creditos = creditos - 1;
  localStorage.setItem('bannerflix_user', JSON.stringify(usuarioAtual));

  atualizarDisplayCreditos();
  return true;
}

// ===== ATUALIZAR DISPLAY DE CRÉDITOS =====
function atualizarDisplayCreditos() {
  if (!usuarioAtual) return;

  const displayEl = document.getElementById('creditosDisplay');
  if (!displayEl) return;

  const planos = {
    teste: { nome: 'Teste', cor: '#6b7280' },
    mensal: { nome: 'Mensal', cor: '#7c3aed' },
    anual: { nome: 'Anual', cor: '#2563eb' },
    vitalicio: { nome: 'Vitalício', cor: '#eab308' }
  };

  const planoConfig = planos[usuarioAtual.plano] || planos.teste;
  const creditos = usuarioAtual.creditos;

  if (creditos === -1) {
    displayEl.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="color: ${planoConfig.cor}; font-weight: 700;">∞</span>
        <span style="font-size: 0.85rem; color: var(--text-muted);">${planoConfig.nome}</span>
      </div>
    `;
  } else {
    displayEl.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="color: ${planoConfig.cor}; font-weight: 700;">${creditos}</span>
        <span style="font-size: 0.85rem; color: var(--text-muted);">créditos</span>
      </div>
    `;
  }
}

// ===== LOGOUT =====
function fazerLogout() {
  usuarioAtual = null;
  localStorage.removeItem('bannerflix_user');
  localStorage.removeItem('bannerflix_token');

  // Limpa interface
  atualizarNavbar();

  // Limpa campos
  ['inputWhatsapp', 'inputInstagram', 'inputSite', 'inputTexto'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });

  if (typeof removerLogo === 'function') {
    removerLogo();
  }

  showToast('👋 Você saiu da conta.');
}

// ===== INICIALIZAÇÃO =====
window.addEventListener('load', () => {
  // Inicializa LicenseAuth
  inicializarLicenseAuth();

  // Verifica se há usuário salvo
  const savedUser = localStorage.getItem('bannerflix_user');
  const savedToken = localStorage.getItem('bannerflix_token');

  if (savedUser && savedToken) {
    try {
      usuarioAtual = JSON.parse(savedUser);

      // Verifica se o token não expirou (opcional)
      if (usuarioAtual.token) {
        atualizarNavbar();
        atualizarDisplayCreditos();
        carregarPerfilDoUsuario(usuarioAtual.userData || {});
      } else {
        // Token expirado
        fazerLogout();
      }
    } catch (err) {
      console.error('Erro ao carregar usuário salvo:', err);
      fazerLogout();
    }
  }

  // Event listeners
  const btnAbrirAuth = document.getElementById('btnAbrirAuth');
  if (btnAbrirAuth) {
    btnAbrirAuth.addEventListener('click', () => {
      console.log('🔵 Botão Entrar clicado');
      abrirModal('login');
    });
  }

  const navAvatar = document.getElementById('navAvatar');
  if (navAvatar) {
    navAvatar.addEventListener('click', () => {
      document.getElementById('navUserMenu').classList.toggle('open');
    });
  }

  // Fecha menu ao clicar fora
  document.addEventListener('click', e => {
    const menu = document.getElementById('navUserMenu');
    const avatar = document.getElementById('navAvatar');
    if (menu && !menu.contains(e.target) && e.target !== avatar) {
      menu.classList.remove('open');
    }
  });

  // Fecha modais com ESC
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') fecharTodosModais();
  });
});

// ===== FUNÇÕES AUXILIARES =====
function mostrarErro(id, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.style.display = 'block';
  el.style.color = '#ef4444';
}

function limparErros() {
  ['loginErro'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.textContent = '';
      el.style.display = 'none';
    }
  });
}

function setBtnLoading(id, loading, texto) {
  const btn = document.getElementById(id);
  if (!btn) return;
  btn.disabled = loading;
  btn.innerHTML = loading ? '<span class="spinner"></span> ' + texto : texto;
}

function showToast(msg) {
  if (typeof window.showToast === 'function') {
    window.showToast(msg);
  } else {
    console.log(msg);
  }
}

function fecharTodosModais() {
  document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('open'));
}

function mostrarModalSemCreditos() {
  const modal = document.getElementById('modalSemCreditos');
  if (modal) {
    modal.classList.add('open');
  }
}

function abrirModal(tipo) {
  console.log('🔵 abrirModal chamado com tipo:', tipo);
  fecharTodosModais();
  if (tipo === 'login' || tipo === 'cadastro') {
    const modal = document.getElementById('modalAuth');
    if (!modal) {
      console.error('❌ Modal modalAuth não encontrado');
      return;
    }
    modal.classList.add('open');
    console.log('✅ Modal aberto');
  } else if (tipo === 'perfil') {
    const modal = document.getElementById('modalPerfil');
    if (!modal) {
      console.error('❌ Modal modalPerfil não encontrado');
      return;
    }
    modal.classList.add('open');
    preencherFormPerfil();
  }
}

function fecharModal() {
  fecharTodosModais();
}

function fecharModalFora(e) {
  if (e.target.classList.contains('modal-overlay')) fecharTodosModais();
}

function abrirPerfil() {
  const menu = document.getElementById('navUserMenu');
  if (menu) menu.classList.remove('open');
  abrirModal('perfil');
}

function atualizarNavbar() {
  const btnAuth = document.getElementById('btnAbrirAuth');
  const navUser = document.getElementById('navUser');
  const navEmail = document.getElementById('navUserEmail');
  const navAvatar = document.getElementById('navAvatar');
  const criadorBloqueado = document.getElementById('criadorBloqueado');
  const criadorConteudo = document.getElementById('criadorConteudo');
  const creditosDisplay = document.getElementById('creditosDisplay');
  const btnAdmin = document.getElementById('btnAdmin');

  if (usuarioAtual) {
    if (btnAuth) btnAuth.style.display = 'none';
    if (navUser) navUser.style.display = 'flex';
    if (creditosDisplay) creditosDisplay.style.display = 'block';

    const email = usuarioAtual.email || '';
    if (navEmail) navEmail.textContent = email;
    if (navAvatar) navAvatar.textContent = email.charAt(0).toUpperCase();

    if (criadorBloqueado) criadorBloqueado.style.display = 'none';
    if (criadorConteudo) criadorConteudo.style.display = 'block';

    // Mostra botão Admin apenas para emails autorizados
    if (btnAdmin) {
      const admins = ['dedex1711@gmail.com', 'admin@bannerflix.com'];
      btnAdmin.style.display = admins.includes(email) ? 'block' : 'none';
    }

    atualizarDisplayCreditos();
  } else {
    if (btnAuth) btnAuth.style.display = 'block';
    if (navUser) navUser.style.display = 'none';
    if (creditosDisplay) creditosDisplay.style.display = 'none';
    if (btnAdmin) btnAdmin.style.display = 'none';
    if (criadorBloqueado) criadorBloqueado.style.display = 'block';
    if (criadorConteudo) criadorConteudo.style.display = 'none';
  }
}

// ===== PERFIL — PREENCHER FORM =====
function preencherFormPerfil() {
  if (!usuarioAtual) return;

  const set = (id, srcId) => {
    const dest = document.getElementById(id);
    const src = document.getElementById(srcId);
    if (dest && src) dest.value = src.value;
  };

  set('perfilWhatsapp', 'inputWhatsapp');
  set('perfilInstagram', 'inputInstagram');
  set('perfilSite', 'inputSite');
  set('perfilTexto', 'inputTexto');

  // Sincroniza checkbox
  const checkSrc = document.getElementById('checkMostrarSiteBanner');
  const checkDest = document.getElementById('perfilCheckMostrarSiteBanner');
  if (checkSrc && checkDest) {
    checkDest.checked = checkSrc.checked;
  }

  const nome = usuarioAtual.nome || '';
  const perfilNome = document.getElementById('perfilNome');
  if (perfilNome) perfilNome.value = nome;

  const logoSrc = document.getElementById('logoPreview')?.src;
  const perfilPreview = document.getElementById('perfilLogoPreview');
  const perfilPlaceholder = document.getElementById('perfilLogoPlaceholder');
  const perfilBtnRemove = document.getElementById('perfilBtnRemoveLogo');

  if (logoSrc && logoSrc !== window.location.href) {
    if (perfilPreview) { perfilPreview.src = logoSrc; perfilPreview.style.display = 'block'; }
    if (perfilPlaceholder) perfilPlaceholder.style.display = 'none';
    if (perfilBtnRemove) perfilBtnRemove.style.display = 'block';
  } else {
    if (perfilPreview) perfilPreview.style.display = 'none';
    if (perfilPlaceholder) perfilPlaceholder.style.display = 'block';
    if (perfilBtnRemove) perfilBtnRemove.style.display = 'none';
  }
}

// ===== PERFIL — LOGO NO MODAL =====
let perfilLogoFile = null;

function perfilCarregarLogo(event) {
  const file = event.target.files[0];
  if (!file) return;
  perfilLogoFile = file;

  const reader = new FileReader();
  reader.onload = e => {
    const preview = document.getElementById('perfilLogoPreview');
    const placeholder = document.getElementById('perfilLogoPlaceholder');
    const btnRemove = document.getElementById('perfilBtnRemoveLogo');
    if (preview) { preview.src = e.target.result; preview.style.display = 'block'; }
    if (placeholder) placeholder.style.display = 'none';
    if (btnRemove) btnRemove.style.display = 'block';
  };
  reader.readAsDataURL(file);
}

function perfilRemoverLogo() {
  perfilLogoFile = null;
  const preview = document.getElementById('perfilLogoPreview');
  const placeholder = document.getElementById('perfilLogoPlaceholder');
  const btnRemove = document.getElementById('perfilBtnRemoveLogo');
  const input = document.getElementById('perfilLogoInput');
  if (preview) { preview.src = ''; preview.style.display = 'none'; }
  if (placeholder) placeholder.style.display = 'block';
  if (btnRemove) btnRemove.style.display = 'none';
  if (input) input.value = '';
}

// ===== PERFIL — SALVAR =====
async function salvarPerfil() {
  console.log('🔵 salvarPerfil iniciado');
  if (!usuarioAtual) {
    mostrarErro('perfilErro', 'Você precisa estar logado.');
    return;
  }

  limparErros();
  setBtnLoading('btnSalvarPerfil', true, '💾 Salvar Perfil');

  const nome = document.getElementById('perfilNome')?.value.trim() || '';
  const whatsapp = document.getElementById('perfilWhatsapp')?.value.trim() || '';
  const instagram = document.getElementById('perfilInstagram')?.value.trim() || '';
  const site = document.getElementById('perfilSite')?.value.trim() || '';
  const mostrar_site_banner = document.getElementById('perfilCheckMostrarSiteBanner')?.checked ?? true;
  const texto = document.getElementById('perfilTexto')?.value.trim() || '';

  console.log('📝 Dados:', { nome, whatsapp, instagram, site, mostrar_site_banner, texto, temLogo: !!perfilLogoFile });

  let logo_url = null;

  try {
    // Converte e comprime logo para base64
    if (perfilLogoFile) {
      console.log('📤 Convertendo e comprimindo logo...');
      logo_url = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => {
          const img = new Image();
          img.onload = () => {
            const maxW = 400;
            const maxH = 400;
            let w = img.width;
            let h = img.height;

            if (w > maxW || h > maxH) {
              const scale = Math.min(maxW / w, maxH / h);
              w = w * scale;
              h = h * scale;
            }

            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');

            ctx.clearRect(0, 0, w, h);
            ctx.drawImage(img, 0, 0, w, h);

            const compressed = canvas.toDataURL('image/png');
            resolve(compressed);
          };
          img.onerror = reject;
          img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(perfilLogoFile);
      });
      console.log('✅ Logo comprimida (tamanho:', logo_url.length, 'chars)');
    } else {
      const logoPreview = document.getElementById('logoPreview');
      if (logoPreview && logoPreview.src && logoPreview.src !== window.location.href) {
        logo_url = logoPreview.src;
        console.log('ℹ️ Mantendo logo existente da tela');
      } else {
        logo_url = null;
        console.log('ℹ️ Sem logo');
      }
    }

    // Salva LOCALMENTE no navegador
    console.log('💾 Salvando perfil no localStorage...');
    const perfil = {
      userId: usuarioAtual.id,
      email: usuarioAtual.email,
      nome,
      whatsapp,
      instagram,
      site,
      mostrar_site_banner,
      texto_extra: texto,
      logo_url,
      updated_at: new Date().toISOString(),
    };

    localStorage.setItem('bannerflix_perfil_' + usuarioAtual.id, JSON.stringify(perfil));
    console.log('✅ Perfil salvo no localStorage!');

    // Atualiza campos na tela principal
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
    set('inputWhatsapp', whatsapp);
    set('inputInstagram', instagram);
    set('inputSite', site);
    set('inputTexto', texto);

    const checkSite = document.getElementById('checkMostrarSiteBanner');
    if (checkSite) checkSite.checked = mostrar_site_banner;

    if (logo_url) await carregarLogoDeUrl(logo_url);

    setBtnLoading('btnSalvarPerfil', false, '💾 Salvar Perfil');

    const perfilSucesso = document.getElementById('perfilSucesso');
    if (perfilSucesso) {
      perfilSucesso.textContent = '✅ Perfil salvo com sucesso!';
      perfilSucesso.style.display = 'block';
      perfilSucesso.style.color = '#10b981';
    }

    setTimeout(() => fecharTodosModais(), 1200);

    showToast('✅ Perfil salvo!');

  } catch (err) {
    console.error('❌ Erro inesperado:', err);
    mostrarErro('perfilErro', 'Erro inesperado: ' + err.message);
    setBtnLoading('btnSalvarPerfil', false, '💾 Salvar Perfil');
  }
}

// ===== CARREGAR LOGO DE URL =====
async function carregarLogoDeUrl(url) {
  return new Promise(resolve => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (typeof window.logoImg !== 'undefined') {
        window.logoImg = img;
      }

      const preview = document.getElementById('logoPreview');
      if (preview) {
        preview.src = url;
        preview.style.display = 'block';
      }

      const placeholder = document.getElementById('logoPlaceholder');
      if (placeholder) placeholder.style.display = 'none';

      const btnRemove = document.getElementById('btnRemoveLogo');
      if (btnRemove) btnRemove.style.display = 'block';

      resolve();
    };
    img.onerror = () => {
      console.error('Erro ao carregar logo:', url);
      resolve();
    };
    img.src = url;
  });
}
