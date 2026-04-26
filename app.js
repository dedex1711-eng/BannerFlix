// ===== CONFIGURAÇÃO =====
// Chave pública gratuita do TMDB — substitua pela sua em https://www.themoviedb.org/settings/api
const TMDB_API_KEY = '8265bd1679663a7ea12ac168da84d2e8';
const TMDB_BASE    = 'https://api.themoviedb.org/3';
const TMDB_IMG     = 'https://image.tmdb.org/t/p/original';
const TMDB_IMG_W   = 'https://image.tmdb.org/t/p/w500';

// ===== ESTADO =====
let filmeAtual    = null;   // { title, year, posterPath, backdropPath, type }
let logoImg       = null;   // HTMLImageElement da logo do usuário
let bannerGerado  = false;

// ===== RESUMO =====
let resumoAtual = { overview: '', genres: [], tagline: '', rating: '', runtime: '' };
let resumoVariante = 0;

// ===== COOKIES =====
function acceptCookies() {
  document.getElementById('cookieBanner').style.display = 'none';
  localStorage.setItem('cookiesAccepted', '1');
}
if (localStorage.getItem('cookiesAccepted')) {
  document.getElementById('cookieBanner').style.display = 'none';
}

// ===== TOAST =====
function showToast(msg, duration = 2800) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), duration);
}

// ===== BUSCA TMDB =====
async function buscarFilme() {
  const query = document.getElementById('searchInput').value.trim();
  if (!query) { showToast('Digite o nome de um filme ou série'); return; }

  const btn = document.getElementById('btnBuscar');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Buscando...';

  const resultsDiv = document.getElementById('searchResults');
  resultsDiv.innerHTML = '';

  try {
    const url = `${TMDB_BASE}/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=pt-BR&page=1`;
    const res  = await fetch(url);
    const data = await res.json();

    const items = (data.results || [])
      .filter(i => (i.media_type === 'movie' || i.media_type === 'tv') && (i.poster_path || i.backdrop_path))
      .slice(0, 12);

    if (!items.length) {
      resultsDiv.innerHTML = '<p style="color:var(--text-muted);font-size:0.85rem;padding:8px 0;">Nenhum resultado encontrado.</p>';
      return;
    }

    items.forEach(item => {
      const title = item.title || item.name;
      const year  = (item.release_date || item.first_air_date || '').slice(0, 4);
      const isSerie = item.media_type === 'tv';
      const type  = isSerie ? 'Série' : 'Filme';
      const typeIcon = isSerie ? '📺' : '🎬';
      const poster = item.poster_path ? `${TMDB_IMG_W}${item.poster_path}` : null;

      const el = document.createElement('div');
      el.className = 'result-item';
      el.innerHTML = `
        ${poster
          ? `<img src="${poster}" alt="${title}" loading="lazy" />`
          : `<div class="no-poster">${typeIcon}</div>`}
        <div class="result-info">
          <strong>${title}</strong>
          <small>${year || 'S/D'}</small>
        </div>
        <span class="result-type ${isSerie ? 'type-serie' : 'type-filme'}">${typeIcon} ${type}</span>
      `;
      el.addEventListener('click', () => selecionarFilme(item, el));
      resultsDiv.appendChild(el);
    });

  } catch (err) {
    resultsDiv.innerHTML = '<p style="color:#ef4444;font-size:0.85rem;padding:8px 0;">Erro ao buscar. Verifique sua conexão.</p>';
    console.error(err);
  } finally {
    btn.disabled = false;
    btn.innerHTML = '🔍 Buscar';
  }
}

// Enter para buscar
document.getElementById('searchInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') buscarFilme();
});

// ===== SELECIONAR FILME =====
function selecionarFilme(item, el) {
  // Remove seleção anterior
  document.querySelectorAll('.result-item').forEach(r => r.classList.remove('selected'));
  el.classList.add('selected');

  const title = item.title || item.name;
  const year  = (item.release_date || item.first_air_date || '').slice(0, 4);
  const type  = item.media_type === 'movie' ? 'Filme' : 'Série';

  filmeAtual = {
    title,
    year,
    type,
    posterPath:   item.poster_path   ? `${TMDB_IMG}${item.poster_path}`   : null,
    backdropPath: item.backdrop_path ? `${TMDB_IMG}${item.backdrop_path}` : null,
    posterThumb:  item.poster_path   ? `${TMDB_IMG_W}${item.poster_path}` : null,
  };

  // Atualiza info do filme selecionado
  const infoDiv = document.getElementById('filmeSelecionado');
  document.getElementById('filmeThumb').src = filmeAtual.posterThumb || '';
  document.getElementById('filmeNome').textContent = title;
  document.getElementById('filmeAno').textContent  = `${year} • ${type}`;
  infoDiv.style.display = 'flex';

  showToast(`✅ "${title}" selecionado`);
  gerarBanner(false); // false = apenas preview, sem verificar crédito
  buscarResumo(item);
}

// ===== BUSCAR RESUMO =====

async function buscarResumo(item) {
  const card = document.getElementById('resumoCard');
  const textoEl = document.getElementById('resumoTexto');
  const tagsEl  = document.getElementById('resumoTags');

  card.style.display = 'block';
  tagsEl.innerHTML   = '';
  textoEl.contentEditable = 'false';
  textoEl.innerHTML  = `
    <div class="skeleton" style="width:90%"></div>
    <div class="skeleton" style="width:75%"></div>
    <div class="skeleton" style="width:85%"></div>
    <div class="skeleton"></div>
  `;

  try {
    const endpoint = item.media_type === 'movie'
      ? `${TMDB_BASE}/movie/${item.id}?api_key=${TMDB_API_KEY}&language=pt-BR`
      : `${TMDB_BASE}/tv/${item.id}?api_key=${TMDB_API_KEY}&language=pt-BR`;

    const res  = await fetch(endpoint);
    const data = await res.json();

    const overview  = data.overview || '';
    const genres    = (data.genres || []).map(g => g.name);
    const tagline   = data.tagline || '';
    const rating    = data.vote_average ? data.vote_average.toFixed(1) : '';
    const runtime   = data.runtime
      ? `${Math.floor(data.runtime / 60)}h${data.runtime % 60}min`
      : (data.episode_run_time?.[0] ? `${data.episode_run_time[0]}min/ep` : '');
    const seasons   = data.number_of_seasons ? `${data.number_of_seasons} temporada${data.number_of_seasons > 1 ? 's' : ''}` : '';

    // Buscar trailer
    let trailerUrl = '';
    try {
      const videosEndpoint = item.media_type === 'movie'
        ? `${TMDB_BASE}/movie/${item.id}/videos?api_key=${TMDB_API_KEY}&language=pt-BR`
        : `${TMDB_BASE}/tv/${item.id}/videos?api_key=${TMDB_API_KEY}&language=pt-BR`;
      
      const videosRes = await fetch(videosEndpoint);
      const videosData = await videosRes.json();
      
      // Procura por trailer em português
      let trailer = videosData.results?.find(v => 
        v.site === 'YouTube' && 
        (v.type === 'Trailer' || v.type === 'Teaser')
      );
      
      // Se não encontrar em português, tenta em inglês
      if (!trailer) {
        const videosEnEndpoint = item.media_type === 'movie'
          ? `${TMDB_BASE}/movie/${item.id}/videos?api_key=${TMDB_API_KEY}&language=en-US`
          : `${TMDB_BASE}/tv/${item.id}/videos?api_key=${TMDB_API_KEY}&language=en-US`;
        
        const videosEnRes = await fetch(videosEnEndpoint);
        const videosEnData = await videosEnRes.json();
        
        trailer = videosEnData.results?.find(v => 
          v.site === 'YouTube' && 
          (v.type === 'Trailer' || v.type === 'Teaser')
        );
      }
      
      if (trailer) {
        trailerUrl = `https://www.youtube.com/watch?v=${trailer.key}`;
      }
    } catch (err) {
      console.log('Erro ao buscar trailer:', err);
    }

    resumoAtual = { overview, genres, tagline, rating, runtime, seasons, type: item.media_type, trailerUrl };
    resumoVariante = 0;

    exibirResumo();

    // Tags de gênero clicáveis
    genres.slice(0, 5).forEach(g => {
      const tag = document.createElement('span');
      tag.className   = 'resumo-tag';
      tag.textContent = `#${g.replace(/\s+/g, '')}`;
      tag.title       = 'Clique para copiar a hashtag';
      tag.onclick     = () => {
        navigator.clipboard.writeText(tag.textContent);
        showToast(`📋 ${tag.textContent} copiado!`);
      };
      tagsEl.appendChild(tag);
    });

  } catch (err) {
    textoEl.contentEditable = 'true';
    textoEl.textContent = 'Não foi possível carregar o resumo. Escreva sua descrição aqui.';
    console.error(err);
  }
}

