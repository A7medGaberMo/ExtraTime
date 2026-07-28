const fs = require('fs');
const path = require('path');

const MULTI_POSITION_MAP = {
  // Arsenal
  "B. Saka": "RW/ST",
  "Gabriel Martinelli": "LW/ST",
  "K. Havertz": "ST/CAM",
  "Gabriel Jesus": "ST/RW",
  "E. Eze": "CAM/LW",
  "J. Timber": "CB/RB",
  "B. White": "RB/CB",
  "R. Calafiori": "LB/CB",
  "P. Hincapié": "CB/LB",
  "Mikel Merino": "CM/CDM",
  "D. Rice": "CDM/CM",
  "Martín Zubimendi": "CDM/CM",

  // Manchester City
  "Phil Foden": "CAM/RW",
  "P. Foden": "CAM/RW",
  "J. Gvardiol": "LB/CB",
  "N. Aké": "CB/LB",
  "J. Stones": "CB/CDM",
  "R. Lewis": "RB/CDM",
  "B. Silva": "RW/CM",
  "J. Doku": "LW/RW",
  "Savinho": "RW/LW",
  "Sávio": "RW/LW",
  "Omar Marmoush": "ST/LW",
  "R. Cherki": "CAM/RW",
  "Rodri": "CDM/CM",
  "M. Kovačić": "CM/CDM",

  // Liverpool
  "Mohamed Salah": "RW/ST",
  "L. Díaz": "LW/RW",
  "C. Gakpo": "LW/ST",
  "Diogo Jota": "ST/LW",
  "D. Szoboszlai": "CAM/CM",
  "A. Mac Allister": "CM/CDM",
  "Trent Alexander-Arnold": "RB/CM",
  "J. Gomez": "CB/RB",
  "C. Bradley": "RB/RM",
  "R. Gravenberch": "CDM/CM",
  "W. Endo": "CDM/CM",

  // Manchester United
  "M. Rashford": "LW/ST",
  "A. Garnacho": "LW/RW",
  "Bruno Fernandes": "CAM/CM",
  "Mason Mount": "CAM/CM",
  "Casemiro": "CDM/CM",
  "M. Ugarte": "CDM/CM",
  "Diogo Dalot": "RB/LB",
  "N. Mazraoui": "RB/LB",
  "L. Martínez": "CB/LB",
  "J. Zirkzee": "ST/CAM",
  "A. Diallo": "RW/CAM",
  "Antony": "RW/RM",

  // Chelsea
  "C. Palmer": "RW/CAM",
  "N. Jackson": "ST/LW",
  "C. Nkunku": "ST/CAM",
  "J. Félix": "ST/CAM",
  "P. Neto": "RW/LW",
  "N. Madueke": "RW/LW",
  "M. Gusto": "RB/LB",
  "M. Cucurella": "LB/CB",
  "E. Fernández": "CM/CDM",
  "M. Caicedo": "CDM/CM",
  "R. Lavia": "CDM/CM",

  // Tottenham
  "Son Heung-Min": "LW/ST",
  "D. Kulusevski": "RW/CAM",
  "B. Johnson": "RW/ST",
  "T. Werner": "LW/ST",
  "Richarlison": "ST/LW",
  "P. Porro": "RB/RW",
  "A. Gray": "CB/CDM",
  "J. Maddison": "CAM/CM",
  "P. Sarr": "CM/CDM",
  "Y. Bissouma": "CDM/CM",

  // Aston Villa
  "O. Watkins": "ST/LW",
  "L. Bailey": "RW/RM",
  "E. Buendía": "CAM/RW",
  "M. Rogers": "CAM/LW",
  "J. Duran": "ST/CF",
  "I. Maatsen": "LB/LM",
  "E. Konsa": "CB/RB",
  "Y. Tielemans": "CM/CDM",
  "A. Onana": "CDM/CM",

  // Newcastle
  "A. Isak": "ST/LW",
  "A. Gordon": "LW/RW",
  "H. Barnes": "LW/RW",
  "M. Almirón": "RW/CAM",
  "T. Livramento": "RB/LB",
  "F. Schär": "CB/CDM",
  "Joelinton": "CM/LW",
  "S. Tonali": "CM/CDM",
  "Bruno Guimarães": "CDM/CM",
  "A. Elanga": "RW/LW",

  // Brighton
  "Joao Pedro": "ST/CAM",
  "G. Rutter": "ST/CAM",
  "K. Mitoma": "LW/LM",
  "Y. Minteh": "RW/RM",
  "S. Adingra": "LW/RW",
  "P. Estupiñán": "LB/LM",
  "F. Kadioglu": "LB/RB",
  "C. Baleba": "CDM/CM",
  "M. Wieffer": "CDM/CM",

  // West Ham
  "Mohammed Kudus": "RW/CAM",
  "J. Bowen": "RW/ST",
  "C. Summerville": "LW/RW",
  "L. Paquetá": "CAM/CM",
  "E. Alvarez": "CDM/CB",
  "A. Wan-Bissaka": "RB/CB",
  "K. Walker-Peters": "RB/LB",

  // Everton
  "J. Harrison": "RW/RM",
  "D. McNeil": "LW/LM",
  "J. Lindstrøm": "RW/CAM",
  "I. Ndiaye": "ST/CAM",
  "J. Garner": "CM/RB",

  // Fulham
  "A. Iwobi": "CM/LM",
  "Andreas Pereira": "CAM/CM",
  "E. Smith Rowe": "CAM/LW",
  "H. Wilson": "RW/CAM",
  "Adama Traoré": "RW/RM",
  "Reiss Nelson": "RW/LW",

  // Bournemouth
  "J. Kluivert": "LW/CAM",
  "A. Semenyo": "RW/ST",
  "Marcus Tavernier": "LM/CAM",
  "T. Adams": "CDM/CM",
  "M. Kerkez": "LB/LM",

  // Brentford
  "B. Mbeumo": "RW/ST",
  "Y. Wissa": "ST/LW",
  "K. Schade": "LW/ST",
  "F. Carvalho": "CAM/LW",
  "K. Ajer": "CB/RB",

  // Crystal Palace
  "Daichi Kamada": "CAM/CM",
  "Ismaïla Sarr": "RW/ST",
  "Eddie Nketiah": "ST/CF",
  "D. Muñoz": "RB/RM",
  "A. Wharton": "CM/CDM",

  // Leicester
  "Stephy Mavididi": "LW/ST",
  "Abdul Fatawu": "RW/RM",
  "A. Fatawu": "RW/RM",
  "Facundo Buonanotte": "CAM/RW",
  "B. El Khannouss": "CAM/CM",
  "W. Ndidi": "CDM/CM",

  // Ipswich
  "S. Szmodics": "CAM/LW",
  "O. Hutchinson": "RW/CAM",
  "Chiedozie Ogbene": "RW/RM",
  "Liam Delap": "ST/CF",
  "L. Delap": "ST/CF"
};

function updateMultiPositions() {
  const dir = path.join(__dirname, '..', 'data', 'players', 'active', 'premier-league');
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));

  let totalUpdated = 0;

  for (const file of files) {
    const filePath = path.join(dir, file);
    const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    let updatedInFile = 0;

    for (const p of content.players) {
      if (MULTI_POSITION_MAP[p.name]) {
        p.position = MULTI_POSITION_MAP[p.name];
        updatedInFile++;
        totalUpdated++;
      }
    }

    if (updatedInFile > 0) {
      fs.writeFileSync(filePath, JSON.stringify(content, null, 2));
      console.log(`⚡ Updated multi-positions for ${updatedInFile} players in ${file}`);
    }
  }

  console.log(`\n🎉 Total players updated with secondary positions: ${totalUpdated}`);
}

updateMultiPositions();
