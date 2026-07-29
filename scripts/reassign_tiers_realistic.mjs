import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const activeDir = path.join(__dirname, '../data/players/active');

function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);
  files.forEach((file) => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else if (file.endsWith('.json')) {
      arrayOfFiles.push(fullPath);
    }
  });
  return arrayOfFiles;
}

// ----------------------------------------------------
// REAL FOOTBALL PLAYER TIERING SYSTEM
// ----------------------------------------------------

// 1. MASTER TIER (World Top ~45 Superstars)
const MASTER_PLAYERS = new Set([
  // Premier League
  'Erling Haaland', 'E. Haaland', 'Rodri', 'Kevin De Bruyne', 'K. De Bruyne',
  'Phil Foden', 'P. Foden', 'Gianluigi Donnarumma', 'G. Donnarumma',
  'William Saliba', 'W. Saliba', 'Bukayo Saka', 'B. Saka', 'Declan Rice', 'D. Rice',
  'Martin Ødegaard', 'M. Ødegaard', 'Cole Palmer', 'C. Palmer', 'Moises Caicedo', 'M. Caicedo',
  'Virgil van Dijk', 'V. van Dijk', 'Mohamed Salah', 'M. Salah', 'Alexis Mac Allister', 'A. Mac Allister',
  'Florian Wirtz', 'F. Wirtz', 'Alexander Isak', 'A. Isak', 'Bruno Fernandes', 'Bruno Guimarães',

  // La Liga
  'Kylian Mbappé', 'K. Mbappé', 'Jude Bellingham', 'J. Bellingham', 'Vinícius Júnior', 'Vinicius Jr',
  'Federico Valverde', 'F. Valverde', 'Thibaut Courtois', 'T. Courtois', 'Lamine Yamal', 'L. Yamal',
  'Robert Lewandowski', 'R. Lewandowski', 'Pedri', 'Raphinha', 'Antoine Griezmann', 'A. Griezmann',

  // Serie A
  'Lautaro Martínez', 'Lautaro Martinez', 'L. Martínez', 'Nicolò Barella', 'N. Barella',
  'Alessandro Bastoni', 'A. Bastoni', 'Hakan Çalhanoğlu', 'H. Çalhanoğlu',
  'Mike Maignan', 'M. Maignan', 'Theo Hernández', 'T. Hernández', 'Khvicha Kvaratskhelia', 'K. Kvaratskhelia',

  // Bundesliga
  'Harry Kane', 'H. Kane', 'Jamal Musiala', 'J. Musiala', 'Alphonso Davies', 'A. Davies',
  'Gregor Kobel', 'G. Kobel',

  // Ligue 1
  'Ousmane Dembélé', 'O. Dembélé', 'Achraf Hakimi', 'A. Hakimi', 'Vitinha', 'Marquinhos',
  'Warren Zaïre-Emery', 'W. Zaïre-Emery', 'Nuno Mendes',

  // Legends / Global Icons
  'Lionel Messi', 'Cristiano Ronaldo', 'Neymar', 'Karim Benzema', 'N\'Golo Kanté'
]);

