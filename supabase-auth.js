// =====================================================
// SUPABASE CONFIG
// =====================================================
const SUPABASE_URL  = 'https://xobjappuhykothckyoqg.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhvYmphcHB1aHlrb3RoY2t5b3FnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwNjk1MDgsImV4cCI6MjA5MjY0NTUwOH0.J5C0LW6_pdyZjOswdD7jue9d8u05jYZpE9doR0l1Reg';

// Cria cliente Supabase
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);

// ===== ESTADO DO USUÁRIO =====
let usuarioAtual = null;

// ===== INICIALIZAÇÃO =====
sb.auth.onAuthStateChange(async (event, session) => {
  usuarioAtual = session?.user ?? null;
  
  // Se fez login, verifica se o perfil existe
  if (event === 'SIGNED_IN' && usuarioAtual) {
    await garantirPerfilExiste();
  }
  
  atualizarNavbar();
  if (usuarioAtual) await carregarPerfilNaTela();
});

(async () => {
  const { data: { session } } = await sb.auth.getSession();
  usuarioAtual = session?.user ?? null;
  
  // Se já está logado, verifica se o perfil existe
  if (usuarioAtual) {
    await garantirPerfilExiste();
  }
  
  atualizarNavbar();
  if (usuarioAtual) await carregarPerfilNaTela();
})();

// Garante que o perfil existe no Supabase
async function garantirPerfilExiste() {
  if (!usuarioAtual) return;
  
  try {
    // Verifica se o perfil existe
    const { data, error } = await sb
      .from('perfis')
      .select('id')
      .eq('id', usuarioAtual.id)
      .single();
    
    // Se não existe, cria
    if (error && error.code === 'PGRST116') {
      console.log('📝 Criando perfil no primeiro login...');
      
      const { error: insertError } = await sb.from('perfis').insert({
        id: usuarioAtual.id,
        email: usuarioAtual.email,
        nome: usuarioAtual.user_metadata?.nome || '',
        whatsapp: '',
        instagram: '',
        texto_extra: '',
        logo_url: null,
        plano: 'teste',
        creditos: 50,
      });
      
      if (insertError) {
        console.error('Erro ao criar perfil:', insertError);
      } else {
        console.log('✅ Perfil criado com sucesso!');
      }
    }
  } catch (err) {
    console.error('Erro ao verificar perfil:', err);
  }
}

// ===== NAVBAR =====
function atualizarNavbar() {
  const btnAuth = document.getElementById('btnAbrirAuth');
  const navUser = document.getElementById('navUser');
  const navEmail = document.getElementById('navUserEmail');
  const navAvatar = document.getElementById('navAvatar');
  const criadorBloqueado = document.getElementById('criadorBloqueado');
  const criadorConteudo  = document.getElementById('criadorConteudo');
  const creditosDisplay = document.getElementById('creditosDisplay');
  const btnAdmin = document.getElementById('btnAdmin');

  if (usuarioAtual) {
    btnAuth.style.display = 'none';
    navUser.style.display = 'flex';
    if (creditosDisplay) creditosDisplay.style.display = 'block';
    const email = usuarioAtual.email || '';
    navEmail.textContent = email;
    navAvatar.textContent = email.charAt(0).toUpperCase();
    if (criadorBloqueado) criadorBloqueado.style.display = 'none';
    if (criadorConteudo)  criadorConteudo.style.display  = 'block';
    
    // Mostra botão Admin apenas para emails autorizados
    if (btnAdmin) {
      const admins = ['dedex1711@gmail.com', 'admin@bannerflix.com'];
      btnAdmin.style.display = admins.includes(email) ? 'block' : 'none';
    }
    
    // Atualiza display de créditos
    if (typeof atualizarDisplayCreditos === 'function') {
      setTimeout(() => atualizarDisplayCreditos(), 100);
    }
  } else {
    btnAuth.style.display = 'block';
    navUser.style.display = 'none';
    if (creditosDisplay) creditosDisplay.style.display = 'none';
    if (btnAdmin) btnAdmin.style.display = 'none';
    if (criadorBloqueado) criadorBloqueado.style.display = 'block';
    if (criadorConteudo)  criadorConteudo.style.display  = 'none';
  }
}