function exibirResumo() {
  const textoEl = document.getElementById('resumoTexto');
  const { overview, tagline, rating, runtime, seasons, genres, type, trailerUrl } = resumoAtual;
  const title = filmeAtual?.title || '';
  const year  = filmeAtual?.year  || '';

  const whatsapp  = document.getElementById('inputWhatsapp').value.trim();
  const instagram = document.getElementById('inputInstagram').value.trim();
  const site      = document.getElementById('inputSite').value.trim();

  const estrelas = rating ? `⭐ ${rating}/10` : '';
  const duracao  = runtime || seasons || '';
  const generoStr = genres.slice(0, 3).join(' • ');

  const contato = [
    whatsapp  ? `📱 ${whatsapp}`  : '',
    instagram ? `📸 ${instagram}` : '',
    site      ? `🌐 ${site}`      : '',
  ].filter(Boolean).join('  |  ');

  const trailerTexto = trailerUrl ? `🎬 Trailer: ${trailerUrl}` : '';

  const variantes = [
    // Variante 0 — Completo
    [
      `🎬 *${title}* ${year ? `(${year})` : ''}`,
      estrelas && duracao ? `${estrelas}  •  ${duracao}` : (estrelas || duracao),
      generoStr ? `🎭 ${generoStr}` : '',
      '',
      overview ? overview : tagline,
      '',
      trailerTexto,
      '',
      contato ? `📲 Fale comigo:\n${contato}` : '',
    ].filter(l => l !== undefined && !(l === '' && !overview)).join('\n'),

    // Variante 1 — Curto (para Stories)
    [
      `🔥 *${title}*`,
      tagline ? `"${tagline}"` : (overview ? overview.slice(0, 120) + '...' : ''),
      '',
      estrelas,
      '',
      trailerTexto,
      '',
      contato ? `👉 ${contato}` : '',
    ].filter(l => l !== undefined).join('\n'),

    // Variante 2 — Chamada de venda
    [
      `📺 Já assistiu *${title}*?`,
      '',
      overview ? overview.slice(0, 200) + (overview.length > 200 ? '...' : '') : tagline,
      '',
      `${estrelas}  ${duracao ? '• ' + duracao : ''}`.trim(),
      '',
      trailerTexto,
      '',
      `✅ Disponível no nosso catálogo!`,
      contato ? contato : '',
    ].filter(l => l !== undefined).join('\n'),
  ];

  textoEl.contentEditable = 'true';
  textoEl.textContent = variantes[resumoVariante % variantes.length].trim();
}

function gerarResumoPersonalizado() {
  resumoVariante++;
  exibirResumo();
  showToast('🔄 Nova versão gerada!');
}

function copiarResumo() {
  const textoEl = document.getElementById('resumoTexto');
  const texto   = textoEl.textContent.trim();
  if (!texto) { showToast('Nenhum resumo para copiar'); return; }

  navigator.clipboard.writeText(texto)
    .then(() => showToast('📋 Texto copiado! Cole na sua rede social.'))
    .catch(() => {
      // Fallback
      const sel = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(textoEl);
      sel.removeAllRanges();
      sel.addRange(range);
      document.execCommand('copy');
      sel.removeAllRanges();
      showToast('📋 Texto copiado!');
    });
}

// Atualiza contato no resumo quando usuário digita
['inputWhatsapp', 'inputInstagram', 'inputSite'].forEach(id => {
  document.getElementById(id).addEventListener('input', () => {
    if (filmeAtual && resumoAtual.overview !== undefined) exibirResumo();
  });
});

// ===== LOGO =====
function carregarLogo(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = e => {
    const img = new Image();
    img.onload = () => {
      logoImg = img;
      const preview = document.getElementById('logoPreview');
      preview.src = e.target.result;
      preview.style.display = 'block';
      document.getElementById('logoPlaceholder').style.display = 'none';
      document.getElementById('btnRemoveLogo').style.display = 'block';
      showToast('✅ Logo carregada!');
      if (filmeAtual) gerarBanner(false); // false = apenas preview
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function removerLogo() {
  logoImg = null;
  document.getElementById('logoPreview').style.display = 'none';
  document.getElementById('logoPreview').src = '';
  document.getElementById('logoPlaceholder').style.display = 'block';
  document.getElementById('btnRemoveLogo').style.display = 'none';
  document.getElementById('logoInput').value = '';
  if (filmeAtual) gerarBanner(false); // false = apenas preview
}

// ===== FORMATO =====
function getFormato() {
  return document.querySelector('input[name="formato"]:checked').value;
}

function getDimensoes() {
  const f = getFormato();
  if (f === 'whatsapp')  return { w: 1080, h: 1080 };  // Quadrado perfeito para WhatsApp
  if (f === 'stories')   return { w: 1080, h: 1920 };
  if (f === 'feed')      return { w: 1080, h: 1350 };
  if (f === 'paisagem')  return { w: 1920, h: 1080 };
  return { w: 1080, h: 1080 };
}

function atualizarFormato() {
  if (filmeAtual) gerarBanner(false); // false = não verificar crédito, apenas preview
}

// ===== OVERLAY COLOR =====
function getOverlayStyle() {
  const v = document.querySelector('input[name="overlay"]:checked').value;
  const map = {
    dark:   'rgba(0,0,0,0.55)',
    purple: 'rgba(76,29,149,0.6)',
    blue:   'rgba(30,58,95,0.6)',
    red:    'rgba(127,29,29,0.6)',
    none:   null,
  };
  return map[v] || null;
}

// ===== GERAR BANNER FINAL (com verificação de crédito) =====
async function gerarBannerFinal() {
  await gerarBanner(true); // true = verificar e consumir crédito
  if (bannerGerado) {
    showToast('✅ Banner gerado com sucesso!');
  }
}

// ===== GERAR BANNER =====
async function gerarBanner(verificarCredito = false) {
  console.log('🎨 gerarBanner chamada, filmeAtual:', filmeAtual, 'verificarCredito:', verificarCredito);
  
  if (!filmeAtual) { 
    console.log('❌ Nenhum filme selecionado');
    showToast('Selecione um filme primeiro'); 
    return; 
  }

  // Só verifica créditos quando for realmente gerar (botão "Gerar Banner")
  if (verificarCredito) {
    console.log('🔍 Verificando créditos...');
    if (typeof verificarCreditos === 'function') {
      try {
        const { temCredito } = await verificarCreditos();
        console.log('💳 Tem crédito:', temCredito);
        if (!temCredito) {
          mostrarModalSemCreditos();
          return;
        }
      } catch (error) {
        console.log('⚠️ Erro ao verificar créditos, continuando...', error);
      }
    }
  }

  const template = document.querySelector('input[name="template"]:checked')?.value || 'simples';
  console.log('🎭 Template selecionado:', template);

  // Alterna painel de opções conforme template
  const overlayOpcoes = document.getElementById('overlayOpcoes');
  const fundoPromoOpcoes = document.getElementById('fundoPromoOpcoes');
  
  if (overlayOpcoes) overlayOpcoes.style.display = template === 'simples' ? 'block' : 'none';
  if (fundoPromoOpcoes) fundoPromoOpcoes.style.display = template === 'promocional' ? 'block' : 'none';

  console.log('🚀 Iniciando geração do banner...');
  
  try {
    // Gera o banner
    if (template === 'promocional') {
      console.log('🍿 Gerando banner promocional...');
      await gerarBannerPromocional();
    } else {
      console.log('🎬 Gerando banner simples...');
      await gerarBannerSimples();
    }
    
    // Só consome crédito quando for geração final (botão "Gerar Banner")
    if (verificarCredito) {
      console.log('✅ Banner gerado com sucesso - consumindo crédito');
      if (typeof consumirCredito === 'function') {
        await consumirCredito();
      }
    } else {
      console.log('✅ Preview atualizado');
    }
    
  } catch (error) {
    console.error('❌ Erro ao gerar banner:', error);
    showToast('❌ Erro ao gerar banner: ' + error.message);
  }
}

// ===== GERAR BANNER SIMPLES =====
async function gerarBannerSimples() {
  console.log('🎬 gerarBannerSimples iniciada');
  
  const { w, h } = getDimensoes();
  const canvas   = document.getElementById('bannerCanvas');
  const ctx      = canvas.getContext('2d');
  
  if (!canvas || !ctx) {
    console.error('❌ Canvas ou contexto não encontrado');
    return;
  }
  
  canvas.width   = w;
  canvas.height  = h;

  // Esconde placeholder e mostra canvas
  const placeholder = document.getElementById('canvasPlaceholder');
  if (placeholder) placeholder.style.display = 'none';
  canvas.style.display = 'block';

  // Escolhe imagem de fundo
  const formato = getFormato();
  let imgUrl = formato === 'paisagem'
    ? (filmeAtual.backdropPath || filmeAtual.posterPath)
    : (filmeAtual.posterPath   || filmeAtual.backdropPath);

  console.log('🖼️ URL da imagem:', imgUrl);

  if (!imgUrl) {
    // Sem imagem - fundo sólido
    console.log('⚠️ Sem imagem, usando fundo sólido');
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, w, h);
    desenharTextos(ctx, w, h);
    finalizarBanner();
    return;
  }

  try {
    console.log('📥 Carregando imagem...');
    const bgImg = await carregarImagem(imgUrl);
    console.log('✅ Imagem carregada:', bgImg.width, 'x', bgImg.height);
    
    // Desenha fundo
    desenharCover(ctx, bgImg, w, h);
    console.log('🎨 Fundo desenhado');

    // Overlay
    const overlay = getOverlayStyle();
    console.log('🎭 Overlay:', overlay);
    
    if (overlay && overlay !== 'none') {
      const grad = ctx.createLinearGradient(0, h * 0.3, 0, h);
      grad.addColorStop(0, 'transparent');
      grad.addColorStop(0.5, overlay);
      grad.addColorStop(1, overlay.replace(/[\d.]+\)$/, '0.92)'));
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Escurecimento no topo
      const gradTop = ctx.createLinearGradient(0, 0, 0, h * 0.25);
      gradTop.addColorStop(0, 'rgba(0,0,0,0.5)');
      gradTop.addColorStop(1, 'transparent');
      ctx.fillStyle = gradTop;
      ctx.fillRect(0, 0, w, h);
      
      console.log('🎨 Overlay aplicado');
    }

    // Logo
    if (logoImg) {
      console.log('🏷️ Desenhando logo...');
      desenharLogo(ctx, w, h);
    }

    // Textos
    console.log('📝 Desenhando textos...');
    desenharTextos(ctx, w, h);

    console.log('✅ Banner simples gerado');
    finalizarBanner();
    
  } catch (err) {
    console.error('❌ Erro ao carregar imagem:', err);
    console.log('🔄 Usando fallback com fundo sólido');
    
    // Fallback - fundo sólido
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, w, h);
    
    // Aplica overlay mesmo sem imagem
    const overlay = getOverlayStyle();
    if (overlay && overlay !== 'none') {
      ctx.fillStyle = overlay;
      ctx.fillRect(0, 0, w, h);
    }
    
    // Logo
    if (logoImg) {
      desenharLogo(ctx, w, h);
    }
    
    // Textos
    desenharTextos(ctx, w, h);
    finalizarBanner();
  }
}

