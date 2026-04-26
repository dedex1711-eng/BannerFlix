// =====================================================
// SERVIDOR ESTÁTICO SIMPLES PARA BANNERFLIX
// =====================================================
// Serve arquivos estáticos sem precisar de PHP
// Acesse em: http://localhost:3000

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3000;
const HOST = 'localhost';

// Tipos MIME comuns
const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.txt': 'text/plain; charset=utf-8'
};

const server = http.createServer((req, res) => {
  // Parse URL
  const parsedUrl = url.parse(req.url, true);
  let pathname = parsedUrl.pathname;

  // Remove leading slash
  if (pathname === '/') {
    pathname = '/index.html';
  }

  // Caminho do arquivo
  const filePath = path.join(__dirname, pathname);

  // Segurança: previne path traversal
  const realPath = path.resolve(filePath);
  const baseDir = path.resolve(__dirname);
  
  if (!realPath.startsWith(baseDir)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Acesso negado');
    return;
  }

  // Tenta ler o arquivo
  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // Arquivo não encontrado
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <title>404 - Não Encontrado</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f5f5f5; }
              h1 { color: #333; }
              p { color: #666; }
              a { color: #0066cc; text-decoration: none; }
            </style>
          </head>
          <body>
            <h1>404 - Arquivo não encontrado</h1>
            <p>Arquivo: ${pathname}</p>
            <p><a href="/">Voltar para home</a></p>
          </body>
          </html>
        `);
        console.log(`❌ 404: ${pathname}`);
      } else {
        // Outro erro
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Erro interno do servidor');
        console.error(`❌ Erro ao ler ${filePath}:`, err.message);
      }
    } else {
      // Arquivo encontrado
      const ext = path.extname(filePath).toLowerCase();
      const contentType = mimeTypes[ext] || 'application/octet-stream';

      res.writeHead(200, {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache'
      });
      res.end(data);
      console.log(`✅ 200: ${pathname}`);
    }
  });
});

server.listen(PORT, HOST, () => {
  console.log(`
╔════════════════════════════════════════════════════════╗
║         🎬 SERVIDOR BANNERFLIX INICIADO 🎬            ║
╠════════════════════════════════════════════════════════╣
║                                                        ║
║  🌐 Acesse em: http://${HOST}:${PORT}                    ║
║                                                        ║
║  📁 Servindo arquivos de: ${__dirname}                 ║
║                                                        ║
║  ✅ Servidor rodando com sucesso!                     ║
║                                                        ║
║  Pressione CTRL+C para parar o servidor               ║
║                                                        ║
╚════════════════════════════════════════════════════════╝
  `);
});

// Tratamento de erros
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Porta ${PORT} já está em uso!`);
    console.log(`\nTente uma das opções:`);
    console.log(`1. Feche o programa que está usando a porta ${PORT}`);
    console.log(`2. Use uma porta diferente: node server-simples.js 3001`);
  } else {
    console.error('❌ Erro no servidor:', err);
  }
  process.exit(1);
});

// Tratamento de CTRL+C
process.on('SIGINT', () => {
  console.log('\n\n👋 Servidor encerrado');
  process.exit(0);
});
