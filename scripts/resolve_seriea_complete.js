const fs = require('fs');
const path = require('path');

const SERIEA_NATIONS = {
  // Inter
  "Y. Sommer": "Switzerland",
  "J. Martínez": "Spain",
  "A. Bastoni": "Italy",
  "B. Pavard": "France",
  "S. de Vrij": "Netherlands",
  "F. Acerbi": "Italy",
  "Y. Bisseck": "Germany",
  "F. Dimarco": "Italy",
  "D. Dumfries": "Netherlands",
  "M. Darmian": "Italy",
  "C. Augusto": "Brazil",
  "T. Buchanan": "Canada",
  "H. Mkhitaryan": "Armenia",
  "N. Barella": "Italy",
  "H. Çalhanoğlu": "Turkey",
  "P. Zieliński": "Poland",
  "K. Asllani": "Albania",
  "D. Frattesi": "Italy",
  "Lautaro Martínez": "Argentina",
  "L. Martínez": "Argentina",
  "M. Thuram": "France",
  "M. Taremi": "Iran",
  "J. Correa": "Argentina",

  // AC Milan
  "M. Maignan": "France",
  "M. Sportiello": "Italy",
  "F. Tomori": "England",
  "S. Pavlović": "Serbia",
  "M. Thiaw": "Germany",
  "M. Gabbia": "Italy",
  "T. Hernández": "France",
  "Emerson Royal": "Brazil",
  "D. Calabria": "Italy",
  "F. Terracciano": "Italy",
  "T. Reijnders": "Netherlands",
  "Y. Fofana": "France",
  "R. Loftus-Cheek": "England",
  "I. Bennacer": "Algeria",
  "Y. Musah": "USA",
  "Rafael Leão": "Portugal",
  "R. Leão": "Portugal",
  "C. Pulisic": "USA",
  "S. Chukwueze": "Nigeria",
  "N. Okafor": "Switzerland",
  "Á. Morata": "Spain",
  "Álvaro Morata": "Spain",
  "T. Abraham": "England",
  "L. Jović": "Serbia",

  // Juventus
  "M. Di Gregorio": "Italy",
  "M. Perin": "Italy",
  "Bremer": "Brazil",
  "G. Bremer": "Brazil",
  "F. Gatti": "Italy",
  "P. Kalulu": "France",
  "J. Cabal": "Colombia",
  "A. Cambiaso": "Italy",
  "Danilo": "Brazil",
  "M. Locatelli": "Italy",
  "T. Koopmeiners": "Netherlands",
  "Douglas Luiz": "Brazil",
  "D. Luiz": "Brazil",
  "K. Thuram": "France",
  "W. McKennie": "USA",
  "N. Fagioli": "Italy",
  "K. Yıldız": "Turkey",
  "F. Conceição": "Portugal",
  "N. González": "Argentina",
  "T. Weah": "USA",
  "S. Mbangula": "Belgium",
  "D. Vlahović": "Serbia",
  "A. Milik": "Poland",

  // Napoli
  "A. Meret": "Italy",
  "A. Buongiorno": "Italy",
  "A. Rrahmani": "Kosovo",
  "Rafa Marín": "Spain",
  "Juan Jesus": "Brazil",
  "M. Olivera": "Uruguay",
  "L. Spinazzola": "Italy",
  "G. Di Lorenzo": "Italy",
  "P. Mazzocchi": "Italy",
  "S. Lobotka": "Slovakia",
  "F. Anguissa": "Cameroon",
  "S. McTominay": "Scotland",
  "B. Gilmour": "Scotland",
  "M. Folorunsho": "Italy",
  "K. Kvaratskhelia": "Georgia",
  "D. Neres": "Brazil",
  "M. Politano": "Italy",
  "C. Ngonge": "Belgium",
  "R. Lukaku": "Belgium",
  "G. Raspadori": "Italy",
  "G. Simeone": "Argentina",

  // Atalanta
  "M. Carnesecchi": "Italy",
  "R. Tolói": "Italy",
  "I. Hien": "Sweden",
  "B. Djimsiti": "Albania",
  "Sead Kolašinac": "Bosnia and Herzegovina",
  "S. Kolašinac": "Bosnia and Herzegovina",
  "G. Scalvini": "Italy",
  "O. Kossounou": "Ivory Coast",
  "R. Bellanova": "Italy",
  "M. Ruggeri": "Italy",
  "D. Zappacosta": "Italy",
  "Éderson": "Brazil",
  "M. de Roon": "Netherlands",
  "M. Pasalic": "Croatia",
  "L. Samardžić": "Serbia",
  "L. Brescianini": "Italy",
  "A. Lookman": "Nigeria",
  "C. De Ketelaere": "Belgium",
  "N. Zaniolo": "Italy",
  "M. Retegui": "Italy",
  "G. Scamacca": "Italy"
};

