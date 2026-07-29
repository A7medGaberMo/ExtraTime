const fs = require('fs');
const path = require('path');

const BUNDESLIGA_NATIONS = {
  // Bayern Munich
  "Manuel Neuer": "Germany",
  "M. Neuer": "Germany",
  "Sven Ulreich": "Germany",
  "S. Ulreich": "Germany",
  "D. Peretz": "Israel",
  "D. Upamecano": "France",
  "Min-Jae Kim": "South Korea",
  "M. Kim": "South Korea",
  "H. Ito": "Japan",
  "E. Dier": "England",
  "A. Davies": "Canada",
  "Alphonso Davies": "Canada",
  "R. Guerreiro": "Portugal",
  "S. Boey": "France",
  "J. Stanišić": "Croatia",
  "J. Kimmich": "Germany",
  "Joshua Kimmich": "Germany",
  "L. Goretzka": "Germany",
  "A. Pavlović": "Germany",
  "K. Laimer": "Austria",
  "J. Musiala": "Germany",
  "Jamal Musiala": "Germany",
  "T. Müller": "Germany",
  "Thomas Müller": "Germany",
  "M. Olise": "France",
  "L. Sané": "Germany",
  "K. Coman": "France",
  "S. Gnabry": "Germany",
  "H. Kane": "England",
  "Harry Kane": "England",
  "M. Tel": "France",

  // Borussia Dortmund
  "G. Kobel": "Switzerland",
  "A. Meyer": "Germany",
  "N. Schlotterbeck": "Germany",
  "N. Süle": "Germany",
  "W. Anton": "Germany",
  "R. Bensebaini": "Algeria",
  "J. Ryerson": "Norway",
  "Yan Couto": "Brazil",
  "E. Can": "Germany",
  "Emre Can": "Germany",
  "P. Groß": "Germany",
  "M. Sabitzer": "Austria",
  "F. Nmecha": "Germany",
  "J. Brandt": "Germany",
  "Julian Brandt": "Germany",
  "G. Reyna": "USA",
  "K. Adeyemi": "Germany",
  "J. Gittens": "England",
  "D. Malen": "Netherlands",
  "S. Guirassy": "Guinea",
  "M. Beier": "Germany",

  // Bayer Leverkusen
  "L. Hradecky": "Finland",
  "M. Kovar": "Czech Republic",
  "J. Tah": "Germany",
  "Jonathan Tah": "Germany",
  "E. Tapsoba": "Burkina Faso",
  "P. Hincapié": "Ecuador",
  "J. Belocian": "France",
  "Á. Grimaldo": "Spain",
  "J. Frimpong": "Netherlands",
  "Jeremie Frimpong": "Netherlands",
  "Arthur": "Brazil",
  "G. Xhaka": "Switzerland",
  "Granit Xhaka": "Switzerland",
  "R. Andrich": "Germany",
  "E. Palacios": "Argentina",
  "Aleix García": "Spain",
  "F. Wirtz": "Germany",
  "Florian Wirtz": "Germany",
  "J. Hofmann": "Germany",
  "A. Adli": "Morocco",
  "M. Terrier": "France",
  "V. Boniface": "Nigeria",
  "P. Schick": "Czech Republic",

  // RB Leipzig
  "P. Gulácsi": "Hungary",
  "M. Vandevoordt": "Belgium",
  "W. Orbán": "Hungary",
  "C. Lukeba": "France",
  "L. Geertruida": "Netherlands",
  "E. Bitshiabu": "France",
  "D. Raum": "Germany",
  "B. Henrichs": "Germany",
  "X. Schlager": "Austria",
  "A. Haidara": "Mali",
  "K. Kampl": "Slovenia",
  "A. Vermeeren": "Belgium",
  "X. Simons": "Netherlands",
  "Xavi Simons": "Netherlands",
  "C. Baumgartner": "Austria",
  "E. Elmas": "North Macedonia",
  "L. Openda": "Belgium",
  "B. Šeško": "Slovenia",
  "Y. Poulsen": "Denmark"
};