async function finalizarBanner() {
  bannerGerado = true;
  document.getElementById('previewActions').style.display = 'flex';
  
  // Não consome crédito aqui - será consumido apenas no botão "Gerar Banner"
  console.log('✅ Banner finalizado (preview)');
}

// ===== GERAR BANNER PROMOCIONAL =====
async function gerarBannerPromocional() {
  const { w, h } = getDimensoes();
  const canvas   = document.getElementById('bannerCanvas');
  const ctx      = canvas.getContext('2d');
  canvas.width   = w;
  canvas.height  = h;

  document.getElementById('canvasPlaceholder').style.display = 'none';
  canvas.style.display = 'block';

  // Paleta de cores
  const fundoVal = document.querySelector('input[name="fundoPromo"]:checked')?.value || 'roxo';
  const paletas = {
    roxo:     { c1:'#0d0618', c2:'#1a0a2e', c3:'#2d1060', accent:'#7c3aed', glow:'rgba(124,58,237,0.6)'  },
    azul:     { c1:'#020b18', c2:'#0a1628', c3:'#0f2d5e', accent:'#1d4ed8', glow:'rgba(29,78,216,0.6)'   },
    vermelho: { c1:'#180202', c2:'#1a0a0a', c3:'#5e0f0f', accent:'#dc2626', glow:'rgba(220,38,38,0.6)'   },
    verde:    { c1:'#021208', c2:'#0a1a0e', c3:'#0f4d1e', accent:'#16a34a', glow:'rgba(22,163,74,0.6)'   },
    laranja:  { c1:'#1a0a00', c2:'#2d1400', c3:'#5e2a0f', accent:'#ea580c', glow:'rgba(234,88,12,0.6)'   },
    rosa:     { c1:'#180214', c2:'#2d0a1e', c3:'#5e0f3d', accent:'#ec4899', glow:'rgba(236,72,153,0.6)'  },
    ciano:    { c1:'#021418', c2:'#0a1e28', c3:'#0f3d5e', accent:'#06b6d4', glow:'rgba(6,182,212,0.6)'   },
    dourado:  { c1:'#1a1200', c2:'#2d2000', c3:'#5e4a0f', accent:'#eab308', glow:'rgba(234,179,8,0.6)'   },
    preto:    { c1:'#000000', c2:'#0a0a0a', c3:'#1a1a1a', accent:'#6b7280', glow:'rgba(107,114,128,0.4)' },
  };
  
  let p; // Declara a variável uma única vez
  
  // Se escolheu imagem como fundo
  if (fundoVal === 'imagem') {
    try {
      const imgUrl = filmeAtual.backdropPath || filmeAtual.posterPath;
      if (imgUrl) {
        const bgImg = await carregarImagem(imgUrl);
        desenharCover(ctx, bgImg, w, h);
        
        // Overlay escuro para legibilidade
        const overlayGrad = ctx.createLinearGradient(0, 0, 0, h);
        overlayGrad.addColorStop(0, 'rgba(0,0,0,0.75)');
        overlayGrad.addColorStop(0.5, 'rgba(0,0,0,0.65)');
        overlayGrad.addColorStop(1, 'rgba(0,0,0,0.85)');
        ctx.fillStyle = overlayGrad;
        ctx.fillRect(0, 0, w, h);
      } else {
        // Fallback para roxo se não tiver imagem
        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, '#0d0618');
        grad.addColorStop(0.5, '#1a0a2e');
        grad.addColorStop(1, '#2d1060');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
      }
    } catch(e) {
      console.log('Erro ao carregar imagem de fundo:', e);
      // Fallback para roxo
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#0d0618');
      grad.addColorStop(0.5, '#1a0a2e');
      grad.addColorStop(1, '#2d1060');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    }
    
    // Define accent padrão para imagem
    p = { accent: '#7c3aed', glow: 'rgba(124,58,237,0.6)' };
  } else {
    p = paletas[fundoVal];
    
    // Fundo gradiente
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0,   p.c1);
    grad.addColorStop(0.5, p.c2);
    grad.addColorStop(1,   p.c3);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Brilho radial
    const glowGrad = ctx.createRadialGradient(w/2, h*0.85, 0, w/2, h*0.85, w*0.7);
    glowGrad.addColorStop(0, p.glow);
    glowGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = glowGrad;
    ctx.fillRect(0, 0, w, h);
  }

  // Partículas
  ctx.fillStyle = 'rgba(255,255,255,0.07)';
  for (let i = 0; i < 60; i++) {
    ctx.beginPath();
    ctx.arc(Math.random()*w, Math.random()*h, Math.random()*2.5, 0, Math.PI*2);
    ctx.fill();
  }

  // Poster
  try {
    const posterUrl = filmeAtual.posterPath || filmeAtual.posterThumb;
    if (posterUrl) {
      const posterImg = await carregarImagem(posterUrl);
      const posterH = h * 0.44;
      const posterW = posterH * 0.67;
      const posterX = w * 0.05;
      const posterY = h * 0.07;
      ctx.shadowColor = 'rgba(0,0,0,0.7)';
      ctx.shadowBlur  = 30;
      ctx.shadowOffsetX = 6; ctx.shadowOffsetY = 6;
      
      // Borda dourada (mesma cor do texto ASSISTA)
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth   = Math.max(4, w * 0.005);
      ctx.strokeRect(posterX-2, posterY-2, posterW+4, posterH+4);
      
      ctx.drawImage(posterImg, posterX, posterY, posterW, posterH);
      ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;
    }
  } catch(e) { console.log('poster err', e); }

  // Pipoca (movida para cima, antes do texto ASSISTA)
  ctx.font = `${w * 0.13}px serif`;
  ctx.textAlign = 'right';
  ctx.shadowColor = 'rgba(0,0,0,0.9)'; ctx.shadowBlur = 25;
  ctx.fillText('🍿', w * 0.87, h * 0.14);

  // Texto ASSISTA
  const titleSize = w * 0.115;
  ctx.font      = `900 ${titleSize}px Inter, sans-serif`;
  ctx.fillStyle = '#ffd700';
  ctx.textAlign = 'right';
  ctx.fillText('ASSISTA', w * 0.95, h * 0.30);

  // Texto EM ALTA RESOLUÇÃO
  const subSize = titleSize * 0.33;
  ctx.font      = `700 ${subSize}px Inter, sans-serif`;
  ctx.fillStyle = '#ffffff';
  ctx.shadowBlur = 15;
  ctx.fillText('EM ALTA RESOLUÇÃO', w * 0.95, h * 0.30 + subSize * 1.4);
  ctx.shadowBlur = 0;

  // Botão "Assista agora" - Canto inferior direito com play integrado
  const formato = getFormato();
  let btnH, btnW, btnX, btnY, circR;
  
  if (formato === 'stories') {
    // Proporções para Stories (9:16)
    btnH  = h * 0.060; // Diminuído de 0.070
    btnW  = w * 0.30;
    btnX  = w * 0.95 - btnW;
    btnY  = h * 0.42;
    circR = btnH * 0.55;
  } else {
    // Proporções padrão para outros formatos
    btnH  = h * 0.065;
    btnW  = w * 0.30;
    btnX  = w * 0.95 - btnW;
    btnY  = h * 0.42;
    circR = btnH * 0.65;
  }

  // Sombra do botão
  ctx.shadowColor = 'rgba(0,0,0,0.4)';
  ctx.shadowBlur  = 20;
  ctx.shadowOffsetY = 8;

  // Fundo branco do botão (desenha primeiro, por baixo)
  ctx.fillStyle = '#ffffff';
  roundRect(ctx, btnX, btnY, btnW, btnH, btnH/2); 
  ctx.fill();

  // Círculo play com gradiente dourado (por cima do fundo branco, no lado esquerdo)
  const circX = btnX + circR;
  const circY = btnY + btnH / 2;
  const cg = ctx.createRadialGradient(circX-circR*0.25, circY-circR*0.25, 0, circX, circY, circR);
  cg.addColorStop(0, '#ffe066'); // Dourado claro
  cg.addColorStop(1, '#ffd700'); // Dourado (mesma cor do ASSISTA)
  ctx.fillStyle = cg;
  ctx.beginPath(); 
  ctx.arc(circX, circY, circR, 0, Math.PI*2); 
  ctx.fill();

  // Triângulo play
  ctx.fillStyle = '#111111'; // Preto para contraste com o dourado
  const ps = circR * 0.38;
  ctx.beginPath();
  ctx.moveTo(circX - ps*0.2, circY - ps*0.65);
  ctx.lineTo(circX - ps*0.2, circY + ps*0.65);
  ctx.lineTo(circX + ps*0.7, circY);
  ctx.closePath(); 
  ctx.fill();
  
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // Texto do botão (centralizado na parte branca)
  let textSize;
  if (formato === 'stories') {
    textSize = btnH * 0.22;
  } else if (formato === 'feed') {
    textSize = btnH * 0.28; // Feed com letra menor
  } else {
    textSize = btnH * 0.35; // WhatsApp e Paisagem
  }
  let textX;
  if (formato === 'stories') {
    textX = btnX + btnW * 0.70;
  } else if (formato === 'feed') {
    textX = btnX + btnW * 0.68; // Feed um pouco para a direita
  } else if (formato === 'paisagem') {
    textX = btnX + btnW * 0.58; // Paisagem um pouco para a esquerda
  } else {
    textX = btnX + btnW * 0.62; // WhatsApp
  }
  ctx.fillStyle = '#111111';
  ctx.font      = `700 ${textSize}px Inter, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('Assista agora', textX, btnY + btnH*0.62);

  // Faixa dispositivos
  const faixaY = h * 0.68;
  const faixaH = h * 0.115;
  const fg = ctx.createLinearGradient(0, faixaY, w, faixaY);
  fg.addColorStop(0, 'transparent');
  fg.addColorStop(0.08, 'rgba(0,0,0,0.6)');
  fg.addColorStop(0.92, 'rgba(0,0,0,0.6)');
  fg.addColorStop(1, 'transparent');
  ctx.fillStyle = fg;
  ctx.fillRect(0, faixaY, w, faixaH);

  ctx.font      = `700 ${formato === 'paisagem' ? w * 0.018 : w * 0.022}px Inter, sans-serif`;
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = 10;
  ctx.fillText('DISPONÍVEL PARA TODOS OS DISPOSITIVOS', w/2, faixaY + faixaH * 0.35);
  ctx.shadowBlur = 0;

  // Ícones dos dispositivos
  const iconY    = faixaY + faixaH * 0.72;
  const iconSize = formato === 'stories' ? faixaH * 0.30 : faixaH * 0.38; // Menor no Stories
  const devices  = ['LG','Roku','TCL','Samsung','Fire TV','Android TV','Mecool','Mi'];
  const spacing  = formato === 'stories' ? iconSize * 1.8 : iconSize * 2.5; // Menos espaçamento no Stories
  const totalW   = devices.length * spacing;
  let   iconX    = w/2 - totalW/2;
  devices.forEach(name => {
    desenharIconeDispositivo(ctx, name, iconX, iconY, iconSize, p.accent);
    iconX += spacing;
  });

  // Logo (acima da faixa de dispositivos, centralizada)
  if (logoImg) {
    const logoMaxW = w * 0.35; // Aumentado de 0.28 para 0.35
    const logoMaxH = h * 0.13; // Aumentado de 0.10 para 0.13
    const ls = Math.min(logoMaxW/logoImg.width, logoMaxH/logoImg.height);
    const lw = logoImg.width*ls, lh = logoImg.height*ls;
    ctx.shadowColor = p.glow; ctx.shadowBlur = 30;
    ctx.drawImage(logoImg, w/2-lw/2, h*0.54, lw, lh);
    ctx.shadowBlur = 0;
  }

  // Seção "ASSISTA EM QUALQUER DISPOSITIVO" (apenas para outros formatos, não Stories)
  if (formato !== 'stories') {
    const dispBoxW = w * 0.42;
    const dispBoxH = h * 0.11;
    const dispBoxX = w * 0.56;
    const dispBoxY = h * 0.87;
    
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 2;
    roundRect(ctx, dispBoxX, dispBoxY, dispBoxW, dispBoxH, w * 0.012);
    ctx.fill();
    ctx.stroke();
    
    ctx.font = `700 ${w * 0.0135}px Inter, sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0,0,0,0.9)';
    ctx.shadowBlur = 6;
    ctx.fillText('ASSISTA EM QUALQUER DISPOSITIVO', dispBoxX + dispBoxW/2, dispBoxY + dispBoxH * 0.24);
    ctx.shadowBlur = 0;
    
    const dispIconSize = dispBoxH * 0.38;
    const dispDevices = ['TV SMART', 'TV BOX', 'PC/NOT', 'WHATSAPP', 'XBOX', 'CHROMECAST'];
    
    const totalIconsWidth = dispDevices.length * dispIconSize;
    const availableSpace = dispBoxW - totalIconsWidth;
    const dispSpacing = availableSpace / (dispDevices.length + 1);
    
    let dispIconX = dispBoxX + dispSpacing;
    const dispIconY = dispBoxY + dispBoxH * 0.48;
    
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    
    dispDevices.forEach(device => {
      const iconCenterX = dispIconX + dispIconSize / 2;
      
      desenharIconeDispositivoVisual(ctx, device, dispIconX, dispIconY, dispIconSize);
      
      ctx.font = `600 ${w * 0.0085}px Inter, sans-serif`;
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.shadowColor = 'rgba(0,0,0,0.9)';
      ctx.shadowBlur = 3;
      ctx.fillText(device, iconCenterX, dispIconY + dispIconSize + w * 0.004);
      
      dispIconX += dispIconSize + dispSpacing;
    });
    
    ctx.shadowBlur = 0;
    ctx.textBaseline = 'alphabetic';
  }

  // Contatos (alinhados à esquerda)
  const whatsapp  = document.getElementById('inputWhatsapp').value.trim();
  const instagram = document.getElementById('inputInstagram').value.trim();
  const site      = document.getElementById('inputSite').value.trim();
  const mostrarSite = document.getElementById('checkMostrarSiteBanner').checked;
  if (whatsapp || instagram || (site && mostrarSite)) {
    const cSize = w * 0.028;
    const cX = w * 0.08; // Posição à esquerda
    ctx.font = `700 ${cSize}px Inter, sans-serif`;
    ctx.fillStyle = '#ffffff'; 
    ctx.textAlign = 'left'; // Alinhamento à esquerda
    ctx.shadowColor = 'rgba(0,0,0,0.9)'; 
    ctx.shadowBlur = 12;
    let cy = h * 0.945;
    if (site && mostrarSite) { ctx.fillText(`🌐 ${site}`, cX, cy); cy -= cSize*1.5; }
    if (instagram) { ctx.fillText(`📸 ${instagram}`, cX, cy); cy -= cSize*1.5; }
    if (whatsapp)  { ctx.fillText(`📱 ${whatsapp}`,  cX, cy); }
    ctx.shadowBlur = 0;
  }

  ctx.textAlign = 'left';
  finalizarBanner();
}