document.getElementById('navAvatar')?.addEventListener('click', () => {
  document.getElementById('navUserMenu').classList.toggle('open');
});
document.addEventListener('click', e => {
  const menu = document.getElementById('navUserMenu');
  const avatar = document.getElementById('navAvatar');
  if (menu && !menu.contains(e.target) && e.target !== avatar) {
    menu.classList.remove('open');
  }
});

// ===== MODAIS =====
function abrirModal(tipo) {
  console.log('🔵 abrirModal chamado com tipo:', tipo);
  fecharTodosModais();
  if (tipo === 'login' || tipo === 'cadastro') {
    const modal = document.getElementById('modalAuth');
    if (!modal) { console.error('❌ Modal modalAuth não encontrado'); return; }
    modal.classList.add('open');
    trocarTab(tipo);
  } else if (tipo === 'perfil') {
    const modal = document.getElementById('modalPerfil');
    if (!modal) { console.error('❌ Modal modalPerfil não encontrado'); return; }
    modal.classList.add('open');
    preencherFormPerfil();
  }
  console.log('✅ Modal aberto');
}

function abrirPerfil() {
  document.getElementById('navUserMenu').classList.remove('open');
  abrirModal('perfil');
}

function fecharModal() { fecharTodosModais(); }
function fecharTodosModais() {
  document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('open'));
}
function fecharModalFora(e) {
  if (e.target.classList.contains('modal-overlay')) fecharTodosModais();
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') fecharTodosModais();
});

// ===== TABS AUTH =====
function trocarTab(tab) {
  document.getElementById('formLogin').style.display    = tab === 'login'    ? 'block' : 'none';
  document.getElementById('formCadastro').style.display = tab === 'cadastro' ? 'block' : 'none';
  document.getElementById('tabLogin').classList.toggle('active',    tab === 'login');
  document.getElementById('tabCadastro').classList.toggle('active', tab === 'cadastro');
  limparErros();
}

function limparErros() {
  ['loginErro','cadErro','perfilErro','perfilSucesso'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.textContent = ''; el.style.display = 'none'; }
  });
}

function mostrarErro(id, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.style.display = 'block';
}

function mostrarSucesso(id, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.style.display = 'block';
}

function setBtnLoading(id, loading, texto) {
  const btn = document.getElementById(id);
  if (!btn) return;
  btn.disabled = loading;
  btn.innerHTML = loading ? '<span class="spinner"></span> Aguarde...' : texto;
  
  // Garantia: remove loading após 15 segundos
  if (loading) {
    setTimeout(() => {
      if (btn.disabled) {
        btn.disabled = false;
        btn.innerHTML = texto;
        console.warn('⚠️ Botão desbloqueado por timeout de segurança');
      }
    }, 15000);
  }
}

// ===== LOGIN =====
async function fazerLogin() {
  const email = document.getElementById('loginEmail').value.trim();
  const senha = document.getElementById('loginSenha').value;
  limparErros();

  if (!email || !senha) { mostrarErro('loginErro', 'Preencha e-mail e senha.'); return; }

  setBtnLoading('btnLogin', true, 'Entrar');
  
  try {
    // Timeout de 10 segundos
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), 10000)
    );
    
    const loginPromise = sb.auth.signInWithPassword({ email, password: senha });
    
    const { error } = await Promise.race([loginPromise, timeoutPromise]);
    
    setBtnLoading('btnLogin', false, 'Entrar');

    if (error) {
      mostrarErro('loginErro', traduzirErro(error.message));
    } else {
      fecharTodosModais();
      if (typeof showToast === 'function') {
        showToast('✅ Login realizado!');
      }
    }
  } catch (err) {
    setBtnLoading('btnLogin', false, 'Entrar');
    
    if (err.message === 'Timeout') {
      mostrarErro('loginErro', '⏱️ Tempo esgotado. Verifique sua conexão e tente novamente.');
    } else {
      mostrarErro('loginErro', 'Erro ao fazer login: ' + err.message);
    }
  }
}

