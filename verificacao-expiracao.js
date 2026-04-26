// =====================================================
// VERIFICAÇÃO DE EXPIRAÇÃO DE CHAVE
// =====================================================

// ===== VERIFICAR EXPIRAÇÃO DA CHAVE =====
function verificarExpiracaoChave() {
  if (!usuarioAtual) return;

  const dias = usuarioAtual.dias || 0;
  
  // Se for ilimitado (dias = 0), não precisa verificar
  if (dias === 0) return;
  
  // Se os dias chegaram a 0 ou menos, deslogar
  if (dias <= 0) {
    console.warn('⚠️ Chave expirada! Deslogando...');
    showToast('⏰ Sua chave de licença expirou. Faça login novamente.');
    fazerLogout();
    return;
  }
  
  // Se faltam menos de 1 dia, avisar
  if (dias === 1) {
    showToast('⚠️ Sua chave expira em 1 dia!');
  }
}

// ===== INICIAR VERIFICAÇÃO PERIÓDICA =====
function iniciarVerificacaoExpiracaoPeriodia() {
  // Verifica a cada 1 hora (3600000 ms)
  setInterval(() => {
    verificarExpiracaoChave();
  }, 3600000);
  
  // Também verifica ao carregar a página
  verificarExpiracaoChave();
}

// Inicia a verificação quando a página carrega
window.addEventListener('load', () => {
  iniciarVerificacaoExpiracaoPeriodia();
});