// Desenha ícone de dispositivo
function desenharIconeDispositivo(ctx, nome, x, y, size, accent) {
  ctx.save();
  const cx = x + size * 1.1;

  // Fundo do badge (um pouco maior)
  const badgeW = size * 1.5;
  const badgeH = size * 1.2;
  ctx.fillStyle = 'rgba(255,255,255,0.13)';
  roundRect(ctx, cx - badgeW/2, y - badgeH/2, badgeW, badgeH, size*0.2);
  ctx.fill();

  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowBlur   = 0;

  // Configurações por dispositivo (tamanhos ajustados)
  const cores = {
    'LG':         { cor:'#a50034', fs: size*0.50, txt:'LG' },
    'Roku':       { cor:'#6c1d8e', fs: size*0.45, txt:'Roku' },
    'TCL':        { cor:'#1a73e8', fs: size*0.50, txt:'TCL' },
    'Samsung':    { cor:'#1428a0', fs: size*0.32, txt:'Samsung' },
    'Fire TV':    { cor:'#ff9900', fs: size*0.34, txt:'Fire TV' },
    'Android TV': { cor:'#3ddc84', fs: size*0.28, txt:'Android' },
    'Mecool':     { cor:'#ffffff', fs: size*0.34, txt:'Mecool' },
    'Mi':         { cor:'#ff6900', fs: size*0.58, txt:'mi' },
  };
  
  const cfg = cores[nome] || { cor:'#ffffff', fs: size*0.38, txt:nome };
  ctx.fillStyle = cfg.cor;
  ctx.font      = `700 ${cfg.fs}px Inter, sans-serif`;
  ctx.fillText(cfg.txt, cx, y);

  ctx.textBaseline = 'alphabetic';
  ctx.restore();
}