document.getElementById('loginSenha')?.addEventListener('keydown', e => {
  if (e.key === 'Enter') fazerLogin();
});

// ===== CADASTRO =====
async function fazerCadastro() {
  const nome  = document.getElementById('cadNome').value.trim();
  const email = document.getElementById('cadEmail').value.trim();
  const senha = document.getElementById('cadSenha').value;
  limparErros();

  if (!nome)  { mostrarErro('cadErro', 'Digite seu nome.'); return; }
  if (!email) { mostrarErro('cadErro', 'Digite seu e-mail.'); return; }
  if (senha.length < 6) { mostrarErro('cadErro', 'Senha deve ter pelo menos 6 caracteres.'); return; }

  setBtnLoading('btnCadastro', true, 'Criar Conta');

  try {
    const { data, error } = await sb.auth.signUp({
      email,
      password: senha,
      options: { 
        data: { nome },
        emailRedirectTo: window.location.origin
      }
    });

    if (error) {
      console.error('Erro no signUp:', error);
      mostrarErro('cadErro', traduzirErro(error.message));
      setBtnLoading('btnCadastro', false, 'Criar Conta');
      return;
    }

    // Aguarda um pouco para o usuário ser autenticado
    await new Promise(resolve => setTimeout(resolve, 500));

    if (data.user) {
      // Tenta criar perfil (pode falhar se RLS estiver bloqueando)
      const { error: perfilError } = await sb.from('perfis').upsert({
        id: data.user.id,
        email: email,
        nome,
        whatsapp: '',
        instagram: '',
        texto_extra: '',
        logo_url: null,
        plano: 'teste',
        creditos: 50,
      });

      if (perfilError) {
        console.error('Erro ao criar perfil:', perfilError);
        // Não mostra erro para o usuário, perfil será criado no primeiro login
        console.log('ℹ️ Perfil será criado no primeiro login');
      }
    }

    setBtnLoading('btnCadastro', false, 'Criar Conta');
    
    // Verifica se precisa confirmar email
    if (data.user && !data.session) {
      // Supabase está configurado para exigir confirmação de email
      limparErros();
      mostrarSucesso('cadErro', '📧 Conta criada! Verifique seu email para confirmar o cadastro.');
      setTimeout(() => {
        fecharTodosModais();
      }, 5000);
    } else {
      // Login automático (confirmação de email desabilitada)
      fecharTodosModais();
      showToast('🎉 Conta criada com sucesso!');
    }
  } catch (err) {
    console.error('Erro inesperado:', err);
    mostrarErro('cadErro', 'Erro inesperado: ' + err.message);
    setBtnLoading('btnCadastro', false, 'Criar Conta');
  }
}