// 2. ELITE_PLUS TIER (Top ~100 Champions League Starters)
const ELITE_PLUS_PLAYERS = new Set([
  // Premier League
  'David Raya', 'Gabriel Magalhães', 'Jurriën Timber', 'J. Timber', 'Eberechi Eze', 'E. Eze',
  'Martín Zubimendi', 'Viktor Gyökeres', 'V. Gyökeres', 'Kai Havertz', 'K. Havertz', 'Emiliano Martínez', 'E. Martínez',
  'Ollie Watkins', 'O. Watkins', 'Kaoru Mitoma', 'K. Mitoma', 'Levi Colwill', 'L. Colwill', 'Reece James', 'R. James',
  'Enzo Fernández', 'E. Fernández', 'Estêvão', 'João Pedro', 'Pedro Neto', 'Daniel Muñoz', 'D. Muñoz',
  'Adam Wharton', 'A. Wharton', 'Jean-Philippe Mateta', 'J. Mateta', 'Jordan Pickford', 'J. Pickford', 'Iliman Ndiaye', 'I. Ndiaye',
  'Bernd Leno', 'B. Leno', 'Alex Iwobi', 'A. Iwobi', 'Alisson Becker', 'Ryan Gravenberch', 'R. Gravenberch',
  'Dominik Szoboszlai', 'D. Szoboszlai', 'Hugo Ekitike', 'H. Ekitike', 'Rúben Dias', 'Ruben Dias', 'Josko Gvardiol', 'J. Gvardiol',
  'Tijjani Reijnders', 'T. Reijnders', 'Jérémy Doku', 'J. Doku', 'Leny Yoro', 'L. Yoro', 'Matheus Cunha', 'Bryan Mbeumo', 'B. Mbeumo',
  'Nick Pope', 'N. Pope', 'Tino Livramento', 'T. Livramento', 'Nick Woltemade', 'N. Woltemade', 'Murillo', 'Morgan Gibbs-White', 'M. Gibbs-White',
  'Guglielmo Vicario', 'G. Vicario', 'Cristian Romero', 'C. Romero', 'Micky van de Ven', 'M. van de Ven', 'Lucas Bergvall', 'L. Bergvall',
  'James Maddison', 'J. Maddison', 'Pape Matar Sarr', 'P. Sarr', 'Sandro Tonali', 'S. Tonali', 'Jarrod Bowen', 'J. Bowen',
  'Joshua Kimmich', 'J. Kimmich', 'Dominic Solanke', 'D. Solanke', 'Kobbie Mainoo', 'K. Mainoo', 'Rayan Aït-Nouri', 'R. Aït-Nouri',
  'Marc Guéhi', 'M. Guéhi', 'Riccardo Calafiori', 'R. Calafiori', 'Ben White', 'B. White',

  // La Liga
  'Eder Militão', 'Éder Militão', 'Antonio Rüdiger', 'A. Rüdiger', 'Dani Carvajal', 'D. Carvajal', 'Aurélien Tchouaméni', 'A. Tchouaméni',
  'Eduardo Camavinga', 'E. Camavinga', 'Rodrygo', 'Luka Modrić', 'L. Modrić', 'Marc-André ter Stegen', 'M. ter Stegen', 'Jules Koundé', 'J. Koundé',
  'Ronald Araújo', 'R. Araújo', 'Gavi', 'Fermín López', 'F. López', 'Dani Olmo', 'D. Olmo', 'Oihan Sancet', 'O. Sancet', 'Álex Baena', 'A. Baena',
  'Takefusa Kubo', 'T. Kubo', 'Samu Omorodion', 'S. Omorodion', 'Jan Oblak', 'J. Oblak', 'Marcos Llorente', 'M. Llorente', 'Robin Le Normand', 'R. Le Normand',
  'Conor Gallagher', 'C. Gallagher', 'Julián Alvarez', 'Julian Alvarez', 'Nico Williams', 'N. Williams',

  // Serie A
  'Yann Sommer', 'Y. Sommer', 'Benjamin Pavard', 'B. Pavard', 'Denzel Dumfries', 'D. Dumfries', 'Federico Dimarco', 'F. Dimarco',
  'Marcus Thuram', 'M. Thuram', 'Gleison Bremer', 'Bremer', 'Teun Koopmeiners', 'T. Koopmeiners', 'Douglas Luiz', 'Dušan Vlahović', 'D. Vlahović',
  'Kenan Yıldız', 'K. Yıldız', 'Rafael Leão', 'R. Leão', 'Christian Pulisic', 'C. Pulisic', 'Ademola Lookman', 'A. Lookman', 'Mateo Retegui', 'M. Retegui',
  'Paulo Dybala', 'P. Dybala', 'Romelu Lukaku', 'R. Lukaku', 'Scott McTominay', 'S. McTominay', 'Alex Meret', 'A. Meret', 'David De Gea', 'D. De Gea',

  // Bundesliga
  'Manuel Neuer', 'M. Neuer', 'Jonathan Tah', 'J. Tah', 'Piero Hincapié', 'P. Hincapié', 'Jeremie Frimpong', 'J. Frimpong', 'Alejandro Grimaldo', 'A. Grimaldo',
  'Granit Xhaka', 'G. Xhaka', 'Exequiel Palacios', 'E. Palacios', 'Serhou Guirassy', 'S. Guirassy', 'Kingsley Coman', 'K. Coman', 'Serge Gnabry', 'S. Gnabry',
  'Dayot Upamecano', 'D. Upamecano', 'Nico Schlotterbeck', 'N. Schlotterbeck', 'Julian Brandt', 'J. Brandt', 'Karim Adeyemi', 'K. Adeyemi', 'Loïc Openda', 'L. Openda',
  'Xavi Simons', 'X. Simons', 'Benjamin Šeško', 'B. Šeško', 'Michael Olise', 'M. Olise',

  // Ligue 1
  'Lucas Beraldo', 'Beraldo', 'Fabián Ruiz', 'F. Ruiz', 'João Neves', 'J. Neves', 'Bradley Barcola', 'B. Barcola', 'Gonçalo Ramos', 'G. Ramos',
  'Mason Greenwood', 'M. Greenwood', 'Pierre-Emile Højbjerg', 'P. Højbjerg', 'Jonathan David', 'J. David', 'Lucas Chevalier', 'L. Chevalier',

  // Global
  'Darwin Núñez', 'D. Núñez', 'Riyad Mahrez', 'R. Mahrez', 'Édouard Mendy', 'E. Mendy', 'Ivan Toney', 'I. Toney', 'Roberto Firmino', 'R. Firmino',
  'Rúben Neves', 'R. Neves', 'Franck Kessié', 'F. Kessié', 'Malcom', 'Sergej Milinković-Savić', 'S. Milinković-Savić'
]);