// ===== DESENHAR COVER =====
function desenharCover(ctx, img, cw, ch) {
  const scale = Math.max(cw / img.width, ch / img.height);
  const sw    = img.width  * scale;
  const sh    = img.height * scale;
  const sx    = (cw - sw) / 2;
  const sy    = (ch - sh) / 2;
  ctx.drawImage(img, sx, sy, sw, sh);
}

// ===== DESENHAR LOGO =====
function desenharLogo(ctx, cw, ch) {
  const maxW  = cw * 0.45;  // aumentado de 0.35 para 0.45
  const maxH  = ch * 0.12;  // aumentado de 0.08 para 0.12
  const scale = Math.min(maxW / logoImg.width, maxH / logoImg.height);
  const lw    = logoImg.width  * scale;
  const lh    = logoImg.height * scale;
  const pad   = cw * 0.05;
  const x     = pad;
  const y     = pad;
  ctx.drawImage(logoImg, x, y, lw, lh);
}

// ===== DESENHAR TEXTOS =====
function desenharTextos(ctx, cw, ch) {
  const pad     = cw * 0.07;
  const formato = getFormato();

  // Calcula tamanho do título baseado no comprimento
  const tituloLength = filmeAtual.title.length;
  let titleSizeBase = formato === 'paisagem' ? cw * 0.045 : cw * 0.065;
  
  // Reduz o tamanho se o título for muito longo
  if (tituloLength > 30) {
    titleSizeBase *= 0.75;
  } else if (tituloLength > 20) {
    titleSizeBase *= 0.85;
  }
  
  const titleSize = titleSizeBase;
  ctx.font        = `900 ${titleSize}px Inter, sans-serif`;
  ctx.fillStyle   = '#ffffff';
  ctx.shadowColor = 'rgba(0,0,0,0.8)';
  ctx.shadowBlur  = 20;

  const maxTitleW = cw - pad * 2;
  
  // Posiciona o título mais acima para dar espaço aos contatos
  const titleY = formato === 'paisagem' ? ch * 0.65 : ch * 0.70;
  
  // Retorna número de linhas usadas
  const numLinhas = wrapText(ctx, filmeAtual.title.toUpperCase(), pad, titleY, maxTitleW, titleSize * 1.2);

  // Ano + tipo (posiciona logo após a última linha do título)
  const subSize = titleSize * 0.45;
  ctx.font      = `600 ${subSize}px Inter, sans-serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.shadowBlur = 10;
  const subY = titleY + (numLinhas * titleSize * 1.2) + subSize * 0.5;
  ctx.fillText(`${filmeAtual.year}  •  ${filmeAtual.type.toUpperCase()}`, pad, subY);

  ctx.shadowBlur = 0;

  // Contatos CENTRALIZADOS (sempre na parte inferior)
  const whatsapp   = document.getElementById('inputWhatsapp').value.trim();
  const instagram  = document.getElementById('inputInstagram').value.trim();
  const site       = document.getElementById('inputSite').value.trim();
  const mostrarSite = document.getElementById('checkMostrarSiteBanner').checked;
  const textoExtra = document.getElementById('inputTexto').value.trim();

  const contactSize = titleSize * 0.58;
  ctx.shadowColor   = 'rgba(0,0,0,0.95)';
  ctx.shadowBlur    = 18;

  let contactY = ch - pad * 1.1;

  if (textoExtra) {
    ctx.font      = `700 ${contactSize}px Inter, sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(textoExtra, cw / 2, contactY);
    contactY -= contactSize * 1.6;
  }

  if (site && mostrarSite) {
    ctx.font      = `700 ${contactSize}px Inter, sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(`🌐 ${site}`, cw / 2, contactY);
    contactY -= contactSize * 1.6;
  }

  if (instagram) {
    ctx.font      = `700 ${contactSize}px Inter, sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(`📸 ${instagram}`, cw / 2, contactY);
    contactY -= contactSize * 1.6;
  }

  if (whatsapp) {
    const iconSize = contactSize * 0.9; // Reduzido de 1.1 para 0.9
    
    // Mede o texto para centralizar o conjunto (ícone + número)
    ctx.font = `700 ${contactSize}px Inter, sans-serif`;
    const textWidth = ctx.measureText(whatsapp).width;
    const totalWidth = iconSize * 1.25 + textWidth;
    
    const startX = (cw - totalWidth) / 2;
    const iconX  = startX;
    const iconY  = contactY - iconSize * 0.85; // Ajustado de 0.82 para 0.85
    const textX  = startX + iconSize * 1.25;

    // Desenha ícone WhatsApp
    desenharIconeWhatsApp(ctx, iconX, iconY, iconSize);

    // Desenha número
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.fillText(whatsapp, textX, contactY);
  }

  ctx.shadowBlur = 0;
  ctx.textAlign = 'left'; // Reseta para padrão
}