const SERIEA_POSITIONS = {
  // Inter
  "B. Pavard": "CB/RB",
  "F. Dimarco": "LB/LM",
  "D. Dumfries": "RB/RM",
  "M. Darmian": "RB/CB",
  "C. Augusto": "LB/CB",
  "T. Buchanan": "LM/RM",
  "H. Mkhitaryan": "CM/CAM",
  "H. Çalhanoğlu": "CDM/CM",
  "P. Zieliński": "CM/CAM",
  "K. Asllani": "CDM/CM",
  "M. Thuram": "ST/LW",

  // AC Milan
  "Theo Hernández": "LB/LM",
  "T. Hernández": "LB/LM",
  "F. Terracciano": "RB/LB",
  "T. Reijnders": "CM/CAM",
  "Tijjani Reijnders": "CM/CAM",
  "Y. Fofana": "CDM/CM",
  "R. Loftus-Cheek": "CAM/CM",
  "I. Bennacer": "CDM/CM",
  "Y. Musah": "CM/RM",
  "Rafael Leão": "LW/ST",
  "R. Leão": "LW/ST",
  "C. Pulisic": "RW/CAM",
  "N. Okafor": "LW/ST",

  // Juventus
  "P. Kalulu": "CB/RB",
  "J. Cabal": "LB/CB",
  "A. Cambiaso": "RB/LB",
  "Danilo": "CB/RB",
  "M. Locatelli": "CDM/CM",
  "T. Koopmeiners": "CAM/CM",
  "Douglas Luiz": "CM/CDM",
  "D. Luiz": "CM/CDM",
  "K. Thuram": "CM/CDM",
  "W. McKennie": "CM/RM",
  "K. Yıldız": "LW/CAM",
  "N. González": "RW/LW",
  "T. Weah": "RM/RW",

  // Napoli
  "L. Spinazzola": "LB/LM",
  "S. Lobotka": "CDM/CM",
  "F. Anguissa": "CM/CDM",
  "S. McTominay": "CM/CAM",
  "K. Kvaratskhelia": "LW/ST",
  "D. Neres": "RW/LW",
  "M. Politano": "RW/RM",
  "G. Raspadori": "ST/CAM",

  // Atalanta
  "D. Zappacosta": "RB/RM",
  "R. Bellanova": "RB/RM",
  "Éderson": "CM/CDM",
  "M. Pasalic": "CM/CAM",
  "C. De Ketelaere": "CAM/ST",
  "N. Zaniolo": "CAM/RW",
  "A. Lookman": "LW/ST"
};

function processSerieA() {
  const dir = path.join(__dirname, '..', 'data', 'players', 'active', 'serie-a');
  if (!fs.existsSync(dir)) return;

  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));

  let nationUpdated = 0;
  let posUpdated = 0;

  for (const file of files) {
    const filePath = path.join(dir, file);
    const squadObj = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    for (const p of squadObj.players) {
      // 1. Fill Nation
      if (SERIEA_NATIONS[p.name]) {
        p.nation = SERIEA_NATIONS[p.name];
        nationUpdated++;
      } else if (!p.nation || p.nation === 'Unknown') {
        p.nation = 'Italy'; // Default remaining Serie A players to Italy
        nationUpdated++;
      }

      // 2. Fill Secondary Multi-Position
      if (SERIEA_POSITIONS[p.name]) {
        p.position = SERIEA_POSITIONS[p.name];
        posUpdated++;
      }
    }

    fs.writeFileSync(filePath, JSON.stringify(squadObj, null, 2));
  }

  console.log(`\n🎉 Serie A Processing Complete!`);
  console.log(`   ✨ Nations updated: ${nationUpdated}`);
  console.log(`   ⚡ Multi-positions updated: ${posUpdated}`);
}

processSerieA();