function assignHonestTier(player, clubInfo) {
  const name = (player.name || '').trim();
  const league = (clubInfo?.league || '').trim();

  // Check Master
  if (MASTER_PLAYERS.has(name)) return 'MASTER';

  // Check Elite Plus
  if (ELITE_PLUS_PLAYERS.has(name)) return 'ELITE_PLUS';

  // Determine realistic tier based on player reputation and squad standing
  const topLeagues = ['Premier League', 'La Liga', 'Serie A', 'Bundesliga', 'Ligue 1'];
  const isTopLeague = topLeagues.includes(league);

  if (isTopLeague) {
    // In Top 5 Leagues:
    // Any senior player with a defined position (GK, CB, LB, RB, CDM, CM, CAM, LW, RW, ST) who is an established squad player gets ELITE.
    // This provides a realistic ~1,000 ELITE players across the 97 top European clubs.
    if (player.position && player.position !== 'UNKNOWN') {
      // Check if player is an academy/youth reserve player with zero senior experience
      // Academy players usually have long generic names or reserve status flag
      if (player.isReserve || (name.length > 20 && !name.includes(' '))) {
        return 'BRONZE';
      }
      return 'ELITE';
    }
    return 'GOLD';
  }

  // Other leagues (Saudi Pro League, Eredivisie, Primeira Liga, Brasileirão, Süper Lig, MLS):
  return 'GOLD';
}

// ----------------------------------------------------
// EXECUTION
// ----------------------------------------------------
const allFiles = getAllFiles(activeDir);
let totalUpdated = 0;
const tierCounts = {
  MASTER: 0,
  ELITE_PLUS: 0,
  ELITE: 0,
  GOLD: 0,
  SILVER: 0,
  BRONZE: 0
};

console.log(`Assigning real, honest tiers across ${allFiles.length} club files...`);

allFiles.forEach(filePath => {
  const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const clubInfo = content.club || {};

  if (content.players && Array.isArray(content.players)) {
    content.players.forEach(player => {
      if (player.isLegend) return;

      const newTier = assignHonestTier(player, clubInfo);
      player.tier = newTier;
      tierCounts[newTier] = (tierCounts[newTier] || 0) + 1;
      totalUpdated++;
    });
  }

  fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf8');
});

console.log(`\nSuccessfully updated all ${totalUpdated} active players!`);
console.log('--- REASSIGNED REALISTIC TIER DISTRIBUTION ---');
console.table(tierCounts);
