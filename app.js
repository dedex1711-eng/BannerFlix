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

  showToast(`✅ "${title}" selecionado`);
  
  // Só gera o banner e mostra informações se estiver na aba de filmes
  if (tipoAtual !== 'futebol') {
    // Atualiza info do filme selecionado
    const infoDiv = document.getElementById('filmeSelecionado');
    document.getElementById('filmeThumb').src = filmeAtual.posterThumb || '';
    document.getElementById('filmeNome').textContent = title;
    document.getElementById('filmeAno').textContent  = `${year} • ${type}`;
    infoDiv.style.display = 'flex';
    
    gerarBanner(false); // false = apenas preview, sem verificar crédito
    buscarResumo(item);
  }
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
      // Só regenera se estiver na aba correta com conteúdo selecionado
      if (tipoAtual === 'futebol' && jogosSelecionados.length > 0) {
        gerarBannerAtual();
      } else if (tipoAtual !== 'futebol' && filmeAtual) {
        gerarBanner(false);
      }
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
  // Só regenera se estiver na aba correta com conteúdo selecionado
  if (tipoAtual === 'futebol' && jogosSelecionados.length > 0) {
    gerarBannerAtual();
  } else if (tipoAtual !== 'futebol' && filmeAtual) {
    gerarBanner(false);
  }
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
  if (tipoAtual === 'futebol' && jogosSelecionados.length > 0) {
    gerarBannerAtual(); // Gera banner de futebol
  } else if (filmeAtual) {
    gerarBanner(false); // false = não verificar crédito, apenas preview
  }
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
  // Se há banners múltiplos, usar a função específica
  if (window.bannersMultiplos && window.bannersMultiplos.length > 0) {
    downloadBannersMultiplos();
    return;
  }
  
  if (!bannerGerado) { showToast('Gere um banner primeiro'); return; }
  const canvas   = document.getElementById('bannerCanvas');
  const formato  = getFormato();
  
  // Definir nome do arquivo baseado no tipo de banner
  let titulo;
  if (tipoAtual === 'futebol') {
    titulo = 'futebol_destaques';
  } else {
    titulo = (filmeAtual?.title || 'banner').replace(/[^a-z0-9]/gi, '_').toLowerCase();
  }
  
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
          // Definir título baseado no tipo de banner
          const titulo = tipoAtual === 'futebol' ? 'Banner Futebol' : (filmeAtual?.title || 'Banner');
          await navigator.share({ files: [file], title: titulo });
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
// ===== FUTEBOL FUNCTIONS =====
let tipoAtual = 'filme';
let jogosSelecionados = [];

function selecionarTipo(tipo) {
  tipoAtual = tipo;
  
  // Atualizar botões
  document.querySelectorAll('.type-btn').forEach(btn => btn.classList.remove('active'));
  document.getElementById(`btnTipo${tipo.charAt(0).toUpperCase() + tipo.slice(1)}`).classList.add('active');
  
  // Mostrar/esconder painéis
  document.getElementById('painelFilmes').style.display = tipo === 'filme' ? 'block' : 'none';
  document.getElementById('painelFutebol').style.display = tipo === 'futebol' ? 'block' : 'none';
  
  // Atualizar placeholder do preview
  const placeholder = document.getElementById('canvasPlaceholder');
  if (tipo === 'futebol') {
    placeholder.innerHTML = '<span>⚽</span><p>Selecione jogos para começar</p>';
  } else {
    placeholder.innerHTML = '<span>🎬</span><p>Busque um filme para começar</p>';
  }
  
  // Limpar preview
  placeholder.style.display = 'block';
  document.getElementById('bannerCanvas').style.display = 'none';
  document.getElementById('previewActions').style.display = 'none';
  
  // Se trocou para futebol, esconder info do filme e resumo
  if (tipo === 'futebol') {
    const filmeSelecionado = document.getElementById('filmeSelecionado');
    if (filmeSelecionado) filmeSelecionado.style.display = 'none';
    
    const resumoCard = document.getElementById('resumoCard');
    if (resumoCard) resumoCard.style.display = 'none';
  }
  
  // Resetar estado do banner
  bannerGerado = false;
  
  // Limpar banners múltiplos
  window.bannersMultiplos = null;
  
  // Esconder visualizador múltiplo
  const visualizador = document.getElementById('visualizadorMultiplo');
  if (visualizador) {
    visualizador.classList.remove('show');
  }
  
  // Resetar botão de download
  const btnDownload = document.querySelector('.btn-download');
  if (btnDownload) {
    btnDownload.innerHTML = '⬇️ Baixar Banner';
    btnDownload.onclick = downloadBanner;
  }
  
  // Se for futebol, buscar jogos automaticamente
  if (tipo === 'futebol') {
    buscarJogosFutebol();
  }
}

