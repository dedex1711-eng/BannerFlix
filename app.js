// ===== DESABILITAR CONSOLE EM PRODUÇÃO =====
if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
  console.log = function() {};
  console.warn = function() {};
  console.error = function() {};
  console.info = function() {};
  console.debug = function() {};
}

// ===== CONFIGURAÇÃO =====
// Chave pública gratuita do TMDB — substitua pela sua em https://www.themoviedb.org/settings/api
const TMDB_API_KEY = '8265bd1679663a7ea12ac168da84d2e8';
const TMDB_BASE    = 'https://api.themoviedb.org/3';
const TMDB_IMG     = 'https://image.tmdb.org/t/p/original';
const TMDB_IMG_W   = 'https://image.tmdb.org/t/p/w500';

// ===== ESTADO =====
let filmeAtual    = null;   // { title, year, posterPath, backdropPath, type }
let logoImg       = null;   // HTMLImageElement da logo do usuário
let jogadorImg    = null;   // HTMLImageElement da foto do jogador
let jogadorAutomatico = false; // Flag para indicar se está usando jogador automático
let bannerGerado  = false;

// ===== BANCO DE DADOS DE JOGADORES FAMOSOS =====
// Array de imagens disponíveis (fallback aleatório)
const imagensJogadoresDisponiveis = [
  { nome: 'Giorgian De Arrascaeta', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Giorgian%20De%20Arrascaeta%20-%20FootyRenders.png' },
  { nome: 'Harry Kane', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Harry%20Kane%20Bayern%20Munich.png' },
  { nome: 'Kylian Mbappé', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Kylian%20Mbappe%20Real%20Madrid.png' },
  { nome: 'Lamine Yamal', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/lamine-yamal-.png' },
  { nome: 'Lionel Messi', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Lionel%20Messi%20Inter%20Miami.png' },
  { nome: 'Luka Modrić', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Luka%20Modrić%20Real%20Madrid.png' },
  { nome: 'Erling Haaland', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Manchester%20City%20Erling%20Haaland.png' },
  { nome: 'Neymar Jr', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Neymar.png' },
  { nome: 'Gustavo Gómez', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Gustavo%20Gómez.png' },
  { nome: 'Vinícius Jr', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Vinicius%20Junior%20Real%20Madrid.png' },
  { nome: 'Memphis Depay', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Memphis%20Depay.png' },
  { nome: 'Mohamed Salah', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Mohamed%20Salah.png' },
  { nome: 'João Pedro', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/João%20Pedro.png' },
  { nome: 'Cole Palmer', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Cole%20Palmer.png' },
  { nome: 'Bukayo Saka', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Bukayo%20Saka2.png' },
  { nome: 'Luis Rioja', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Luis_Rioja.png' },
  { nome: 'John Kennedy', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/john-kennedy-fluminense-brazilian-serie-a-brazil-brazilian-footballers-uniqrenders.com.png' },
  { nome: 'Arthur Cabral', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Arthur%20Cabral2.png' },
  { nome: 'Isidro Pitta', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Isidro%20Pitta.png' },
  { nome: 'Roberto Firmino', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/roberto-firmino-al-ahli-saudi-professional-league-brazil-brazilian-footballers-uniqrenders.com.png' }
];

const jogadoresFamosos = {
  // Campeonato Saudita
  'Al Nassr': { nome: 'Cristiano Ronaldo', url: 'https://raw.githubusercontent.com/dedex1711-eng/jogadores/refs/heads/main/cristiano_ronaldo.png' },
  'Al-Nassr': { nome: 'Cristiano Ronaldo', url: 'https://raw.githubusercontent.com/dedex1711-eng/jogadores/refs/heads/main/cristiano_ronaldo.png' },
  'Al Nassr FC': { nome: 'Cristiano Ronaldo', url: 'https://raw.githubusercontent.com/dedex1711-eng/jogadores/refs/heads/main/cristiano_ronaldo.png' },
  'Al-Nassr FC': { nome: 'Cristiano Ronaldo', url: 'https://raw.githubusercontent.com/dedex1711-eng/jogadores/refs/heads/main/cristiano_ronaldo.png' },
  'Al Nassr (KSA)': { nome: 'Cristiano Ronaldo', url: 'https://raw.githubusercontent.com/dedex1711-eng/jogadores/refs/heads/main/cristiano_ronaldo.png' },
  'Al-Nassr (KSA)': { nome: 'Cristiano Ronaldo', url: 'https://raw.githubusercontent.com/dedex1711-eng/jogadores/refs/heads/main/cristiano_ronaldo.png' },
  'AlNassr': { nome: 'Cristiano Ronaldo', url: 'https://raw.githubusercontent.com/dedex1711-eng/jogadores/refs/heads/main/cristiano_ronaldo.png' },
  'Al Ahli': { nome: 'Roberto Firmino', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/roberto-firmino-al-ahli-saudi-professional-league-brazil-brazilian-footballers-uniqrenders.com.png' },
  'Al Hilal': { nome: 'Neymar Jr', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Neymar.png' },
  'Al Ittihad': { nome: 'Karim Benzema', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Kylian%20Mbappe%20Real%20Madrid.png' },
  'Al Riyadh': { nome: 'Cristiano Ronaldo', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Neymar.png' },
  'Al Qadsiah': { nome: 'Neymar Jr', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Neymar.png' },
  'Al Ettifaq': { nome: 'Roberto Firmino', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/roberto-firmino-al-ahli-saudi-professional-league-brazil-brazilian-footballers-uniqrenders.com.png' },
  'Al Fateh': { nome: 'Cristiano Ronaldo', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Neymar.png' },
  'Al Taawoun': { nome: 'Neymar Jr', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Neymar.png' },
  'Al Shabab': { nome: 'Karim Benzema', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Kylian%20Mbappe%20Real%20Madrid.png' },
  
  // Premier League
  'Manchester City': { nome: 'Erling Haaland', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Manchester%20City%20Erling%20Haaland.png' },
  'Arsenal': { nome: 'Bukayo Saka', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Bukayo%20Saka2.png' },
  'Liverpool': { nome: 'Mohamed Salah', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Mohamed%20Salah.png' },
  'Liverpool FC': { nome: 'Mohamed Salah', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Mohamed%20Salah.png' },
  'Manchester United': { nome: 'Bruno Fernandes', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Luka%20Modrić%20Real%20Madrid.png' },
  'Chelsea': { nome: 'Cole Palmer', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Cole%20Palmer.png' },
  'Tottenham': { nome: 'Son Heung-min', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Giorgian%20De%20Arrascaeta%20-%20FootyRenders.png' },
  'Newcastle': { nome: 'Bruno Fernandes', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Luka%20Modrić%20Real%20Madrid.png' },
  'Leeds United': { nome: 'Daniel James', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Daniel%20James.png' },
  'Norwich City': { nome: 'Josh Sargent', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Josh%20Sargent2.png' },
  'Norwich': { nome: 'Josh Sargent', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Josh%20Sargent2.png' },
  'Sheffield Wednesday': { nome: 'Liam Palmer', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Liam%20Palmer.png' },
  'Sheffield W.': { nome: 'Liam Palmer', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Liam%20Palmer.png' },
  'Brentford': { nome: 'Nathan Collins', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/nathan%20collins.png' },
  
  // La Liga
  'Real Madrid': { nome: 'Vinícius Jr', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Vinicius%20Junior%20Real%20Madrid.png' },
  'Barcelona': { nome: 'Lamine Yamal', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/lamine-yamal-.png' },
  'Atlético Madrid': { nome: 'Antoine Griezmann', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Antoine%20Griezmann.png' },
  'Atletico Madrid': { nome: 'Antoine Griezmann', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Antoine%20Griezmann.png' },
  'Atletico M.': { nome: 'Antoine Griezmann', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Antoine%20Griezmann.png' },
  'Sevilla': { nome: 'Vinícius Jr', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Vinicius%20Junior%20Real%20Madrid.png' },
  'Mallorca': { nome: 'Abdón Prats', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Abdón%20Prats.png' },
  'Deportivo Alavés': { nome: 'Luis Rioja', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Luis_Rioja.png' },
  'Albacete': { nome: 'Antonio Puertas', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Antonio%20Puertas.png' },
  'Albacete BP': { nome: 'Antonio Puertas', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Antonio%20Puertas.png' },
  'Levante': { nome: 'Carlos Álvarez', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Carlos%20Álvarez2.png' },
  'Levante UD': { nome: 'Carlos Álvarez', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Carlos%20Álvarez2.png' },
  
  // América do Sul
  'Boca Juniors': { nome: 'Leandro Paredes', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/leandro-paredes.png' },
  'River Plate': { nome: 'Gonzalo Montiel', url: 'https://raw.githubusercontent.com/dedex1711-eng/jogadores/refs/heads/main/Gonzalo%20Montiel.png' },
  'CA River Plate': { nome: 'Gonzalo Montiel', url: 'https://raw.githubusercontent.com/dedex1711-eng/jogadores/refs/heads/main/Gonzalo%20Montiel.png' },
  'River Plate (ARG)': { nome: 'Gonzalo Montiel', url: 'https://raw.githubusercontent.com/dedex1711-eng/jogadores/refs/heads/main/Gonzalo%20Montiel.png' },
  'Alianza Lima': { nome: 'Hernán Barcos', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Hernán%20Barcos.png' },
  'Club Alianza Lima': { nome: 'Hernán Barcos', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Hernán%20Barcos.png' },
  'Universidad Católica': { nome: 'Eduard Bello', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Eduard%20Bello2.png' },
  'CD Universidad Católica': { nome: 'Eduard Bello', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Eduard%20Bello2.png' },
  'Universidad C.': { nome: 'Eduard Bello', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Eduard%20Bello2.png' },
  'Universidad Catolica': { nome: 'Eduard Bello', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Eduard%20Bello2.png' },
  'U. Católica': { nome: 'Eduard Bello', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Eduard%20Bello2.png' },
  'Universidad Católica (Quito)': { nome: 'Eduard Bello', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Eduard%20Bello2.png' },
  'FC Cajamarca': { nome: 'Pablo Lavandeira', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Pablo%20Lavandeira.png' },
  'Cajamarca': { nome: 'Pablo Lavandeira', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Pablo%20Lavandeira.png' },
  'Comerciantes Unidos': { nome: 'Pablo Lavandeira', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Pablo%20Lavandeira.png' },
  'Liverpool Montevideo': { nome: 'Jean Rosso', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Jean%20Rosso2.png' },
  'Liverpool (URU)': { nome: 'Jean Rosso', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Jean%20Rosso2.png' },
  'Liverpool FC (URU)': { nome: 'Jean Rosso', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Jean%20Rosso2.png' },
  'Boston River': { nome: 'Marco Mancebo', url: 'https://raw.githubusercontent.com/dedex1711-eng/jogadores/refs/heads/main/Marco%20Mancebo.png' },
  'Boston River FC': { nome: 'Marco Mancebo', url: 'https://raw.githubusercontent.com/dedex1711-eng/jogadores/refs/heads/main/Marco%20Mancebo.png' },
  'Club Atlético Boston River': { nome: 'Marco Mancebo', url: 'https://raw.githubusercontent.com/dedex1711-eng/jogadores/refs/heads/main/Marco%20Mancebo.png' },
  'Carabobo': { nome: 'Edson Tortolero', url: 'https://raw.githubusercontent.com/dedex1711-eng/jogadores/refs/heads/main/Edson-Tortolero.png' },
  'Carabobo FC': { nome: 'Edson Tortolero', url: 'https://raw.githubusercontent.com/dedex1711-eng/jogadores/refs/heads/main/Edson-Tortolero.png' },
  'Carabobo Fútbol Club': { nome: 'Edson Tortolero', url: 'https://raw.githubusercontent.com/dedex1711-eng/jogadores/refs/heads/main/Edson-Tortolero.png' },
  'Bucaramanga': { nome: 'Emerson Batalla', url: 'https://raw.githubusercontent.com/dedex1711-eng/jogadores/refs/heads/main/Emerson%20Batalla.png' },
  'Bucaramanga FC': { nome: 'Emerson Batalla', url: 'https://raw.githubusercontent.com/dedex1711-eng/jogadores/refs/heads/main/Emerson%20Batalla.png' },
  'Atlético Bucaramanga': { nome: 'Emerson Batalla', url: 'https://raw.githubusercontent.com/dedex1711-eng/jogadores/refs/heads/main/Emerson%20Batalla.png' },
  
  // Brasileirão
  'Flamengo': { nome: 'Pedro', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/pedro-flamengo2.png' },
  'Palmeiras': { nome: 'Gustavo Gómez', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Gustavo%20Gómez.png' },
  'São Paulo': { nome: 'Lucas Beraldo', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Lucas%20Beraldo2.png' },
  'São Paulo FC': { nome: 'Lucas Beraldo', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Lucas%20Beraldo2.png' },
  'Sao Paulo': { nome: 'Lucas Beraldo', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Lucas%20Beraldo2.png' },
  'Corinthians': { nome: 'Memphis Depay', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Memphis%20Depay.png' },
  'Fluminense': { nome: 'Kevin Serna', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Kevin-Serna20.png' },
  'Fluminense FC': { nome: 'Kevin Serna', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Kevin-Serna20.png' },
  'Fluminense RJ': { nome: 'Kevin Serna', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Kevin-Serna20.png' },
  'Santos': { nome: 'Neymar Jr', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Neymar.png' },
  'Santos FC': { nome: 'Neymar Jr', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Neymar.png' },
  'Botafogo': { nome: 'Arthur Cabral', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Arthur%20Cabral2.png' },
  'Botafogo FR': { nome: 'Arthur Cabral', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Arthur%20Cabral2.png' },
  'Bragantino': { nome: 'Isidro Pitta', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Isidro%20Pitta.png' },
  'Red Bull Bragantino': { nome: 'Isidro Pitta', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Isidro%20Pitta.png' },
  'Estudiantes de La Plata': { nome: 'Lionel Messi', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Lionel%20Messi%20Inter%20Miami.png' },
  'Atlético Mineiro': { nome: 'Gabigol', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Giorgian%20De%20Arrascaeta%20-%20FootyRenders.png' },
  'Grêmio': { nome: 'Carlos Vinícius', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Carlos%20Vinícius.png' },
  'Gremio': { nome: 'Carlos Vinícius', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Carlos%20Vinícius.png' },
  'Internacional': { nome: 'Yuri Alberto', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Giorgian%20De%20Arrascaeta%20-%20FootyRenders.png' },
  'Cruzeiro': { nome: 'Matheus Pereira', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Matheus%20Pereira.png' },
  'Cruzeiro EC': { nome: 'Matheus Pereira', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Matheus%20Pereira.png' },
  'Vasco': { nome: 'Johan Rojas', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Johan%20Rojas.png' },
  'Vasco da Gama': { nome: 'Johan Rojas', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Johan%20Rojas.png' },
  'CR Vasco da Gama': { nome: 'Johan Rojas', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Johan%20Rojas.png' },
  'Bahia': { nome: 'Erick Pulga', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Erick%20Pulga.png' },
  'EC Bahia': { nome: 'Erick Pulga', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Erick%20Pulga.png' },
  'Esporte Clube Bahia': { nome: 'Erick Pulga', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Erick%20Pulga.png' },
  'Mirasol': { nome: 'Reinaldo Manoel da Silva', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Reinaldo%20Manoel%20da%20Silva2.png' },
  'Mirassol': { nome: 'Reinaldo Manoel da Silva', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Reinaldo%20Manoel%20da%20Silva2.png' },
  'Mirassol FC': { nome: 'Reinaldo Manoel da Silva', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Reinaldo%20Manoel%20da%20Silva2.png' },
  'Goiás': { nome: 'Matheus Gonçalves', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Matheus-Goncalves-Goias.png' },
  'Goiás EC': { nome: 'Matheus Gonçalves', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Matheus-Goncalves-Goias.png' },
  'Goias': { nome: 'Matheus Gonçalves', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Matheus-Goncalves-Goias.png' },
  'Vila Nova': { nome: 'Rafael da Silva', url: 'https://raw.githubusercontent.com/dedex1711-eng/jogadores/refs/heads/main/Rafael%20da%20Silva.png' },
  'Vila Nova FC': { nome: 'Rafael da Silva', url: 'https://raw.githubusercontent.com/dedex1711-eng/jogadores/refs/heads/main/Rafael%20da%20Silva.png' },
  'Vila Nova Futebol Clube': { nome: 'Rafael da Silva', url: 'https://raw.githubusercontent.com/dedex1711-eng/jogadores/refs/heads/main/Rafael%20da%20Silva.png' },
  'Athletic': { nome: 'Rodrigo Gelado', url: 'https://raw.githubusercontent.com/dedex1711-eng/jogadores/refs/heads/main/Rodrigo%20Gelado.png' },
  'Athletic Club': { nome: 'Rodrigo Gelado', url: 'https://raw.githubusercontent.com/dedex1711-eng/jogadores/refs/heads/main/Rodrigo%20Gelado.png' },
  'Athletic-MG': { nome: 'Rodrigo Gelado', url: 'https://raw.githubusercontent.com/dedex1711-eng/jogadores/refs/heads/main/Rodrigo%20Gelado.png' },
  'Athletic MG': { nome: 'Rodrigo Gelado', url: 'https://raw.githubusercontent.com/dedex1711-eng/jogadores/refs/heads/main/Rodrigo%20Gelado.png' },
  'Náutico': { nome: 'Paulo Sérgio', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/paulo%20sérgio.png' },
  'Nautico': { nome: 'Paulo Sérgio', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/paulo%20sérgio.png' },
  'Clube Náutico Capibaribe': { nome: 'Paulo Sérgio', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/paulo%20sérgio.png' },
  'Ponte Preta': { nome: 'William Pottker', url: 'https://raw.githubusercontent.com/dedex1711-eng/jogadores/refs/heads/main/William%20Pottker.png' },
  'AA Ponte Preta': { nome: 'William Pottker', url: 'https://raw.githubusercontent.com/dedex1711-eng/jogadores/refs/heads/main/William%20Pottker.png' },
  'Associação Atlética Ponte Preta': { nome: 'William Pottker', url: 'https://raw.githubusercontent.com/dedex1711-eng/jogadores/refs/heads/main/William%20Pottker.png' },
  'Caxias': { nome: 'Andrew', url: 'https://raw.githubusercontent.com/dedex1711-eng/jogadores/refs/heads/main/Andrew.png' },
  'Caxias do Sul': { nome: 'Andrew', url: 'https://raw.githubusercontent.com/dedex1711-eng/jogadores/refs/heads/main/Andrew.png' },
  'SER Caxias': { nome: 'Andrew', url: 'https://raw.githubusercontent.com/dedex1711-eng/jogadores/refs/heads/main/Andrew.png' },
  'Caxias do Sul FC': { nome: 'Andrew', url: 'https://raw.githubusercontent.com/dedex1711-eng/jogadores/refs/heads/main/Andrew.png' },
  'Brighton': { nome: 'João Pedro', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/João%20Pedro.png' },
  
  // Outros times populares
  'Paris Saint Germain': { nome: 'Marquinhos', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/marquinhosss.png' },
  'Paris Saint-Germain': { nome: 'Marquinhos', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/marquinhosss.png' },
  'Paris S.': { nome: 'Marquinhos', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/marquinhosss.png' },
  'PSG': { nome: 'Marquinhos', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/marquinhosss.png' },
  'Bayern Munich': { nome: 'Harry Kane', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Harry%20Kane%20Bayern%20Munich.png' },
  'Inter Miami': { nome: 'Lionel Messi', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Lionel%20Messi%20Inter%20Miami.png' },
  'Juventus': { nome: 'Bremer', url: 'https://raw.githubusercontent.com/dedex1711-eng/jogadores/refs/heads/main/bremer.png' },
  'AC Milan': { nome: 'Rafael Leão', url: 'https://raw.githubusercontent.com/dedex1711-eng/jogadores/refs/heads/main/Rafael%20Leão.png' },
  'Inter Milan': { nome: 'Harry Kane', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Harry%20Kane%20Bayern%20Munich.png' },
  'Avellino': { nome: 'Lorenzo Simic', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Lorenzo%20Simic2.png' },
  'US Avellino 1912': { nome: 'Lorenzo Simic', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Lorenzo%20Simic2.png' },
  'US Avellino': { nome: 'Lorenzo Simic', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Lorenzo%20Simic2.png' },
  'Avellino 1912': { nome: 'Lorenzo Simic', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Lorenzo%20Simic2.png' },
  'Modena': { nome: 'Fabio Gerli', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Gerli%20Fabio.png' },
  'Modena FC': { nome: 'Fabio Gerli', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Gerli%20Fabio.png' },
  'Pisa': { nome: 'Stefano Moreo', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Stefano%20Moreo2.png' },
  'Pisa SC': { nome: 'Stefano Moreo', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Stefano%20Moreo2.png' },
  'Wolfsburg': { nome: 'Vinicius Souza', url: 'https://raw.githubusercontent.com/dedex1711-eng/jogadores/refs/heads/main/Vinicius%20Souza.png' },
  'VfL Wolfsburg': { nome: 'Vinicius Souza', url: 'https://raw.githubusercontent.com/dedex1711-eng/jogadores/refs/heads/main/Vinicius%20Souza.png' },
  'VFL Wolfsburg': { nome: 'Vinicius Souza', url: 'https://raw.githubusercontent.com/dedex1711-eng/jogadores/refs/heads/main/Vinicius%20Souza.png' },
  'RB Leipzig': { nome: 'David Raum', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/david-raum-rb-leipzig.png' },
  'Leipzig': { nome: 'David Raum', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/david-raum-rb-leipzig.png' },
  'FC Cologne': { nome: 'Eric Martel', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Eric%20Martel.png' },
  'Cologne': { nome: 'Eric Martel', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Eric%20Martel.png' },
  '1. FC Köln': { nome: 'Eric Martel', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Eric%20Martel.png' },
  'FC Köln': { nome: 'Eric Martel', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Eric%20Martel.png' },
  'Karlsruher': { nome: 'David Herold', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/David%20Herold.png' },
  'Karlsruher SC': { nome: 'David Herold', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/David%20Herold.png' },
  'Karlsruhe': { nome: 'David Herold', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/David%20Herold.png' },
  'Mainz': { nome: 'Jae-sung Lee', url: 'https://raw.githubusercontent.com/dedex1711-eng/jogadores/refs/heads/main/Jae-sung%20Lee.png' },
  'Mainz 05': { nome: 'Jae-sung Lee', url: 'https://raw.githubusercontent.com/dedex1711-eng/jogadores/refs/heads/main/Jae-sung%20Lee.png' },
  'FSV Mainz 05': { nome: 'Jae-sung Lee', url: 'https://raw.githubusercontent.com/dedex1711-eng/jogadores/refs/heads/main/Jae-sung%20Lee.png' },
  'Montpellier': { nome: 'Alexandre Mendy', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Alexandre%20Mendy.png' },
  'Montpellier HSC': { nome: 'Alexandre Mendy', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Alexandre%20Mendy.png' },
  'Marseille': { nome: 'Mason Greenwood', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Mason%20Greenwood.png' },
  'Olympique Marseille': { nome: 'Mason Greenwood', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Mason%20Greenwood.png' },
  'OM': { nome: 'Mason Greenwood', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Mason%20Greenwood.png' },
  'Ajax': { nome: 'Mika Godts', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Mika%20Godts2.png' },
  'Ajax Amsterdam': { nome: 'Mika Godts', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Mika%20Godts2.png' },
  'AFC Ajax': { nome: 'Mika Godts', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Mika%20Godts2.png' },
  'Arminia Bielefeld': { nome: 'Robin Knoche', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Robin%20Knoche2.png' },
  'Arminia B.': { nome: 'Robin Knoche', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Robin%20Knoche2.png' },
  'DSC Arminia Bielefeld': { nome: 'Robin Knoche', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Robin%20Knoche2.png' },
  'Santa Clara': { nome: 'Gabriel Silva', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Gabriel_Silva.png' },
  'CD Santa Clara': { nome: 'Gabriel Silva', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Gabriel_Silva.png' },
  'Santa Clara Açores': { nome: 'Gabriel Silva', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Gabriel_Silva.png' },
  'Benfica': { nome: 'Vangelis Pavlidis', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Vangelis%20Pavlidis.png' },
  'SL Benfica': { nome: 'Vangelis Pavlidis', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Vangelis%20Pavlidis.png' },
  'Braga': { nome: 'Rodrigo Zalazar', url: 'https://raw.githubusercontent.com/dedex1711-eng/jogadores/refs/heads/main/Rodrigo%20Zalazar.png' },
  'Celtic': { nome: 'Daizen Maeda', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Daizen%20Maeda.png' },
  'Celtic FC': { nome: 'Daizen Maeda', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Daizen%20Maeda.png' },
  'Celtic Glasgow': { nome: 'Daizen Maeda', url: 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Daizen%20Maeda.png' },
  'Celta Vigo': { nome: 'Hugo Álvarez', url: 'https://raw.githubusercontent.com/dedex1711-eng/jogadores/refs/heads/main/Hugo%20Álvarez.png' },
  'Celta de Vigo': { nome: 'Hugo Álvarez', url: 'https://raw.githubusercontent.com/dedex1711-eng/jogadores/refs/heads/main/Hugo%20Álvarez.png' },
  'RC Celta': { nome: 'Hugo Álvarez', url: 'https://raw.githubusercontent.com/dedex1711-eng/jogadores/refs/heads/main/Hugo%20Álvarez.png' },
  'Real Betis': { nome: 'Antony', url: 'https://raw.githubusercontent.com/dedex1711-eng/jogadores/refs/heads/main/Antony.png' },
  'Betis': { nome: 'Antony', url: 'https://raw.githubusercontent.com/dedex1711-eng/jogadores/refs/heads/main/Antony.png' },
  'Real Betis Balompié': { nome: 'Antony', url: 'https://raw.githubusercontent.com/dedex1711-eng/jogadores/refs/heads/main/Antony.png' },
};

async function obterLogo() {
  if (logoImg) return logoImg;
  return null;
}

// ===== FUNÇÃO PARA BUSCAR JOGADOR AUTOMATICAMENTE =====
async function buscarJogadorAutomatico() {
  if (jogosSelecionados.length === 0) {
    showToast('❌ Selecione pelo menos um jogo primeiro!');
    return;
  }
  
  console.log('🔍 Analisando jogos selecionados:', jogosSelecionados.length);
  
  // Lista de prioridade de jogadores (do mais famoso para o menos)
  const prioridadeJogadores = [
    'Cristiano Ronaldo', 'Lionel Messi', 'Neymar Jr', 'Kylian Mbappé',
    'Erling Haaland', 'Vinícius Jr', 'Mohamed Salah', 'Harry Kane',
    'Lamine Yamal', 'Memphis Depay', 'Pedro', 'Marquinhos'
  ];
  
  // Coletar TODOS os jogadores encontrados
  let jogadoresEncontrados = [];
  
  // Percorrer todos os jogos para encontrar TODOS os times cadastrados
  for (let i = 0; i < jogosSelecionados.length; i++) {
    const jogo = jogosSelecionados[i];
    
    console.log(`🔍 Jogo ${i+1}: "${jogo.timeCasa}" vs "${jogo.timeVisitante}"`);
    console.log(`🔍 Verificando se "${jogo.timeCasa}" existe no banco:`, !!jogadoresFamosos[jogo.timeCasa]);
    console.log(`🔍 Verificando se "${jogo.timeVisitante}" existe no banco:`, !!jogadoresFamosos[jogo.timeVisitante]);
    
    if (jogadoresFamosos[jogo.timeCasa]) {
      jogadoresEncontrados.push({
        jogador: jogadoresFamosos[jogo.timeCasa],
        time: jogo.timeCasa,
        jogoIndex: i
      });
      console.log(`✅ Encontrado jogador do time da casa no jogo ${i+1}:`, jogo.timeCasa, '-', jogadoresFamosos[jogo.timeCasa].nome);
    }
    
    if (jogadoresFamosos[jogo.timeVisitante]) {
      jogadoresEncontrados.push({
        jogador: jogadoresFamosos[jogo.timeVisitante],
        time: jogo.timeVisitante,
        jogoIndex: i
      });
      console.log(`✅ Encontrado jogador do time visitante no jogo ${i+1}:`, jogo.timeVisitante, '-', jogadoresFamosos[jogo.timeVisitante].nome);
    }
    
    if (!jogadoresFamosos[jogo.timeCasa] && !jogadoresFamosos[jogo.timeVisitante]) {
      console.log(`❌ Nenhum jogador cadastrado para: ${jogo.timeCasa} ou ${jogo.timeVisitante}`);
    }
  }
  
  // Escolher jogador
  let jogadorEscolhido = null;
  let timeEncontrado = null;
  let usouAleatorio = false;
  
  if (jogadoresEncontrados.length > 0) {
    // Se encontrou jogadores, escolher por PRIORIDADE
    console.log(`🎯 ${jogadoresEncontrados.length} jogadores encontrados, escolhendo por prioridade...`);
    
    // Tentar encontrar jogador prioritário
    let jogadorPrioritario = null;
    for (const nomeJogador of prioridadeJogadores) {
      jogadorPrioritario = jogadoresEncontrados.find(j => j.jogador.nome === nomeJogador);
      if (jogadorPrioritario) {
        console.log(`⭐ Jogador prioritário encontrado: ${nomeJogador}`);
        break;
      }
    }
    
    // Se encontrou jogador prioritário, usar ele. Senão, usar o primeiro da lista
    const escolha = jogadorPrioritario || jogadoresEncontrados[0];
    jogadorEscolhido = escolha.jogador;
    timeEncontrado = escolha.time;
    console.log(`✅ Escolhido: ${jogadorEscolhido.nome} (${timeEncontrado})`);
  } else {
    // Se não encontrou nenhum time cadastrado, usar jogador aleatório
    const indiceAleatorio = Math.floor(Math.random() * imagensJogadoresDisponiveis.length);
    jogadorEscolhido = imagensJogadoresDisponiveis[indiceAleatorio];
    timeEncontrado = 'Jogador Aleatório';
    usouAleatorio = true;
    console.log('⚠️ Nenhum time cadastrado encontrado! Usando jogador aleatório:', jogadorEscolhido.nome);
  }
  
  // Carregar a imagem do jogador
  const mensagem = usouAleatorio 
    ? `🎲 Usando ${jogadorEscolhido.nome} (aleatório)`
    : `🔍 Buscando ${jogadorEscolhido.nome} (${timeEncontrado})`;
  showToast(mensagem, 2000);
  
  try {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    await new Promise((resolve, reject) => {
      img.onload = () => {
        jogadorImg = img;
        jogadorAutomatico = true;
        
        // Atualizar preview
        const preview = document.getElementById('jogadorPreview');
        if (preview) {
          preview.src = jogadorEscolhido.url;
          preview.style.display = 'block';
        }
        const placeholder = document.getElementById('jogadorPlaceholder');
        if (placeholder) placeholder.style.display = 'none';
        const btnRemove = document.getElementById('btnRemoveJogador');
        if (btnRemove) btnRemove.style.display = 'block';
        
        showToast(`✅ ${jogadorEscolhido.nome} carregado!`);
        resolve();
      };
      
      img.onerror = () => {
        showToast(`❌ Erro ao carregar imagem de ${jogadorEscolhido.nome}. Use upload manual ou tente outro jogo.`);
        reject();
      };
      
      img.src = jogadorEscolhido.url;
    });
    
  } catch (error) {
    console.error('Erro ao buscar jogador:', error);
    showToast('💡 Dica: Faça upload manual da imagem do jogador', 4000);
  }
}

// ===== FUNÇÃO PARA BUSCAR JOGADOR PARA BANNER ESPECÍFICO (MÚLTIPLOS BANNERS) =====
async function buscarJogadorParaBanner(jogos, indiceBanner) {
  console.log(`🔍 Buscando jogador para banner ${indiceBanner + 1} com ${jogos.length} jogos`);
  
  // Tentar encontrar jogador em TODOS os jogos deste banner
  let jogadorEncontrado = null;
  
  for (let i = 0; i < jogos.length; i++) {
    const jogo = jogos[i];
    
    console.log(`🔍 Banner ${indiceBanner + 1}, Jogo ${i + 1}: ${jogo.timeCasa} vs ${jogo.timeVisitante}`);
    
    // Alternar entre time casa e visitante baseado no índice do banner
    const usarTimeCasa = indiceBanner % 2 === 0;
    const timePrincipal = usarTimeCasa ? jogo.timeCasa : jogo.timeVisitante;
    const timeAlternativo = usarTimeCasa ? jogo.timeVisitante : jogo.timeCasa;
    
    if (jogadoresFamosos[timePrincipal]) {
      jogadorEncontrado = jogadoresFamosos[timePrincipal];
      console.log(`✅ Banner ${indiceBanner + 1}: Encontrado ${jogadorEncontrado.nome} (${timePrincipal})`);
      break;
    } else if (jogadoresFamosos[timeAlternativo]) {
      jogadorEncontrado = jogadoresFamosos[timeAlternativo];
      console.log(`✅ Banner ${indiceBanner + 1}: Encontrado ${jogadorEncontrado.nome} (${timeAlternativo})`);
      break;
    } else {
      console.log(`❌ Banner ${indiceBanner + 1}, Jogo ${i + 1}: Nenhum jogador para ${timePrincipal} ou ${timeAlternativo}`);
    }
  }
  
  // Se não encontrou nenhum time cadastrado, usar jogador aleatório baseado no índice
  if (!jogadorEncontrado) {
    const indiceAleatorio = indiceBanner % imagensJogadoresDisponiveis.length;
    jogadorEncontrado = imagensJogadoresDisponiveis[indiceAleatorio];
    console.log(`⚠️ Banner ${indiceBanner + 1}: Nenhum time cadastrado, usando ${jogadorEncontrado.nome} (aleatório)`);
  }
  
  if (!jogadorEncontrado) {
    return null;
  }
  
  // Carregar a imagem do jogador
  try {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    await new Promise((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject();
      img.src = jogadorEncontrado.url;
    });
    
    return img;
    
  } catch (error) {
    console.error(`❌ Erro ao carregar jogador para banner ${indiceBanner + 1}:`, error);
    return null;
  }
}

// Função para definir a logo a partir de uma URL (chamada pelo sistema de autenticação)
async function definirLogoDeUrl(url) {
  return new Promise(resolve => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      logoImg = img;
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
      resolve();
    };
    img.src = url;
  });
}

// ===== RESUMO =====
let resumoAtual = { overview: '', genres: [], tagline: '', rating: '', runtime: '' };
let resumoVariante = 0;

// ===== COOKIES =====
function acceptCookies() {
  const banner = document.getElementById('cookieBanner');
  if (banner) banner.style.display = 'none';
  localStorage.setItem('cookiesAccepted', '1');
}
document.addEventListener('DOMContentLoaded', function() {
  if (localStorage.getItem('cookiesAccepted')) {
    const banner = document.getElementById('cookieBanner');
    if (banner) banner.style.display = 'none';
  }
  
  // Carregar preferências salvas
  carregarPreferencias();
});

// ===== SALVAR E CARREGAR PREFERÊNCIAS =====
function salvarPreferencias() {
  // Salvar template baseado no tipo atual (filme ou futebol)
  const template = document.querySelector('input[name="template"]:checked');
  if (template) {
    if (tipoAtual === 'futebol') {
      localStorage.setItem('templateFutebol', template.value);
    } else {
      localStorage.setItem('templateFilme', template.value);
    }
  }
  
  // Salvar formato
  const formato = document.querySelector('input[name="formato"]:checked');
  if (formato) {
    localStorage.setItem('formatoSelecionado', formato.value);
  }
  
  // Salvar overlay futebol
  const overlayFutebol = document.querySelector('input[name="overlayFutebol"]:checked');
  if (overlayFutebol) {
    localStorage.setItem('overlayFutebol', overlayFutebol.value);
  }
  
  // Salvar fundo promocional (separado por tipo)
  const fundoPromo = document.querySelector('input[name="fundoPromo"]:checked');
  if (fundoPromo) {
    if (tipoAtual === 'futebol') {
      localStorage.setItem('fundoPromoFutebol', fundoPromo.value);
    } else {
      localStorage.setItem('fundoPromoFilme', fundoPromo.value);
    }
  }
  
  // Salvar overlay promocional (separado por tipo)
  const overlayPromo = document.querySelector('input[name="overlayPromo"]:checked');
  if (overlayPromo) {
    if (tipoAtual === 'futebol') {
      localStorage.setItem('overlayPromoFutebol', overlayPromo.value);
    } else {
      localStorage.setItem('overlayPromoFilme', overlayPromo.value);
    }
  }
  
  // Salvar overlay filmes (template simples)
  const overlayFilme = document.querySelector('input[name="overlay"]:checked');
  if (overlayFilme) {
    localStorage.setItem('overlayFilme', overlayFilme.value);
  }
}

function carregarPreferencias() {
  // Carregar template baseado no tipo atual
  const templateSalvo = tipoAtual === 'futebol' 
    ? localStorage.getItem('templateFutebol')
    : localStorage.getItem('templateFilme');
    
  if (templateSalvo) {
    const radio = document.querySelector(`input[name="template"][value="${templateSalvo}"]`);
    if (radio) {
      radio.checked = true;
      // Atualizar painéis após um pequeno delay para garantir que tudo está carregado
      setTimeout(() => {
        alternarPainelTemplate();
      }, 50);
    }
  }
  
  // Carregar formato
  const formatoSalvo = localStorage.getItem('formatoSelecionado');
  if (formatoSalvo) {
    const radio = document.querySelector(`input[name="formato"][value="${formatoSalvo}"]`);
    if (radio) {
      radio.checked = true;
    }
  }
  
  // Carregar cor de destaque futebol
  const corSalva = localStorage.getItem('corFutebolDestaque');
  if (corSalva) {
    coresFutebol.destaque = corSalva;
    coresFutebol.hora = corSalva;
    coresFutebol.liga = corSalva;
    
    // Atualizar visual
    setTimeout(() => {
      document.querySelectorAll('#corFutebolUnica .cor-opt').forEach(opt => {
        if (opt.dataset.cor === corSalva) {
          opt.classList.add('active');
        } else {
          opt.classList.remove('active');
        }
      });
    }, 100);
  }
  
  // Carregar cor de destaque filme
  const corFilmeSalva = localStorage.getItem('corDestaqueFilme');
  if (corFilmeSalva) {
    corDestaqueFilme = corFilmeSalva;
    
    // Atualizar visual
    setTimeout(() => {
      document.querySelectorAll('#corDestaqueFilme .cor-opt, #corDestaqueFilmePromo .cor-opt').forEach(opt => {
        if (opt.dataset.cor === corFilmeSalva) {
          opt.classList.add('active');
        } else {
          opt.classList.remove('active');
        }
      });
    }, 100);
  }
  
  // Carregar overlay futebol
  const overlayFutebolSalvo = localStorage.getItem('overlayFutebol');
  if (overlayFutebolSalvo) {
    const radio = document.querySelector(`input[name="overlayFutebol"][value="${overlayFutebolSalvo}"]`);
    if (radio) radio.checked = true;
  }
  
  // Carregar fundo promocional (separado por tipo)
  const fundoPromoSalvo = tipoAtual === 'futebol'
    ? localStorage.getItem('fundoPromoFutebol')
    : localStorage.getItem('fundoPromoFilme');
  if (fundoPromoSalvo) {
    const radio = document.querySelector(`input[name="fundoPromo"][value="${fundoPromoSalvo}"]`);
    if (radio) radio.checked = true;
  }
  
  // Carregar overlay promocional (separado por tipo)
  const overlayPromoSalvo = tipoAtual === 'futebol'
    ? localStorage.getItem('overlayPromoFutebol')
    : localStorage.getItem('overlayPromoFilme');
  if (overlayPromoSalvo) {
    const radio = document.querySelector(`input[name="overlayPromo"][value="${overlayPromoSalvo}"]`);
    if (radio) radio.checked = true;
  }
  
  // Carregar overlay filmes (template simples)
  const overlayFilmeSalvo = localStorage.getItem('overlayFilme');
  if (overlayFilmeSalvo) {
    const radio = document.querySelector(`input[name="overlay"][value="${overlayFilmeSalvo}"]`);
    if (radio) radio.checked = true;
  }
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
    const url = `${TMDB_BASE}/search/multi?api_key=${TMDB_API_KEY}&language=pt-BR&query=${encodeURIComponent(query)}`;
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
async function selecionarFilme(item, el) {
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
    overview:     item.overview || '',
    nota:         item.vote_average ? item.vote_average.toFixed(1) : null,
    genreIds:     item.genre_ids || [],
    duracao:      null, // será preenchido via API de detalhes
  };

  // Busca detalhes completos (duração e gêneros) via API
  try {
    const mediaType = item.media_type === 'movie' ? 'movie' : 'tv';
    const detailUrl = `${TMDB_BASE}/${mediaType}/${item.id}?api_key=${TMDB_API_KEY}&language=pt-BR`;
    const detailRes = await fetch(detailUrl);
    const detailData = await detailRes.json();
    
    // Duração
    if (mediaType === 'movie' && detailData.runtime) {
      const h = Math.floor(detailData.runtime / 60);
      const m = detailData.runtime % 60;
      filmeAtual.duracao = h > 0 ? `${h}h${m > 0 ? m + 'min' : ''}` : `${m}min`;
    } else if (mediaType === 'tv' && detailData.episode_run_time && detailData.episode_run_time[0]) {
      filmeAtual.duracao = `${detailData.episode_run_time[0]}min/ep`;
    }
    
    // Gêneros
    if (detailData.genres && detailData.genres.length > 0) {
      filmeAtual.generos = detailData.genres.slice(0, 2).map(g => g.name).join(' • ');
    }
  } catch(e) { /* erro ao buscar detalhes */ }

  showToast(`✅ "${title}" selecionado`);
  
  // Só gera o banner e mostra informações se estiver na aba de filmes
  if (tipoAtual !== 'futebol') {
    // Atualiza info do filme selecionado
    const infoDiv = document.getElementById('filmeSelecionado');
    document.getElementById('filmeThumb').src = filmeAtual.posterThumb || '';
    document.getElementById('filmeNome').textContent = title;
    document.getElementById('filmeAno').textContent  = `${year} • ${type}`;
    infoDiv.style.display = 'flex';
    
    // Só gera preview se tiver logo carregada
    if (logoImg) {
      // Mostrar loading
      const loading = document.getElementById('canvasLoading');
      const canvas = document.getElementById('bannerCanvas');
      const placeholder = document.getElementById('canvasPlaceholder');
      
      if (loading) loading.style.display = 'flex';
      if (canvas) canvas.style.display = 'none';
      if (placeholder) placeholder.style.display = 'none';
      
      // Pequeno delay para garantir que o loading apareça
      setTimeout(() => {
        gerarBanner(false); // false = apenas preview, sem verificar crédito
      }, 100);
    } else {
      showToast('⚠️ Carregue uma logo para ver o preview');
    }
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
    const endpoint = `${TMDB_BASE}/${item.media_type}/${item.id}?api_key=${TMDB_API_KEY}&language=pt-BR`;

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
      const videosEndpoint = `${TMDB_BASE}/${item.media_type}/${item.id}/videos?api_key=${TMDB_API_KEY}&language=pt-BR`;
      
      const videosRes = await fetch(videosEndpoint);
      const videosData = await videosRes.json();
      
      // Procura por trailer em português
      let trailer = videosData.results?.find(v => 
        v.site === 'YouTube' && 
        (v.type === 'Trailer' || v.type === 'Teaser')
      );
      
      // Se não encontrar em português, tenta em inglês
      if (!trailer) {
        const videosEnEndpoint = `${TMDB_BASE}/${item.media_type}/${item.id}/videos?api_key=${TMDB_API_KEY}&language=en-US`;
        
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

  // Validar formatos aceitos pelo Remove.bg
  const formatosAceitos = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
  if (!formatosAceitos.includes(file.type)) {
    showToast('❌ Apenas PNG, JPG ou WebP são permitidos!');
    event.target.value = ''; // Limpar o input
    return;
  }

  showToast('🔄 Processando logo...', 2000);

  const reader = new FileReader();
  reader.onload = async e => {
    const img = new Image();
    img.onload = async () => {
      // Verificar se a imagem já tem transparência
      const temTransparencia = await verificarTransparencia(img);
      
      if (temTransparencia) {
        // Já tem fundo transparente, usar direto
        logoImg = img;
        const preview = document.getElementById('logoPreview');
        preview.src = e.target.result;
        preview.style.display = 'block';
        document.getElementById('logoPlaceholder').style.display = 'none';
        document.getElementById('btnRemoveLogo').style.display = 'block';
        showToast('✅ Logo carregada!');
        if (tipoAtual === 'futebol' && jogosSelecionados.length > 0) {
          gerarBannerAtual();
        } else if (tipoAtual !== 'futebol' && filmeAtual) {
          gerarBanner(false);
        }
      } else {
        // Tem fundo, remover automaticamente
        showToast('🎨 Removendo fundo da logo...', 3000);
        try {
          const imagemSemFundo = await removerFundoAPI(file);
          const imgSemFundo = new Image();
          imgSemFundo.onload = () => {
            logoImg = imgSemFundo;
            const preview = document.getElementById('logoPreview');
            preview.src = imagemSemFundo;
            preview.style.display = 'block';
            document.getElementById('logoPlaceholder').style.display = 'none';
            document.getElementById('btnRemoveLogo').style.display = 'block';
            showToast('✅ Logo carregada com fundo removido!');
            if (tipoAtual === 'futebol' && jogosSelecionados.length > 0) {
              gerarBannerAtual();
            } else if (tipoAtual !== 'futebol' && filmeAtual) {
              gerarBanner(false);
            }
          };
          imgSemFundo.src = imagemSemFundo;
        } catch (error) {
          console.error('Erro ao remover fundo:', error);
          
          // Se for erro de créditos esgotados
          if (error.message === 'CREDITS_EXHAUSTED') {
            showToast('💡 Faça upload da logo com fundo transparente após remover no Remove.bg', 6000);
            // Usar a imagem original temporariamente
            logoImg = img;
            const preview = document.getElementById('logoPreview');
            preview.src = e.target.result;
            preview.style.display = 'block';
            document.getElementById('logoPlaceholder').style.display = 'none';
            document.getElementById('btnRemoveLogo').style.display = 'block';
          } else {
            // Outros erros - usar a imagem original
            logoImg = img;
            const preview = document.getElementById('logoPreview');
            preview.src = e.target.result;
            preview.style.display = 'block';
            document.getElementById('logoPlaceholder').style.display = 'none';
            document.getElementById('btnRemoveLogo').style.display = 'block';
            showToast('⚠️ Logo carregada (não foi possível remover fundo automaticamente)');
          }
          
          if (tipoAtual === 'futebol' && jogosSelecionados.length > 0) {
            gerarBannerAtual();
          } else if (tipoAtual !== 'futebol' && filmeAtual) {
            gerarBanner(false);
          }
        }
      }
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

// Verificar se a imagem tem transparência
async function verificarTransparencia(img) {
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  
  try {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Verificar se há pixels com transparência (alpha < 255)
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] < 255) {
        return true; // Tem transparência
      }
    }
    return false; // Não tem transparência
  } catch (e) {
    return false; // Em caso de erro, assumir que não tem transparência
  }
}

// Remover fundo usando Remove.bg API
async function removerFundoAPI(file) {
  const formData = new FormData();
  formData.append('image_file', file);
  formData.append('size', 'auto');
  
  const response = await fetch('https://api.remove.bg/v1.0/removebg', {
    method: 'POST',
    headers: {
      'X-Api-Key': 'eNjmZZ2eimyX9FfkZJb2pzmw'
    },
    body: formData
  });
  
  if (!response.ok) {
    // Verificar se é erro de créditos esgotados
    if (response.status === 402 || response.status === 403) {
      // Créditos esgotados - abrir Remove.bg
      showToast('⚠️ Créditos esgotados! Abrindo Remove.bg para remoção manual...', 5000);
      window.open('https://www.remove.bg/pt-br/upload', '_blank');
      throw new Error('CREDITS_EXHAUSTED');
    }
    throw new Error('Erro ao remover fundo: ' + response.statusText);
  }
  
  const blob = await response.blob();
  return URL.createObjectURL(blob);
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

// ===== LOGO DO PERFIL =====
function perfilCarregarLogo(event) {
  const file = event.target.files[0];
  if (!file) return;

  // Validar formatos aceitos pelo Remove.bg
  const formatosAceitos = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
  if (!formatosAceitos.includes(file.type)) {
    showToast('❌ Apenas PNG, JPG ou WebP são permitidos!');
    event.target.value = ''; // Limpar o input
    return;
  }

  const reader = new FileReader();
  reader.onload = e => {
    const img = new Image();
    img.onload = () => {
      const preview = document.getElementById('perfilLogoPreview');
      if (preview) {
        preview.src = e.target.result;
        preview.style.display = 'block';
      }
      const placeholder = document.getElementById('perfilLogoPlaceholder');
      if (placeholder) placeholder.style.display = 'none';
      const btnRemove = document.getElementById('perfilBtnRemoveLogo');
      if (btnRemove) btnRemove.style.display = 'block';
      showToast('✅ Logo do perfil carregada!');
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function perfilRemoverLogo() {
  const preview = document.getElementById('perfilLogoPreview');
  if (preview) {
    preview.style.display = 'none';
    preview.src = '';
  }
  const placeholder = document.getElementById('perfilLogoPlaceholder');
  if (placeholder) placeholder.style.display = 'block';
  const btnRemove = document.getElementById('perfilBtnRemoveLogo');
  if (btnRemove) btnRemove.style.display = 'none';
  const input = document.getElementById('perfilLogoInput');
  if (input) input.value = '';
  showToast('Logo do perfil removida');
}

// ===== IMAGEM DO JOGADOR =====
function carregarImagemJogador(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = e => {
    const img = new Image();
    img.onload = () => {
      jogadorImg = img;
      jogadorAutomatico = false; // Reset flag automático quando carregar manualmente
      const preview = document.getElementById('jogadorPreview');
      preview.src = e.target.result;
      preview.style.display = 'block';
      document.getElementById('jogadorPlaceholder').style.display = 'none';
      document.getElementById('btnRemoveJogador').style.display = 'block';
      showToast('✅ Imagem do jogador carregada!');
      // Regenera se tiver jogos selecionados
      if (tipoAtual === 'futebol' && jogosSelecionados.length > 0) {
        gerarBannerAtual();
      }
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function removerImagemJogador() {
  jogadorImg = null;
  jogadorAutomatico = false; // Reset flag automático
  document.getElementById('jogadorPreview').style.display = 'none';
  document.getElementById('jogadorPreview').src = '';
  document.getElementById('jogadorPlaceholder').style.display = 'block';
  document.getElementById('btnRemoveJogador').style.display = 'none';
  document.getElementById('jogadorInput').value = '';
  // Regenera se tiver jogos selecionados
  if (tipoAtual === 'futebol' && jogosSelecionados.length > 0) {
    gerarBannerAtual();
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

// ===== ALTERNAR PAINEL DE TEMPLATE (SIMPLES / PROMOCIONAL / JOGADOR) =====
function alternarPainelTemplate() {
  const template = document.querySelector('input[name="template"]:checked')?.value || 'simples';
  const overlayOpcoes = document.getElementById('overlayOpcoes');
  const fundoPromoOpcoes = document.getElementById('fundoPromoOpcoes');
  const overlayPromoOpcoes = document.getElementById('overlayPromoOpcoes');
  const fundoFutebolImagens = document.getElementById('fundoFutebolImagens');
  const corDestaquePromoOpcoes = document.getElementById('corDestaquePromoOpcoes');
  const overlayFutebolOpcoes = document.getElementById('overlayFutebolOpcoes');
  const coresFutebolOpcoes = document.getElementById('coresFutebolOpcoes');
  const templateJogadorOption = document.querySelector('.template-jogador-option');
  
  // Mostrar/esconder opção de template jogador baseado no tipo
  if (templateJogadorOption) {
    templateJogadorOption.style.display = tipoAtual === 'futebol' ? 'block' : 'none';
  }
  
  // Overlay simples: só aparece em filmes com template simples
  if (overlayOpcoes) overlayOpcoes.style.display = (template === 'simples' && tipoAtual !== 'futebol') ? 'block' : 'none';
  
  // Fundo promocional: aparece em filmes com template promocional OU futebol com template jogador
  if (fundoPromoOpcoes) {
    fundoPromoOpcoes.style.display = ((template === 'promocional' && tipoAtual !== 'futebol') || (template === 'jogador' && tipoAtual === 'futebol')) ? 'block' : 'none';
  }
  
  // Overlay promocional: aparece em filmes com template promocional OU futebol com template jogador
  if (overlayPromoOpcoes) {
    overlayPromoOpcoes.style.display = ((template === 'promocional' && tipoAtual !== 'futebol') || (template === 'jogador' && tipoAtual === 'futebol')) ? 'block' : 'none';
  }
  
  // Imagens de futebol aparecem na aba futebol + template promocional (com !important para sobrescrever o pai)
  if (fundoFutebolImagens) {
    if (tipoAtual === 'futebol' && template === 'promocional') {
      fundoFutebolImagens.style.setProperty('display', 'block', 'important');
    } else {
      fundoFutebolImagens.style.setProperty('display', 'none', 'important');
    }
  }
  
  // Overlay de futebol só aparece na aba futebol (simples e promocional, não no jogador)
  if (overlayFutebolOpcoes) {
    overlayFutebolOpcoes.style.display = (tipoAtual === 'futebol' && template !== 'jogador') ? 'block' : 'none';
  }
  
  // Cores de futebol: aparece em futebol com todos os templates (simples, promocional E jogador)
  if (coresFutebolOpcoes) {
    coresFutebolOpcoes.style.display = tipoAtual === 'futebol' ? 'block' : 'none';
  }
  
  // Cor de destaque promocional: só aparece em filmes com template promocional (NÃO no futebol)
  if (corDestaquePromoOpcoes) {
    corDestaquePromoOpcoes.style.display = (template === 'promocional' && tipoAtual !== 'futebol') ? 'block' : 'none';
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
    green:  'rgba(20,83,45,0.6)',
    orange: 'rgba(124,45,18,0.6)',
    pink:   'rgba(131,24,67,0.6)',
    gray:   'rgba(55,65,81,0.6)',
    none:   null,
  };
  return map[v] || null;
}

// ===== OVERLAY COLOR PROMOCIONAL =====
function getOverlayStylePromo() {
  const v = document.querySelector('input[name="overlayPromo"]:checked')?.value || 'dark';
  const map = {
    dark:   'rgba(0,0,0,0.55)',
    purple: 'rgba(76,29,149,0.6)',
    blue:   'rgba(30,58,95,0.6)',
    red:    'rgba(127,29,29,0.6)',
    green:  'rgba(20,83,45,0.6)',
    orange: 'rgba(124,45,18,0.6)',
    pink:   'rgba(131,24,67,0.6)',
    gray:   'rgba(55,65,81,0.6)',
    none:   null,
  };
  return map[v] || null;
}

// ===== OVERLAY COLOR FUTEBOL =====
function getOverlayStyleFutebol() {
  const v = document.querySelector('input[name="overlayFutebol"]:checked')?.value || 'dark';
  const map = {
    dark:   'rgba(0,0,0,0.55)',
    purple: 'rgba(76,29,149,0.6)',
    blue:   'rgba(30,58,95,0.6)',
    red:    'rgba(127,29,29,0.6)',
    green:  'rgba(20,83,45,0.6)',
    orange: 'rgba(124,45,18,0.6)',
    pink:   'rgba(131,24,67,0.6)',
    gray:   'rgba(55,65,81,0.6)',
    none:   null,
  };
  return map[v] || null;
}

// ===== GERAR BANNER FINAL (com verificação de crédito) =====
async function gerarBannerFinal() {
  // Valida se a logo foi carregada
  if (!logoImg) {
    showToast('❌ Você precisa carregar uma logo para gerar o banner');
    return;
  }

  await gerarBanner(true); // true = verificar e consumir crédito
  if (bannerGerado) {
    showToast('✅ Banner gerado com sucesso!');
  }
}

// ===== GERAR BANNER =====
async function gerarBanner(verificarCredito = false) {
  
  if (!filmeAtual) { 
    showToast('Selecione um filme primeiro'); 
    return; 
  }

  // Só verifica créditos quando for realmente gerar (botão "Gerar Banner")
  if (verificarCredito) {
    if (typeof verificarCreditos === 'function') {
      try {
        const { temCredito } = await verificarCreditos();
        if (!temCredito) {
          mostrarModalSemCreditos();
          return;
        }
      } catch (error) {
      }
    }
  }

  const template = document.querySelector('input[name="template"]:checked')?.value || 'simples';

  // Alterna painel de opções conforme template
  const overlayOpcoes = document.getElementById('overlayOpcoes');
  const fundoPromoOpcoes = document.getElementById('fundoPromoOpcoes');
  
  if (overlayOpcoes) overlayOpcoes.style.display = template === 'simples' ? 'block' : 'none';
  if (fundoPromoOpcoes) fundoPromoOpcoes.style.display = template === 'promocional' ? 'block' : 'none';

  
  try {
    // Gera o banner
    if (template === 'promocional') {
      await gerarBannerPromocional();
    } else {
      await gerarBannerSimples();
    }
    
    // Só consome crédito quando for geração final (botão "Gerar Banner")
    if (verificarCredito) {
      if (typeof consumirCredito === 'function') {
        await consumirCredito();
      }
    } else {
    }
    
  } catch (error) {
    // Esconder loading em caso de erro
    const loading = document.getElementById('canvasLoading');
    if (loading) loading.style.display = 'none';
    showToast('❌ Erro ao gerar banner: ' + error.message);
    console.error('Erro:', error);
  }
}

// ===== GERAR BANNER SIMPLES =====
async function gerarBannerSimples() {
  
  // Valida se a logo foi carregada
  if (!logoImg) {
    const placeholder = document.getElementById('canvasPlaceholder');
    if (placeholder) {
      placeholder.innerHTML = '<span>📁</span><p>Carregue uma logo para ver o preview</p>';
      placeholder.style.display = 'block';
    }
    const canvas = document.getElementById('bannerCanvas');
    if (canvas) canvas.style.display = 'none';
    return;
  }

  const { w, h } = getDimensoes();
  const canvas   = document.getElementById('bannerCanvas');
  const ctx      = canvas.getContext('2d');
  
  if (!canvas || !ctx) {
    return;
  }
  
  canvas.width   = w;
  canvas.height  = h;

  // Configurações de qualidade para melhor renderização
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Esconde placeholder e loading, mostra canvas
  const placeholder = document.getElementById('canvasPlaceholder');
  const loading = document.getElementById('canvasLoading');
  if (placeholder) placeholder.style.display = 'none';
  if (loading) loading.style.display = 'none';
  canvas.style.display = 'block';

  // Escolhe imagem de fundo
  const formato = getFormato();
  let imgUrl = formato === 'paisagem'
    ? (filmeAtual.backdropPath || filmeAtual.posterPath)
    : (filmeAtual.posterPath   || filmeAtual.backdropPath);


  if (!imgUrl) {
    // Sem imagem - fundo sólido
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, w, h);
    desenharTextos(ctx, w, h);
    finalizarBanner();
    return;
  }

  try {
    const bgImg = await carregarImagem(imgUrl);
    
    // Desenha fundo
    desenharCover(ctx, bgImg, w, h);

    // Overlay
    const overlay = getOverlayStyle();
    
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
      
    }

    // Logo
    const logoParaDesenhar = await obterLogo();
    if (logoParaDesenhar) {
      const _logoImgOriginal = logoImg;
      logoImg = logoParaDesenhar;
      desenharLogo(ctx, w, h);
      logoImg = _logoImgOriginal;
    }

    // Textos
    desenharTextos(ctx, w, h);

    finalizarBanner();
    
  } catch (err) {
    
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
}

// ===== GERAR BANNER PROMOCIONAL =====
async function gerarBannerPromocional() {
  // Valida se a logo foi carregada
  if (!logoImg) {
    const placeholder = document.getElementById('canvasPlaceholder');
    if (placeholder) {
      placeholder.innerHTML = '<span>📁</span><p>Carregue uma logo para ver o preview</p>';
      placeholder.style.display = 'block';
    }
    const canvas = document.getElementById('bannerCanvas');
    if (canvas) canvas.style.display = 'none';
    return;
  }

  const { w, h } = getDimensoes();
  const canvas   = document.getElementById('bannerCanvas');
  const ctx      = canvas.getContext('2d');
  canvas.width   = w;
  canvas.height  = h;

  // Configurações de qualidade para melhor renderização
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  const placeholder = document.getElementById('canvasPlaceholder');
  const loading = document.getElementById('canvasLoading');
  if (placeholder) placeholder.style.display = 'none';
  if (loading) loading.style.display = 'none';
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
    turquesa: { c1:'#021814', c2:'#0a2820', c3:'#0f5e4d', accent:'#14b8a6', glow:'rgba(20,184,166,0.6)'  },
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
        
        // Overlay configurável para legibilidade
        const overlayStyle = getOverlayStylePromo();
        if (overlayStyle && overlayStyle !== 'none') {
          const overlayGrad = ctx.createLinearGradient(0, 0, 0, h);
          overlayGrad.addColorStop(0, overlayStyle.replace(/0\.\d+\)/, '0.75)'));
          overlayGrad.addColorStop(0.5, overlayStyle.replace(/0\.\d+\)/, '0.65)'));
          overlayGrad.addColorStop(1, overlayStyle.replace(/0\.\d+\)/, '0.85)'));
          ctx.fillStyle = overlayGrad;
          ctx.fillRect(0, 0, w, h);
        }
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
    // Se for uma imagem de futebol (fut1-fut5) ou valor desconhecido, usar roxo como fallback
    p = paletas[fundoVal] || paletas['roxo'];
    
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
    
    // Overlay configurável para legibilidade
    const overlayStyle = getOverlayStylePromo();
    if (overlayStyle && overlayStyle !== 'none') {
      ctx.fillStyle = overlayStyle;
      ctx.fillRect(0, 0, w, h);
    }
  }

  // Partículas
  ctx.fillStyle = 'rgba(255,255,255,0.07)';
  for (let i = 0; i < 60; i++) {
    ctx.beginPath();
    ctx.arc(Math.random()*w, Math.random()*h, Math.random()*2.5, 0, Math.PI*2);
    ctx.fill();
  }

  // Marca d'água da logo (abaixo do overlay, antes dos textos)
  await desenharMarcaDaguaBaixo(ctx, w, h);

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
      
      // Borda com cor de destaque (mesma cor do texto ASSISTA)
      ctx.strokeStyle = corDestaqueFilme;
      ctx.lineWidth   = Math.max(4, w * 0.005);
      ctx.strokeRect(posterX-2, posterY-2, posterW+4, posterH+4);
      
      ctx.drawImage(posterImg, posterX, posterY, posterW, posterH);
      ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;
      
      // Tipo (Filme/Série) e ano abaixo da capa
      const badgeSize = w * 0.022;
      ctx.font = `700 ${badgeSize}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 8;
      
      // Badge colorido: mesma cor de destaque para Filme e Série
      const badgeColor = corDestaqueFilme;
      const badgeText = `${filmeAtual.year}  •  ${(filmeAtual.type || '').toUpperCase()}`;
      const badgeTextW = ctx.measureText(badgeText).width;
      const badgePad = w * 0.015;
      const badgeH2 = badgeSize * 1.6;
      const badgeX = posterX + posterW/2 - badgeTextW/2 - badgePad;
      const badgeY2 = posterY + posterH + h * 0.01;
      
      // Fundo do badge
      ctx.fillStyle = badgeColor;
      roundRect(ctx, badgeX, badgeY2, badgeTextW + badgePad*2, badgeH2, badgeH2/2);
      ctx.fill();
      
      // Texto do badge
      ctx.fillStyle = '#ffffff';
      ctx.fillText(badgeText, posterX + posterW/2, badgeY2 + badgeH2 * 0.68);
      ctx.shadowBlur = 0;
      
      // Nota, duração e gêneros abaixo do badge
      const infoSize = w * 0.012;
      ctx.font = `600 ${infoSize}px Inter, sans-serif`;
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.textAlign = 'center';
      ctx.shadowBlur = 6;
      
      const infoParts = [];
      if (filmeAtual.nota) infoParts.push(`${filmeAtual.nota}/10`);
      if (filmeAtual.duracao) infoParts.push(`${filmeAtual.duracao}`);
      if (infoParts.length > 0) {
        ctx.fillText(infoParts.join('  •  '), posterX + posterW/2, badgeY2 + badgeH2 + infoSize * 1.4);
      }
      if (filmeAtual.generos) {
        ctx.fillText(filmeAtual.generos, posterX + posterW/2, badgeY2 + badgeH2 + infoSize * 2.8);
      }
      ctx.shadowBlur = 0;
    }
  } catch(e) { /* erro ao carregar poster */ }

  // Texto com nome do filme (diminuído)
  let titleSize = w * 0.140;
  ctx.font      = `900 ${titleSize}px Inter, sans-serif`;
  ctx.fillStyle = corDestaqueFilme;
  ctx.textAlign = 'right';
  let filmeName = (filmeAtual.title || filmeAtual.name || 'FILME').toUpperCase();
  
  // Se o nome for muito grande, o loop abaixo reduz a fonte automaticamente
  const maxWidth = w * 0.85;
  ctx.font = `900 ${titleSize}px Inter, sans-serif`;
  
  // Posição Y do nome
  const nameY = h * 0.28;
  
  // Posição máxima que o nome pode ocupar (topo da capa está em h * 0.07, altura da capa é h * 0.44)
  const capaBottomY = h * 0.07 + h * 0.44; // h * 0.51
  
  // Ajusta o tamanho da fonte se o nome for muito grande ou cobrir a capa
  let textWidth = ctx.measureText(filmeName).width;
  
  // Verifica se o nome vai cobrir a capa (aproximadamente)
  while ((textWidth > maxWidth || nameY - titleSize < capaBottomY) && titleSize > w * 0.025) {
    titleSize -= w * 0.005; // Reduz 0.5% da largura do canvas
    ctx.font = `900 ${titleSize}px Inter, sans-serif`;
    textWidth = ctx.measureText(filmeName).width;
  }
  
  ctx.fillText(filmeName, w * 0.95, nameY);

  // Sinopse completa (resumo gerado do filme)
  const sinopseSize = titleSize * 0.60;
  ctx.font      = `400 ${sinopseSize}px Inter, sans-serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.textAlign = 'right';
  const sinopse = filmeAtual.overview || 'Sinopse não disponível';
  
  // Quebra a sinopse em múltiplas linhas
  const maxCharsPerLine = 70;
  const sinopseLines = [];
  for (let i = 0; i < sinopse.length; i += maxCharsPerLine) {
    sinopseLines.push(sinopse.substring(i, i + maxCharsPerLine));
  }
  
  let sinopseY = h * 0.28 + titleSize * 0.8;
  for (let i = 0; i < Math.min(sinopseLines.length, 6); i++) {
    ctx.fillText(sinopseLines[i], w * 0.95, sinopseY);
    sinopseY += sinopseSize * 1.3;
  }

  // Botão "Assista agora" - Canto inferior direito com play integrado
  const formato = getFormato();
  let btnH, btnW, btnX, btnY, circR;
  
  if (formato === 'stories') {
    // Proporções para Stories (9:16)
    btnH  = h * 0.060; // Diminuído de 0.070
    btnW  = w * 0.30;
    btnX  = w * 0.72 - btnW;
    btnY  = h * 0.42;
    circR = btnH * 0.55;
  } else {
    // Proporções padrão para outros formatos
    btnH  = h * 0.065;
    btnW  = w * 0.30;
    btnX  = w * 0.72 - btnW;
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

  // Círculo play com gradiente da cor de destaque
  const circX = btnX + circR;
  const circY = btnY + btnH / 2;
  const cg = ctx.createRadialGradient(circX-circR*0.25, circY-circR*0.25, 0, circX, circY, circR);
  cg.addColorStop(0, corDestaqueFilme + 'cc'); // Cor mais clara
  cg.addColorStop(1, corDestaqueFilme);
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

  // Faixa inferior com contatos (substitui a seção de dispositivos)
  // Faixa de dispositivos — altura aumentada para caber ícones + labels
  const faixaY = h * 0.63;
  const faixaH = h * 0.20;
  const fg = ctx.createLinearGradient(0, faixaY, w, faixaY);
  fg.addColorStop(0, 'transparent');
  fg.addColorStop(0.06, 'rgba(0,0,0,0.72)');
  fg.addColorStop(0.94, 'rgba(0,0,0,0.72)');
  fg.addColorStop(1, 'transparent');
  ctx.fillStyle = fg;
  ctx.fillRect(0, faixaY, w, faixaH);

  // Título da faixa
  ctx.font      = `700 ${formato === 'paisagem' ? w * 0.018 : w * 0.022}px Inter, sans-serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.textAlign = 'center';
  ctx.shadowColor = 'rgba(0,0,0,0.9)'; ctx.shadowBlur = 10;
  ctx.fillText('ASSISTA EM QUALQUER DISPOSITIVO', w/2, faixaY + faixaH * 0.18);
  ctx.shadowBlur = 0;

  // Ícones em linha única, bem espaçados
  const devices  = ['Smart TV','Celular','Computador','Tablet','TV Box','Projetor'];
  const iconSize = Math.min(w * 0.055, faixaH * 0.30); // tamanho controlado
  const iconY    = faixaY + faixaH * 0.58;             // centro vertical dos ícones
  const spacing  = w / (devices.length + 1);           // espaçamento uniforme
  devices.forEach((name, i) => {
    const iconCX = spacing * (i + 1); // centro X de cada ícone
    desenharIconeDispositivo(ctx, name, iconCX, iconY, iconSize, p.accent);
  });

  // Logo (acima da faixa, centralizada)
  const logoPromo = await obterLogo();
  if (logoPromo) {
    const logoMaxW = w * 0.40;
    const logoMaxH = h * 0.15;
    const ls = Math.min(logoMaxW/logoPromo.width, logoMaxH/logoPromo.height);
    const lw = logoPromo.width*ls, lh = logoPromo.height*ls;
    ctx.shadowColor = p.glow; ctx.shadowBlur = 30;
    ctx.drawImage(logoPromo, w - lw - w * 0.05, h*0.04, lw, lh);
    ctx.shadowBlur = 0;
  }

  // Caixa preta com ícones removida
  const whatsapp  = document.getElementById('inputWhatsapp').value.trim();
  const instagram = document.getElementById('inputInstagram').value.trim();
  const site      = document.getElementById('inputSite').value.trim();
  const textoExtra = document.getElementById('inputTexto').value.trim();
  const mostrarSite = document.getElementById('checkMostrarSiteBanner').checked;
  
  const contatos = [];
  if (whatsapp)              contatos.push(`📱 ${whatsapp}`);
  if (instagram)             contatos.push(`📸 ${instagram}`);
  if (site && mostrarSite)   contatos.push(`🌐 ${site}`);
  if (textoExtra)            contatos.push(`✨ ${textoExtra}`);
  
  if (contatos.length > 0) {
    const cSize = w * 0.022;
    ctx.font = `700 ${cSize}px Inter, sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0,0,0,0.9)';
    ctx.shadowBlur = 12;
    ctx.fillText(contatos.join('  •  '), w / 2, h * 0.955);
    ctx.shadowBlur = 0;
  }

  ctx.textAlign = 'left';
  finalizarBanner();
}

// Desenha ícone de dispositivo
function desenharIconeDispositivo(ctx, nome, x, y, size, accent) {
  ctx.save();
  const cx = x; // x já é o centro horizontal
  const cor = accent || '#ffffff';

  ctx.strokeStyle = '#ffffff';
  ctx.fillStyle   = '#ffffff';
  ctx.lineWidth   = size * 0.08;
  ctx.lineCap     = 'round';
  ctx.lineJoin    = 'round';

  const iconTop = y - size * 0.72;

  if (nome === 'Smart TV') {
    // Tela
    const tw = size * 1.6, th = size * 1.1;
    const tx = cx - tw/2, ty = iconTop;
    roundRect(ctx, tx, ty, tw, th, size * 0.1);
    ctx.stroke();
    // Pé
    ctx.beginPath();
    ctx.moveTo(cx, ty + th);
    ctx.lineTo(cx, ty + th + size * 0.22);
    ctx.stroke();
    // Base
    ctx.beginPath();
    ctx.moveTo(cx - size * 0.4, ty + th + size * 0.22);
    ctx.lineTo(cx + size * 0.4, ty + th + size * 0.22);
    ctx.stroke();

  } else if (nome === 'Celular') {
    const pw = size * 0.7, ph = size * 1.3;
    const px = cx - pw/2, py = iconTop;
    roundRect(ctx, px, py, pw, ph, size * 0.12);
    ctx.stroke();
    // Notch
    ctx.beginPath();
    ctx.arc(cx, py + size * 0.1, size * 0.07, 0, Math.PI * 2);
    ctx.fill();

  } else if (nome === 'Computador') {
    // Tela
    const sw = size * 1.5, sh = size * 1.0;
    const sx = cx - sw/2, sy = iconTop;
    roundRect(ctx, sx, sy, sw, sh, size * 0.08);
    ctx.stroke();
    // Base teclado
    ctx.beginPath();
    ctx.moveTo(cx - size * 0.7, sy + sh + size * 0.18);
    ctx.lineTo(cx + size * 0.7, sy + sh + size * 0.18);
    ctx.stroke();
    // Dobradiça
    ctx.beginPath();
    ctx.moveTo(cx - size * 0.2, sy + sh);
    ctx.lineTo(cx - size * 0.5, sy + sh + size * 0.18);
    ctx.moveTo(cx + size * 0.2, sy + sh);
    ctx.lineTo(cx + size * 0.5, sy + sh + size * 0.18);
    ctx.stroke();

  } else if (nome === 'Tablet') {
    const tw = size * 1.0, th = size * 1.35;
    const tx = cx - tw/2, ty = iconTop;
    roundRect(ctx, tx, ty, tw, th, size * 0.1);
    ctx.stroke();
    // Botão home
    ctx.beginPath();
    ctx.arc(cx, ty + th - size * 0.12, size * 0.07, 0, Math.PI * 2);
    ctx.stroke();

  } else if (nome === 'TV Box') {
    // Box
    const bw = size * 1.1, bh = size * 0.65;
    const bx = cx - bw/2 - size * 0.2, by = iconTop + size * 0.4;
    roundRect(ctx, bx, by, bw, bh, size * 0.1);
    ctx.stroke();
    // Ponto no box
    ctx.beginPath();
    ctx.arc(bx + bw/2, by + bh/2, size * 0.07, 0, Math.PI * 2);
    ctx.fill();
    // Controle remoto
    const rx = cx + size * 0.55, ry = iconTop;
    const rw = size * 0.38, rh = size * 1.1;
    roundRect(ctx, rx - rw/2, ry, rw, rh, size * 0.1);
    ctx.stroke();
    // Botão do controle
    ctx.beginPath();
    ctx.arc(rx, ry + rh * 0.35, size * 0.1, 0, Math.PI * 2);
    ctx.stroke();

  } else if (nome === 'Videogame') {
    // Controle estilo Xbox — forma fiel com bezier
    const s  = size * 1.1;
    const gx = cx;
    const gy = iconTop + s * 0.55;

    ctx.beginPath();
    // Topo esquerdo → entalhe central esquerdo
    ctx.moveTo(gx - s * 0.25, gy - s * 0.55);
    ctx.bezierCurveTo(gx - s * 0.55, gy - s * 0.65, gx - s * 0.90, gy - s * 0.55, gx - s * 0.90, gy - s * 0.20);
    // Alça esquerda (desce e arredonda)
    ctx.bezierCurveTo(gx - s * 0.92, gy + s * 0.15, gx - s * 0.85, gy + s * 0.55, gx - s * 0.60, gy + s * 0.65);
    ctx.bezierCurveTo(gx - s * 0.40, gy + s * 0.72, gx - s * 0.20, gy + s * 0.55, gx - s * 0.10, gy + s * 0.35);
    // Base central
    ctx.bezierCurveTo(gx - s * 0.05, gy + s * 0.25, gx + s * 0.05, gy + s * 0.25, gx + s * 0.10, gy + s * 0.35);
    // Alça direita (sobe)
    ctx.bezierCurveTo(gx + s * 0.20, gy + s * 0.55, gx + s * 0.40, gy + s * 0.72, gx + s * 0.60, gy + s * 0.65);
    ctx.bezierCurveTo(gx + s * 0.85, gy + s * 0.55, gx + s * 0.92, gy + s * 0.15, gx + s * 0.90, gy - s * 0.20);
    // Topo direito → entalhe central direito
    ctx.bezierCurveTo(gx + s * 0.90, gy - s * 0.55, gx + s * 0.55, gy - s * 0.65, gx + s * 0.25, gy - s * 0.55);
    // Entalhe no topo (curva côncava)
    ctx.bezierCurveTo(gx + s * 0.15, gy - s * 0.52, gx + s * 0.08, gy - s * 0.42, gx, gy - s * 0.42);
    ctx.bezierCurveTo(gx - s * 0.08, gy - s * 0.42, gx - s * 0.15, gy - s * 0.52, gx - s * 0.25, gy - s * 0.55);
    ctx.closePath();
    ctx.stroke();

    // Cruz direcional (esquerda)
    const dx = gx - s * 0.42, dy = gy + s * 0.05;
    const ca = s * 0.10, cb = s * 0.22;
    ctx.beginPath();
    // Horizontal
    ctx.moveTo(dx - cb, dy - ca); ctx.lineTo(dx - cb, dy + ca);
    ctx.lineTo(dx - ca, dy + ca); ctx.lineTo(dx - ca, dy + cb);
    ctx.lineTo(dx + ca, dy + cb); ctx.lineTo(dx + ca, dy + ca);
    ctx.lineTo(dx + cb, dy + ca); ctx.lineTo(dx + cb, dy - ca);
    ctx.lineTo(dx + ca, dy - ca); ctx.lineTo(dx + ca, dy - cb);
    ctx.lineTo(dx - ca, dy - cb); ctx.lineTo(dx - ca, dy - ca);
    ctx.closePath();
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // 4 botões ABXY (direita)
    const bx = gx + s * 0.42, by = gy + s * 0.05;
    const br = s * 0.10;
    [[-s*0.18, 0],[s*0.18, 0],[0, -s*0.18],[0, s*0.18]].forEach(([ox, oy]) => {
      ctx.beginPath();
      ctx.arc(bx + ox, by + oy, br, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    });

  } else if (nome === 'Projetor') {
    // Corpo
    const pw = size * 1.5, ph = size * 0.75;
    const px = cx - pw/2, py = iconTop + size * 0.25;
    roundRect(ctx, px, py, pw, ph, size * 0.12);
    ctx.stroke();
    // Lente
    ctx.beginPath();
    ctx.arc(cx + size * 0.35, py + ph/2, size * 0.22, 0, Math.PI * 2);
    ctx.stroke();
    // Pés
    ctx.beginPath();
    ctx.moveTo(px + pw*0.25, py + ph);
    ctx.lineTo(px + pw*0.25, py + ph + size*0.18);
    ctx.moveTo(px + pw*0.75, py + ph);
    ctx.lineTo(px + pw*0.75, py + ph + size*0.18);
    ctx.stroke();
    // Feixe de luz (triângulo branco sólido)
    ctx.beginPath();
    ctx.moveTo(cx + size * 0.57, py + ph/2);
    ctx.lineTo(cx + size * 1.1, py + ph/2 - size * 0.3);
    ctx.lineTo(cx + size * 1.1, py + ph/2 + size * 0.3);
    ctx.closePath();
    ctx.fillStyle = '#ffffff';
    ctx.fill();
  }

  // Label abaixo do ícone
  ctx.fillStyle   = 'rgba(255,255,255,0.9)';
  ctx.font        = `600 ${size * 0.28}px Inter, sans-serif`;
  ctx.textAlign   = 'center';
  ctx.textBaseline = 'top';
  ctx.shadowColor = 'rgba(0,0,0,0.8)';
  ctx.shadowBlur  = 6;
  ctx.fillText(nome, cx, y + size * 0.95);
  ctx.shadowBlur  = 0;

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
  ctx.fillStyle   = corDestaqueFilme; // Cor de destaque configurável
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
    const mediaType = filmeAtual.type === 'Filme' ? 'movie' : 'tv';
    const searchUrl = `${TMDB_BASE}/search/${mediaType}?api_key=${TMDB_API_KEY}&language=pt-BR&query=${query}`;
    
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();
    
    if (!searchData.results || !searchData.results.length) {
      mostrarErroTrailer();
      return;
    }
    
    const itemId = searchData.results[0].id;
    
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
          red: 'rgba(127,29,29,0.5)',
          green: 'rgba(20,83,45,0.5)',
          orange: 'rgba(124,45,18,0.5)',
          pink: 'rgba(131,24,67,0.5)',
          gray: 'rgba(55,65,81,0.5)'
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
let dataJogos = 0; // 0 = hoje, 1 = amanhã

// Cores do banner de futebol
let coresFutebol = {
  destaque: '#F77F30',
  hora:     '#F77F30',
  liga:     '#F77F30',
};

// Cor de destaque para filmes (borda poster, ASSISTA, botão play)
let corDestaqueFilme = '#F77F30';

function selecionarCorFilme(cor, el) {
  corDestaqueFilme = cor;
  
  // Salvar no localStorage
  localStorage.setItem('corDestaqueFilme', cor);
  
  // Atualizar visual — remover active de todos e marcar o clicado
  document.querySelectorAll('#corDestaqueFilme .cor-opt, #corDestaqueFilmePromo .cor-opt').forEach(o => o.classList.remove('active'));
  el.classList.add('active');
  // Sincronizar o mesmo cor no outro seletor
  document.querySelectorAll(`#corDestaqueFilme .cor-opt, #corDestaqueFilmePromo .cor-opt`).forEach(o => {
    if (o.getAttribute('data-cor') === cor) o.classList.add('active');
  });
  
  // Regenerar banner
  if (filmeAtual) gerarBanner(false);
}

function selecionarCor(tipo, cor, el) {
  coresFutebol[tipo] = cor;
  
  // Atualizar visual — remover active do grupo e adicionar no clicado
  const grupoId = tipo === 'destaque' ? 'corDestaque' : tipo === 'hora' ? 'corHora' : 'corLiga';
  document.querySelectorAll(`#${grupoId} .cor-opt`).forEach(o => o.classList.remove('active'));
  el.classList.add('active');  
  // Regenerar banner se houver jogos
  if (jogosSelecionados.length > 0) gerarBannerAtual();
}

// Altera as 3 cores do futebol de uma vez
function selecionarCorFutebol(cor, el) {
  coresFutebol.destaque = cor;
  coresFutebol.hora     = cor;
  coresFutebol.liga     = cor;
  
  // Salvar no localStorage
  localStorage.setItem('corFutebolDestaque', cor);
  
  // Atualizar visual
  document.querySelectorAll('#corFutebolUnica .cor-opt').forEach(o => o.classList.remove('active'));
  el.classList.add('active');
  
  // Regenerar banner se houver jogos
  if (jogosSelecionados.length > 0) gerarBannerAtual();
}

function selecionarTipo(tipo) {
  tipoAtual = tipo;
  
  // Trocar tema visual: futebol = roxo, filmes = laranja
  if (tipo === 'futebol') {
    document.body.classList.add('tema-futebol');
  } else {
    document.body.classList.remove('tema-futebol');
  }
  
  // Atualizar botões
  document.querySelectorAll('.type-btn').forEach(btn => btn.classList.remove('active'));
  document.getElementById(`btnTipo${tipo.charAt(0).toUpperCase() + tipo.slice(1)}`).classList.add('active');
  
  // Mostrar/esconder painéis
  document.getElementById('painelFilmes').style.display = tipo === 'filme' ? 'block' : 'none';
  document.getElementById('painelFutebol').style.display = tipo === 'futebol' ? 'block' : 'none';
  
  // Carregar TODAS as preferências para o tipo selecionado
  setTimeout(() => {
    carregarPreferencias();
  }, 50);
  
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
    
    // Mostrar painel de cores do futebol
    const coresFutebolOpcoes = document.getElementById('coresFutebolOpcoes');
    if (coresFutebolOpcoes) coresFutebolOpcoes.style.display = 'block';
  } else {
    // Esconder painel de cores do futebol
    const coresFutebolOpcoes = document.getElementById('coresFutebolOpcoes');
    if (coresFutebolOpcoes) coresFutebolOpcoes.style.display = 'none';
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
  } else {
    // Ao voltar para filmes, recarregar logoImg sem crossOrigin para evitar problema de CORS no canvas
    const logoPreview = document.getElementById('logoPreview');
    if (logoPreview && logoPreview.src && logoPreview.style.display !== 'none') {
      const img = new Image();
      img.onload = () => {
        logoImg = img;
        if (filmeAtual) gerarBanner(false);
      };
      img.src = logoPreview.src;
    }
  }
  
  // Atualizar visibilidade das imagens de futebol
  alternarPainelTemplate();
}

// ===== BUSCAR TODOS OS JOGOS DO DIA =====
// Retorna data formatada YYYYMMDD no fuso de Brasília. offset=0 hoje, offset=1 amanhã
function getDataFormatadaBR(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' })
          .split('/').reverse().join('');
}

async function buscarTodosJogosDoDia() {
  const container = document.getElementById('jogosDisponiveis');
  const btn = document.getElementById('btnBuscarTodos');
  
  // Definir que estamos buscando jogos de HOJE
  dataJogos = 0;
  
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Buscando...';
  container.innerHTML = '<div class="loading-state">🔄 Buscando jogos de todos os campeonatos...</div>';
  
  const todasLigas = [
    // Brasil
    { id: 'BRA.1',  nome: 'Brasileirão Série A' },
    { id: 'BRA.2',  nome: 'Brasileirão Série B' },
    { id: 'BRA.3',  nome: 'Brasileirão Série C' },
    { id: 'BRA.4',  nome: 'Brasileirão Série D' },
    { id: 'BRA.CB', nome: 'Copa do Brasil' },
    { id: 'BRA.RJ', nome: 'Campeonato Carioca' },
    { id: 'BRA.SP', nome: 'Campeonato Paulista' },
    { id: 'BRA.MG', nome: 'Campeonato Mineiro' },
    { id: 'BRA.RS', nome: 'Campeonato Gaúcho' },
    { id: 'BRA.BA', nome: 'Campeonato Baiano' },
    { id: 'BRA.PE', nome: 'Campeonato Pernambucano' },
    { id: 'BRA.CE', nome: 'Campeonato Cearense' },
    { id: 'BRA.GO', nome: 'Campeonato Goiano' },
    { id: 'BRA.PR', nome: 'Campeonato Paranaense' },
    { id: 'BRA.SC', nome: 'Campeonato Catarinense' },
    { id: 'BRA.ES', nome: 'Campeonato Capixaba' },
    { id: 'BRA.PA', nome: 'Campeonato Paraense' },
    { id: 'BRA.AM', nome: 'Campeonato Amazonense' },
    // América do Sul
    { id: 'CONMEBOL.LIBERTADORES',  nome: 'Copa Libertadores' },
    { id: 'CONMEBOL.SUDAMERICANA',  nome: 'Copa Sul-Americana' },
    { id: 'CONMEBOL.RECOPA',        nome: 'Recopa Sul-Americana' },
    { id: 'ARG.1', nome: 'Liga Argentina' },
    { id: 'COL.1', nome: 'Liga Colombiana' },
    { id: 'CHI.1', nome: 'Liga Chilena' },
    { id: 'URU.1', nome: 'Liga Uruguaia' },
    { id: 'PER.1', nome: 'Liga Peruana' },
    { id: 'ECU.1', nome: 'Liga Equatoriana' },
    { id: 'VEN.1', nome: 'Liga Venezuelana' },
    { id: 'PAR.1', nome: 'Liga Paraguaia' },
    { id: 'BOL.1', nome: 'Liga Boliviana' },
    // Europa
    { id: 'UEFA.CHAMPIONS',  nome: 'Champions League' },
    { id: 'UEFA.EUROPA',     nome: 'Europa League' },
    { id: 'UEFA.CONFERENCE', nome: 'Conference League' },
    { id: 'UEFA.NATIONS',    nome: 'Nations League' },
    { id: 'ENG.1', nome: 'Premier League' },
    { id: 'ENG.2', nome: 'Championship' },
    { id: 'ESP.1', nome: 'La Liga' },
    { id: 'ESP.2', nome: 'La Liga 2' },
    { id: 'GER.1', nome: 'Bundesliga' },
    { id: 'GER.2', nome: '2. Bundesliga' },
    { id: 'ITA.1', nome: 'Serie A' },
    { id: 'ITA.2', nome: 'Serie B' },
    { id: 'FRA.1', nome: 'Ligue 1' },
    { id: 'FRA.2', nome: 'Ligue 2' },
    { id: 'POR.1', nome: 'Primeira Liga' },
    { id: 'NED.1', nome: 'Eredivisie' },
    { id: 'SCO.1', nome: 'Scottish Premiership' },
    { id: 'TUR.1', nome: 'Süper Lig' },
    { id: 'RUS.1', nome: 'Premier League Russa' },
    { id: 'BEL.1', nome: 'Pro League Belga' },
    { id: 'GRE.1', nome: 'Super League Grega' },
    { id: 'KSA.1', nome: 'Campeonato Saudita' },
    // Mundial
    { id: 'FIFA.WORLDQ.CONMEBOL', nome: 'Eliminatórias Sul-Americanas' },
    { id: 'CONCACAF.CHAMPIONS',   nome: 'CONCACAF Champions Cup' },
    { id: 'CAF.CHAMPIONS',        nome: 'CAF Champions League' },
  ];
  
  let dataFormatada = getDataFormatadaBR(0);
  let buscandoAmanha = false;
  
  console.log('🔍 BUSCA INICIADA - Total de ligas:', todasLigas.length);
  console.log('📅 Data da busca:', dataFormatada);
  console.log('🇸🇦 Campeonato Saudita está na lista:', todasLigas.some(l => l.id === 'KSA.1'));
  
  const canaisPorLiga = {
    'BRA.BA': ['SporTV'], 'BRA.PE': ['SporTV'],
    'BRA.CE': ['SporTV'], 'BRA.GO': ['SporTV'],
    'BRA.PR': ['SporTV'], 'BRA.SC': ['SporTV'],
    'BRA.ES': ['SporTV'], 'BRA.PA': ['SporTV'],
    'BRA.AM': ['SporTV'],
    'CONMEBOL.LIBERTADORES': ['ESPN', 'SporTV'],
    'CONMEBOL.SUDAMERICANA': ['ESPN', 'SporTV'],
    'CONMEBOL.RECOPA':       ['SporTV'],
    'ARG.1': ['ESPN'], 'COL.1': ['ESPN'],
    'CHI.1': ['ESPN'], 'URU.1': ['ESPN'],
    'PER.1': ['ESPN'], 'ECU.1': ['ESPN'],
    'VEN.1': ['ESPN'], 'PAR.1': ['ESPN'],
    'BOL.1': ['ESPN'],
    'UEFA.CHAMPIONS':  ['TNT Sports', 'HBO Max'],
    'UEFA.EUROPA':     ['ESPN'],
    'UEFA.CONFERENCE': ['ESPN'],
    'UEFA.NATIONS':    ['SporTV'],
    'ENG.1': ['ESPN'], 'ENG.2': ['ESPN'],
    'ESP.1': ['ESPN'], 'ESP.2': ['ESPN'],
    'GER.1': ['Fox Sports'], 'GER.2': ['Fox Sports'],
    'ITA.1': ['ESPN'], 'ITA.2': ['ESPN'],
    'FRA.1': ['CazéTV'], 'FRA.2': ['CazéTV'],
    'POR.1': ['ESPN'], 'NED.1': ['ESPN'],
    'SCO.1': ['ESPN'], 'TUR.1': ['ESPN'],
    'RUS.1': ['ESPN'], 'BEL.1': ['ESPN'],
    'GRE.1': ['ESPN'], 'KSA.1': ['ESPN'],
    'FIFA.WORLDQ.CONMEBOL': ['Globo', 'SporTV'],
    'CONCACAF.CHAMPIONS':   ['DAZN'],
    'CAF.CHAMPIONS':        ['DAZN'],
  };

  const traducaoStatus = {
    'Scheduled': 'Agendado', 'In Progress': 'Ao Vivo',
    'Final': 'Encerrado', 'Postponed': 'Adiado',
    'Halftime': 'Intervalo', 'Full Time': 'Encerrado',
  };
  
  // Coletar todos os jogos em um array plano
  let todosJogos = [];
  
  const chunks = [];
  for (let i = 0; i < todasLigas.length; i += 5) {
    chunks.push(todasLigas.slice(i, i + 5));
  }
  
  for (const chunk of chunks) {
    const resultados = await Promise.allSettled(
      chunk.map(liga => 
        fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${liga.id}/scoreboard?dates=${dataFormatada}`)
          .then(r => r.json())
          .then(data => ({ liga, jogos: data.events || [] }))
          .catch(() => ({ liga, jogos: [] }))
      )
    );
    
    for (const resultado of resultados) {
      if (resultado.status !== 'fulfilled') continue;
      const { liga, jogos } = resultado.value;
      
      jogos.forEach(jogo => {
        try {
          const timeCasa = jogo.competitions[0].competitors.find(c => c.homeAway === 'home');
          const timeVisitante = jogo.competitions[0].competitors.find(c => c.homeAway === 'away');
          const dataJogo = new Date(jogo.date);
          const horario = dataJogo.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
          const status = traducaoStatus[jogo.status.type.description] || jogo.status.type.description;
          const canaisDisponiveis = canaisPorLiga[liga.id] || ['ESPN'];
          const canal = canaisDisponiveis[Math.floor(Math.random() * canaisDisponiveis.length)];
          
          // Log especial para Campeonato Saudita
          if (liga.id === 'KSA.1') {
            console.log('🇸🇦 JOGO SAUDITA ENCONTRADO:', timeCasa.team.displayName, 'vs', timeVisitante.team.displayName);
          }
          
          todosJogos.push({
            timestamp: dataJogo.getTime(), // Para ordenação
            horario, status, liga: liga.nome, canal,
            timeCasa: timeCasa.team.displayName,
            timeVisitante: timeVisitante.team.displayName,
            logoCasa: timeCasa.team.logo || '',
            logoVisitante: timeVisitante.team.logo || '',
            id: `${liga.id}_${jogo.id}`,
          });
        } catch(e) { /* jogo inválido */ }
      });
    }
  }
  
  // Ordenar por horário (mais cedo primeiro)
  todosJogos.sort((a, b) => a.timestamp - b.timestamp);

  // Se não há jogos hoje ou todos encerraram, busca amanhã automaticamente
  const todosEncerrados = todosJogos.length > 0 && todosJogos.every(j => j.status === 'Encerrado' || j.status === 'Adiado' || j.status === 'Cancelado');
  if ((todosJogos.length === 0 || todosEncerrados) && !buscandoAmanha) {
    buscandoAmanha = true;
    dataJogos = 1; // ATUALIZAR PARA AMANHÃ
    dataFormatada = getDataFormatadaBR(1);
    container.innerHTML = '<div class="loading-state">🔄 Sem jogos hoje, buscando jogos de amanhã...</div>';
    // Rebusca com a data de amanhã
    todosJogos = [];
    for (const chunk of chunks) {
      const resultados = await Promise.allSettled(
        chunk.map(liga =>
          fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${liga.id}/scoreboard?dates=${dataFormatada}`)
            .then(r => r.json())
            .then(data => ({ liga, jogos: data.events || [] }))
            .catch(() => ({ liga, jogos: [] }))
        )
      );
      for (const resultado of resultados) {
        if (resultado.status !== 'fulfilled') continue;
        const { liga, jogos } = resultado.value;
        jogos.forEach(jogo => {
          try {
            const timeCasa = jogo.competitions[0].competitors.find(c => c.homeAway === 'home');
            const timeVisitante = jogo.competitions[0].competitors.find(c => c.homeAway === 'away');
            const dataJogo = new Date(jogo.date);
            const horario = dataJogo.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            const status = traducaoStatus[jogo.status.type.description] || jogo.status.type.description;
            const canaisDisponiveis = canaisPorLiga[liga.id] || ['ESPN'];
            const canal = canaisDisponiveis[Math.floor(Math.random() * canaisDisponiveis.length)];
            todosJogos.push({
              timestamp: dataJogo.getTime(),
              horario, status, liga: liga.nome, canal,
              timeCasa: timeCasa.team.displayName,
              timeVisitante: timeVisitante.team.displayName,
              logoCasa: timeCasa.team.logo || '',
              logoVisitante: timeVisitante.team.logo || '',
              id: `${liga.id}_${jogo.id}`,
            });
          } catch(e) { /* jogo inválido */ }
        });
      }
    }
    todosJogos.sort((a, b) => a.timestamp - b.timestamp);
  }

  if (todosJogos.length === 0) {
    container.innerHTML = '<div class="empty-state">Nenhum jogo encontrado para hoje ou amanhã</div>';
  } else {
    // Renderizar ordenado por horário
    let html = '';
    todosJogos.forEach((jogo, index) => {
      const jogoData = JSON.stringify({
        id: jogo.id,
        timeCasa: jogo.timeCasa,
        timeVisitante: jogo.timeVisitante,
        horario: jogo.horario,
        status: jogo.status,
        liga: jogo.liga,
        logoCasa: jogo.logoCasa,
        logoVisitante: jogo.logoVisitante,
        canal: jogo.canal,
      });
      
      html += `
        <div class="jogo-api-item" onclick="toggleJogoSelecionado(${index}, this)" data-jogo='${jogoData}'>
          <div class="jogo-api-header">
            <div class="jogo-api-data">${jogo.horario}</div>
            <div class="jogo-api-status">${jogo.status}</div>
          </div>
          <div class="jogo-api-times">
            <div class="jogo-api-time">
              <div class="jogo-api-logo">${jogo.logoCasa ? `<img src="${jogo.logoCasa}" style="width:100%;height:100%;border-radius:50%;" />` : '⚽'}</div>
              <div class="jogo-api-nome">${jogo.timeCasa}</div>
            </div>
            <div class="jogo-api-vs">VS</div>
            <div class="jogo-api-time">
              <div class="jogo-api-logo">${jogo.logoVisitante ? `<img src="${jogo.logoVisitante}" style="width:100%;height:100%;border-radius:50%;" />` : '⚽'}</div>
              <div class="jogo-api-nome">${jogo.timeVisitante}</div>
            </div>
          </div>
          <div class="jogo-api-transmissao">📺 ${jogo.canal} • ${jogo.liga}</div>
        </div>`;
    });
    
    container.innerHTML = html;
    showToast(buscandoAmanha ? `📅 ${todosJogos.length} jogos encontrados para amanhã!` : `✅ ${todosJogos.length} jogos encontrados hoje!`);
    atualizarBotaoSelecionarTodos();
    
    // Selecionar todos automaticamente
    setTimeout(() => {
      selecionarTodosJogos();
      
      // Verificar se todas as configurações estão prontas e gerar banner automaticamente
      verificarEGerarBannerAutomatico();
    }, 100);
  }
  
  btn.disabled = false;
  btn.innerHTML = '🌍 Todos do Dia';
}

// ===== FUNÇÃO PARA BUSCAR JOGOS DE AMANHÃ =====
async function buscarJogosAmanha() {
  const container = document.getElementById('jogosDisponiveis');
  const btn = document.getElementById('btnBuscarAmanha');
  
  // Definir que estamos buscando jogos de AMANHÃ
  dataJogos = 1;
  
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Buscando...';
  container.innerHTML = '<div class="loading-state">🔄 Buscando jogos de amanhã...</div>';
  
  const todasLigas = [
    // Brasil
    { id: 'BRA.1',  nome: 'Brasileirão Série A' },
    { id: 'BRA.2',  nome: 'Brasileirão Série B' },
    { id: 'BRA.3',  nome: 'Brasileirão Série C' },
    { id: 'BRA.4',  nome: 'Brasileirão Série D' },
    { id: 'BRA.CB', nome: 'Copa do Brasil' },
    { id: 'BRA.RJ', nome: 'Campeonato Carioca' },
    { id: 'BRA.SP', nome: 'Campeonato Paulista' },
    { id: 'BRA.MG', nome: 'Campeonato Mineiro' },
    { id: 'BRA.RS', nome: 'Campeonato Gaúcho' },
    { id: 'BRA.BA', nome: 'Campeonato Baiano' },
    { id: 'BRA.PE', nome: 'Campeonato Pernambucano' },
    { id: 'BRA.CE', nome: 'Campeonato Cearense' },
    { id: 'BRA.GO', nome: 'Campeonato Goiano' },
    { id: 'BRA.PR', nome: 'Campeonato Paranaense' },
    { id: 'BRA.SC', nome: 'Campeonato Catarinense' },
    { id: 'BRA.ES', nome: 'Campeonato Capixaba' },
    { id: 'BRA.PA', nome: 'Campeonato Paraense' },
    { id: 'BRA.AM', nome: 'Campeonato Amazonense' },
    // América do Sul
    { id: 'CONMEBOL.LIBERTADORES',  nome: 'Copa Libertadores' },
    { id: 'CONMEBOL.SUDAMERICANA',  nome: 'Copa Sul-Americana' },
    { id: 'CONMEBOL.RECOPA',        nome: 'Recopa Sul-Americana' },
    { id: 'ARG.1', nome: 'Liga Argentina' },
    { id: 'COL.1', nome: 'Liga Colombiana' },
    { id: 'CHI.1', nome: 'Liga Chilena' },
    { id: 'URU.1', nome: 'Liga Uruguaia' },
    { id: 'PER.1', nome: 'Liga Peruana' },
    { id: 'ECU.1', nome: 'Liga Equatoriana' },
    { id: 'VEN.1', nome: 'Liga Venezuelana' },
    { id: 'PAR.1', nome: 'Liga Paraguaia' },
    { id: 'BOL.1', nome: 'Liga Boliviana' },
    // Europa
    { id: 'UEFA.CHAMPIONS',  nome: 'Champions League' },
    { id: 'UEFA.EUROPA',     nome: 'Europa League' },
    { id: 'UEFA.CONFERENCE', nome: 'Conference League' },
    { id: 'UEFA.NATIONS',    nome: 'Nations League' },
    { id: 'ENG.1', nome: 'Premier League' },
    { id: 'ENG.2', nome: 'Championship' },
    { id: 'ESP.1', nome: 'La Liga' },
    { id: 'ESP.2', nome: 'La Liga 2' },
    { id: 'GER.1', nome: 'Bundesliga' },
    { id: 'GER.2', nome: '2. Bundesliga' },
    { id: 'ITA.1', nome: 'Serie A' },
    { id: 'ITA.2', nome: 'Serie B' },
    { id: 'FRA.1', nome: 'Ligue 1' },
    { id: 'FRA.2', nome: 'Ligue 2' },
    { id: 'POR.1', nome: 'Primeira Liga' },
    { id: 'NED.1', nome: 'Eredivisie' },
    { id: 'SCO.1', nome: 'Scottish Premiership' },
    { id: 'TUR.1', nome: 'Süper Lig' },
    { id: 'RUS.1', nome: 'Premier League Russa' },
    { id: 'BEL.1', nome: 'Pro League Belga' },
    { id: 'GRE.1', nome: 'Super League Grega' },
    { id: 'KSA.1', nome: 'Campeonato Saudita' },
    // Mundial
    { id: 'FIFA.WORLDQ.CONMEBOL', nome: 'Eliminatórias Sul-Americanas' },
    { id: 'CONCACAF.CHAMPIONS',   nome: 'CONCACAF Champions Cup' },
    { id: 'CAF.CHAMPIONS',        nome: 'CAF Champions League' },
  ];
  
  // FORÇAR DATA DE AMANHÃ
  const dataFormatada = getDataFormatadaBR(1);
  
  console.log('🔍 BUSCA AMANHÃ INICIADA - Total de ligas:', todasLigas.length);
  console.log('📅 Data da busca:', dataFormatada);
  console.log('🇸🇦 Campeonato Saudita está na lista:', todasLigas.some(l => l.id === 'KSA.1'));
  
  const canaisPorLiga = {
    'BRA.BA': ['SporTV'], 'BRA.PE': ['SporTV'],
    'BRA.CE': ['SporTV'], 'BRA.GO': ['SporTV'],
    'BRA.PR': ['SporTV'], 'BRA.SC': ['SporTV'],
    'BRA.ES': ['SporTV'], 'BRA.PA': ['SporTV'],
    'BRA.AM': ['SporTV'],
    'CONMEBOL.LIBERTADORES': ['ESPN', 'SporTV'],
    'CONMEBOL.SUDAMERICANA': ['ESPN', 'SporTV'],
    'CONMEBOL.RECOPA':       ['SporTV'],
    'ARG.1': ['ESPN'], 'COL.1': ['ESPN'],
    'CHI.1': ['ESPN'], 'URU.1': ['ESPN'],
    'PER.1': ['ESPN'], 'ECU.1': ['ESPN'],
    'VEN.1': ['ESPN'], 'PAR.1': ['ESPN'],
    'BOL.1': ['ESPN'],
    'UEFA.CHAMPIONS':  ['TNT Sports', 'HBO Max'],
    'UEFA.EUROPA':     ['ESPN'],
    'UEFA.CONFERENCE': ['ESPN'],
    'UEFA.NATIONS':    ['SporTV'],
    'ENG.1': ['ESPN'], 'ENG.2': ['ESPN'],
    'ESP.1': ['ESPN'], 'ESP.2': ['ESPN'],
    'GER.1': ['Fox Sports'], 'GER.2': ['Fox Sports'],
    'ITA.1': ['ESPN'], 'ITA.2': ['ESPN'],
    'FRA.1': ['CazéTV'], 'FRA.2': ['CazéTV'],
    'POR.1': ['ESPN'], 'NED.1': ['ESPN'],
    'SCO.1': ['ESPN'], 'TUR.1': ['ESPN'],
    'RUS.1': ['ESPN'], 'BEL.1': ['ESPN'],
    'GRE.1': ['ESPN'], 'KSA.1': ['ESPN'],
    'FIFA.WORLDQ.CONMEBOL': ['Globo', 'SporTV'],
    'CONCACAF.CHAMPIONS':   ['DAZN'],
    'CAF.CHAMPIONS':        ['DAZN'],
  };

  const traducaoStatus = {
    'Scheduled': 'Agendado', 'In Progress': 'Ao Vivo',
    'Final': 'Encerrado', 'Postponed': 'Adiado',
    'Halftime': 'Intervalo', 'Full Time': 'Encerrado',
  };
  
  // Coletar todos os jogos em um array plano
  let todosJogos = [];
  
  const chunks = [];
  for (let i = 0; i < todasLigas.length; i += 5) {
    chunks.push(todasLigas.slice(i, i + 5));
  }
  
  for (const chunk of chunks) {
    const resultados = await Promise.allSettled(
      chunk.map(liga => 
        fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${liga.id}/scoreboard?dates=${dataFormatada}`)
          .then(r => r.json())
          .then(data => ({ liga, jogos: data.events || [] }))
          .catch(() => ({ liga, jogos: [] }))
      )
    );
    
    for (const resultado of resultados) {
      if (resultado.status !== 'fulfilled') continue;
      const { liga, jogos } = resultado.value;
      
      jogos.forEach(jogo => {
        try {
          const timeCasa = jogo.competitions[0].competitors.find(c => c.homeAway === 'home');
          const timeVisitante = jogo.competitions[0].competitors.find(c => c.homeAway === 'away');
          const dataJogo = new Date(jogo.date);
          const horario = dataJogo.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
          const status = traducaoStatus[jogo.status.type.description] || jogo.status.type.description;
          const canaisDisponiveis = canaisPorLiga[liga.id] || ['ESPN'];
          const canal = canaisDisponiveis[Math.floor(Math.random() * canaisDisponiveis.length)];
          
          // Log especial para Campeonato Saudita
          if (liga.id === 'KSA.1') {
            console.log('🇸🇦 JOGO SAUDITA AMANHÃ:', timeCasa.team.displayName, 'vs', timeVisitante.team.displayName);
          }
          
          todosJogos.push({
            timestamp: dataJogo.getTime(),
            horario, status, liga: liga.nome, canal,
            timeCasa: timeCasa.team.displayName,
            timeVisitante: timeVisitante.team.displayName,
            logoCasa: timeCasa.team.logo || '',
            logoVisitante: timeVisitante.team.logo || '',
            id: `${liga.id}_${jogo.id}`,
          });
        } catch(e) { /* jogo inválido */ }
      });
    }
  }
  
  // Ordenar por horário
  todosJogos.sort((a, b) => a.timestamp - b.timestamp);

  if (todosJogos.length === 0) {
    container.innerHTML = '<div class="empty-state">Nenhum jogo encontrado para amanhã</div>';
  } else {
    // Renderizar ordenado por horário
    let html = '';
    todosJogos.forEach((jogo, index) => {
      const jogoData = JSON.stringify({
        id: jogo.id,
        timeCasa: jogo.timeCasa,
        timeVisitante: jogo.timeVisitante,
        horario: jogo.horario,
        status: jogo.status,
        liga: jogo.liga,
        logoCasa: jogo.logoCasa,
        logoVisitante: jogo.logoVisitante,
        canal: jogo.canal,
      });
      
      html += `
        <div class="jogo-api-item" onclick="toggleJogoSelecionado(${index}, this)" data-jogo='${jogoData}'>
          <div class="jogo-api-header">
            <div class="jogo-api-data">${jogo.horario}</div>
            <div class="jogo-api-status">${jogo.status}</div>
          </div>
          <div class="jogo-api-times">
            <div class="jogo-api-time">
              <div class="jogo-api-logo">${jogo.logoCasa ? `<img src="${jogo.logoCasa}" style="width:100%;height:100%;border-radius:50%;" />` : '⚽'}</div>
              <div class="jogo-api-nome">${jogo.timeCasa}</div>
            </div>
            <div class="jogo-api-vs">VS</div>
            <div class="jogo-api-time">
              <div class="jogo-api-logo">${jogo.logoVisitante ? `<img src="${jogo.logoVisitante}" style="width:100%;height:100%;border-radius:50%;" />` : '⚽'}</div>
              <div class="jogo-api-nome">${jogo.timeVisitante}</div>
            </div>
          </div>
          <div class="jogo-api-transmissao">📺 ${jogo.canal} • ${jogo.liga}</div>
        </div>`;
    });
    
    container.innerHTML = html;
    showToast(`📅 ${todosJogos.length} jogos encontrados para amanhã!`);
    atualizarBotaoSelecionarTodos();
    
    // Selecionar todos automaticamente
    setTimeout(() => {
      selecionarTodosJogos();
      
      // Verificar se todas as configurações estão prontas e gerar banner automaticamente
      verificarEGerarBannerAutomatico();
    }, 100);
  }
  
  btn.disabled = false;
  btn.innerHTML = '📅 Amanhã';
}

async function buscarJogosFutebol() {
  const ligaSelect = document.getElementById('ligaSelect');
  const liga = ligaSelect.value;
  const container = document.getElementById('jogosDisponiveis');
  
  // Definir que estamos buscando jogos de HOJE
  dataJogos = 0;
  
  if (!liga) {
    container.innerHTML = '<div class="empty-state">Selecione uma liga para ver os jogos</div>';
    return;
  }
  
  container.innerHTML = '<div class="loading-state">🔄 Buscando jogos...</div>';
  
  try {
    // Buscar jogos da ESPN API — tenta hoje, se vazio ou todos encerrados busca amanhã
    let dataFormatada = getDataFormatadaBR(0);
    let buscandoAmanha = false;

    let response = await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${liga}/scoreboard?dates=${dataFormatada}`);
    if (!response.ok) throw new Error('Erro ao buscar jogos');
    let data = await response.json();
    let jogos = data.events || [];

    // Verifica se todos estão encerrados
    const traducaoStatusCheck = { 'Final':'Encerrado','Postponed':'Adiado','Canceled':'Cancelado','Full Time':'Encerrado' };
    const todosEncerrados = jogos.length > 0 && jogos.every(j => {
      const s = traducaoStatusCheck[j.status.type.description];
      return !!s;
    });

    if (jogos.length === 0 || todosEncerrados) {
      buscandoAmanha = true;
      dataJogos = 1; // ATUALIZAR PARA AMANHÃ
      dataFormatada = getDataFormatadaBR(1);
      container.innerHTML = '<div class="loading-state">🔄 Sem jogos hoje, buscando amanhã...</div>';
      response = await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${liga}/scoreboard?dates=${dataFormatada}`);
      if (!response.ok) throw new Error('Erro ao buscar jogos');
      data = await response.json();
      jogos = data.events || [];
    }

    if (jogos.length === 0) {
      container.innerHTML = `<div class="empty-state">Nenhum jogo encontrado para hoje ou amanhã nesta liga</div>`;
      return;
    }
    
    // Renderizar jogos
    let jogosHtml = '';
    jogos.forEach((jogo, index) => {
      const timeCasa = jogo.competitions[0].competitors.find(c => c.homeAway === 'home');
      const timeVisitante = jogo.competitions[0].competitors.find(c => c.homeAway === 'away');
      const dataJogo = new Date(jogo.date);
      const horario = dataJogo.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      const statusRaw = jogo.status.type.description;
      
      // Traduzir status para português
      const traducaoStatus = {
        'Scheduled':  'Agendado',
        'In Progress': 'Ao Vivo',
        'Final':       'Encerrado',
        'Postponed':   'Adiado',
        'Canceled':    'Cancelado',
        'Suspended':   'Suspenso',
        'Delayed':     'Atrasado',
        'Halftime':    'Intervalo',
        'Full Time':   'Encerrado',
        'Extra Time':  'Prorrogação',
        'Penalty':     'Pênaltis',
      };
      const status = traducaoStatus[statusRaw] || statusRaw;
      
      // Determinar canal de transmissão baseado na liga
      let canalTransmissao = 'A definir';
      const ligaNome = ligaSelect.options[ligaSelect.selectedIndex].text;
      const ligaVal  = ligaSelect.value;
      
      // Mapa de ligas para canais
      const canaisPorLiga = {
        // Brasil
        'BRA.1':  ['Globo', 'SporTV', 'Premiere'],
        'BRA.2':  ['SporTV', 'Premiere'],
        'BRA.3':  ['DAZN'],
        'BRA.CB': ['Globo', 'SporTV', 'Premiere'],
        'BRA.RJ': ['Band', 'SporTV'],
        'BRA.SP': ['Record', 'SporTV'],
        'BRA.MG': ['SporTV'],
        'BRA.RS': ['SporTV'],
        'BRA.BA': ['SporTV'],
        'BRA.PE': ['SporTV'],
        'BRA.CE': ['SporTV'],
        // América do Sul
        'CONMEBOL.LIBERTADORES':  ['ESPN', 'SporTV'],
        'CONMEBOL.SUDAMERICANA':  ['ESPN', 'SporTV'],
        'CONMEBOL.RECOPA':        ['SporTV'],
        'ARG.1': ['ESPN'],
        'COL.1': ['ESPN'],
        'CHI.1': ['ESPN'],
        'URU.1': ['ESPN'],
        // Europa
        'UEFA.CHAMPIONS':  ['TNT Sports', 'HBO Max'],
        'UEFA.EUROPA':     ['ESPN'],
        'UEFA.CONFERENCE': ['ESPN'],
        'UEFA.NATIONS':    ['SporTV'],
        'ENG.1': ['ESPN'],
        'ENG.2': ['ESPN'],
        'ESP.1': ['ESPN'],
        'ESP.2': ['ESPN'],
        'GER.1': ['Fox Sports'],
        'GER.2': ['Fox Sports'],
        'ITA.1': ['ESPN'],
        'ITA.2': ['ESPN'],
        'FRA.1': ['CazéTV'],
        'FRA.2': ['CazéTV'],
        'POR.1': ['ESPN'],
        'NED.1': ['ESPN'],
        'SCO.1': ['ESPN'],
        'TUR.1': ['ESPN'],
        // Mundial
        'FIFA.WORLDQ.CONMEBOL': ['Globo', 'SporTV'],
        'FIFA.WORLDQ.UEFA':     ['SporTV'],
        'CONCACAF.CHAMPIONS':   ['DAZN'],
        'CAF.CHAMPIONS':        ['DAZN'],
      };
      
      const canaisDisponiveis = canaisPorLiga[ligaVal] || ['ESPN', 'Fox Sports', 'SporTV'];
      canalTransmissao = canaisDisponiveis[Math.floor(Math.random() * canaisDisponiveis.length)];

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
    showToast(buscandoAmanha ? `📅 Jogos de amanhã carregados!` : `✅ Jogos carregados!`);
    
    // Atualizar botão "Selecionar Todos" após carregar jogos
    atualizarBotaoSelecionarTodos();
    
  } catch (error) {
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
    
    // Limpar banners múltiplos e jogador quando remover jogos
    window.bannersMultiplos = null;
    jogadorImg = null;
    jogadorAutomatico = false;
    console.log('🗑️ Banners e jogador limpos ao remover jogo');
  } else {
    // Adicionar seleção
    jogosSelecionados.push(jogoData);
    element.classList.add('selected');
    
    // Limpar banners múltiplos e jogador quando adicionar jogos
    window.bannersMultiplos = null;
    jogadorImg = null;
    jogadorAutomatico = false;
    console.log('🗑️ Banners e jogador limpos ao adicionar jogo');
  }
  
  atualizarJogosSelecionados();
  
  // Verificar se pode gerar banner automaticamente
  if (jogosSelecionados.length > 0) {
    setTimeout(() => {
      verificarEGerarBannerAutomatico();
    }, 300);
  }
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
  
  // Gerar resumo em tempo real com todos os jogos selecionados
  gerarResumoFutebol();
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
  
  // Limpar jogador carregado para forçar nova busca
  jogadorImg = null;
  jogadorAutomatico = false;
  console.log('🗑️ Jogador limpo - será buscado novamente na próxima geração');
  
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
    
    // Verificar se pode gerar banner automaticamente
    setTimeout(() => {
      verificarEGerarBannerAutomatico();
    }, 300);
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

// ===== FUNÇÃO PARA VERIFICAR E GERAR BANNER AUTOMATICAMENTE =====
function verificarEGerarBannerAutomatico() {
  // Verificar se estamos na aba de futebol
  if (tipoAtual !== 'futebol') return;
  
  // Verificar se há jogos selecionados
  if (!jogosSelecionados || jogosSelecionados.length === 0) return;
  
  // Verificar se a logo foi carregada (obrigatório para templates simples e promocional)
  const template = document.querySelector('input[name="template"]:checked')?.value || 'simples';
  if (template !== 'jogador' && !logoImg) {
    console.log('⏸️ Aguardando logo para gerar banner automaticamente...');
    return;
  }
  
  // Verificar se o formato está selecionado
  const formatoSelecionado = document.querySelector('input[name="formato"]:checked');
  if (!formatoSelecionado) return;
  
  // Todas as configurações estão prontas! Gerar banner automaticamente
  console.log('✅ Todas as configurações prontas! Gerando banner automaticamente...');
  
  // Aguardar um pouco para garantir que tudo está carregado
  setTimeout(() => {
    gerarBannerAtual();
    showToast('🎨 Banner gerado automaticamente!');
  }, 500);
}

// ===== RESUMO DE FUTEBOL PARA REDES SOCIAIS =====
function gerarResumoFutebol() {
  const card = document.getElementById('resumoCard');
  const textoEl = document.getElementById('resumoTexto');
  const tagsEl = document.getElementById('resumoTags');
  
  if (!card || !textoEl) return;
  
  card.style.display = 'block';
  if (tagsEl) tagsEl.innerHTML = '';
  
  if (jogosSelecionados.length === 0) return;
  
  // Montar texto do resumo
  const hoje = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' });
  const whatsapp = document.getElementById('inputWhatsapp')?.value || '';
  const instagram = document.getElementById('inputInstagram')?.value || '';
  const site = document.getElementById('inputSite')?.value || '';
  const textoExtra = document.getElementById('inputTexto')?.value || '';
  
  let linhas = [];
  linhas.push(`⚽ *JOGOS DE HOJE* - ${hoje.toUpperCase()}`);
  linhas.push('');
  
  jogosSelecionados.forEach((jogo, i) => {
    linhas.push(`🕐 *${jogo.horario}* | ${jogo.liga}`);
    linhas.push(`${jogo.timeCasa} x ${jogo.timeVisitante}`);
    linhas.push(`📺 ${jogo.canal || 'A definir'}`);
    if (i < jogosSelecionados.length - 1) linhas.push('');
  });
  
  // Contatos
  const contatos = [];
  if (whatsapp) contatos.push(`📱 ${whatsapp}`);
  if (instagram) contatos.push(`📸 ${instagram}`);
  if (site) contatos.push(`🌐 ${site}`);
  if (textoExtra) contatos.push(`✨ ${textoExtra}`);
  
  if (contatos.length > 0) {
    linhas.push('');
    linhas.push('📲 Fale comigo:');
    linhas.push(contatos.join('  |  '));
  }
  
  textoEl.contentEditable = 'true';
  textoEl.textContent = linhas.join('\n').trim();
  
  // Tags dos times
  if (tagsEl) {
    const times = new Set();
    jogosSelecionados.forEach(j => {
      times.add(j.timeCasa.replace(/\s+/g, ''));
      times.add(j.timeVisitante.replace(/\s+/g, ''));
    });
    
    Array.from(times).slice(0, 8).forEach(time => {
      const tag = document.createElement('span');
      tag.className = 'resumo-tag';
      tag.textContent = `#${time}`;
      tag.title = 'Clique para copiar';
      tag.onclick = () => {
        navigator.clipboard.writeText(tag.textContent);
        showToast(`📋 ${tag.textContent} copiado!`);
      };
      tagsEl.appendChild(tag);
    });
  }
}

function gerarBannerFutebol() {
  
  if (jogosSelecionados.length === 0) {
    alert('Selecione pelo menos um jogo!');
    return;
  }

  const template = document.querySelector('input[name="template"]:checked')?.value || 'simples';
  
  // Se tiver 5 jogos ou menos, limpar banners múltiplos e jogador para forçar nova busca
  if (jogosSelecionados.length <= 5) {
    window.bannersMultiplos = null;
    jogadorImg = null;
    jogadorAutomatico = false;
    console.log('🗑️ Limpo banners múltiplos e jogador (≤5 jogos selecionados)');
  }
  
  // Valida se a logo foi carregada (exceto para template jogador que é opcional)
  if (!logoImg && template !== 'jogador') {
    showToast('❌ Você precisa carregar uma logo para gerar o banner');
    return;
  }
  
  // Para template jogador, se não tiver imagem, buscar automaticamente
  if (template === 'jogador' && !jogadorImg) {
    showToast('🔍 Buscando jogador automaticamente...', 2000);
    buscarJogadorAutomatico().then(() => {
      // Após buscar, gerar o banner
      if (jogosSelecionados.length > 5) {
        gerarMultiplosBannersFutebol();
      } else {
        gerarBannerFutebolCanvas(jogosSelecionados);
      }
    }).catch(() => {
      showToast('❌ Erro ao buscar jogador. Tente fazer upload manual.');
    });
    return;
  }
  
  // Se tiver mais de 5 jogos, dividir em grupos
  if (jogosSelecionados.length > 5) {
    gerarMultiplosBannersFutebol();
  } else {
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
    
    
    // Mostrar mensagem de progresso
    showToast(`Gerando ${gruposDeJogos.length} banners com ${jogosSelecionados.length} jogos...`, 3000);
    
    // Array para armazenar todos os canvas gerados
    const bannersGerados = [];
    
    // Gerar cada banner
    for (let i = 0; i < gruposDeJogos.length; i++) {
      const grupo = gruposDeJogos[i];
      
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
    const placeholder = document.getElementById('canvasPlaceholder');
    const loading = document.getElementById('canvasLoading');
    if (placeholder) placeholder.style.display = 'none';
    if (loading) loading.style.display = 'none';
    canvasPreview.style.display = 'block';
    document.getElementById('previewActions').style.display = 'flex';
    bannerGerado = true;
    
    // Armazenar os banners para download
    window.bannersMultiplos = bannersGerados;
    
    // Criar visualizador de múltiplas imagens
    criarVisualizadorMultiplo(bannersGerados);
    
    // Mostrar visualizador (remover display:none e adicionar classe show)
    const visualizador = document.getElementById('visualizadorMultiplo');
    if (visualizador) {
      visualizador.style.display = ''; // Remover display:none inline
      visualizador.classList.add('show');
    }
    
    // Atualizar botão de download para baixar todos
    atualizarBotaoDownloadMultiplo(bannersGerados.length);
    
    showToast(`✅ ${gruposDeJogos.length} banners gerados com sucesso!`, 4000);
    
  } catch (error) {
    // Esconder loading em caso de erro
    const loading = document.getElementById('canvasLoading');
    if (loading) loading.style.display = 'none';
    showToast('❌ Erro ao gerar banners múltiplos');
    console.error('Erro:', error);
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
  
  // Configurações de qualidade para melhor renderização
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  
  // Fundo baseado no template selecionado
  const template = document.querySelector('input[name="template"]:checked')?.value || 'simples';
  console.log('🎯 Template múltiplo:', template, 'Banner', numeroBanner); // Debug
  
  if (template === 'jogador') {
    // Se estiver usando jogador automático, buscar jogador diferente para cada banner
    if (jogadorAutomatico) {
      const jogadorParaBanner = await buscarJogadorParaBanner(jogos, numeroBanner - 1);
      if (jogadorParaBanner) {
        // Temporariamente substituir jogadorImg para este banner
        const jogadorOriginal = jogadorImg;
        jogadorImg = jogadorParaBanner;
        await desenharBannerComJogador(ctx, w, h, jogos);
        jogadorImg = jogadorOriginal;
      } else {
        // Se não encontrar jogador, usar o padrão ou pular
        await desenharBannerComJogador(ctx, w, h, jogos);
      }
    } else {
      // Template com jogador manual: usar a mesma imagem para todos
      await desenharBannerComJogador(ctx, w, h, jogos);
    }
  } else if (template === 'promocional') {
    // Template promocional: usar imagens de futebol
    await desenharFundoFutebol(ctx, w, h);
    await desenharJogosNoBanner(ctx, w, h, jogos);
  } else {
    // Template simples: usar gradiente de cor
    await desenharFundoSimplesFutebol(ctx, w, h);
    await desenharJogosNoBanner(ctx, w, h, jogos);
  }
  
  return canvas;
}

// ===== FUNÇÃO PARA DESENHAR LOGO DO USUÁRIO EM CANVAS ESPECÍFICO =====
async function desenharLogoUsuarioCanvas(ctx, w, h) {
  const logoElement = document.getElementById('logoPreview');
  
  // Usar logo do usuário se disponível
  let logoSrc = null;
  if (logoElement && logoElement.src && logoElement.style.display !== 'none') {
    logoSrc = logoElement.src;
  }
  
  if (logoSrc) {
    try {
      const logoImg = await carregarImagem(logoSrc);
      
      // Calcular tamanho da logo (canto superior esquerdo)
      const logoMaxSize = Math.min(w * 0.16, h * 0.11);
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
      
    } catch (error) {
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
  
  try {
    const canvas = document.getElementById('bannerCanvas');
    const ctx = canvas.getContext('2d');
    
    
    // Configurar dimensões
    const { w, h } = getDimensoes();
    canvas.width = w;
    canvas.height = h;
    
    // Configurações de qualidade para melhor renderização
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    
    // Fundo baseado no template selecionado
    const template = document.querySelector('input[name="template"]:checked')?.value || 'simples';
    console.log('🎯 Template selecionado:', template); // Debug
    console.log('🖼️ Jogador IMG existe?', !!jogadorImg); // Debug
    console.log('📊 Total de jogos:', jogos.length); // Debug
    
    if (template === 'jogador') {
      console.log('✅ Gerando banner com jogador...'); // Debug
      // Template com jogador: desenhar layout especial
      await desenharBannerComJogador(ctx, w, h, jogos);
    } else if (template === 'promocional') {
      console.log('✅ Gerando banner promocional...'); // Debug
      // Template promocional: usar imagens de futebol
      await desenharFundoFutebol(ctx, w, h);
      await desenharJogosNoBanner(ctx, w, h, jogos);
    } else {
      console.log('✅ Gerando banner simples...'); // Debug
      // Template simples: usar gradiente de cor
      await desenharFundoSimplesFutebol(ctx, w, h);
      await desenharJogosNoBanner(ctx, w, h, jogos);
    }
    
    // Esconder visualizador de múltiplos banners (se existir)
    const visualizador = document.getElementById('visualizadorMultiplo');
    if (visualizador) {
      visualizador.classList.remove('show');
      visualizador.style.display = 'none';
    }
    
    // Resetar botão de download para modo single
    const btnDownload = document.querySelector('.btn-download');
    if (btnDownload) {
      btnDownload.innerHTML = '⬇️ Baixar Banner';
      btnDownload.onclick = downloadBanner;
    }
    
    // Mostrar canvas
    const placeholder = document.getElementById('canvasPlaceholder');
    const loading = document.getElementById('canvasLoading');
    if (placeholder) placeholder.style.display = 'none';
    if (loading) loading.style.display = 'none';
    canvas.style.display = 'block';
    document.getElementById('previewActions').style.display = 'flex';
    
    // Marcar banner como gerado para permitir download
    bannerGerado = true;
    
    
    // Gerar resumo dos jogos para redes sociais
    gerarResumoFutebol();
    
  } catch (error) {
    // Esconder loading em caso de erro
    const loading = document.getElementById('canvasLoading');
    if (loading) loading.style.display = 'none';
    console.error('❌ Erro ao gerar banner:', error);
    alert('Erro ao gerar banner: ' + error.message);
  }
}

// ===== DESENHAR JOGOS NO BANNER (TEMPLATES SIMPLES E PROMOCIONAL) =====
async function desenharJogosNoBanner(ctx, w, h, jogos) {
  // Marca d'água da logo (apenas rodapé)
  await desenharMarcaDagua(ctx, w, h);
  
  // Título "DESTAQUES"
  ctx.fillStyle = coresFutebol.destaque;
  ctx.font = `900 ${w * 0.08}px Impact, Anton, 'Arial Black', sans-serif`;
  ctx.textAlign = 'center';
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 10;
  ctx.fillText('DESTAQUES', w/2, h * 0.10);
  ctx.shadowBlur = 0;
  
  // Data (usar dataJogos para calcular: 0=hoje, 1=amanhã)
  const hoje = new Date();
  hoje.setDate(hoje.getDate() + dataJogos);
  const dataFormatada = hoje.toLocaleDateString('pt-BR', { 
    weekday: 'short', 
    day: '2-digit', 
    month: '2-digit' 
  });
  ctx.font = `700 ${w * 0.025}px Inter, sans-serif`;
  ctx.fillStyle = '#ffffff';
  ctx.fillText(`DA RODADA - ${dataFormatada.toUpperCase()}`, w/2, h * 0.14);
  
  // Desenhar jogos
  let yPos = h * 0.18;
  const jogoHeight = h * 0.11;
  const jogoSpacing = h * 0.015;
  
  // Carregar todas as imagens primeiro
  const imagensCarregadas = await carregarImagensDosTimes(jogos);
  
  for (let i = 0; i < jogos.length && i < 5; i++) {
    const jogo = jogos[i];
    
    // Fundo do jogo com bordas arredondadas
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    roundRect(ctx, w * 0.05, yPos, w * 0.9, jogoHeight, 12);
    ctx.fill();
    
    // Campeonato/Liga (topo) - fonte Impact igual ao DESTAQUES
    ctx.fillStyle = coresFutebol.liga;
    ctx.font = `900 ${w * 0.018}px Impact, Anton, 'Arial Black', sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(jogo.liga, w/2, yPos + jogoHeight * 0.2);
    
    // Horário (esquerda)
    ctx.fillStyle = coresFutebol.hora;
    ctx.font = `900 ${w * 0.032}px Impact, Anton, 'Arial Black', sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText(jogo.horario, w * 0.08, yPos + jogoHeight * 0.6);
    
    // Desenhar brasões dos times
    const logoSize = w * 0.06;
    const logoY = yPos + jogoHeight * 0.22;
    
    // Logo time casa (esquerda)
    if (imagensCarregadas[i] && imagensCarregadas[i].logoCasa) {
      ctx.drawImage(imagensCarregadas[i].logoCasa, w * 0.28, logoY, logoSize, logoSize);
    } else {
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
    ctx.fillText(`${abreviarTime(jogo.timeCasa)} x ${abreviarTime(jogo.timeVisitante)}`, w/2, yPos + jogoHeight * 0.8);
    
    // Canal de transmissão (direita)
    ctx.fillStyle = '#F77F30';
    ctx.font = `600 ${w * 0.020}px Inter, sans-serif`;
    ctx.textAlign = 'right';
    const canalTransmissao = jogo.canal || 'A definir';
    await desenharIconeCanal(ctx, canalTransmissao, w * 0.92, yPos + jogoHeight * 0.5, jogoHeight * 0.55);
    
    yPos += jogoHeight + jogoSpacing;
  }
  
  // Logo do usuário no canto superior esquerdo
  await desenharLogoUsuario(ctx, w, h);
  
  // Informações do usuário (rodapé)
  const whatsappEl = document.getElementById('inputWhatsapp');
  const instagramEl = document.getElementById('inputInstagram');
  const siteEl = document.getElementById('inputSite');
  const textoEl = document.getElementById('inputTexto');
  
  const whatsapp = whatsappEl ? whatsappEl.value : '';
  const instagram = instagramEl ? instagramEl.value : '';
  const site = siteEl ? siteEl.value : '';
  const textoExtra = textoEl ? textoEl.value : '';
  
  const mostrarSiteEl = document.getElementById('checkMostrarSiteBanner');
  const mostrarSite = mostrarSiteEl ? mostrarSiteEl.checked : true;
  
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
}

// ===== DESENHAR BANNER COM JOGADOR =====
async function desenharBannerComJogador(ctx, w, h, jogos) {
  // Obter configurações de fundo e overlay
  const fundoRadio = document.querySelector('input[name="fundoPromo"]:checked');
  const fundoVal = fundoRadio?.value || 'roxo';
  
  // Paletas de cores para fundos coloridos
  const paletas = {
    roxo:     { c1:'#0d0618', c2:'#1a0a2e', c3:'#2d1060' },
    azul:     { c1:'#020b18', c2:'#0a1628', c3:'#0f2d5e' },
    vermelho: { c1:'#180202', c2:'#1a0a0a', c3:'#5e0f0f' },
    verde:    { c1:'#021208', c2:'#0a1a0e', c3:'#0f4d1e' },
    laranja:  { c1:'#1a0a00', c2:'#2d1400', c3:'#5e2a0f' },
    rosa:     { c1:'#180214', c2:'#2d0a1e', c3:'#5e0f3d' },
    ciano:    { c1:'#021418', c2:'#0a1e28', c3:'#0f3d5e' },
    turquesa: { c1:'#021814', c2:'#0a2820', c3:'#0f5e4d' },
    dourado:  { c1:'#1a1200', c2:'#2d2000', c3:'#5e4a0f' },
    preto:    { c1:'#000000', c2:'#0a0a0a', c3:'#1a1a1a' },
  };
  
  // Desenhar fundo baseado na seleção
  if (paletas[fundoVal]) {
    const p = paletas[fundoVal];
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, p.c1);
    grad.addColorStop(0.5, p.c2);
    grad.addColorStop(1, p.c3);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  } else {
    // Fundo padrão escuro
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#0a0a0f');
    grad.addColorStop(0.5, '#1a1a24');
    grad.addColorStop(1, '#0a0a0f');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }
  
  // Desenhar imagem do jogador no lado esquerdo (se houver)
  if (jogadorImg) {
    const jogadorWidth = w * 0.40; // 40% da largura
    const jogadorHeight = h;
    
    // Calcular dimensões mantendo proporção
    const imgRatio = jogadorImg.width / jogadorImg.height;
    const targetRatio = jogadorWidth / jogadorHeight;
    
    let sx, sy, sWidth, sHeight;
    
    if (imgRatio > targetRatio) {
      // Imagem mais larga - cortar laterais
      sHeight = jogadorImg.height;
      sWidth = sHeight * targetRatio;
      sx = (jogadorImg.width - sWidth) / 2;
      sy = 0;
    } else {
      // Imagem mais alta - cortar topo/base
      sWidth = jogadorImg.width;
      sHeight = sWidth / targetRatio;
      sx = 0;
      sy = (jogadorImg.height - sHeight) / 2;
    }
    
    // Desenhar jogador
    ctx.drawImage(jogadorImg, sx, sy, sWidth, sHeight, 0, 0, jogadorWidth, jogadorHeight);
    
    // Gradiente de transição do jogador para o fundo
    const fadeGrad = ctx.createLinearGradient(jogadorWidth * 0.75, 0, jogadorWidth * 1.15, 0);
    fadeGrad.addColorStop(0, 'rgba(10,10,15,0)');
    fadeGrad.addColorStop(0.5, 'rgba(10,10,15,0.5)');
    fadeGrad.addColorStop(1, 'rgba(10,10,15,1)');
    ctx.fillStyle = fadeGrad;
    ctx.fillRect(0, 0, w, h);
  }
  
  // Aplicar overlay configurável
  const overlayStyle = getOverlayStylePromo();
  if (overlayStyle && overlayStyle !== 'none') {
    const overlayGrad = ctx.createLinearGradient(0, 0, 0, h);
    overlayGrad.addColorStop(0, overlayStyle.replace(/0\.\d+\)/, '0.3)'));
    overlayGrad.addColorStop(0.5, overlayStyle.replace(/0\.\d+\)/, '0.25)'));
    overlayGrad.addColorStop(1, overlayStyle.replace(/0\.\d+\)/, '0.4)'));
    ctx.fillStyle = overlayGrad;
    ctx.fillRect(0, 0, w, h);
  }
  
  // Área dos jogos (lado direito)
  const jogosX = w * 0.42; // Começa em 42%
  const jogosWidth = w * 0.54; // 54% da largura
  
  // Data no topo (caixa BRANCA com borda arredondada) - usar dataJogos para calcular
  const hoje = new Date();
  hoje.setDate(hoje.getDate() + dataJogos);
  const dia = hoje.getDate().toString().padStart(2, '0');
  const mes = (hoje.getMonth() + 1).toString().padStart(2, '0');
  const diaSemana = hoje.toLocaleDateString('pt-BR', { weekday: 'long' }).toUpperCase().replace('-FEIRA', '');
  
  // Calcular largura total do conjunto (data + dia da semana)
  const dataBoxW = w * 0.10;
  const dataBoxH = h * 0.10;
  const padding = w * 0.015;
  const espacoEntre = 0; // ENCOSTADO - sem espaço entre os quadrados
  
  // Medir largura do dia da semana
  ctx.font = `900 ${w * 0.065}px Impact, Anton, 'Arial Black', sans-serif`;
  const diaSemanaWidth = ctx.measureText(diaSemana).width;
  const diaSemanaBoxW = diaSemanaWidth + padding * 2;
  
  // Largura total do conjunto
  const conjuntoWidth = dataBoxW + espacoEntre + diaSemanaBoxW;
  
  // Centralizar o conjunto na área dos jogos (alinhado com as ligas)
  const cardX = jogosX + jogosWidth * 0.05;
  const cardW = jogosWidth * 0.9;
  const centroCard = cardX + cardW/2;
  
  // Posição inicial do conjunto (centralizado)
  const conjuntoX = centroCard - conjuntoWidth/2;
  const dataBoxY = h * 0.04;
  
  // Caixa da data (BRANCA)
  const dataBoxX = conjuntoX;
  
  // Fundo branco com borda arredondada
  ctx.fillStyle = '#ffffff';
  roundRect(ctx, dataBoxX, dataBoxY, dataBoxW, dataBoxH, 12);
  ctx.fill();
  
  // Dia (grande, PRETO) - fonte Impact igual ao dia da semana
  ctx.fillStyle = '#000000';
  ctx.font = `900 ${w * 0.050}px Impact, Anton, 'Arial Black', sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(dia, dataBoxX + dataBoxW/2, dataBoxY + dataBoxH * 0.48);
  
  // Mês (pequeno, PRETO) - fonte Impact igual ao dia da semana
  ctx.font = `900 ${w * 0.028}px Impact, Anton, 'Arial Black', sans-serif`;
  ctx.fillText(mes, dataBoxX + dataBoxW/2, dataBoxY + dataBoxH * 0.80);
  
  // Dia da semana ao lado (GRANDE e BRANCO)
  const diaSemanaBoxX = dataBoxX + dataBoxW + espacoEntre;
  const diaSemanaX = diaSemanaBoxX + padding;
  const diaSemanaY = dataBoxY + dataBoxH * 0.70;
  
  // Desenhar retângulo preto com a MESMA ALTURA do quadrado branco (dataBoxH) e bordas arredondadas
  ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
  roundRect(ctx, diaSemanaBoxX, dataBoxY, diaSemanaBoxW, dataBoxH, 12);
  ctx.fill();
  
  // Agora desenhar o texto branco por cima
  ctx.fillStyle = '#ffffff';
  ctx.font = `900 ${w * 0.065}px Impact, Anton, 'Arial Black', sans-serif`;
  ctx.textAlign = 'left';
  ctx.shadowColor = 'rgba(0,0,0,0.8)';
  ctx.shadowBlur = 10;
  ctx.fillText(diaSemana, diaSemanaX, diaSemanaY);
  ctx.shadowBlur = 0;
  
  // Título "DESTAQUES" (grande, embaixo da data) - CENTRALIZADO
  ctx.fillStyle = coresFutebol.destaque;
  ctx.font = `900 ${w * 0.055}px Impact, Anton, 'Arial Black', sans-serif`;
  ctx.textAlign = 'center';
  ctx.shadowColor = 'rgba(0,0,0,0.8)';
  ctx.shadowBlur = 15;
  ctx.fillText('DESTAQUES', centroCard, h * 0.18);
  ctx.shadowBlur = 0;
  
  // Desenhar jogos (cards compactos e modernos)
  let yPos = h * 0.23; // Ajustado para dar espaço para data e título maiores
  const jogoHeight = h * 0.130;
  const jogoSpacing = h * 0.015;
  
  // Carregar imagens dos times
  const imagensCarregadas = await carregarImagensDosTimes(jogos);
  
  for (let i = 0; i < jogos.length && i < 5; i++) {
    const jogo = jogos[i];
    
    // Fundo do jogo (card escuro semi-transparente)
    ctx.fillStyle = 'rgba(30, 30, 40, 0.85)';
    roundRect(ctx, jogosX + jogosWidth * 0.05, yPos, jogosWidth * 0.9, jogoHeight, 12);
    ctx.fill();
    
    // Borda branca fina
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    const cardX = jogosX + jogosWidth * 0.05;
    const cardW = jogosWidth * 0.9;
    
    // MARCA D'ÁGUA dentro do card (pequena e discreta)
    if (logoImg) {
      const logoRatio = logoImg.width / logoImg.height;
      const marcaW = cardW * 0.25; // 25% da largura do card
      const marcaH = marcaW / logoRatio;
      const marcaX = cardX + (cardW - marcaW) / 2; // Centralizada no card
      const marcaY = yPos + (jogoHeight - marcaH) / 2; // Centralizada verticalmente
      
      ctx.save();
      ctx.globalAlpha = 0.06; // Bem transparente para não atrapalhar
      ctx.drawImage(logoImg, marcaX, marcaY, marcaW, marcaH);
      ctx.restore();
    }
    
    // Campeonato/Liga (topo, cor destaque) - fonte Impact igual ao DESTAQUES
    ctx.fillStyle = coresFutebol.liga;
    ctx.font = `900 ${w * 0.014}px Impact, Anton, 'Arial Black', sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(jogo.liga.toUpperCase(), cardX + cardW/2, yPos + jogoHeight * 0.15);
    
    // Horário (esquerda, grande e destacado)
    ctx.fillStyle = coresFutebol.hora;
    ctx.font = `900 ${w * 0.028}px Impact, Anton, 'Arial Black', sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText(jogo.horario, cardX + cardW * 0.08, yPos + jogoHeight * 0.5);
    
    // Brasões dos times (centralizados)
    const logoSize = w * 0.055;
    const logoY = yPos + jogoHeight * 0.3;
    const centerX = cardX + cardW/2;
    
    // Logo time casa (esquerda do centro)
    if (imagensCarregadas[i] && imagensCarregadas[i].logoCasa) {
      ctx.drawImage(imagensCarregadas[i].logoCasa, centerX - logoSize * 2.2, logoY, logoSize, logoSize);
    } else {
      // Fallback
      ctx.fillStyle = 'rgba(255,255,255,0.1)';
      ctx.beginPath();
      ctx.arc(centerX - logoSize * 1.7, logoY + logoSize/2, logoSize/2, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // VS no centro
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = `700 ${w * 0.018}px Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('VS', centerX, logoY + logoSize * 0.6);
    
    // Logo time visitante (direita do centro)
    if (imagensCarregadas[i] && imagensCarregadas[i].logoVisitante) {
      ctx.drawImage(imagensCarregadas[i].logoVisitante, centerX + logoSize * 1.2, logoY, logoSize, logoSize);
    } else {
      // Fallback
      ctx.fillStyle = 'rgba(255,255,255,0.1)';
      ctx.beginPath();
      ctx.arc(centerX + logoSize * 1.7, logoY + logoSize/2, logoSize/2, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Nomes dos times (abaixo dos logos)
    ctx.fillStyle = '#ffffff';
    ctx.font = `600 ${w * 0.016}px Inter, sans-serif`;
    ctx.textAlign = 'center';
    const nomeJogo = `${abreviarTime(jogo.timeCasa)} x ${abreviarTime(jogo.timeVisitante)}`;
    ctx.fillText(nomeJogo, centerX, yPos + jogoHeight * 0.85);
    
    // Canal de transmissão (direita, com logo)
    const canalTexto = jogo.canal || 'ESPN';
    const canalX = cardX + cardW * 0.92;
    const canalY = yPos + jogoHeight * 0.5;
    const canalSize = jogoHeight * 0.35; // Tamanho da logo do canal
    
    // Desenhar logo do canal
    await desenharIconeCanal(ctx, canalTexto, canalX, canalY, canalSize);
    
    yPos += jogoHeight + jogoSpacing;
  }
  
  // Logo do usuário (canto superior esquerdo, sobre o jogador)
  if (logoImg) {
    const logoMaxW = w * 0.15;
    const logoMaxH = h * 0.08;
    const logoRatio = logoImg.width / logoImg.height;
    let logoW, logoH;
    
    if (logoRatio > logoMaxW / logoMaxH) {
      logoW = logoMaxW;
      logoH = logoW / logoRatio;
    } else {
      logoH = logoMaxH;
      logoW = logoH * logoRatio;
    }
    
    ctx.shadowColor = 'rgba(0,0,0,0.9)';
    ctx.shadowBlur = 15;
    ctx.drawImage(logoImg, w * 0.03, h * 0.02, logoW, logoH);
    ctx.shadowBlur = 0;
  }
  
  // Rodapé com texto "TODOS OS JOGOS AO VIVO" ou contatos
  const whatsappEl = document.getElementById('inputWhatsapp');
  const instagramEl = document.getElementById('inputInstagram');
  const siteEl = document.getElementById('inputSite');
  const textoEl = document.getElementById('inputTexto');
  
  const whatsapp = whatsappEl ? whatsappEl.value : '';
  const instagram = instagramEl ? instagramEl.value : '';
  const site = siteEl ? siteEl.value : '';
  const textoExtra = textoEl ? textoEl.value : '';
  
  const mostrarSiteEl = document.getElementById('checkMostrarSiteBanner');
  const mostrarSite = mostrarSiteEl ? mostrarSiteEl.checked : true;
  
  let contatos = [];
  if (whatsapp) contatos.push(`📱 ${whatsapp}`);
  if (instagram) contatos.push(`📷 ${instagram}`);
  if (site && mostrarSite) contatos.push(`🌐 ${site}`);
  if (textoExtra) contatos.push(textoExtra);
  
  // Faixa no rodapé
  const rodapeY = h * 0.94;
  const rodapeH = h * 0.06;
  
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, rodapeY, w, rodapeH);
  
  // Texto do rodapé
  ctx.fillStyle = '#ffffff';
  ctx.font = `700 ${w * 0.020}px Inter, sans-serif`;
  ctx.textAlign = 'center';
  ctx.shadowColor = 'rgba(0,0,0,0.9)';
  ctx.shadowBlur = 5;
  
  if (contatos.length > 0) {
    ctx.fillText(contatos.join('  •  '), w/2, rodapeY + rodapeH * 0.6);
  } else {
    ctx.fillText('TODOS OS JOGOS AO VIVO', w/2, rodapeY + rodapeH * 0.6);
  }
  
  ctx.shadowBlur = 0;
}

// Inicializar com um jogo exemplo
document.addEventListener('DOMContentLoaded', function() {
  // Painel de futebol inicializado
});
function gerarBannerAtual() {
  // Validações ANTES de mostrar o loading
  if (tipoAtual === 'futebol') {
    // Validar se há jogos selecionados
    if (jogosSelecionados.length === 0) {
      alert('Selecione pelo menos um jogo!');
      return;
    }
  } else {
    // Validar se há filme selecionado
    if (!filmeAtual) {
      alert('Busque um filme primeiro!');
      return;
    }
  }
  
  // Mostrar loading
  const loading = document.getElementById('canvasLoading');
  const canvas = document.getElementById('bannerCanvas');
  const placeholder = document.getElementById('canvasPlaceholder');
  
  if (loading) loading.style.display = 'flex';
  if (canvas) canvas.style.display = 'none';
  if (placeholder) placeholder.style.display = 'none';
  
  // Pequeno delay para garantir que o loading apareça
  setTimeout(() => {
    if (tipoAtual === 'futebol') {
      gerarBannerFutebol();
    } else {
      gerarBanner(); // Função original para filmes
    }
  }, 100);
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
      } catch (e) {
      }
    }
    
    // Carregar logo do time visitante
    if (jogo.logoVisitante) {
      try {
        imagens.logoVisitante = await carregarImagem(jogo.logoVisitante);
      } catch (e) {
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
  
  // Usar logo do usuário se disponível
  let logoSrc = null;
  if (logoElement && logoElement.src && logoElement.style.display !== 'none') {
    logoSrc = logoElement.src;
  }
  
  if (logoSrc) {
    try {
      const logoImg = await carregarImagem(logoSrc);
      
      // Calcular tamanho mantendo proporção original
      const maxLogoSize = Math.min(w, h) * 0.16; // Aumentado de 0.12 para 0.16
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
      
    } catch(e) {
    }
  } else if (typeof logoAtual !== 'undefined' && logoAtual) {
    try {
      
      // Calcular tamanho mantendo proporção original
      const maxLogoSize = Math.min(w, h) * 0.16; // Aumentado de 0.12 para 0.16
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
      
    } catch(e) {
    }
  } else {
  }
}
// ===== FUNÇÃO PARA DESENHAR MARCA D'ÁGUA DA LOGO =====
async function desenharMarcaDagua(ctx, w, h) {
  const logoElement = document.getElementById('logoPreview');
  
  if (!logoElement || !logoElement.src || logoElement.style.display === 'none') return;
  
  try {
    const logoImg = await carregarImagem(logoElement.src);
    
    // Tamanho grande para marca d'água (40% da largura)
    const marcaMaxW = w * 0.40;
    const marcaMaxH = h * 0.30;
    const scale = Math.min(marcaMaxW / logoImg.width, marcaMaxH / logoImg.height);
    const marcaW = logoImg.width * scale;
    const marcaH = logoImg.height * scale;
    
    // Centralizada na área do topo (atrás de DESTAQUES e DA RODADA)
    const marcaX = (w - marcaW) / 2;
    const marcaY = h * 0.01; // Logo abaixo do topo, completamente visível
    
    // Aplicar opacidade baixa (marca d'água)
    ctx.save();
    ctx.globalAlpha = 0.25; // 25% de opacidade — mais visível
    
    // Apenas marca d'água inferior — rodapé
    const marcaY2 = h - marcaH - h * 0.01;
    ctx.drawImage(logoImg, marcaX, marcaY2, marcaW, marcaH);
    
    ctx.restore();
    
  } catch (e) {
  }
}

// ===== FUNÇÃO PARA DESENHAR MARCA D'ÁGUA APENAS EMBAIXO =====
async function desenharMarcaDaguaBaixo(ctx, w, h) {
  const logoElement = document.getElementById('logoPreview');
  
  if (!logoElement || !logoElement.src || logoElement.style.display === 'none') return;
  
  try {
    const logoImg = await carregarImagem(logoElement.src);
    
    // Tamanho menor para marca d'água (20% da largura)
    const marcaMaxW = w * 0.20;
    const marcaMaxH = h * 0.12;
    const scale = Math.min(marcaMaxW / logoImg.width, marcaMaxH / logoImg.height);
    const marcaW = logoImg.width * scale;
    const marcaH = logoImg.height * scale;
    
    const marcaX = (w - marcaW) / 2;
    
    // Aplicar opacidade baixa (marca d'água)
    ctx.save();
    ctx.globalAlpha = 0.25;
    
    // Posiciona abaixo da faixa preta (faixa termina em h * 0.83)
    const marcaY2 = h * 0.83 + h * 0.01;
    ctx.drawImage(logoImg, marcaX, marcaY2, marcaW, marcaH);
    
    ctx.restore();
    
  } catch (e) {
  }
}

// ===== FUNÇÃO PARA DESENHAR ÍCONE DO CANAL =====
async function desenharIconeCanal(ctx, canal, x, y, size) {
  // Mapa de canais para URLs de logos
  const logosCanais = {
    'Globo':      'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/canal11.png',
    'SporTV':     'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/canal8.png',
    'Premiere':   'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/canal1.png',
    'ESPN':       'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/canal3.png',
    'TNT Sports': 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/canal10.png',
    'HBO Max':    'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/canal5.png',
    'Fox Sports': 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/canal4.png',
    'Band':       'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/canal9.png',
    'Record':     'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/canal7.png',
    'DAZN':       'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/canal2.png',
    'CazéTV':     'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/canal6.png',
  };

  const logoUrl = logosCanais[canal];
  
  if (logoUrl) {
    try {
      const logoImg = await carregarImagem(logoUrl);
      
      // Multiplicador de tamanho por canal (SporTV, TNT Sports e HBO Max diminuídos pois as imagens são maiores)
      const multiplicadores = {
        'SporTV':    0.55,
        'TNT Sports': 0.55,
        'HBO Max':   0.35,
      };
      const mult = multiplicadores[canal] || 1.0;
      
      // Altura fixa para todos os canais — garante alinhamento uniforme
      const alturaFixa = size * 0.7; // Altura padrão igual para todos
      const alturaCanal = alturaFixa * mult;
      
      // Calcular largura proporcional à altura
      const aspectRatio = logoImg.width / logoImg.height;
      const lh = alturaCanal;
      const lw = lh * aspectRatio;
      
      // Centralizar verticalmente no mesmo ponto Y para todos
      const drawX = x - lw;
      const drawY = y - lh / 2; // Sempre centralizado no mesmo Y
      
      ctx.drawImage(logoImg, drawX, drawY, lw, lh);
      return;
    } catch (e) {
    }
  }
  
  // Fallback: texto com ícone
  ctx.fillStyle = '#F77F30';
  ctx.font = `600 ${size * 0.35}px Inter, sans-serif`;
  ctx.textAlign = 'right';
  ctx.fillText(`📺 ${canal}`, x, y + size * 0.12);
}

// ===== FUNÇÃO PARA ABREVIAR NOME DE TIME =====
function abreviarTime(nome, maxChars = 14) {
  if (!nome || nome.length <= maxChars) return nome;
  
  const palavras = nome.split(' ');
  
  // Se tiver só 1 palavra, trunca com ...
  if (palavras.length === 1) return nome.substring(0, maxChars - 1) + '.';
  
  // Tenta reduzir: mantém primeira palavra + iniciais das demais
  // Ex: "FC Baltika Kaliningrad" → "FC Baltika K."
  let resultado = palavras[0];
  for (let i = 1; i < palavras.length; i++) {
    const tentativa = resultado + ' ' + palavras[i];
    if (tentativa.length <= maxChars) {
      resultado = tentativa;
    } else {
      // Adiciona inicial da próxima palavra
      resultado += ' ' + palavras[i][0] + '.';
      break;
    }
  }
  
  return resultado;
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
  } else if (overlayStyle === 'rgba(20,83,45,0.6)') { // Green
    gradient = ctx.createLinearGradient(0, 0, w, h);
    gradient.addColorStop(0, '#0a1f0f');
    gradient.addColorStop(0.5, '#14532d');
    gradient.addColorStop(1, '#16a34a');
  } else if (overlayStyle === 'rgba(124,45,18,0.6)') { // Orange
    gradient = ctx.createLinearGradient(0, 0, w, h);
    gradient.addColorStop(0, '#1a0a00');
    gradient.addColorStop(0.5, '#7c2d12');
    gradient.addColorStop(1, '#ea580c');
  } else if (overlayStyle === 'rgba(131,24,67,0.6)') { // Pink
    gradient = ctx.createLinearGradient(0, 0, w, h);
    gradient.addColorStop(0, '#1a0a14');
    gradient.addColorStop(0.5, '#831843');
    gradient.addColorStop(1, '#ec4899');
  } else if (overlayStyle === 'rgba(55,65,81,0.6)') { // Gray
    gradient = ctx.createLinearGradient(0, 0, w, h);
    gradient.addColorStop(0, '#0f1419');
    gradient.addColorStop(0.5, '#374151');
    gradient.addColorStop(1, '#6b7280');
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
  
}

// ===== FUNÇÃO PARA DESENHAR FUNDO DE FUTEBOL =====
async function desenharFundoFutebol(ctx, w, h) {
  // Mapa de valores do radio para URLs das imagens
  const imagensLocais = {
    'fut1': 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/main/Fut1.jpg',
    'fut2': 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/main/Fut2.jpg',
    'fut3': 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/main/Fut3.png',
    'fut4': 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/main/Fut4.jpg',
    'fut5': 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/main/Fut5.jpg',
    'fut6': 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Fut6.jpg',
    'fut7': 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/fut7.jpg',
    'fut8': 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Fut8.jpg',
    'fut9': 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Fut9.jpg',
    'fut10': 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Fut10.jpg',
    'fut11': 'https://raw.githubusercontent.com/dedex1711-eng/BannerFlix/refs/heads/main/Fut11.png',
  };

  // Paletas de cores para fundos coloridos
  const paletas = {
    roxo:     { c1:'#0d0618', c2:'#1a0a2e', c3:'#2d1060' },
    azul:     { c1:'#020b18', c2:'#0a1628', c3:'#0f2d5e' },
    vermelho: { c1:'#180202', c2:'#1a0a0a', c3:'#5e0f0f' },
    verde:    { c1:'#021208', c2:'#0a1a0e', c3:'#0f4d1e' },
    laranja:  { c1:'#1a0a00', c2:'#2d1400', c3:'#5e2a0f' },
    rosa:     { c1:'#180214', c2:'#2d0a1e', c3:'#5e0f3d' },
    ciano:    { c1:'#021418', c2:'#0a1e28', c3:'#0f3d5e' },
    turquesa: { c1:'#021814', c2:'#0a2820', c3:'#0f5e4d' },
    dourado:  { c1:'#1a1200', c2:'#2d2000', c3:'#5e4a0f' },
    preto:    { c1:'#000000', c2:'#0a0a0a', c3:'#1a1a1a' },
  };

  const fundoRadio = document.querySelector('input[name="fundoPromo"]:checked');
  const fundoVal = fundoRadio?.value || 'fut1';
  

  // Se for uma das imagens de futebol
  if (imagensLocais[fundoVal]) {
    const url = imagensLocais[fundoVal];
    
    try {
      const imagemFundo = await Promise.race([
        carregarImagem(url),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout 8s')), 8000))
      ]);
      
      desenharCover(ctx, imagemFundo, w, h);
      
      // Overlay configurável para legibilidade
      const overlayStyle = getOverlayStyleFutebol();
      if (overlayStyle && overlayStyle !== 'none') {
        const overlay = ctx.createLinearGradient(0, 0, w, h);
        overlay.addColorStop(0, overlayStyle.replace(/0\.\d+\)/, '0.45)'));
        overlay.addColorStop(0.5, overlayStyle.replace(/0\.\d+\)/, '0.35)'));
        overlay.addColorStop(1, overlayStyle.replace(/0\.\d+\)/, '0.45)'));
        ctx.fillStyle = overlay;
        ctx.fillRect(0, 0, w, h);
      }
      
      return;
      
    } catch (error) {
      // Fallback: fundo escuro em vez de verde
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#0a0a0f');
      grad.addColorStop(1, '#1a1a24');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
      return;
    }
  }

  // Se for uma cor sólida (roxo, azul, etc.)
  if (paletas[fundoVal]) {
    const p = paletas[fundoVal];
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, p.c1);
    grad.addColorStop(0.5, p.c2);
    grad.addColorStop(1, p.c3);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    return;
  }

  // Fallback: fundo escuro
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, '#0a0a0f');
  grad.addColorStop(1, '#1a1a24');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
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
''