const BUNDESLIGA_POSITIONS = {
  // Bayern Munich
  "H. Ito": "CB/LB",
  "E. Dier": "CB/CDM",
  "R. Guerreiro": "LB/CM",
  "J. Stanišić": "RB/CB",
  "J. Kimmich": "CDM/RB",
  "Joshua Kimmich": "CDM/RB",
  "L. Goretzka": "CM/CDM",
  "A. Pavlović": "CDM/CM",
  "K. Laimer": "CM/RB",
  "J. Musiala": "CAM/LW",
  "Jamal Musiala": "CAM/LW",
  "T. Müller": "CAM/ST",
  "Thomas Müller": "CAM/ST",
  "M. Olise": "RW/CAM",
  "L. Sané": "RW/LW",
  "K. Coman": "LW/RW",
  "S. Gnabry": "LW/RW",
  "M. Tel": "ST/LW",

  // Borussia Dortmund
  "N. Süle": "CB/RB",
  "J. Ryerson": "RB/LB",
  "Yan Couto": "RB/RM",
  "E. Can": "CDM/CB",
  "Emre Can": "CDM/CB",
  "P. Groß": "CM/CDM",
  "M. Sabitzer": "CM/CAM",
  "J. Brandt": "CAM/CM",
  "Julian Brandt": "CAM/CM",
  "G. Reyna": "CAM/RW",
  "K. Adeyemi": "LW/RW",
  "J. Gittens": "LW/RW",
  "D. Malen": "RW/ST",
  "M. Beier": "ST/LW",

  // Bayer Leverkusen
  "P. Hincapié": "CB/LB",
  "J. Belocian": "CB/LB",
  "Á. Grimaldo": "LB/LM",
  "J. Frimpong": "RB/RM",
  "Jeremie Frimpong": "RB/RM",
  "G. Xhaka": "CDM/CM",
  "Granit Xhaka": "CDM/CM",
  "R. Andrich": "CDM/CB",
  "Aleix García": "CM/CDM",
  "F. Wirtz": "CAM/LW",
  "Florian Wirtz": "CAM/LW",
  "J. Hofmann": "CAM/RW",
  "A. Adli": "LW/ST",
  "M. Terrier": "LW/ST",

  // RB Leipzig
  "L. Geertruida": "RB/CB",
  "D. Raum": "LB/LM",
  "B. Henrichs": "RB/LB",
  "X. Simons": "CAM/RW",
  "Xavi Simons": "CAM/RW",
  "C. Baumgartner": "CAM/CM",
  "E. Elmas": "CAM/LW",
  "L. Openda": "ST/LW"
};

function processBundesliga() {
  const dir = path.join(__dirname, '..', 'data', 'players', 'active', 'bundesliga');
  if (!fs.existsSync(dir)) return;

  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));

  let nationUpdated = 0;
  let posUpdated = 0;

  for (const file of files) {
    const filePath = path.join(dir, file);
    const squadObj = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    for (const p of squadObj.players) {
      // 1. Fill Nation
      if (BUNDESLIGA_NATIONS[p.name]) {
        p.nation = BUNDESLIGA_NATIONS[p.name];
        nationUpdated++;
      } else if (!p.nation || p.nation === 'Unknown') {
        p.nation = 'Germany'; // Default remaining Bundesliga players to Germany
        nationUpdated++;
      }

      // 2. Fill Secondary Multi-Position
      if (BUNDESLIGA_POSITIONS[p.name]) {
        p.position = BUNDESLIGA_POSITIONS[p.name];
        posUpdated++;
      }
    }

    fs.writeFileSync(filePath, JSON.stringify(squadObj, null, 2));
  }

  console.log(`\n🎉 Bundesliga Processing Complete!`);
  console.log(`   ✨ Nations updated: ${nationUpdated}`);
  console.log(`   ⚡ Multi-positions updated: ${posUpdated}`);
}

processBundesliga();
