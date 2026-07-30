import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const plDir = path.join(__dirname, '..', 'data', 'players', 'active', 'premier-league');
const files = fs.readdirSync(plDir);

const tierMap = {
  // Liverpool
  "Alisson Becker": "MASTER",
  "F. Wirtz": "MASTER",
  "J. Frimpong": "ELITE",
  "G. Mamardashvili": "ELITE",
  "T. Nyoni": "SILVER",

  // Man City
  "G. Donnarumma": "MASTER",
  "T. Reijnders": "ELITE",
  "Sávio": "ELITE",
  "Omar Marmoush": "ELITE",
  "Charlie Gray": "SILVER",
  "R. McAidoo": "SILVER",
  "S. Mfuni": "SILVER",
  "J. Monga": "SILVER",
  "D. Mukasa": "SILVER",

  // Man United
  "B. Šeško": "ELITE_PLUS",
  "Y. Tielemans": "ELITE",
  "A. Heaven": "SILVER",
  "G. Kukonki": "SILVER",
  "J. Fletcher": "SILVER",
  "T. Fletcher": "SILVER",

  // Tottenham
  "M. van de Ven": "ELITE_PLUS",
  "J. Maddison": "ELITE_PLUS",
  "C. Gallagher": "ELITE",
  "R. Bentancur": "ELITE",
  "J. van Hecke": "ELITE",
  "K. Danso": "ELITE",
  "L. Bergvall": "GOLD",
  "Yang Min-Hyeok": "SILVER",
  "J. Donley": "SILVER",
  "D. Scarlett": "SILVER",
  "X. Simons": "SILVER",
  "W. Odobert": "GOLD",
  "M. Moore": "GOLD",

  // Aston Villa
  "E. Martínez": "ELITE_PLUS",
  "I. Maatsen": "ELITE",
  "L. Bailey": "ELITE",
  "Aidan Borland": "SILVER",
  "J. Jimoh": "SILVER",
  "J. Manzambi": "SILVER",

  // Brighton
  "F. Kadıoğlu": "ELITE",
  "M. Wieffer": "ELITE",
  "M. O'Riley": "ELITE",
  "K. Mitoma": "ELITE_PLUS",
  "G. Rutter": "ELITE",
  "H. Howell": "SILVER",
  "Z. Yohanna": "SILVER",

  // Newcastle
  "Joelinton": "ELITE_PLUS",
  "S. Botman": "ELITE",
  "M. Thiaw": "ELITE_PLUS",
  "J. Willock": "ELITE",
  "J. Murphy": "ELITE",
  "J. Ramsey": "ELITE",
  "Sean Steur": "SILVER",
  "Park Seung-Soo": "SILVER",
  "B. Touré": "SILVER",

  // Bournemouth
  "Đ. Petrović": "ELITE",
  "A. Scott": "ELITE",
  "L. Cook": "ELITE",
  "A. Adli": "ELITE",
  "T. Adams": "ELITE",
  "A. Truffert": "ELITE",
  "Veljko Milosavljević": "SILVER",
  "A. Tóth": "SILVER",

  // Brentford
  "C. Kelleher": "ELITE",
  "K. Ajer": "ELITE",
  "A. Hickey": "ELITE",
  "R. Henry": "ELITE",
  "S. van den Berg": "ELITE",
  "M. Damsgaard": "ELITE",
  "V. Janelt": "ELITE",
  "M. Jensen": "ELITE",
  "C. Wilson": "ELITE",
  "Jannik Schuster": "SILVER",

  // Crystal Palace
  "D. Henderson": "ELITE",
  "W. Benítez": "ELITE",
  "M. Lacroix": "ELITE",
  "Óscar Mingueza": "ELITE",
  "T. Mitchell": "ELITE",
  "A. Wharton": "ELITE_PLUS",
  "C. Doucouré": "ELITE",
  "D. Kamada": "ELITE",
  "Yeremy Pino": "ELITE",
  "E. Nketiah": "ELITE",
  "J. Strand Larsen": "ELITE",
  "J. Canvot": "SILVER",
  "Daniel Edward Peter Imray": "SILVER",
  "M. Jemide": "SILVER",

  // Everton
  "J. Pickford": "ELITE_PLUS",
  "J. Branthwaite": "ELITE_PLUS",
  "J. Tarkowski": "ELITE",
  "J. Garner": "ELITE",
  "Elijah Xavier Campbell": "SILVER",
  "Malik Olayiwola": "SILVER",
  "B. Graham": "SILVER",

  // Fulham
  "Oscar Bobb": "ELITE",
  "C. Bassey": "ELITE",
  "T. Castagne": "ELITE",
  "S. Amissah": "SILVER",
  "Joshua King": "SILVER",

  // Ipswich
  "J. Greaves": "ELITE",
  "D. O'Shea": "ELITE",
  "J. Philogene": "ELITE",
  "D. Maeda": "ELITE",
  "S. Boniface": "SILVER",
  "S. Egeli": "SILVER",
  "Emersonn": "SILVER",

  // Leicester
  "W. Faes": "ELITE",
  "V. Kristiansen": "ELITE",
  "A. Fatawu": "ELITE",
  "S. Mavididi": "ELITE",
  "Harry French": "SILVER",
  "L. Page": "SILVER",
  "T. Wilson-Brown": "SILVER",
  "S. Braybrooke": "SILVER",

  // Nottingham Forest
  "Murillo": "ELITE_PLUS",
  "M. Sels": "ELITE",
  "I. Sangaré": "ELITE",
  "Z. Abbott": "SILVER",
  "B. Hammond": "SILVER",
  "Jack Ethan Thompson": "SILVER",
  "G. McDonnell": "SILVER",
  "A. Whitehall": "SILVER",

  // Southampton
  "F. Downes": "ELITE",
  "T. Fellows": "ELITE",
  "T. Dobson-Ventura": "SILVER",
  "J. O'Brien-Whitmarsh": "SILVER",
  "M. Sesay": "SILVER",
  "B. Williams": "SILVER",

  // West Ham
  "A. Wan-Bissaka": "ELITE",
  "K. Walker-Peters": "ELITE",
  "T. Souček": "ELITE",
  "J. Ward-Prowse": "ELITE",
  "V. Castellanos": "ELITE",
  "K. Casey": "SILVER",
  "O. Scarles": "SILVER",
  "R. Battrum": "SILVER",
  "A. Golambeckis": "SILVER",
  "E. Mayers": "SILVER",
  "Junior Robinson": "SILVER",
  "P. Fearon": "SILVER",
  "K. Lamadrid": "SILVER",

  // Wolves
  "José Sá": "ELITE",
  "K. Trippier": "ELITE",
  "João Gomes": "ELITE",
  "S. Olagunju": "SILVER",
  "T. Edozie": "SILVER",
  "L. Rawlings": "SILVER"
};

files.forEach(file => {
  if (file === 'arsenal.json' || file === 'chelsea.json') return;
  const filePath = path.join(plDir, file);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  let modified = false;
  data.players.forEach(p => {
    if (tierMap[p.name]) {
      if (p.tier !== tierMap[p.name]) {
        console.log(`Updating ${p.name} in ${data.club.name}: ${p.tier} -> ${tierMap[p.name]}`);
        p.tier = tierMap[p.name];
        modified = true;
      }
    }
  });

  if (modified) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
  }
});

console.log('Tier updates complete!');