async function buscarJogosFutebol() {
  const ligaSelect = document.getElementById('ligaSelect');
  const liga = ligaSelect.value;
  const container = document.getElementById('jogosDisponiveis');
  
  if (!liga) {
    container.innerHTML = '<div class="empty-state">Selecione uma liga para ver os jogos</div>';
    return;
  }
  
  container.innerHTML = '<div class="loading-state">🔄 Buscando jogos...</div>';
  
  try {
    // Buscar jogos da ESPN API
    const hoje = new Date();
    const dataFormatada = hoje.toISOString().split('T')[0].replace(/-/g, '');
    
    const response = await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${liga}/scoreboard?dates=${dataFormatada}`);
    
    if (!response.ok) {
      throw new Error('Erro ao buscar jogos');
    }
    
    const data = await response.json();
    const jogos = data.events || [];
    
    if (jogos.length === 0) {
      container.innerHTML = '<div class="empty-state">Nenhum jogo encontrado para hoje nesta liga</div>';
      return;
    }
    
    // Renderizar jogos
    let jogosHtml = '';
    jogos.forEach((jogo, index) => {
      const timeCasa = jogo.competitions[0].competitors.find(c => c.homeAway === 'home');
      const timeVisitante = jogo.competitions[0].competitors.find(c => c.homeAway === 'away');
      const dataJogo = new Date(jogo.date);
      const horario = dataJogo.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      const status = jogo.status.type.description;
      
      // Determinar canal de transmissão baseado na liga
      let canalTransmissao = 'A definir';
      const ligaNome = ligaSelect.options[ligaSelect.selectedIndex].text;
      
      if (ligaNome.includes('Brasileirão')) {
        const canaisBrasileirao = ['Globo', 'SporTV', 'Premiere'];
        canalTransmissao = canaisBrasileirao[Math.floor(Math.random() * canaisBrasileirao.length)];
      } else if (ligaNome.includes('Premier League')) {
        canalTransmissao = 'ESPN';
      } else if (ligaNome.includes('La Liga')) {
        canalTransmissao = 'ESPN';
      } else if (ligaNome.includes('Champions')) {
        const canaisChampions = ['TNT Sports', 'HBO Max'];
        canalTransmissao = canaisChampions[Math.floor(Math.random() * canaisChampions.length)];
      } else if (ligaNome.includes('Libertadores')) {
        canalTransmissao = 'ESPN';
      } else {
        const canaisGerais = ['ESPN', 'Fox Sports', 'SporTV'];
        canalTransmissao = canaisGerais[Math.floor(Math.random() * canaisGerais.length)];
      }

      jogosHtml += `
        <div class="jogo-api-item" onclick="toggleJogoSelecionado(${index}, this)" data-jogo='${JSON.stringify({
          id: jogo.id,
          timeCasa: timeCasa.team.displayName,
          timeVisitante: timeVisitante.team.displayName,
          horario: horario,
          status: status,
          liga: ligaSelect.options[ligaSelect.selectedIndex].text,
          logoCasa: timeCasa.team.logo || '',
          logoVisitante: timeVisitante.team.logo || '',
          local: jogo.competitions[0].venue ? jogo.competitions[0].venue.fullName : 'Local não informado',
          canal: canalTransmissao
        })}'>
          <div class="jogo-api-header">
            <div class="jogo-api-data">${horario}</div>
            <div class="jogo-api-status">${status}</div>
          </div>
          <div class="jogo-api-times">
            <div class="jogo-api-time">
              <div class="jogo-api-logo">
                ${timeCasa.team.logo ? `<img src="${timeCasa.team.logo}" style="width:100%;height:100%;border-radius:50%;" />` : '⚽'}
              </div>
              <div class="jogo-api-nome">${timeCasa.team.displayName}</div>
            </div>
            <div class="jogo-api-vs">VS</div>
            <div class="jogo-api-time">
              <div class="jogo-api-logo">
                ${timeVisitante.team.logo ? `<img src="${timeVisitante.team.logo}" style="width:100%;height:100%;border-radius:50%;" />` : '⚽'}
              </div>
              <div class="jogo-api-nome">${timeVisitante.team.displayName}</div>
            </div>
          </div>
          <div class="jogo-api-transmissao">📺 ${canalTransmissao}</div>
        </div>
      `;
    });
    
    container.innerHTML = jogosHtml;
    
    // Atualizar botão "Selecionar Todos" após carregar jogos
    atualizarBotaoSelecionarTodos();
    
  } catch (error) {
    console.error('Erro ao buscar jogos:', error);
    container.innerHTML = '<div class="error-state">❌ Erro ao carregar jogos. Tente novamente.</div>';
  }
}

function toggleJogoSelecionado(index, element) {
  const jogoData = JSON.parse(element.getAttribute('data-jogo'));
  
  // Verificar se já está selecionado
  const jaExiste = jogosSelecionados.findIndex(j => j.id === jogoData.id);
  
  if (jaExiste >= 0) {
    // Remover seleção
    jogosSelecionados.splice(jaExiste, 1);
    element.classList.remove('selected');
  } else {
    // Adicionar seleção
    jogosSelecionados.push(jogoData);
    element.classList.add('selected');
  }
  
  atualizarJogosSelecionados();
}

function atualizarJogosSelecionados() {
  const container = document.getElementById('jogosSelecionados');
  
  if (jogosSelecionados.length === 0) {
    container.innerHTML = '<p class="empty-state">Nenhum jogo selecionado</p>';
    // Atualizar placeholder
    const placeholder = document.getElementById('canvasPlaceholder');
    placeholder.innerHTML = '<span>⚽</span><p>Selecione jogos para começar</p>';
    placeholder.style.display = 'block';
    document.getElementById('bannerCanvas').style.display = 'none';
    return;
  }
  
  let html = '';
  jogosSelecionados.forEach((jogo, index) => {
    html += `
      <div class="jogo-selecionado">
        <div class="jogo-info">
          <strong>${jogo.timeCasa} x ${jogo.timeVisitante}</strong>
          <div>${jogo.horario} - ${jogo.liga}</div>
        </div>
        <button onclick="removerJogoSelecionado(${index})" class="btn-remove">✕</button>
      </div>
    `;
  });
  
  container.innerHTML = html;
  
  // Atualizar placeholder para mostrar que há jogos selecionados
  const placeholder = document.getElementById('canvasPlaceholder');
  placeholder.innerHTML = `<span>⚽</span><p>${jogosSelecionados.length} jogo(s) selecionado(s)<br/>Clique em "Gerar Banner" para criar</p>`;
  
  // Atualizar botão "Selecionar Todos"
  atualizarBotaoSelecionarTodos();
}

function removerJogoSelecionado(index) {
  const jogo = jogosSelecionados[index];
  jogosSelecionados.splice(index, 1);
  
  // Remover seleção visual
  const elementos = document.querySelectorAll('.jogo-api-item');
  elementos.forEach(el => {
    const data = JSON.parse(el.getAttribute('data-jogo'));
    if (data.id === jogo.id) {
      el.classList.remove('selected');
    }
  });
  
  atualizarJogosSelecionados();
}

function limparJogosSelecionados() {
  jogosSelecionados = [];
  document.querySelectorAll('.jogo-api-item').forEach(el => el.classList.remove('selected'));
  
  // Limpar banners múltiplos
  window.bannersMultiplos = null;
  
  // Resetar botão de download
  const btnDownload = document.querySelector('.btn-download');
  if (btnDownload) {
    btnDownload.innerHTML = '⬇️ Baixar Banner';
    btnDownload.onclick = downloadBanner;
  }
  
  atualizarJogosSelecionados();
}

// ===== FUNÇÃO PARA SELECIONAR TODOS OS JOGOS =====
function selecionarTodosJogos() {
  const jogosDisponiveis = document.querySelectorAll('.jogo-api-item');
  
  if (jogosDisponiveis.length === 0) {
    showToast('Nenhum jogo disponível para seleção');
    return;
  }
  
  // Verificar se todos já estão selecionados
  const todosSelecionados = Array.from(jogosDisponiveis).every(el => el.classList.contains('selected'));
  
  if (todosSelecionados) {
    // Se todos estão selecionados, desmarcar todos
    limparJogosSelecionados();
    showToast('🔄 Todos os jogos desmarcados');
  } else {
    // Selecionar todos os jogos
    jogosSelecionados = [];
    
    jogosDisponiveis.forEach(el => {
      // Adicionar classe selected
      el.classList.add('selected');
      
      // Extrair dados do jogo do atributo data-jogo
      try {
        const jogoData = JSON.parse(el.getAttribute('data-jogo'));
        jogosSelecionados.push(jogoData);
      } catch (error) {
        console.error('Erro ao extrair dados do jogo:', error);
      }
    });
    
    // Limpar banners múltiplos anteriores
    window.bannersMultiplos = null;
    
    // Resetar botão de download
    const btnDownload = document.querySelector('.btn-download');
    if (btnDownload) {
      btnDownload.innerHTML = '⬇️ Baixar Banner';
      btnDownload.onclick = downloadBanner;
    }
    
    // Atualizar interface
    atualizarJogosSelecionados();
    
    // Mostrar toast com quantidade selecionada
    showToast(`✅ ${jogosSelecionados.length} jogos selecionados!`);
    
    console.log('Todos os jogos selecionados:', jogosSelecionados);
  }
  
  // Atualizar texto do botão
  atualizarBotaoSelecionarTodos();
}

// ===== FUNÇÃO PARA ATUALIZAR TEXTO DO BOTÃO SELECIONAR TODOS =====
function atualizarBotaoSelecionarTodos() {
  const jogosDisponiveis = document.querySelectorAll('.jogo-api-item');
  const todosSelecionados = Array.from(jogosDisponiveis).every(el => el.classList.contains('selected'));
  
  const botao = document.querySelector('button[onclick="selecionarTodosJogos()"]');
  if (botao) {
    if (todosSelecionados && jogosDisponiveis.length > 0) {
      botao.innerHTML = '🔄 Desmarcar Todos';
    } else {
      botao.innerHTML = '✅ Selecionar Todos';
    }
  }
}

function gerarBannerFutebol() {
  console.log('gerarBannerFutebol chamada');
  console.log('Jogos selecionados:', jogosSelecionados.length);
  
  if (jogosSelecionados.length === 0) {
    alert('Selecione pelo menos um jogo!');
    return;
  }
  
  // Se tiver mais de 5 jogos, dividir em grupos
  if (jogosSelecionados.length > 5) {
    console.log('Mais de 5 jogos selecionados, gerando múltiplas imagens...');
    gerarMultiplosBannersFutebol();
  } else {
    console.log('Iniciando geração do canvas...');
    // Gerar banner com os jogos selecionados
    gerarBannerFutebolCanvas(jogosSelecionados);
  }
}

// ===== FUNÇÃO PARA GERAR MÚLTIPLOS BANNERS DE FUTEBOL =====
async function gerarMultiplosBannersFutebol() {
  try {
    // Dividir jogos em grupos de 5
    const gruposDeJogos = [];
    for (let i = 0; i < jogosSelecionados.length; i += 5) {
      gruposDeJogos.push(jogosSelecionados.slice(i, i + 5));
    }
    
    console.log(`Gerando ${gruposDeJogos.length} banners para ${jogosSelecionados.length} jogos`);
    
    // Mostrar mensagem de progresso
    showToast(`Gerando ${gruposDeJogos.length} banners com ${jogosSelecionados.length} jogos...`, 3000);
    
    // Array para armazenar todos os canvas gerados
    const bannersGerados = [];
    
    // Gerar cada banner
    for (let i = 0; i < gruposDeJogos.length; i++) {
      const grupo = gruposDeJogos[i];
      console.log(`Gerando banner ${i + 1}/${gruposDeJogos.length} com ${grupo.length} jogos`);
      
      // Criar um canvas temporário para este grupo
      const canvas = await gerarBannerFutebolCanvasMultiplo(grupo, i + 1, gruposDeJogos.length);
      bannersGerados.push({
        canvas: canvas,
        numero: i + 1,
        total: gruposDeJogos.length,
        jogos: grupo.length
      });
    }
    
    // Mostrar o primeiro banner no preview
    const canvasPreview = document.getElementById('bannerCanvas');
    const ctx = canvasPreview.getContext('2d');
    canvasPreview.width = bannersGerados[0].canvas.width;
    canvasPreview.height = bannersGerados[0].canvas.height;
    ctx.drawImage(bannersGerados[0].canvas, 0, 0);
    
    // Mostrar canvas e ações
    document.getElementById('canvasPlaceholder').style.display = 'none';
    canvasPreview.style.display = 'block';
    document.getElementById('previewActions').style.display = 'flex';
    bannerGerado = true;
    
    // Armazenar os banners para download
    window.bannersMultiplos = bannersGerados;
    
    // Criar visualizador de múltiplas imagens
    criarVisualizadorMultiplo(bannersGerados);
    
    // Mostrar visualizador
    const visualizador = document.getElementById('visualizadorMultiplo');
    if (visualizador) {
      visualizador.classList.add('show');
    }
    
    // Atualizar botão de download para baixar todos
    atualizarBotaoDownloadMultiplo(bannersGerados.length);
    
    showToast(`✅ ${gruposDeJogos.length} banners gerados com sucesso!`, 4000);
    
  } catch (error) {
    console.error('Erro ao gerar múltiplos banners:', error);
    showToast('❌ Erro ao gerar banners múltiplos');
  }
}

// ===== FUNÇÃO PARA GERAR CANVAS MÚLTIPLO =====
async function gerarBannerFutebolCanvasMultiplo(jogos, numeroBanner, totalBanners) {
  // Criar um canvas temporário
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  // Configurar dimensões
  const { w, h } = getDimensoes();
  canvas.width = w;
  canvas.height = h;
  
  // Fundo baseado no template selecionado
  const template = document.querySelector('input[name="template"]:checked')?.value || 'simples';
  
  if (template === 'promocional') {
    // Template promocional: usar imagens de futebol
    await desenharFundoFutebol(ctx, w, h);
  } else {
    // Template simples: usar gradiente de cor
    await desenharFundoSimplesFutebol(ctx, w, h);
  }
  
  // Título "DESTAQUES" com indicador de página
  ctx.fillStyle = '#ffffff';
  ctx.font = `900 ${w * 0.08}px Inter, sans-serif`;
  ctx.textAlign = 'center';
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 10;
  ctx.fillText('DESTAQUES', w/2, h * 0.10); // Movido de 0.12 para 0.10
  ctx.shadowBlur = 0;
  
  // Indicador de página (removido - não mostrar mais)
  // if (totalBanners > 1) {
  //   ctx.fillStyle = '#F77F30'; // Laranja
  //   ctx.font = `700 ${w * 0.025}px Inter, sans-serif`;
  //   ctx.fillText(`PÁGINA ${numeroBanner} DE ${totalBanners}`, w/2, h * 0.155);
  // }
  
  // Data
  const hoje = new Date();
  const dataFormatada = hoje.toLocaleDateString('pt-BR', { 
    weekday: 'short', 
    day: '2-digit', 
    month: '2-digit' 
  });
  ctx.font = `700 ${w * 0.025}px Inter, sans-serif`;
  ctx.fillStyle = '#ffffff';
  ctx.fillText(`DA RODADA - ${dataFormatada.toUpperCase()}`, w/2, h * 0.14); // Movido de 0.19 para 0.14
  
  // Desenhar jogos
  let yPos = h * 0.18; // Movido de 0.25 para 0.18
  const jogoHeight = h * 0.11;
  const jogoSpacing = h * 0.015;
  
  // Carregar todas as imagens primeiro
  const imagensCarregadas = await carregarImagensDosTimes(jogos);
  
  console.log(`Total de jogos recebidos: ${jogos.length}`);
  console.log('Jogos:', jogos.map(j => `${j.timeCasa} x ${j.timeVisitante}`));
  
  for (let i = 0; i < jogos.length && i < 5; i++) {
    const jogo = jogos[i];
    
    console.log(`Desenhando jogo ${i + 1}/5:`, jogo.timeCasa, 'x', jogo.timeVisitante);
    
    // Fundo do jogo com bordas arredondadas
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    roundRect(ctx, w * 0.05, yPos, w * 0.9, jogoHeight, 12);
    ctx.fill();
    
    // Campeonato/Liga (topo)
    ctx.fillStyle = '#F77F30'; // Laranja vibrante
    ctx.font = `600 ${w * 0.018}px Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(jogo.liga, w/2, yPos + jogoHeight * 0.2);
    
    // Horário (esquerda)
    ctx.fillStyle = '#F77F30'; // Laranja (igual ao canal)
    ctx.font = `900 ${w * 0.032}px Inter, sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText(jogo.horario, w * 0.08, yPos + jogoHeight * 0.6);
    
    // Desenhar brasões dos times
    const logoSize = w * 0.06;
    const logoY = yPos + jogoHeight * 0.32;
    
    // Logo time casa (esquerda)
    if (imagensCarregadas[i] && imagensCarregadas[i].logoCasa) {
      ctx.drawImage(imagensCarregadas[i].logoCasa, w * 0.28, logoY, logoSize, logoSize);
    } else {
      // Fallback: círculo com emoji
      ctx.fillStyle = '#f0f0f0';
      ctx.beginPath();
      ctx.arc(w * 0.28 + logoSize/2, logoY + logoSize/2, logoSize/2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#666';
      ctx.font = `${logoSize * 0.6}px Arial`;
      ctx.textAlign = 'center';
      ctx.fillText('⚽', w * 0.28 + logoSize/2, logoY + logoSize * 0.7);
    }
    
    // Logo time visitante (direita)
    if (imagensCarregadas[i] && imagensCarregadas[i].logoVisitante) {
      ctx.drawImage(imagensCarregadas[i].logoVisitante, w * 0.66, logoY, logoSize, logoSize);
    } else {
      // Fallback: círculo com emoji
      ctx.fillStyle = '#f0f0f0';
      ctx.beginPath();
      ctx.arc(w * 0.66 + logoSize/2, logoY + logoSize/2, logoSize/2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#666';
      ctx.font = `${logoSize * 0.6}px Arial`;
      ctx.textAlign = 'center';
      ctx.fillText('⚽', w * 0.66 + logoSize/2, logoY + logoSize * 0.7);
    }
    
    // Times (centro)
    ctx.fillStyle = '#000000';
    ctx.font = `600 ${w * 0.020}px Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(`${jogo.timeCasa} x ${jogo.timeVisitante}`, w/2, yPos + jogoHeight * 0.8);
    
    // Canal de transmissão (direita)
    ctx.fillStyle = '#F77F30';
    ctx.font = `600 ${w * 0.020}px Inter, sans-serif`;
    ctx.textAlign = 'right';
    const canalTransmissao = jogo.canal || 'A definir';
    ctx.fillText(`📺 ${canalTransmissao}`, w * 0.92, yPos + jogoHeight * 0.65);
    
    yPos += jogoHeight + jogoSpacing;
  }
  
  // Logo do usuário no canto superior esquerdo
  await desenharLogoUsuarioCanvas(ctx, w, h);
  
  // Informações do usuário (se houver)
  const whatsappEl = document.getElementById('inputWhatsapp');
  const instagramEl = document.getElementById('inputInstagram');
  const siteEl = document.getElementById('inputSite');
  const textoEl = document.getElementById('inputTexto');
  
  const whatsapp = whatsappEl ? whatsappEl.value : '';
  const instagram = instagramEl ? instagramEl.value : '';
  const site = siteEl ? siteEl.value : '';
  const textoExtra = textoEl ? textoEl.value : '';
  
  // Verificar se deve mostrar site no banner
  const mostrarSiteEl = document.getElementById('checkMostrarSiteBanner');
  const mostrarSite = mostrarSiteEl ? mostrarSiteEl.checked : true;
  
  // Criar array de contatos
  let contatos = [];
  if (whatsapp) contatos.push(`📱 ${whatsapp}`);
  if (instagram) contatos.push(`📷 ${instagram}`);
  if (site && mostrarSite) contatos.push(`🌐 ${site}`);
  if (textoExtra) contatos.push(`✨ ${textoExtra}`);
  
  if (contatos.length > 0) {
    ctx.fillStyle = '#ffffff';
    ctx.font = `600 ${w * 0.018}px Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 5;
    
    ctx.fillText(contatos.join('  •  '), w/2, h * 0.92);
    ctx.shadowBlur = 0;
  }
  
  return canvas;
}

// ===== FUNÇÃO PARA DESENHAR LOGO DO USUÁRIO EM CANVAS ESPECÍFICO =====
async function desenharLogoUsuarioCanvas(ctx, w, h) {
  const logoElement = document.getElementById('logoPreview');
  
  if (logoElement && logoElement.src && logoElement.style.display !== 'none') {
    try {
      const logoImg = await carregarImagem(logoElement.src);
      
      // Calcular tamanho da logo (canto superior esquerdo)
      const logoMaxSize = Math.min(w * 0.12, h * 0.08);
      const logoScale = Math.min(logoMaxSize / logoImg.width, logoMaxSize / logoImg.height);
      const logoW = logoImg.width * logoScale;
      const logoH = logoImg.height * logoScale;
      
      // Posição no canto superior esquerdo
      const logoX = w * 0.05;
      const logoY = h * 0.05;
      
      // Sombra da logo
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      
      // Desenhar logo
      ctx.drawImage(logoImg, logoX, logoY, logoW, logoH);
      
      // Resetar sombra
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      
      console.log('Logo do usuário desenhada no canvas');
    } catch (error) {
      console.log('Erro ao desenhar logo do usuário:', error);
    }
  }
}

// ===== FUNÇÃO PARA ATUALIZAR BOTÃO DE DOWNLOAD MÚLTIPLO =====
function atualizarBotaoDownloadMultiplo(quantidadeBanners) {
  const btnDownload = document.querySelector('.btn-download');
  if (btnDownload) {
    btnDownload.innerHTML = `⬇️ Baixar ${quantidadeBanners} Banners`;
    btnDownload.onclick = downloadBannersMultiplos;
  }
}

// ===== FUNÇÃO PARA DOWNLOAD DE MÚLTIPLOS BANNERS =====
async function downloadBannersMultiplos() {
  if (!window.bannersMultiplos || window.bannersMultiplos.length === 0) {
    showToast('Nenhum banner múltiplo encontrado');
    return;
  }
  
  const formato = getFormato();
  
  // Fazer download de cada banner
  for (let i = 0; i < window.bannersMultiplos.length; i++) {
    const banner = window.bannersMultiplos[i];
    const filename = `banner_futebol_parte${banner.numero}_${formato}.png`;
    
    const link = document.createElement('a');
    link.download = filename;
    link.href = banner.canvas.toDataURL('image/png');
    link.click();
    
    // Pequeno delay entre downloads para não sobrecarregar o navegador
    if (i < window.bannersMultiplos.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  showToast(`⬇️ ${window.bannersMultiplos.length} banners baixados!`, 3000);
}

// ===== FUNÇÃO PARA CRIAR VISUALIZADOR MÚLTIPLO =====
function criarVisualizadorMultiplo(bannersGerados) {
  // Verificar se já existe o visualizador
  let visualizador = document.getElementById('visualizadorMultiplo');
  
  if (!visualizador) {
    // Criar o visualizador
    visualizador = document.createElement('div');
    visualizador.id = 'visualizadorMultiplo';
    visualizador.className = 'visualizador-multiplo';
    
    // Inserir após o canvas wrapper
    const canvasWrapper = document.getElementById('canvasWrapper');
    canvasWrapper.parentNode.insertBefore(visualizador, canvasWrapper.nextSibling);
  }
  
  // Criar HTML do visualizador
  let html = `
    <div class="visualizador-header">
      <h4>📄 ${bannersGerados.length} Banners Gerados</h4>
      <p>Clique em qualquer banner para visualizar</p>
    </div>
    <div class="visualizador-grid">
  `;
  
  bannersGerados.forEach((banner, index) => {
    html += `
      <div class="banner-thumb ${index === 0 ? 'active' : ''}" onclick="trocarBannerPreview(${index})">
        <canvas class="thumb-canvas" width="200" height="200"></canvas>
        <div class="thumb-info">
          <span>Página ${banner.numero}</span>
          <small>${banner.jogos} jogos</small>
        </div>
      </div>
    `;
  });
  
  html += `
    </div>
    <div class="visualizador-navegacao">
      <button onclick="bannerAnterior()" class="btn-nav">← Anterior</button>
      <span id="bannerAtual">1 de ${bannersGerados.length}</span>
      <button onclick="proximoBanner()" class="btn-nav">Próximo →</button>
    </div>
  `;
  
  visualizador.innerHTML = html;
  
  // Desenhar thumbnails
  setTimeout(() => {
    bannersGerados.forEach((banner, index) => {
      const thumbCanvas = visualizador.querySelectorAll('.thumb-canvas')[index];
      if (thumbCanvas) {
        const thumbCtx = thumbCanvas.getContext('2d');
        
        // Calcular escala para thumbnail
        const scale = Math.min(200 / banner.canvas.width, 200 / banner.canvas.height);
        const thumbW = banner.canvas.width * scale;
        const thumbH = banner.canvas.height * scale;
        
        thumbCanvas.width = thumbW;
        thumbCanvas.height = thumbH;
        
        // Desenhar banner reduzido
        thumbCtx.drawImage(banner.canvas, 0, 0, thumbW, thumbH);
      }
    });
  }, 100);
  
  // Armazenar índice atual
  window.bannerAtualIndex = 0;
}

// ===== FUNÇÕES DE NAVEGAÇÃO =====
function trocarBannerPreview(index) {
  if (!window.bannersMultiplos || !window.bannersMultiplos[index]) return;
  
  // Atualizar canvas principal
  const canvasPreview = document.getElementById('bannerCanvas');
  const ctx = canvasPreview.getContext('2d');
  const banner = window.bannersMultiplos[index];
  
  canvasPreview.width = banner.canvas.width;
  canvasPreview.height = banner.canvas.height;
  ctx.drawImage(banner.canvas, 0, 0);
  
  // Atualizar thumbnails ativos
  document.querySelectorAll('.banner-thumb').forEach((thumb, i) => {
    thumb.classList.toggle('active', i === index);
  });
  
  // Atualizar navegação
  window.bannerAtualIndex = index;
  const navegacao = document.getElementById('bannerAtual');
  if (navegacao) {
    navegacao.textContent = `${index + 1} de ${window.bannersMultiplos.length}`;
  }
}

function bannerAnterior() {
  if (window.bannerAtualIndex > 0) {
    trocarBannerPreview(window.bannerAtualIndex - 1);
  }
}

function proximoBanner() {
  if (window.bannerAtualIndex < window.bannersMultiplos.length - 1) {
    trocarBannerPreview(window.bannerAtualIndex + 1);
  }
}

async function gerarBannerFutebolCanvas(jogos) {
  console.log('gerarBannerFutebolCanvas iniciada com jogos:', jogos);
  
  try {
    const canvas = document.getElementById('bannerCanvas');
    const ctx = canvas.getContext('2d');
    
    console.log('Canvas encontrado:', canvas);
    console.log('Context obtido:', ctx);
    
    // Configurar dimensões
    const { w, h } = getDimensoes();
    canvas.width = w;
    canvas.height = h;
    
    console.log('Dimensões configuradas:', w, 'x', h);
    
    // Fundo baseado no template selecionado
    const template = document.querySelector('input[name="template"]:checked')?.value || 'simples';
    
    if (template === 'promocional') {
      // Template promocional: usar imagens de futebol
      await desenharFundoFutebol(ctx, w, h);
    } else {
      // Template simples: usar gradiente de cor
      await desenharFundoSimplesFutebol(ctx, w, h);
    }
    
    console.log('Fundo desenhado');
    
    // Título "DESTAQUES"
    ctx.fillStyle = '#ffffff';
    ctx.font = `900 ${w * 0.08}px Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 10;
    ctx.fillText('DESTAQUES', w/2, h * 0.10); // Movido de 0.12 para 0.10
    ctx.shadowBlur = 0;
    
    console.log('Título desenhado');
    
    // Data
    const hoje = new Date();
    const dataFormatada = hoje.toLocaleDateString('pt-BR', { 
      weekday: 'short', 
      day: '2-digit', 
      month: '2-digit' 
    });
    ctx.font = `700 ${w * 0.025}px Inter, sans-serif`;
    ctx.fillText(`DA RODADA - ${dataFormatada.toUpperCase()}`, w/2, h * 0.14); // Movido de 0.16 para 0.14
    
    console.log('Data desenhada');
    
    // Desenhar jogos
    let yPos = h * 0.18; // Movido de 0.22 para 0.18
    const jogoHeight = h * 0.11; // Voltou para o tamanho original
    const jogoSpacing = h * 0.015; // Voltou para o espaçamento original
    
    // Carregar todas as imagens primeiro
    const imagensCarregadas = await carregarImagensDosTimes(jogos);
    
    for (let i = 0; i < jogos.length && i < 5; i++) {
      const jogo = jogos[i];
      
      console.log('Desenhando jogo:', i, jogo);
      
      // Fundo do jogo com bordas arredondadas
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      roundRect(ctx, w * 0.05, yPos, w * 0.9, jogoHeight, 12);
      ctx.fill();
      
      // Campeonato/Liga (topo)
      ctx.fillStyle = '#F77F30'; // Laranja vibrante
      ctx.font = `600 ${w * 0.018}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(jogo.liga, w/2, yPos + jogoHeight * 0.2);
      
      // Horário (esquerda)
      ctx.fillStyle = '#F77F30'; // Laranja (igual ao canal)
      ctx.font = `900 ${w * 0.032}px Inter, sans-serif`;
      ctx.textAlign = 'left';
      ctx.fillText(jogo.horario, w * 0.08, yPos + jogoHeight * 0.6);
      
      // Desenhar brasões dos times
      const logoSize = w * 0.06; // Aumentado de 0.05 para 0.06
      const logoY = yPos + jogoHeight * 0.32; // Ajustado para acomodar o tamanho maior
      
      // Logo time casa (esquerda)
      if (imagensCarregadas[i] && imagensCarregadas[i].logoCasa) {
        ctx.drawImage(imagensCarregadas[i].logoCasa, w * 0.28, logoY, logoSize, logoSize);
      } else {
        // Fallback: círculo com emoji
        ctx.fillStyle = '#f0f0f0';
        ctx.beginPath();
        ctx.arc(w * 0.28 + logoSize/2, logoY + logoSize/2, logoSize/2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#666';
        ctx.font = `${logoSize * 0.6}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText('⚽', w * 0.28 + logoSize/2, logoY + logoSize * 0.7);
      }
      
      // Logo time visitante (direita)
      if (imagensCarregadas[i] && imagensCarregadas[i].logoVisitante) {
        ctx.drawImage(imagensCarregadas[i].logoVisitante, w * 0.66, logoY, logoSize, logoSize);
      } else {
        // Fallback: círculo com emoji
        ctx.fillStyle = '#f0f0f0';
        ctx.beginPath();
        ctx.arc(w * 0.66 + logoSize/2, logoY + logoSize/2, logoSize/2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#666';
        ctx.font = `${logoSize * 0.6}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText('⚽', w * 0.66 + logoSize/2, logoY + logoSize * 0.7);
      }
      
      // Times (centro) - ajustado para ficar abaixo dos logos
      ctx.fillStyle = '#000000';
      ctx.font = `600 ${w * 0.020}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(`${jogo.timeCasa} x ${jogo.timeVisitante}`, w/2, yPos + jogoHeight * 0.8);
      
      // Canal de transmissão (direita, mais centralizado)
      ctx.fillStyle = '#F77F30'; // Laranja para destacar
      ctx.font = `600 ${w * 0.020}px Inter, sans-serif`; // Aumentado de 0.016 para 0.020
      ctx.textAlign = 'right';
      const canalTransmissao = jogo.canal || 'A definir';
      ctx.fillText(`📺 ${canalTransmissao}`, w * 0.92, yPos + jogoHeight * 0.65);
      
      yPos += jogoHeight + jogoSpacing;
    }
    
    console.log('Jogos desenhados');
    
    // Logo do usuário no canto superior esquerdo
    await desenharLogoUsuario(ctx, w, h);
    
    // Informações do usuário (se houver)
    const whatsappEl = document.getElementById('inputWhatsapp');
    const instagramEl = document.getElementById('inputInstagram');
    const siteEl = document.getElementById('inputSite');
    const textoEl = document.getElementById('inputTexto');
    
    const whatsapp = whatsappEl ? whatsappEl.value : '';
    const instagram = instagramEl ? instagramEl.value : '';
    const site = siteEl ? siteEl.value : '';
    const textoExtra = textoEl ? textoEl.value : '';
    
    // Verificar se deve mostrar site no banner
    const mostrarSiteEl = document.getElementById('checkMostrarSiteBanner');
    const mostrarSite = mostrarSiteEl ? mostrarSiteEl.checked : true;
    
    // Criar array de contatos
    let contatos = [];
    if (whatsapp) contatos.push(`📱 ${whatsapp}`);
    if (instagram) contatos.push(`📷 ${instagram}`);
    if (site && mostrarSite) contatos.push(`🌐 ${site}`);
    if (textoExtra) contatos.push(`✨ ${textoExtra}`);
    
    if (contatos.length > 0) {
      ctx.fillStyle = '#ffffff';
      ctx.font = `600 ${w * 0.018}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 5;
      
      ctx.fillText(contatos.join('  •  '), w/2, h * 0.92);
      ctx.shadowBlur = 0;
      console.log('Contatos desenhados');
    }
    
    // Mostrar canvas
    document.getElementById('canvasPlaceholder').style.display = 'none';
    canvas.style.display = 'block';
    document.getElementById('previewActions').style.display = 'flex';
    
    // Marcar banner como gerado para permitir download
    bannerGerado = true;
    
    console.log('Canvas exibido com sucesso!');
    
  } catch (error) {
    console.error('Erro ao gerar banner de futebol:', error);
    alert('Erro ao gerar banner: ' + error.message);
  }
}

// Inicializar com um jogo exemplo
document.addEventListener('DOMContentLoaded', function() {
  // Adicionar jogo exemplo quando selecionar futebol
  setTimeout(() => {
    if (document.getElementById('painelFutebol')) {
      adicionarJogo();
    }
  }, 100);
});
function gerarBannerAtual() {
  console.log('gerarBannerAtual chamada, tipo:', tipoAtual);
  console.log('jogos selecionados:', jogosSelecionados);
  
  if (tipoAtual === 'futebol') {
    console.log('Gerando banner de futebol...');
    gerarBannerFutebol();
  } else {
    console.log('Gerando banner de filme...');
    gerarBanner(); // Função original para filmes
  }
}
// ===== FUNÇÃO PARA CARREGAR IMAGENS DOS TIMES =====
async function carregarImagensDosTimes(jogos) {
  const imagensCarregadas = [];
  
  for (let i = 0; i < jogos.length && i < 5; i++) {
    const jogo = jogos[i];
    const imagens = {
      logoCasa: null,
      logoVisitante: null
    };
    
    // Carregar logo do time casa
    if (jogo.logoCasa) {
      try {
        imagens.logoCasa = await carregarImagem(jogo.logoCasa);
        console.log(`Logo do ${jogo.timeCasa} carregada`);
      } catch (e) {
        console.log(`Erro ao carregar logo do ${jogo.timeCasa}:`, e);
      }
    }
    
    // Carregar logo do time visitante
    if (jogo.logoVisitante) {
      try {
        imagens.logoVisitante = await carregarImagem(jogo.logoVisitante);
        console.log(`Logo do ${jogo.timeVisitante} carregada`);
      } catch (e) {
        console.log(`Erro ao carregar logo do ${jogo.timeVisitante}:`, e);
      }
    }
    
    imagensCarregadas.push(imagens);
  }
  
  return imagensCarregadas;
}

function carregarImagem(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      resolve(img);
    };
    
    img.onerror = () => {
      reject(new Error(`Falha ao carregar imagem: ${url}`));
    };
    
    // Timeout de 5 segundos
    setTimeout(() => {
      reject(new Error(`Timeout ao carregar imagem: ${url}`));
    }, 5000);
    
    img.src = url;
  });
}
// ===== FUNÇÃO PARA DESENHAR LOGO DO USUÁRIO =====
async function desenharLogoUsuario(ctx, w, h) {
  const logoElement = document.getElementById('logoPreview');
  
  console.log('Verificando logo do usuário...');
  console.log('logoElement:', logoElement);
  console.log('logoElement.src:', logoElement ? logoElement.src : 'não encontrado');
  console.log('logoElement.style.display:', logoElement ? logoElement.style.display : 'não encontrado');
  
  if (logoElement && logoElement.src && logoElement.style.display !== 'none') {
    try {
      console.log('Carregando logo do elemento preview...');
      const logoImg = await carregarImagem(logoElement.src);
      
      // Calcular tamanho mantendo proporção original
      const maxLogoSize = Math.min(w, h) * 0.12; // Aumentado de 0.08 para 0.12
      const aspectRatio = logoImg.width / logoImg.height;
      
      let logoWidth, logoHeight;
      if (aspectRatio > 1) {
        // Logo mais larga que alta
        logoWidth = maxLogoSize;
        logoHeight = maxLogoSize / aspectRatio;
      } else {
        // Logo mais alta que larga ou quadrada
        logoHeight = maxLogoSize;
        logoWidth = maxLogoSize * aspectRatio;
      }
      
      const logoX = w * 0.05; // Canto esquerdo
      const logoY = h * 0.05; // Canto superior
      
      ctx.drawImage(logoImg, logoX, logoY, logoWidth, logoHeight);
      console.log(`Logo desenhada no canto superior esquerdo! Tamanho: ${logoWidth}x${logoHeight}`);
      
    } catch(e) {
      console.log('Erro ao carregar/desenhar logo:', e);
    }
  } else if (typeof logoAtual !== 'undefined' && logoAtual) {
    try {
      console.log('Usando logoAtual...');
      
      // Calcular tamanho mantendo proporção original
      const maxLogoSize = Math.min(w, h) * 0.12; // Aumentado de 0.08 para 0.12
      const aspectRatio = logoAtual.width / logoAtual.height;
      
      let logoWidth, logoHeight;
      if (aspectRatio > 1) {
        // Logo mais larga que alta
        logoWidth = maxLogoSize;
        logoHeight = maxLogoSize / aspectRatio;
      } else {
        // Logo mais alta que larga ou quadrada
        logoHeight = maxLogoSize;
        logoWidth = maxLogoSize * aspectRatio;
      }
      
      const logoX = w * 0.05; // Canto esquerdo
      const logoY = h * 0.05; // Canto superior
      
      ctx.drawImage(logoAtual, logoX, logoY, logoWidth, logoHeight);
      console.log(`Logo desenhada no canto superior esquerdo (logoAtual)! Tamanho: ${logoWidth}x${logoHeight}`);
      
    } catch(e) {
      console.log('Erro ao desenhar logoAtual:', e);
    }
  } else {
    console.log('Nenhuma logo encontrada para desenhar');
  }
}
// ===== FUNÇÃO PARA DESENHAR FUNDO SIMPLES DE FUTEBOL =====
async function desenharFundoSimplesFutebol(ctx, w, h) {
  // Obter a cor selecionada do overlay (reutilizando as opções existentes)
  const overlayStyle = getOverlayStyle();
  
  // Mapear cores do overlay para gradientes de fundo
  let gradient;
  
  if (overlayStyle === 'rgba(76,29,149,0.6)') { // Purple
    gradient = ctx.createLinearGradient(0, 0, w, h);
    gradient.addColorStop(0, '#1a0a2e');
    gradient.addColorStop(0.5, '#2d1060');
    gradient.addColorStop(1, '#4c1d95');
  } else if (overlayStyle === 'rgba(30,58,95,0.6)') { // Blue
    gradient = ctx.createLinearGradient(0, 0, w, h);
    gradient.addColorStop(0, '#0a1628');
    gradient.addColorStop(0.5, '#1e3a5f');
    gradient.addColorStop(1, '#2563eb');
  } else if (overlayStyle === 'rgba(127,29,29,0.6)') { // Red
    gradient = ctx.createLinearGradient(0, 0, w, h);
    gradient.addColorStop(0, '#1a0a0a');
    gradient.addColorStop(0.5, '#7f1d1d');
    gradient.addColorStop(1, '#dc2626');
  } else { // Dark (default)
    gradient = ctx.createLinearGradient(0, 0, w, h);
    gradient.addColorStop(0, '#0a0a0f');
    gradient.addColorStop(0.5, '#1a1a24');
    gradient.addColorStop(1, '#2a2a3a');
  }
  
  // Aplicar o gradiente de fundo
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);
  
  // Adicionar padrão sutil de futebol (opcional)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
  
  // Desenhar círculos sutis para simular bolas de futebol
  for (let i = 0; i < 8; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    const radius = Math.random() * 30 + 10;
    
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  
  console.log('Fundo simples de futebol aplicado');
}

// ===== FUNÇÃO PARA DESENHAR FUNDO DE FUTEBOL =====
async function desenharFundoFutebol(ctx, w, h) {
  try {
    // URLs de imagens de futebol de alta qualidade (Unsplash)
    const imagensFutebol = [
      'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1920&h=1080&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=1920&h=1080&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1553778263-73a83bab9b0c?w=1920&h=1080&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1579952363873-27d3bfad9c0d?w=1920&h=1080&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=1920&h=1080&fit=crop&crop=center'
    ];
    
    // Usar sempre a primeira imagem (mais consistente)
    const imagemEscolhida = imagensFutebol[0];
    
    console.log('Carregando imagem de fundo:', imagemEscolhida);
    
    // Carregar imagem de fundo com timeout menor
    const imagemFundo = await Promise.race([
      carregarImagem(imagemEscolhida),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000))
    ]);
    
    // Desenhar imagem de fundo cobrindo todo o canvas
    ctx.drawImage(imagemFundo, 0, 0, w, h);
    
    // Adicionar overlay sutil para melhor legibilidade
    const overlayGradient = ctx.createLinearGradient(0, 0, w, h);
    overlayGradient.addColorStop(0, 'rgba(0, 0, 0, 0.4)'); // Preto sutil
    overlayGradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.3)'); // Preto mais sutil no meio
    overlayGradient.addColorStop(1, 'rgba(0, 0, 0, 0.4)'); // Preto sutil
    
    ctx.fillStyle = overlayGradient;
    ctx.fillRect(0, 0, w, h);
    
    console.log('Fundo de futebol aplicado com sucesso');
    
  } catch (error) {
    console.log('Erro ao carregar imagem de fundo, usando padrão de campo:', error);
    
    // Fallback: padrão de campo de futebol
    desenharPadraoFutebol(ctx, w, h);
  }
}
// ===== FUNÇÃO PARA DESENHAR PADRÃO DE FUTEBOL =====
function desenharPadraoFutebol(ctx, w, h) {
  // Fundo gradiente base
  const gradient = ctx.createLinearGradient(0, 0, w, h);
  gradient.addColorStop(0, '#1a5f1a'); // Verde escuro
  gradient.addColorStop(0.3, '#2d8f2d'); // Verde médio
  gradient.addColorStop(0.7, '#4caf4c'); // Verde claro
  gradient.addColorStop(1, '#1a5f1a'); // Verde escuro
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);
  
  // Desenhar linhas do campo
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 2;
  
  // Linha central
  ctx.beginPath();
  ctx.moveTo(0, h/2);
  ctx.lineTo(w, h/2);
  ctx.stroke();
  
  // Círculo central
  ctx.beginPath();
  ctx.arc(w/2, h/2, Math.min(w, h) * 0.1, 0, Math.PI * 2);
  ctx.stroke();
  
  // Áreas do gol (simplificadas)
  const goalAreaW = w * 0.15;
  const goalAreaH = h * 0.3;
  
  // Área esquerda
  ctx.strokeRect(0, (h - goalAreaH)/2, goalAreaW, goalAreaH);
  
  // Área direita
  ctx.strokeRect(w - goalAreaW, (h - goalAreaH)/2, goalAreaW, goalAreaH);
  
  // Overlay preto sutil para melhor legibilidade
  const overlayGradient = ctx.createLinearGradient(0, 0, w, h);
  overlayGradient.addColorStop(0, 'rgba(0, 0, 0, 0.4)');
  overlayGradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.3)');
  overlayGradient.addColorStop(1, 'rgba(0, 0, 0, 0.4)');
  
  ctx.fillStyle = overlayGradient;
  ctx.fillRect(0, 0, w, h);
}