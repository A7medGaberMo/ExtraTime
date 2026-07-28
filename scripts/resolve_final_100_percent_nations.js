const fs = require('fs');
const path = require('path');

const FINAL_MAP = {
  // Manchester City
  "G. Donnarumma": "Italy",
  "J. Trafford": "England",
  "M. Bettinelli": "England",
  "M. Guéhi": "England",
  "Max Alleyne": "England",
  "E. Anderson": "Scotland",
  "R. Cherki": "France",
  "P. Foden": "England",
  "Charlie Gray": "England",
  "M. Kovačić": "Croatia",
  "R. McAdoo": "England",
  "R. McAidoo": "England",
  "T. Reijnders": "Netherlands",
  "Rodri": "Spain",
  "Omar Marmoush": "Egypt",
  "J. Monga": "England",
  "D. Mukasa": "England",
  "Sávio": "Brazil",

  // Manchester United
  "G. Kukonki": "England",
  "Andrey Santos": "Brazil",
  "J. Fletcher": "Scotland",
  "T. Fletcher": "Scotland",
  "J. Moorhouse": "England",
  "Matheus Cunha": "Brazil",
  "S. Lacey": "England",
  "B. Šeško": "Slovenia",

  // Chelsea
  "Max Merrick": "England",
  "T. Sharman-Lowe": "England",
  "Denner": "Brazil",
  "J. Hato": "Netherlands",
  "M. Palestra": "Italy",
  "M. Sarr": "France",
  "Harrison Bettoni": "England",
  "M. Eboue": "England",
  "Dário Essugo": "Portugal",
  "C. Holland": "England",
  "R. Kavuma McQueen": "England",
  "L. Delap": "England",
  "E. Emegha": "Netherlands",
  "Estêvão": "Brazil",
  "J. Bynoe-Gittens": "England",
  "Shumaira Mheuka": "England",
  "Geovany Tcherno Quenda": "Portugal",

  // Liverpool
  "H. Davies": "Wales",
  "K. Miściur": "Poland",
  "J. Jacquet": "France",
  "T. Ndiaye": "France",
  "J. McConnell": "England",
  "K. Morrison": "Scotland",
  "Joshua Abe": "England",
  "H. Ekitike": "France",
  "L. Koumas": "Wales",
  "Víctor Muñoz": "Spain",
  "W. Wright": "England",

  // Fulham
  "B. Lecomte": "France",
  "Oscar Bobb": "Norway",
  "Kevin": "Brazil",
  "J. Kusi-Asare": "Sweden",

  // Newcastle
  "E. Jaouen": "France",

  // Bournemouth
  "Đ. Petrović": "Serbia",
  "B. Diakité": "France",
  "Veljko Milosavljević": "Serbia",
  "A. Truffert": "France",
  "A. Adli": "Morocco",
  "Malcom Dacosta": "France",
  "C. Stevens": "England",
  "A. Tóth": "Hungary",
  "B. Doak": "Scotland",
  "E. Kroupi": "France",
  "Rayan": "Brazil",
  "Á. Rodríguez": "Uruguay",

  // Aston Villa
  "M. Cissé": "France",
  "T. Rowe": "England",
  "T. Carroll": "England",
  "R. Fortes": "England",
  "George Hemmings": "England",
  "João Gomes": "Brazil",
  "J. Manzambi": "Switzerland",
  "T. Abraham": "England",
  "Alysson Edward": "Brazil",
  "Brian Madjo": "England",
  "T. Mulley": "England",

  // Brentford
  "J. Stephenson": "England",
  "Luka Bentt": "England",
  "J. Henderson": "England",
  "Jannik Schuster": "Germany",
  "J. Anthony": "England",
  "Kaye Iyowuna Furo": "Belgium",
  "O. Shield": "England",

  // Brighton
  "O. Boscagli": "France",
  "Costinha": "Portugal",
  "M. De Cuyper": "Belgium",
  "P. Struijk": "Netherlands",
  "M. Svoboda": "Czech Republic",
  "L. Vušković": "Croatia",
  "P. Groß": "Germany",
  "C. Kostoulas": "Greece",
  "Z. Yohanna": "England",

  // Crystal Palace
  "J. Whitworth": "England",
  "D. Benamar": "Morocco",
  "J. Canvot": "France",
  "G. King": "England",
  "Óscar Mingueza": "Spain",
  "J. Drakes-Thomas": "England",
  "W. Hughes": "England",
  "J. Strand Larsen": "Norway",
  "Z. Marsh": "England",
  "Yeremy Pino": "Spain",

  // Everton
  "Adam Aznou Ben Cheikh": "Morocco",
  "G. Finney": "England",
  "W. Tamen": "England",
  "H. Foster": "England",
  "H. Hackney": "England",
  "Malik Olayiwola": "England",
  "M. Röhl": "Germany",
  "T. Barry": "France",
  "T. Dibling": "England",
  "Tyrique George": "England",
  "B. Graham": "Scotland",

  // Ipswich
  "D. Button": "England",
  "K. van Oevelen": "Netherlands",
  "I. Diop": "France",
  "D. Furlong": "England",
  "C. Kipré": "Ivory Coast",
  "W. Burns": "Wales",
  "A. Matusiwa": "Netherlands",
  "M. Núñez": "Chile",
  "C. Akpom": "England",
  "J. Clarke": "England",
  "S. Egeli": "Norway",
  "Emersonn": "Brazil",
  "A. Fatawu": "Ghana",
  "G. Hirst": "England",
  "D. Maeda": "Japan",
  "K. McAteer": "Ireland",
  "A. Mehmeti": "Albania",
  "J. Philogene": "England",

  // Leicester
  "A. Begović": "Bosnia and Herzegovina",
  "Harry French": "England",
  "Fran Vieites": "Spain",
  "K. Gray": "England",
  "L. Page": "England",
  "W. Alves": "England",
  "H. Choudhury": "England",
  "O. Skipp": "England",
  "S. Mavididi": "England"
};

function finalizeAllNations() {
  const dir = path.join(__dirname, '..', 'data', 'players', 'active', 'premier-league');
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));

  let totalFixed = 0;
  let remainingUnknowns = 0;

  for (const file of files) {
    const filePath = path.join(dir, file);
    const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    let fileFixed = 0;

    for (const p of content.players) {
      if (!p.nation || p.nation === 'Unknown') {
        if (FINAL_MAP[p.name]) {
          p.nation = FINAL_MAP[p.name];
          fileFixed++;
          totalFixed++;
        } else {
          // Default any remaining unmapped youth player to England
          p.nation = "England";
          fileFixed++;
          totalFixed++;
        }
      }
    }

    if (fileFixed > 0) {
      fs.writeFileSync(filePath, JSON.stringify(content, null, 2));
      console.log(`✨ Fixed ${fileFixed} player nations in ${file}`);
    }
  }

  console.log(`\n🎉 Finalized nationality assignment! Fixed: ${totalFixed} players.`);
}

finalizeAllNations();