// ===== ÍCONE WHATSAPP =====
function desenharIconeWhatsApp(ctx, x, y, size) {
  ctx.save();
  ctx.shadowBlur = 0;

  // Fundo verde arredondado
  const r = size * 0.22;
  ctx.fillStyle = '#25D366';
  roundRect(ctx, x, y, size, size, r);
  ctx.fill();

  // Desenha o telefone usando path SVG do WhatsApp (viewBox 0 0 24 24)
  const s = size / 24;
  ctx.translate(x, y);
  ctx.scale(s, s);

  ctx.fillStyle = '#ffffff';

  // Path do ícone WhatsApp oficial (simplificado)
  ctx.beginPath();
  // Corpo do balão
  ctx.moveTo(12, 2);
  ctx.bezierCurveTo(6.477, 2, 2, 6.477, 2, 12);
  ctx.bezierCurveTo(2, 13.89, 2.525, 15.655, 3.438, 17.162);
  ctx.lineTo(2.05, 21.95);
  ctx.lineTo(6.99, 20.586);
  ctx.bezierCurveTo(8.453, 21.447, 10.168, 22, 12, 22);
  ctx.bezierCurveTo(17.523, 22, 22, 17.523, 22, 12);
  ctx.bezierCurveTo(22, 6.477, 17.523, 2, 12, 2);
  ctx.closePath();
  ctx.fill();

  // Telefone interno (verde sobre branco)
  ctx.fillStyle = '#25D366';
  ctx.beginPath();
  ctx.moveTo(12, 3.5);
  ctx.bezierCurveTo(7.313, 3.5, 3.5, 7.313, 3.5, 12);
  ctx.bezierCurveTo(3.5, 13.79, 4.047, 15.45, 4.98, 16.82);
  ctx.lineTo(3.8, 20.2);
  ctx.lineTo(7.28, 19.04);
  ctx.bezierCurveTo(8.617, 19.937, 10.248, 20.5, 12, 20.5);
  ctx.bezierCurveTo(16.687, 20.5, 20.5, 16.687, 20.5, 12);
  ctx.bezierCurveTo(20.5, 7.313, 16.687, 3.5, 12, 3.5);
  ctx.closePath();
  ctx.fill();

  // Ícone do telefone branco
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(9.4, 7.2);
  ctx.bezierCurveTo(9.1, 7.2, 8.6, 7.3, 8.2, 7.8);
  ctx.bezierCurveTo(7.8, 8.3, 6.8, 9.2, 6.8, 11.1);
  ctx.bezierCurveTo(6.8, 13, 8.2, 14.8, 8.4, 15.1);
  ctx.bezierCurveTo(8.6, 15.4, 11, 19.1, 14.6, 20.5);
  ctx.bezierCurveTo(15.6, 20.9, 16.4, 21.1, 17, 21.2);
  ctx.bezierCurveTo(18, 21.3, 18.9, 21.2, 19.6, 20.8);
  ctx.bezierCurveTo(20.1, 20.5, 20.8, 19.8, 21, 19);
  ctx.bezierCurveTo(21.2, 18.2, 21.2, 17.5, 21.1, 17.3);
  ctx.bezierCurveTo(21, 17.1, 20.7, 17, 20.3, 16.8);
  ctx.bezierCurveTo(19.9, 16.6, 18, 15.7, 17.7, 15.6);
  ctx.bezierCurveTo(17.4, 15.5, 17.1, 15.4, 16.9, 15.7);
  ctx.bezierCurveTo(16.7, 16, 16, 16.8, 15.8, 17.1);
  ctx.bezierCurveTo(15.6, 17.4, 15.4, 17.4, 15.1, 17.3);
  ctx.bezierCurveTo(14.8, 17.1, 13.8, 16.8, 12.6, 15.7);
  ctx.bezierCurveTo(11.7, 14.9, 11.1, 13.9, 10.9, 13.6);
  ctx.bezierCurveTo(10.7, 13.3, 10.9, 13.1, 11, 12.9);
  ctx.bezierCurveTo(11.2, 12.7, 11.4, 12.4, 11.6, 12.2);
  ctx.bezierCurveTo(11.8, 12, 11.8, 11.8, 11.9, 11.6);
  ctx.bezierCurveTo(12, 11.4, 11.9, 11.1, 11.8, 10.9);
  ctx.bezierCurveTo(11.7, 10.7, 11.1, 8.8, 10.8, 8.1);
  ctx.bezierCurveTo(10.6, 7.5, 10.3, 7.3, 10, 7.2);
  ctx.bezierCurveTo(9.8, 7.2, 9.6, 7.2, 9.4, 7.2);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ===== DESENHAR ÍCONE DE DISPOSITIVO =====
function desenharIconeDispositivoVisual(ctx, tipo, x, y, size) {
  ctx.save();
  ctx.strokeStyle = '#ffffff';
  ctx.fillStyle = 'transparent';
  ctx.lineWidth = size * 0.1;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  
  const cx = x + size / 2;
  const cy = y + size / 2;
  
  switch(tipo) {
    case 'TV SMART':
      // Tela da TV (retângulo)
      const tvW = size * 0.75;
      const tvH = size * 0.5;
      ctx.strokeRect(cx - tvW/2, cy - tvH/2 - size * 0.05, tvW, tvH);
      // Base triangular
      ctx.beginPath();
      ctx.moveTo(cx - size * 0.15, cy + tvH/2 - size * 0.05);
      ctx.lineTo(cx - size * 0.15, cy + tvH/2 + size * 0.15);
      ctx.lineTo(cx + size * 0.15, cy + tvH/2 + size * 0.15);
      ctx.lineTo(cx + size * 0.15, cy + tvH/2 - size * 0.05);
      ctx.stroke();
      break;
      
    case 'TV BOX':
      // Caixa retangular do TV Box
      const boxW = size * 0.6;
      const boxH = size * 0.35;
      ctx.strokeRect(cx - boxW/2, cy - boxH/2, boxW, boxH);
      // Controle remoto (retângulo menor ao lado)
      const remW = size * 0.18;
      const remH = size * 0.5;
      ctx.strokeRect(cx + boxW/2 + size * 0.08, cy - remH/2, remW, remH);
      // Botões do controle (círculos pequenos)
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(cx + boxW/2 + size * 0.17, cy - size * 0.08, size * 0.04, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx + boxW/2 + size * 0.17, cy + size * 0.08, size * 0.04, 0, Math.PI * 2);
      ctx.fill();
      break;
      
    case 'PC/NOT':
      // Tela do notebook (retângulo)
      const notW = size * 0.8;
      const notH = size * 0.5;
      ctx.strokeRect(cx - notW/2, cy - notH/2 - size * 0.1, notW, notH);
      // Base/teclado (trapézio)
      ctx.beginPath();
      ctx.moveTo(cx - notW/2 - size * 0.05, cy + notH/2 - size * 0.1);
      ctx.lineTo(cx + notW/2 + size * 0.05, cy + notH/2 - size * 0.1);
      ctx.lineTo(cx + notW/2, cy + notH/2 + size * 0.15);
      ctx.lineTo(cx - notW/2, cy + notH/2 + size * 0.15);
      ctx.closePath();
      ctx.stroke();
      break;
      
    case 'WHATSAPP':
      // Círculo externo (balão de fala)
      ctx.lineWidth = size * 0.1;
      ctx.strokeStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(cx, cy - size * 0.02, size * 0.36, 0, Math.PI * 2);
      ctx.stroke();
      
      // Rabinho do balão (canto inferior esquerdo)
      ctx.lineWidth = size * 0.1;
      ctx.beginPath();
      ctx.moveTo(cx - size * 0.22, cy + size * 0.28);
      ctx.lineTo(cx - size * 0.35, cy + size * 0.42);
      ctx.lineTo(cx - size * 0.15, cy + size * 0.32);
      ctx.stroke();
      
      // Telefone preenchido no centro
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      // Parte superior do telefone (curva)
      ctx.moveTo(cx - size * 0.12, cy - size * 0.15);
      ctx.quadraticCurveTo(cx - size * 0.18, cy - size * 0.12, cx - size * 0.18, cy - size * 0.05);
      ctx.lineTo(cx - size * 0.15, cy);
      ctx.quadraticCurveTo(cx - size * 0.12, cy + 0.02, cx - size * 0.08, cy);
      // Parte do meio
      ctx.lineTo(cx + size * 0.08, cy + size * 0.16);
      ctx.quadraticCurveTo(cx + size * 0.10, cy + size * 0.18, cx + size * 0.12, cy + size * 0.16);
      // Parte inferior do telefone (curva)
      ctx.lineTo(cx + size * 0.15, cy + size * 0.12);
      ctx.quadraticCurveTo(cx + size * 0.18, cy + size * 0.10, cx + size * 0.16, cy + size * 0.05);
      ctx.lineTo(cx + size * 0.12, cy - size * 0.08);
      ctx.quadraticCurveTo(cx + size * 0.10, cy - size * 0.12, cx + size * 0.05, cy - size * 0.10);
      ctx.lineTo(cx - size * 0.08, cy - size * 0.18);
      ctx.closePath();
      ctx.fill();
      break;
      
    case 'CELULAR':
      // Corpo do celular (retângulo arredondado)
      const celW = size * 0.45;
      const celH = size * 0.75;
      ctx.lineWidth = size * 0.08;
      ctx.strokeRect(cx - celW/2, cy - celH/2, celW, celH);
      // Câmera (círculo pequeno no topo)
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(cx, cy - celH/2 + size * 0.12, size * 0.04, 0, Math.PI * 2);
      ctx.fill();
      break;
      
    case 'XBOX':
      // Círculo externo
      ctx.beginPath();
      ctx.arc(cx, cy, size * 0.38, 0, Math.PI * 2);
      ctx.stroke();
      // X do Xbox
      ctx.lineWidth = size * 0.12;
      ctx.beginPath();
      ctx.moveTo(cx - size * 0.18, cy - size * 0.18);
      ctx.lineTo(cx + size * 0.18, cy + size * 0.18);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx + size * 0.18, cy - size * 0.18);
      ctx.lineTo(cx - size * 0.18, cy + size * 0.18);
      ctx.stroke();
      break;
      
    case 'CHROMECAST':
      // Círculo principal
      ctx.beginPath();
      ctx.arc(cx, cy, size * 0.32, 0, Math.PI * 2);
      ctx.stroke();
      // Símbolo de transmissão (ondas no canto)
      const waveX = cx - size * 0.12;
      const waveY = cy + size * 0.12;
      ctx.lineWidth = size * 0.08;
      // Onda 1
      ctx.beginPath();
      ctx.arc(waveX, waveY, size * 0.12, -Math.PI * 0.5, 0);
      ctx.stroke();
      // Onda 2
      ctx.beginPath();
      ctx.arc(waveX, waveY, size * 0.22, -Math.PI * 0.5, 0);
      ctx.stroke();
      // Ponto de origem
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(waveX, waveY, size * 0.05, 0, Math.PI * 2);
      ctx.fill();
      break;
  }
  
  ctx.restore();
}

