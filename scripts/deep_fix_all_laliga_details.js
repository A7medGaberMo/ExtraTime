const fs = require('fs');
const path = require('path');

const ADDITIONAL_NATIONS = {
  // Barcelona
  "H. Abdelkarim": "Egypt",

  // Rayo Vallecano
  "E. Eto'o": "Cameroon",
  "J. Vertrouwd": "Netherlands",
  "P. Ciss": "Senegal",
  "R. Nteka": "France",

  // Villarreal
  "Y. Kinareykin": "Ukraine",
  "Willy Kambwala Ndengushi": "France",
  "A. Freeman": "England",
  "T. Oluwaseyi": "Canada",

  // Las Palmas
  "D. Horkaš": "Croatia",
  "A. Bassinga": "Ivory Coast",
  "Ãlvaro Killane": "Argentina",

  // Espanyol
  "Q. Hartman": "Netherlands",
  "C. Riedel": "Germany",
  "M. Dmitrović": "Serbia",

  // Getafe
  "Mady Macalou": "Mali",
  "Z. Tassounte": "Morocco",
  "J. Letáček": "Czech Republic",
  "S. Boselli": "Uruguay",

  // Athletic Club
  "E. Gift": "Nigeria",
  "A. Boiro": "Senegal",
  "Maroan Sannadi": "Morocco",

  // Celta Vigo
  "J. El Abdellaoui": "Norway",
  "B. Somuah": "Ghana",

  // Girona
  "L. Kourouma": "Guinea",
  "P. Ba": "Senegal",
  "V. Krapyvtsov": "Ukraine",
  "A. Andreev": "Bulgaria",

  // Leganes
  "D. Gueye": "Senegal",
  "A. Diawara": "Guinea",
  "Modou Ndiaye": "Senegal",
  "G. Siame": "Zambia",
  "S. Imigene": "France",
  "Z. Buurmeester": "Netherlands",
  "A. Gøthler": "Denmark",

  // Mallorca
  "A. Souhmahoro": "Ivory Coast",
  "I. Salhi": "Morocco",
  "Rareș Vlad": "Romania",

  // Osasuna
  "D. Stamatakis": "Greece",

  // Real Betis
  "C. De Roa": "Argentina",
  "G. Petit": "France",

  // Real Sociedad
  "J. Ochieng": "Kenya",

  // Sevilla
  "A. Sangante": "Senegal",

  // Valencia
  "A. Dieng": "Mali",

  // Valladolid
  "M. Jaouab": "Morocco",
  "M. Lachuer": "France",
  "A. Ndiaye": "Senegal",
  "Brain Chinedu": "Nigeria",
  "S. Jurić": "Croatia",
  "R. Duiven": "Netherlands",

  // Atletico Madrid
  "A. Puric": "Serbia"
};

const MISSING_KIT_NUMBERS = {
  "669869": 29, // Cala (Espanyol)
  "669800": 30, // Mady Macalou (Getafe)
  "669801": 31, // Aimar Dominguez (Las Palmas)
  "316519": 32, // F. Bernal (Real Betis)
  "47380": 3,   // Marc Cucurella (Real Madrid)
  "1145": 5,    // I. Konaté (Real Madrid)
  "636": 20     // Bernardo Silva (Real Madrid)
};

const dir = path.join(__dirname, '..', 'data', 'players', 'active', 'la-liga');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));

let nationChanges = 0;
let kitNumChanges = 0;

files.forEach(file => {
  const filePath = path.join(dir, file);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  data.players.forEach(p => {
    // 1. Nation fix
    if (ADDITIONAL_NATIONS[p.name] && p.nation !== ADDITIONAL_NATIONS[p.name]) {
      p.nation = ADDITIONAL_NATIONS[p.name];
      nationChanges++;
    }

    // 2. Kit number fix
    const apiIdStr = String(p.apiId);
    if (MISSING_KIT_NUMBERS[apiIdStr] && (!p.kitNumber || p.kitNumber === 0)) {
      p.kitNumber = MISSING_KIT_NUMBERS[apiIdStr];
      kitNumChanges++;
    }
  });

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
});

console.log(`Deep fix complete! Nation changes: ${nationChanges}, Kit number changes: ${kitNumChanges}`);
