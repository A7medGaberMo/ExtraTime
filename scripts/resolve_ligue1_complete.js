const fs = require('fs');
const path = require('path');

const LIGUE1_NATIONS = {
  // PSG
  "G. Donnarumma": "Italy",
  "M. Safonov": "Russia",
  "A. Tenas": "Spain",
  "Marquinhos": "Brazil",
  "W. Pacho": "Ecuador",
  "L. Beraldo": "Brazil",
  "M. Škriniar": "Slovakia",
  "P. Kimpembe": "France",
  "A. Hakimi": "Morocco",
  "Nuno Mendes": "Portugal",
  "L. Hernández": "France",
  "Vitinha": "Portugal",
  "João Neves": "Portugal",
  "W. Zaïre-Emery": "France",
  "F. Ruiz": "Spain",
  "K. Lee": "South Korea",
  "O. Dembélé": "France",
  "B. Barcola": "France",
  "D. Doué": "France",
  "M. Asensio": "Spain",
  "R. Kolo Muani": "France",
  "G. Ramos": "Portugal",

  // Monaco
  "R. Majecki": "Poland",
  "P. Köhn": "Switzerland",
  "T. Kehrer": "Germany",
  "W. Singo": "Ivory Coast",
  "M. Salisu": "Ghana",
  "C. Mawissa": "France",
  "V. Vanderson": "Brazil",
  "Caio Henrique": "Brazil",
  "D. Zakaria": "Switzerland",
  "L. Camara": "Senegal",
  "Y. Fofana": "France",
  "A. Golovin": "Russia",
  "M. Akliouche": "France",
  "E. Ben Seghir": "Morocco",
  "K. Diatta": "Senegal",
  "T. Minamino": "Japan",
  "F. Balogun": "USA",
  "B. Embolo": "Switzerland",
  "G. Ilenikhena": "France",

  // Marseille
  "G. Rulli": "Argentina",
  "J. de Lange": "Netherlands",
  "L. Balerdi": "Argentina",
  "D. Cornelius": "Canada",
  "C. Brassier": "France",
  "B. Meïté": "Ivory Coast",
  "M. Murillo": "Panama",
  "Q. Merlin": "France",
  "P. Højbjerg": "Denmark",
  "A. Rabiot": "France",
  "G. Kondogbia": "Central African Republic",
  "V. Rongier": "France",
  "I. Bennacer": "Algeria",
  "A. Harit": "Morocco",
  "M. Greenwood": "England",
  "L. Henrique": "Brazil",
  "J. Rowe": "England",
  "E. Wahi": "France",
  "N. Maupay": "France",

  // Lyon
  "L. Perri": "Brazil",
  "A. Lopes": "Portugal",
  "M. Niakhaté": "Senegal",
  "D. Caleta-Car": "Croatia",
  "N. Tagliafico": "Argentina",
  "A. Maitland-Niles": "England",
  "S. Kumbedi": "France",
  "N. Matic": "Serbia",
  "C. Tolisso": "France",
  "M. Caqueret": "France",
  "J. Veretout": "France",
  "T. Almada": "Argentina",
  "R. Cherki": "France",
  "Saïd Benrahma": "Algeria",
  "Malick Fofana": "Belgium",
  "E. Nuamah": "Ghana",
  "A. Lacazette": "France",
  "G. Mikautadze": "Georgia",
  "Gift Orban": "Nigeria"
};

const LIGUE1_POSITIONS = {
  // PSG
  "A. Hakimi": "RB/RM",
  "L. Hernández": "CB/LB",
  "Vitinha": "CM/CDM",
  "João Neves": "CM/CDM",
  "W. Zaïre-Emery": "CM/RB",
  "K. Lee": "RW/CAM",
  "O. Dembélé": "RW/LW",
  "B. Barcola": "LW/RW",
  "D. Doué": "LW/CAM",
  "M. Asensio": "RW/CAM",
  "R. Kolo Muani": "ST/RW",

  // Monaco
  "W. Singo": "CB/RB",
  "Caio Henrique": "LB/LM",
  "D. Zakaria": "CDM/CB",
  "A. Golovin": "CAM/LM",
  "M. Akliouche": "CAM/RW",
  "E. Ben Seghir": "LW/CAM",
  "T. Minamino": "CAM/ST",
  "F. Balogun": "ST/CF",

  // Marseille
  "P. Højbjerg": "CDM/CM",
  "A. Rabiot": "CM/CDM",
  "A. Harit": "CAM/LW",
  "M. Greenwood": "RW/ST",
  "L. Henrique": "RW/LW",
  "E. Wahi": "ST/CF",

  // Lyon
  "A. Maitland-Niles": "RB/CM",
  "C. Tolisso": "CM/CDM",
  "T. Almada": "CAM/LW",
  "R. Cherki": "CAM/RW",
  "Saïd Benrahma": "LW/CAM",
  "Malick Fofana": "LW/RW",
  "A. Lacazette": "ST/CF",
  "G. Mikautadze": "ST/CF"
};

function processLigue1() {
  const dir = path.join(__dirname, '..', 'data', 'players', 'active', 'ligue-1');
  if (!fs.existsSync(dir)) return;

  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));

  let nationUpdated = 0;
  let posUpdated = 0;

  for (const file of files) {
    const filePath = path.join(dir, file);
    const squadObj = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    for (const p of squadObj.players) {
      // 1. Fill Nation
      if (LIGUE1_NATIONS[p.name]) {
        p.nation = LIGUE1_NATIONS[p.name];
        nationUpdated++;
      } else if (!p.nation || p.nation === 'Unknown') {
        p.nation = 'France'; // Default remaining Ligue 1 players to France
        nationUpdated++;
      }

      // 2. Fill Secondary Multi-Position
      if (LIGUE1_POSITIONS[p.name]) {
        p.position = LIGUE1_POSITIONS[p.name];
        posUpdated++;
      }
    }

    fs.writeFileSync(filePath, JSON.stringify(squadObj, null, 2));
  }

  console.log(`\n🎉 Ligue 1 Processing Complete!`);
  console.log(`   ✨ Nations updated: ${nationUpdated}`);
  console.log(`   ⚡ Multi-positions updated: ${posUpdated}`);
}

processLigue1();