// ===== LOGOUT =====
async function fazerLogout() {
  console.log('🔵 fazerLogout iniciado');
  
  // Verifica se está na página admin
  const isAdminPage = window.location.pathname.includes('admin.html');
  
  // Fecha o menu imediatamente
  const menu = document.getElementById('navUserMenu');
  if (menu) menu.classList.remove('open');
  
  // Atualiza interface ANTES de chamar o Supabase
  usuarioAtual = null;
  
  const btnAuth = document.getElementById('btnAbrirAuth');
  const navUser = document.getElementById('navUser');
  const criadorBloqueado = document.getElementById('criadorBloqueado');
  const criadorConteudo = document.getElementById('criadorConteudo');
  const creditosDisplay = document.getElementById('creditosDisplay');
  const btnAdmin = document.getElementById('btnAdmin');
  
  if (btnAuth) btnAuth.style.display = 'block';
  if (navUser) navUser.style.display = 'none';
  if (creditosDisplay) creditosDisplay.style.display = 'none';
  if (btnAdmin) btnAdmin.style.display = 'none';
  if (criadorBloqueado) criadorBloqueado.style.display = 'block';
  if (criadorConteudo) criadorConteudo.style.display = 'none';
  
  // Limpa campos
  ['inputWhatsapp','inputInstagram','inputSite','inputTexto'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  
  // Limpa logo
  if (typeof removerLogo === 'function') {
    try {
      removerLogo();
    } catch (err) {
      console.error('Erro ao remover logo:', err);
    }
  }
  
  // Mostra toast
  if (typeof showToast === 'function') {
    showToast('👋 Você saiu da conta.');
  }
  
  console.log('✅ Interface atualizada');
  
  // Faz logout no Supabase em background (não espera)
  sb.auth.signOut().then(() => {
    console.log('✅ Logout no Supabase completo');
    
    // Se está na página admin, redireciona para index.html
    if (isAdminPage) {
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 500);
    }
  }).catch(err => {
    console.error('❌ Erro no logout Supabase:', err);
    
    // Mesmo com erro, redireciona se for admin
    if (isAdminPage) {
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 500);
    }
  });
}

// ===== RECUPERAR SENHA =====
async function recuperarSenha() {
  const email = document.getElementById('loginEmail').value.trim();
  if (!email) { mostrarErro('loginErro', 'Digite seu e-mail primeiro.'); return; }

  const { error } = await sb.auth.resetPasswordForEmail(email);
  if (error) {
    mostrarErro('loginErro', traduzirErro(error.message));
  } else {
    mostrarErro('loginErro', '');
    showToast('📧 E-mail de recuperação enviado!');
  }
}

// ===== PERFIL — CARREGAR =====
async function carregarPerfilNaTela() {
  if (!usuarioAtual) return;

  console.log('📂 Carregando perfil do localStorage...');
  
  // Carrega do localStorage
  const perfilKey = 'divulga_perfil_' + usuarioAtual.id;
  const perfilJson = localStorage.getItem(perfilKey);
  
  if (!perfilJson) {
    console.log('ℹ️ Nenhum perfil salvo localmente');
    return;
  }

  try {
    const data = JSON.parse(perfilJson);
    
    console.log('✅ Perfil carregado do localStorage:', data);

    const set = (id, val) => { const el = document.getElementById(id); if (el && val) el.value = val; };
    set('inputWhatsapp',  data.whatsapp);
    set('inputInstagram', data.instagram);
    set('inputSite',      data.site);
    set('inputTexto',     data.texto_extra);
    
    // Carrega preferência do checkbox
    const checkSite = document.getElementById('checkMostrarSiteBanner');
    if (checkSite && data.mostrar_site_banner !== undefined) {
      checkSite.checked = data.mostrar_site_banner;
    }

    if (data.logo_url) await carregarLogoDeUrl(data.logo_url);
  } catch (err) {
    console.error('❌ Erro ao carregar perfil do localStorage:', err);
  }
}

async function carregarLogoDeUrl(url) {
  return new Promise(resolve => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      logoImg = img;
      const preview = document.getElementById('logoPreview');
      if (preview) { preview.src = url; preview.style.display = 'block'; }
      const placeholder = document.getElementById('logoPlaceholder');
      if (placeholder) placeholder.style.display = 'none';
      const btnRemove = document.getElementById('btnRemoveLogo');
      if (btnRemove) btnRemove.style.display = 'block';
      resolve();
    };
    img.onerror = resolve;
    img.src = url;
  });
}

