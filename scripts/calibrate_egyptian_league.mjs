import fs from 'fs';
import path from 'path';

const dir = 'data/players/active/egyptian-premier-league';

function getTier(rating) {
  if (rating >= 91) return 'ULTIMATE';
  if (rating >= 86) return 'MASTER';
  if (rating >= 81) return 'ELITE';
  if (rating >= 74) return 'GOLD';
  if (rating >= 64) return 'SILVER';
  return 'BRONZE';
}

function cleanPosition(pos) {
  if (!pos) return 'CM';
  const p = pos.toUpperCase().trim();
  if (p === 'GOALKEEPER' || p === 'GK') return 'GK';
  if (p === 'DEFENDER' || p === 'CB') return 'CB';
  if (p === 'MIDFIELDER' || p === 'CM') return 'CM';
  if (p === 'ATTACKER' || p === 'ST') return 'ST';
  return p;
}

// Known players nationality and position overrides
const PLAYER_OVERRIDES = {
  // Al Ahly
  'Mohamed El Shenawy': { pos: 'GK', nation: 'Egypt', rating: 82 },
  'Mostafa Shobeir': { pos: 'GK', nation: 'Egypt', rating: 81 },
  'Emam Ashour': { pos: 'CM', nation: 'Egypt', rating: 83 },
  'Marwan Attia': { pos: 'CDM', nation: 'Egypt', rating: 82 },
  'A. Bencharki': { pos: 'LW', nation: 'Morocco', rating: 82 },
  'Y. Belammari': { pos: 'LB', nation: 'Morocco', rating: 77 },
  'S. Benjdida': { pos: 'ST', nation: 'Morocco', rating: 76 },
  'M. Bakrar': { pos: 'ST', nation: 'Algeria', rating: 76 },
  'Zizo': { pos: 'RW', nation: 'Egypt', rating: 83 },
  'Hussein El Shahat': { pos: 'LW', nation: 'Egypt', rating: 80 },
  'Akram Tawfik': { pos: 'RB', nation: 'Egypt', rating: 79 },
  'Mohamed Magdi Kafsha': { pos: 'CAM', nation: 'Egypt', rating: 79 },
  'Taher Mohamed': { pos: 'LW', nation: 'Egypt', rating: 78 },
  'Yasser Ibrahim': { pos: 'CB', nation: 'Egypt', rating: 78 },
  'Mohamed Hany': { pos: 'RB', nation: 'Egypt', rating: 78 },
  'Karim Fouad': { pos: 'RW', nation: 'Egypt', rating: 77 },
  'Omar El Saeey': { pos: 'CM', nation: 'Egypt', rating: 75 },
  'Ahmed Eid': { pos: 'RB', nation: 'Egypt', rating: 75 },
  'Amr El Gazar': { pos: 'CB', nation: 'Egypt', rating: 74 },
  'Karim El Debes': { pos: 'LB', nation: 'Egypt', rating: 74 },
  'Hamza Alaa': { pos: 'GK', nation: 'Egypt', rating: 74 },
  'Tawfik Mohamed': { pos: 'CB', nation: 'Egypt', rating: 71 },
  'Ali Mahmoud': { pos: 'CM', nation: 'Egypt', rating: 71 },

  // Zamalek
  'Mohamed Awad': { pos: 'GK', nation: 'Egypt', rating: 78 },
  'Mohamed Sobhi': { pos: 'GK', nation: 'Egypt', rating: 77 },
  'Al Mahdi Soliman': { pos: 'GK', nation: 'Egypt', rating: 75 },
  'M. Bentayg': { pos: 'LB', nation: 'Morocco', rating: 80 },
  'Ahmed Abou El Fotouh': { pos: 'LB', nation: 'Egypt', rating: 80 },
  'Mahmoud Hamdi El Wensh': { pos: 'CB', nation: 'Egypt', rating: 79 },
  'Abdalla El Said': { pos: 'CAM', nation: 'Egypt', rating: 81 },
  'Oday Dabbagh': { pos: 'ST', nation: 'Palestine', rating: 81 },
  'Omar Gaber': { pos: 'RB', nation: 'Egypt', rating: 77 },
  'Mohamed Shehata': { pos: 'CM', nation: 'Egypt', rating: 77 },
  'Juan Alvina': { pos: 'RW', nation: 'Brazil', rating: 77 },
  'C. Banza': { pos: 'ST', nation: 'Angola', rating: 76 },
  'Hossam Ashraf': { pos: 'ST', nation: 'Egypt', rating: 76 },
  'Naser Mansy': { pos: 'ST', nation: 'Egypt', rating: 76 },
  'M. Ismail': { pos: 'CB', nation: 'Egypt', rating: 76 },
  'Mostafa El Zenary': { pos: 'CB', nation: 'Egypt', rating: 75 },
  'Mahmoud Gehad': { pos: 'CM', nation: 'Egypt', rating: 73 },
  'M. El Sayed': { pos: 'CM', nation: 'Egypt', rating: 72 },
  'A. Rabie': { pos: 'CM', nation: 'Egypt', rating: 68 },

  // Pyramids
  'M. Chibi': { pos: 'RB', nation: 'Morocco', rating: 82 },
  'Walid El Karti': { pos: 'CM', nation: 'Morocco', rating: 80 },
  'Blati Touré': { pos: 'CDM', nation: 'Burkina Faso', rating: 81 },
  'Fiston Mayele': { pos: 'ST', nation: 'DR Congo', rating: 81 },
  'Ibrahim Adel': { pos: 'LW', nation: 'Egypt', rating: 81 },
  'Mostafa Fathi': { pos: 'RW', nation: 'Egypt', rating: 81 },
  'Ramadan Sobhi': { pos: 'LW', nation: 'Egypt', rating: 80 },
  'Ahmed El Shenawy': { pos: 'GK', nation: 'Egypt', rating: 79 },
  'Mohanad Lasheen': { pos: 'CDM', nation: 'Egypt', rating: 78 },
  'Osama Galal': { pos: 'CB', nation: 'Egypt', rating: 78 },
  'Fagrie Lakay': { pos: 'ST', nation: 'South Africa', rating: 78 },
  'Karim Hafez': { pos: 'LB', nation: 'Egypt', rating: 77 },
  'Ahmed Samy': { pos: 'CB', nation: 'Egypt', rating: 77 },
  'M. Gad': { pos: 'GK', nation: 'Egypt', rating: 76 },
  'Eyad El Askalany': { pos: 'CB', nation: 'Egypt', rating: 76 },
  'Mahmoud Zalaka': { pos: 'LW', nation: 'Egypt', rating: 76 },
  'O. Al Fakhouri': { pos: 'ST', nation: 'Jordan', rating: 71 },

  // Ceramica Cleopatra
  'A. Belhadji': { pos: 'CAM', nation: 'Morocco', rating: 79 },
  'John Ebuka': { pos: 'ST', nation: 'Nigeria', rating: 77 },
  'Mohamed Bassam': { pos: 'GK', nation: 'Egypt', rating: 77 },
  'Ahmed Ramadan Beckham': { pos: 'CB', nation: 'Egypt', rating: 76 },
  'Mohamed Shokry': { pos: 'LB', nation: 'Egypt', rating: 76 },
  'Justice Arthur': { pos: 'CDM', nation: 'Ghana', rating: 74 },

  // Other clubs foreign players & stars
  'Yaw Annor': { pos: 'RW', nation: 'Togo', rating: 76 },
  'Alpha Keita': { pos: 'CB', nation: 'Guinea', rating: 74 },
  'Serge Aka': { pos: 'CDM', nation: 'Ivory Coast', rating: 75 },
  'Arnold Eba': { pos: 'ST', nation: 'Cameroon', rating: 75 },
  'Jonathan Ngwem': { pos: 'LB', nation: 'Cameroon', rating: 75 },
  'Hadji Barry': { pos: 'ST', nation: 'Guinea', rating: 74 },
  'Fakhreddine Ben Youssef': { pos: 'ST', nation: 'Tunisia', rating: 76 },
  'Listowel Amankona': { pos: 'RW', nation: 'Ghana', rating: 72 },
  'Amadou Niass': { pos: 'ST', nation: 'Senegal', rating: 74 },
  'Eric Traoré': { pos: 'RW', nation: 'Burkina Faso', rating: 75 },
  'Boateng': { pos: 'ST', nation: 'Ghana', rating: 74 },
  'Moro Salifu': { pos: 'CDM', nation: 'Ghana', rating: 74 },
  'Mabululu': { pos: 'ST', nation: 'Angola', rating: 78 },
  'Junior Ajayi': { pos: 'LW', nation: 'Nigeria', rating: 75 },
  'Duku Dodzi': { pos: 'CDM', nation: 'Ghana', rating: 73 },
  'Abdellatif Benkassou': { pos: 'CB', nation: 'Morocco', rating: 74 },
  'Lahcen Dahbi': { pos: 'CM', nation: 'Morocco', rating: 74 },
  'Rafik Kabou': { pos: 'RW', nation: 'Tunisia', rating: 75 },
  'H. Souissi': { pos: 'CM', nation: 'Tunisia', rating: 74 },
  'I. Ouro-Agoro': { pos: 'ST', nation: 'Togo', rating: 74 },
  'K. Agbo': { pos: 'ST', nation: 'Togo', rating: 68 },
  'K. Komlavi': { pos: 'ST', nation: 'Togo', rating: 68 },
  'W. Benbella': { pos: 'CM', nation: 'Morocco', rating: 68 },
  'Babacar Ndiaye': { pos: 'CB', nation: 'Senegal', rating: 74 },
  'Seif Thierry': { pos: 'ST', nation: 'Sudan', rating: 74 },
  'Zahir Naanaa': { pos: 'CM', nation: 'Algeria', rating: 72 },
  'Arnaud Randrianantenaina': { pos: 'ST', nation: 'Madagascar', rating: 74 },
  'Lucky Emmanuel': { pos: 'CM', nation: 'Nigeria', rating: 72 },
  'Abderrahim Deghmoum': { pos: 'LW', nation: 'Algeria', rating: 76 },
  'Mohamed Ali Ben Hammouda': { pos: 'ST', nation: 'Tunisia', rating: 74 },
  'Bamba': { pos: 'ST', nation: 'Ivory Coast', rating: 74 },
  'Tsvetan Tsvetanov': { pos: 'CB', nation: 'Bulgaria', rating: 72 },
  'A. Keita': { pos: 'CB', nation: 'Guinea', rating: 72 },
  'M. Magassa': { pos: 'CM', nation: 'Mali', rating: 72 },
  'S. Bah': { pos: 'ST', nation: 'Sierra Leone', rating: 71 },
  'Marwane Hajij': { pos: 'CM', nation: 'Morocco', rating: 74 },
  'Rasheed Ahmed': { pos: 'ST', nation: 'Nigeria', rating: 74 },
};

const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));

let totalFixed = 0;

for (const file of files) {
  const filePath = path.join(dir, file);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

  const updatedPlayers = data.players.map(p => {
    let name = p.name;
    let pos = cleanPosition(p.position);
    let nation = p.nation || 'Egypt';
    let rating = p.rating;

    // Apply known overrides
    if (PLAYER_OVERRIDES[name]) {
      const ov = PLAYER_OVERRIDES[name];
      if (ov.pos) pos = ov.pos;
      if (ov.nation) nation = ov.nation;
      if (ov.rating && !p._userLocked) rating = ov.rating;
    }

    // Strict tier calculation to prevent ANY mismatch
    let tier = getTier(rating);

    // If user edited rating but had tier mismatch, fix tier to match rating:
    // e.g. rating 81 -> ELITE, rating 73 -> SILVER, rating 66 -> SILVER
    tier = getTier(rating);

    totalFixed++;
    return {
      ...p,
      name,
      position: pos,
      nation,
      rating,
      tier,
    };
  });

  data.players = updatedPlayers;
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`✓ ${file.padEnd(30)}: ${updatedPlayers.length} players calibrated.`);
}

console.log(`\nDone! Processed ${totalFixed} players.`);