// ===== WRAP TEXT =====
function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line    = '';
  let lines   = [];

  for (let w of words) {
    const test = line ? line + ' ' + w : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  lines.push(line);

  // Máximo 3 linhas
  lines = lines.slice(0, 3);
  lines.forEach((l, i) => ctx.fillText(l, x, y + i * lineHeight));
  
  // Retorna o número de linhas usadas
  return lines.length;
}

// ===== CARREGAR IMAGEM (CORS proxy) =====
function carregarImagem(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload  = () => resolve(img);
    img.onerror = () => {
      // Tenta via proxy CORS público como fallback
      const proxy = `https://corsproxy.io/?${encodeURIComponent(url)}`;
      const img2  = new Image();
      img2.crossOrigin = 'anonymous';
      img2.onload  = () => resolve(img2);
      img2.onerror = reject;
      img2.src = proxy;
    };
    img.src = url;
  });
}

// ===== DOWNLOAD =====
function downloadBanner() {
  if (!bannerGerado) { showToast('Gere um banner primeiro'); return; }
  const canvas   = document.getElementById('bannerCanvas');
  const formato  = getFormato();
  const titulo   = (filmeAtual?.title || 'banner').replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const filename = `banner_${titulo}_${formato}.png`;

  const link  = document.createElement('a');
  link.download = filename;
  link.href     = canvas.toDataURL('image/png');
  link.click();
  showToast('⬇️ Download iniciado!');
}

// ===== COMPARTILHAR =====
async function compartilharBanner() {
  if (!bannerGerado) { showToast('Gere um banner primeiro'); return; }
  const canvas = document.getElementById('bannerCanvas');

  if (navigator.share && navigator.canShare) {
    canvas.toBlob(async blob => {
      const file = new File([blob], 'banner.png', { type: 'image/png' });
      if (navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: filmeAtual?.title || 'Banner' });
        } catch (e) {
          if (e.name !== 'AbortError') showToast('Erro ao compartilhar');
        }
      } else {
        downloadBanner();
      }
    }, 'image/png');
  } else {
    downloadBanner();
    showToast('📋 Compartilhamento não suportado — baixando...');
  }
}


// ===== CRIADOR DE VÍDEO =====
let trailerAtual = null;
let videoAtual = null;
let videoBlob = null;

async function abrirCriadorVideo() {
  if (!filmeAtual) {
    showToast('Selecione um filme ou série primeiro');
    return;
  }

  // Abre o modal
  document.getElementById('modalVideo').classList.add('open');
  
  // Reseta etapas
  document.getElementById('etapaTrailer').style.display = 'block';
  document.getElementById('etapaEdicao').style.display = 'none';
  
  // Preenche informações do filme
  document.getElementById('videoFilmeNome').textContent = filmeAtual.title;
  document.getElementById('videoFilmeAno').textContent = `${filmeAtual.year} • ${filmeAtual.type}`;
  
  // Mostra loading
  document.getElementById('trailerCarregando').style.display = 'block';
  document.getElementById('trailerErro').style.display = 'none';
  document.getElementById('trailerEncontrado').style.display = 'none';
  
  // Busca trailer
  await buscarTrailer();
}

async function buscarTrailer() {
  try {
    const query = encodeURIComponent(filmeAtual.title);
    const searchUrl = `${TMDB_BASE}/search/${filmeAtual.type === 'Filme' ? 'movie' : 'tv'}?api_key=${TMDB_API_KEY}&query=${query}&language=pt-BR&page=1`;
    
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();
    
    if (!searchData.results || !searchData.results.length) {
      mostrarErroTrailer();
      return;
    }
    
    const itemId = searchData.results[0].id;
    const mediaType = filmeAtual.type === 'Filme' ? 'movie' : 'tv';
    
    const videosUrl = `${TMDB_BASE}/${mediaType}/${itemId}/videos?api_key=${TMDB_API_KEY}&language=pt-BR`;
    const videosRes = await fetch(videosUrl);
    const videosData = await videosRes.json();
    
    const trailers = (videosData.results || []).filter(v => 
      v.site === 'YouTube' && 
      (v.type === 'Trailer' || v.type === 'Teaser')
    );
    
    if (!trailers.length) {
      const videosUrlEN = `${TMDB_BASE}/${mediaType}/${itemId}/videos?api_key=${TMDB_API_KEY}&language=en-US`;
      const videosResEN = await fetch(videosUrlEN);
      const videosDataEN = await videosResEN.json();
      
      const trailersEN = (videosDataEN.results || []).filter(v => 
        v.site === 'YouTube' && 
        (v.type === 'Trailer' || v.type === 'Teaser')
      );
      
      if (!trailersEN.length) {
        mostrarErroTrailer();
        return;
      }
      
      trailerAtual = trailersEN[0];
    } else {
      trailerAtual = trailers[0];
    }
    
    document.getElementById('trailerCarregando').style.display = 'none';
    document.getElementById('trailerEncontrado').style.display = 'block';
    showToast('✅ Trailer encontrado!');
    
  } catch (err) {
    console.error('Erro ao buscar trailer:', err);
    mostrarErroTrailer();
  }
}

function mostrarErroTrailer() {
  document.getElementById('trailerCarregando').style.display = 'none';
  document.getElementById('trailerErro').style.display = 'block';
}

function abrirTrailerYoutube() {
  if (!trailerAtual) return;
  const url = `https://www.youtube.com/watch?v=${trailerAtual.key}`;
  window.open(url, '_blank');
  showToast('🎬 Abrindo trailer no YouTube...');
}

function copiarLinkTrailer() {
  if (!trailerAtual) return;
  const url = `https://www.youtube.com/watch?v=${trailerAtual.key}`;
  
  navigator.clipboard.writeText(url)
    .then(() => showToast('📋 Link do trailer copiado!'))
    .catch(() => {
      const input = document.createElement('input');
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      showToast('📋 Link do trailer copiado!');
    });
}