// ===== PERFIL — PREENCHER FORM =====
function preencherFormPerfil() {
  if (!usuarioAtual) return;
  const set = (id, srcId) => {
    const dest = document.getElementById(id);
    const src  = document.getElementById(srcId);
    if (dest && src) dest.value = src.value;
  };
  set('perfilWhatsapp',  'inputWhatsapp');
  set('perfilInstagram', 'inputInstagram');
  set('perfilSite',      'inputSite');
  set('perfilTexto',     'inputTexto');
  
  // Sincroniza checkbox
  const checkSrc = document.getElementById('checkMostrarSiteBanner');
  const checkDest = document.getElementById('perfilCheckMostrarSiteBanner');
  if (checkSrc && checkDest) {
    checkDest.checked = checkSrc.checked;
  }

  const nome = usuarioAtual.user_metadata?.nome || '';
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

  const nome      = document.getElementById('perfilNome')?.value.trim()      || '';
  const whatsapp  = document.getElementById('perfilWhatsapp')?.value.trim()  || '';
  const instagram = document.getElementById('perfilInstagram')?.value.trim() || '';
  const site      = document.getElementById('perfilSite')?.value.trim()      || '';
  const mostrar_site_banner = document.getElementById('perfilCheckMostrarSiteBanner')?.checked ?? true;
  const texto     = document.getElementById('perfilTexto')?.value.trim()     || '';

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
            
            // Limpa o canvas (transparente)
            ctx.clearRect(0, 0, w, h);
            
            // Desenha a imagem
            ctx.drawImage(img, 0, 0, w, h);
            
            // Salva como PNG para manter transparência
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
    
    localStorage.setItem('divulga_perfil_' + usuarioAtual.id, JSON.stringify(perfil));
    console.log('✅ Perfil salvo no localStorage!');

    // Atualiza campos na tela principal
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
    set('inputWhatsapp',  whatsapp);
    set('inputInstagram', instagram);
    set('inputSite',      site);
    set('inputTexto',     texto);
    
    const checkSite = document.getElementById('checkMostrarSiteBanner');
    if (checkSite) checkSite.checked = mostrar_site_banner;

    if (logo_url) await carregarLogoDeUrl(logo_url);

    setBtnLoading('btnSalvarPerfil', false, '💾 Salvar Perfil');
    mostrarSucesso('perfilSucesso', '✅ Perfil salvo com sucesso!');
    setTimeout(() => fecharTodosModais(), 1200);
    
    if (typeof showToast === 'function') {
      showToast('✅ Perfil salvo!');
    }
    
  } catch (err) {
    console.error('❌ Erro inesperado:', err);
    mostrarErro('perfilErro', 'Erro inesperado: ' + err.message);
    setBtnLoading('btnSalvarPerfil', false, '💾 Salvar Perfil');
  }
}

// ===== TRADUÇÃO DE ERROS =====
function traduzirErro(msg) {
  if (!msg) return 'Erro desconhecido.';
  if (msg.includes('Invalid login credentials'))  return 'E-mail ou senha incorretos.';
  if (msg.includes('Email not confirmed'))         return 'Confirme seu e-mail antes de entrar.';
  if (msg.includes('User already registered'))     return 'Este e-mail já está cadastrado.';
  if (msg.includes('Password should be'))          return 'Senha deve ter pelo menos 6 caracteres.';
  if (msg.includes('Unable to validate'))          return 'Sessão expirada. Faça login novamente.';
  if (msg.includes('rate limit'))                  return 'Muitas tentativas. Aguarde alguns minutos.';
  return msg;
}

// ===== EVENT LISTENERS =====
document.addEventListener('DOMContentLoaded', () => {
  console.log('🟢 DOM carregado');
  
  const btnAbrirAuth = document.getElementById('btnAbrirAuth');
  if (btnAbrirAuth) {
    btnAbrirAuth.addEventListener('click', () => {
      console.log('🔵 Botão Entrar clicado');
      abrirModal('login');
    });
    console.log('✅ Event listener adicionado');
  }
});