function carregarVideo(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  if (!file.type.startsWith('video/')) {
    showToast('❌ Por favor, selecione um arquivo de vídeo');
    return;
  }
  
  if (file.size > 500 * 1024 * 1024) {
    showToast('❌ Vídeo muito grande! Máximo 500MB');
    return;
  }
  
  videoBlob = file;
  const url = URL.createObjectURL(file);
  
  const preview = document.getElementById('videoPreview');
  preview.src = url;
  preview.style.display = 'block';
  preview.load();
  
  document.getElementById('videoUploadPlaceholder').style.display = 'none';
  document.getElementById('btnRemoverVideo').style.display = 'block';
  document.getElementById('btnProximoEtapa').style.display = 'block';
  
  showToast('✅ Vídeo carregado!');
}

function removerVideo() {
  videoBlob = null;
  const preview = document.getElementById('videoPreview');
  preview.src = '';
  preview.style.display = 'none';
  
  document.getElementById('videoUploadPlaceholder').style.display = 'block';
  document.getElementById('btnRemoverVideo').style.display = 'none';
  document.getElementById('btnProximoEtapa').style.display = 'none';
  document.getElementById('videoInput').value = '';
}

function irParaEdicao() {
  if (!videoBlob) {
    showToast('❌ Faça upload do vídeo primeiro');
    return;
  }
  
  document.getElementById('etapaTrailer').style.display = 'none';
  document.getElementById('etapaEdicao').style.display = 'block';
  
  const videoEditor = document.getElementById('videoEditor');
  videoEditor.src = URL.createObjectURL(videoBlob);
  videoEditor.load();
  
  showToast('✅ Agora configure as opções e processe o vídeo');
}

function voltarParaUpload() {
  document.getElementById('etapaTrailer').style.display = 'block';
  document.getElementById('etapaEdicao').style.display = 'none';
}

function atualizarPreviewVideo() {
  // Preview em tempo real seria muito pesado
  // Apenas mostra feedback visual
  showToast('💡 Clique em "Processar Vídeo" para aplicar as mudanças');
}

async function processarVideo() {
  if (!videoBlob) {
    showToast('❌ Nenhum vídeo carregado');
    return;
  }
  
  const btnProcessar = document.getElementById('btnProcessarVideo');
  btnProcessar.disabled = true;
  btnProcessar.textContent = '⏳ Processando...';
  
  const progressDiv = document.getElementById('videoProcessando');
  const progressFill = document.getElementById('progressFill');
  const progressTexto = document.getElementById('progressTexto');
  
  progressDiv.style.display = 'block';
  
  try {
    // Simula progresso
    progressFill.style.width = '10%';
    progressTexto.textContent = 'Carregando vídeo... 10%';
    
    const video = document.createElement('video');
    video.src = URL.createObjectURL(videoBlob);
    await new Promise(resolve => {
      video.onloadedmetadata = resolve;
    });
    
    progressFill.style.width = '30%';
    progressTexto.textContent = 'Preparando canvas... 30%';
    
    const formato = document.getElementById('videoFormatoSaida').value;
    const duracao = document.getElementById('videoDuracaoCorte').value;
    const mostrarLogo = document.getElementById('videoMostrarLogo').checked;
    const mostrarTitulo = document.getElementById('videoMostrarTitulo').checked;
    const mostrarContatos = document.getElementById('videoMostrarContatos').checked;
    const logoPos = document.getElementById('videoLogoPos').value;
    const overlay = document.getElementById('videoOverlay').value;
    
    // Calcula dimensões
    let width, height;
    if (formato === 'original') {
      width = video.videoWidth;
      height = video.videoHeight;
    } else if (formato === 'stories' || formato === 'reels') {
      width = 1080;
      height = 1920;
    } else if (formato === 'feed') {
      width = 1080;
      height = 1350;
    } else if (formato === 'paisagem') {
      width = 1920;
      height = 1080;
    }
    
    progressFill.style.width = '50%';
    progressTexto.textContent = 'Processando frames... 50%';
    
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    const stream = canvas.captureStream(30);
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp9',
      videoBitsPerSecond: 5000000
    });
    
    const chunks = [];
    mediaRecorder.ondataavailable = e => chunks.push(e.data);
    
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filmeAtual.title.replace(/[^a-z0-9]/gi, '_')}_editado.webm`;
      a.click();
      
      progressFill.style.width = '100%';
      progressTexto.textContent = 'Concluído! 100%';
      
      setTimeout(() => {
        progressDiv.style.display = 'none';
        btnProcessar.disabled = false;
        btnProcessar.textContent = '🎬 Processar Vídeo';
        showToast('✅ Vídeo processado e baixado!');
      }, 2000);
    };
    
    mediaRecorder.start();
    video.play();
    
    const maxDuration = duracao === 'completo' ? video.duration : parseInt(duracao);
    const fps = 30;
    const frameTime = 1000 / fps;
    let currentTime = 0;
    
    const renderFrame = () => {
      if (currentTime >= maxDuration || currentTime >= video.duration) {
        mediaRecorder.stop();
        video.pause();
        return;
      }
      
      video.currentTime = currentTime;
      
      // Desenha vídeo
      const scale = Math.max(width / video.videoWidth, height / video.videoHeight);
      const sw = video.videoWidth * scale;
      const sh = video.videoHeight * scale;
      const sx = (width - sw) / 2;
      const sy = (height - sh) / 2;
      
      ctx.drawImage(video, sx, sy, sw, sh);
      
      // Overlay
      if (overlay !== 'none') {
        const overlayColors = {
          dark: 'rgba(0,0,0,0.4)',
          purple: 'rgba(76,29,149,0.5)',
          blue: 'rgba(30,58,95,0.5)',
          red: 'rgba(127,29,29,0.5)'
        };
        ctx.fillStyle = overlayColors[overlay];
        ctx.fillRect(0, 0, width, height);
      }
      
      // Logo
      if (mostrarLogo && logoImg) {
        const logoSize = width * 0.15;
        const logoScale = Math.min(logoSize / logoImg.width, logoSize / logoImg.height);
        const lw = logoImg.width * logoScale;
        const lh = logoImg.height * logoScale;
        const pad = width * 0.05;
        
        let lx, ly;
        if (logoPos === 'top-left') {
          lx = pad;
          ly = pad;
        } else if (logoPos === 'top-right') {
          lx = width - lw - pad;
          ly = pad;
        } else if (logoPos === 'bottom-left') {
          lx = pad;
          ly = height - lh - pad;
        } else {
          lx = width - lw - pad;
          ly = height - lh - pad;
        }
        
        ctx.drawImage(logoImg, lx, ly, lw, lh);
      }
      
      // Título
      if (mostrarTitulo) {
        const titleSize = width * 0.05;
        ctx.font = `900 ${titleSize}px Inter, sans-serif`;
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 20;
        ctx.textAlign = 'center';
        ctx.fillText(filmeAtual.title.toUpperCase(), width / 2, height * 0.15);
        ctx.shadowBlur = 0;
      }
      
      // Contatos
      if (mostrarContatos) {
        const whatsapp = document.getElementById('inputWhatsapp').value.trim();
        const instagram = document.getElementById('inputInstagram').value.trim();
        
        const contactSize = width * 0.035;
        ctx.font = `700 ${contactSize}px Inter, sans-serif`;
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(0,0,0,0.9)';
        ctx.shadowBlur = 15;
        ctx.textAlign = 'center';
        
        let contactY = height - width * 0.08;
        
        if (instagram) {
          ctx.fillText(`📸 ${instagram}`, width / 2, contactY);
          contactY -= contactSize * 1.5;
        }
        
        if (whatsapp) {
          ctx.fillText(`📱 ${whatsapp}`, width / 2, contactY);
        }
        
        ctx.shadowBlur = 0;
      }
      
      currentTime += frameTime / 1000;
      const progress = Math.min((currentTime / maxDuration) * 50 + 50, 100);
      progressFill.style.width = progress + '%';
      progressTexto.textContent = `Renderizando... ${Math.round(progress)}%`;
      
      setTimeout(renderFrame, frameTime);
    };
    
    video.onseeked = renderFrame;
    
  } catch (err) {
    console.error('Erro ao processar vídeo:', err);
    showToast('❌ Erro ao processar vídeo: ' + err.message);
    progressDiv.style.display = 'none';
    btnProcessar.disabled = false;
    btnProcessar.textContent = '🎬 Processar Vídeo';
  }
}

// ===== FUNÇÃO WHATSAPP =====
function abrirWhatsApp() {
  const numero = '5583998929124';
  const mensagem = 'Olá! Gostaria de testar o BannerFlix e criar banners profissionais.';
  const url = `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
  window.open(url, '_blank');
}