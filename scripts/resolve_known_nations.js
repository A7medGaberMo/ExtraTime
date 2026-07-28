const fs = require('fs');
const path = require('path');

// Common Premier League & transferred player nationality mappings
const NATION_LOOKUP = {
  // Arsenal
  "I. Meslier": "France",
  "J. Porter": "England",
  "K. Ranson": "England",
  "P. Hincapié": "Ecuador",
  "Cristhian Mosquera": "Spain",
  "Jaden Dixon": "England",
  "M. Salmon": "England",
  "E. Eze": "England",
  "Martín Zubimendi": "Spain",
  "C. Nørgaard": "Denmark",
  "I. Ibrahim": "England",
  "M. Dowman": "England",
  "V. Gyökeres": "Sweden",
  "N. Madueke": "England",
  "Gabriel Martinelli": "Brazil",
  "A. Annous": "England",
  "C. Tzolis": "Greece",
  "B. Bailey-Joseph": "England",

  // Aston Villa
  "J. Gauci": "Australia",
  "R. Olsen": "Sweden",
  "S. Proctor": "England",
  "L. Bogarde": "Netherlands",
  "K. Hause": "England",
  "I. Maatsen": "Netherlands",
  "T. Mings": "England",
  "E. Konsa": "England",
  "P. Torres": "Spain",
  "K. Kosta": "England",
  "L. Bailey": "Jamaica",
  "E. Buendía": "Argentina",
  "R. Barkley": "England",
  "J. McGinn": "Scotland",
  "Y. Tielemans": "Belgium",
  "A. Onana": "Belgium",
  "J. Ramsey": "England",
  "M. Rogers": "England",
  "O. Watkins": "England",
  "J. Duran": "Colombia",

  // Bournemouth
  "W. Dennis": "England",
  "D. Huijsen": "Spain",
  "J. Araujo": "Mexico",
  "I. Zabarnyi": "Ukraine",
  "M. Senesi": "Argentina",
  "M. Kerkez": "Hungary",
  "A. Smith": "England",
  "J. Hill": "England",
  "M. Aarons": "England",
  "T. Adams": "USA",
  "L. Cook": "England",
  "R. Christie": "Scotland",
  "A. Scott": "England",
  "P. Billing": "Denmark",
  "Marcus Tavernier": "England",
  "J. Kluivert": "Netherlands",
  "A. Semenyo": "Ghana",
  "E. Unal": "Turkey",
  "D. Ouattara": "Burkina Faso",

  // Brentford
  "H. Valdimarsson": "Iceland",
  "L. Ji-Soo": "South Korea",
  "S. van den Berg": "Netherlands",
  "E. Pinnock": "Jamaica",
  "N. Collins": "Ireland",
  "K. Ajer": "Norway",
  "R. Henry": "England",
  "A. Hickey": "Scotland",
  "M. Roerslev": "Denmark",
  "C. Nørgaard": "Denmark",
  "M. Jensen": "Denmark",
  "V. Janelt": "Germany",
  "Y. Konak": "Turkey",
  "F. Carvalho": "Portugal",
  "M. Damsgaard": "Denmark",
  "B. Mbeumo": "Cameroon",
  "Y. Wissa": "DR Congo",
  "I. Thiago": "Brazil",
  "K. Schade": "Germany",

  // Brighton
  "J. Steele": "England",
  "C. Rushworth": "England",
  "I. Igor": "Brazil",
  "J. van Hecke": "Netherlands",
  "A. Webster": "England",
  "T. Lamptey": "Ghana",
  "P. Estupiñán": "Ecuador",
  "F. Kadioglu": "Turkey",
  "M. Wieffer": "Netherlands",
  "Y. Ayari": "Sweden",
  "C. Baleba": "Cameroon",
  "J. Moder": "Poland",
  "J. Enciso": "Paraguay",
  "G. Rutter": "France",
  "Y. Minteh": "Gambia",
  "S. Adingra": "Ivory Coast",
  "E. Ferguson": "Ireland",
  "Joao Pedro": "Brazil",
  "D. Welbeck": "England",

  // Chelsea
  "F. Jørgensen": "Denmark",
  "M. Penders": "Belgium",
  "L. Colwill": "England",
  "B. Badiashile": "France",
  "A. Disasi": "France",
  "T. Adarabioyo": "England",
  "W. Fofana": "France",
  "M. Cucurella": "Spain",
  "B. Chilwell": "England",
  "R. James": "England",
  "M. Gusto": "France",
  "R. Lavia": "Belgium",
  "M. Caicedo": "Ecuador",
  "E. Fernández": "Argentina",
  "K. Dewsbury-Hall": "England",
  "C. Palmer": "England",
  "P. Neto": "Portugal",
  "N. Madueke": "England",
  "J. Félix": "Portugal",
  "J. Sancho": "England",
  "M. Mudryk": "Ukraine",
  "N. Jackson": "Senegal",
  "C. Nkunku": "France",

  // Liverpool
  "V. Jaros": "Czech Republic",
  "C. Kelleher": "Ireland",
  "I. Konaté": "France",
  "J. Quansah": "England",
  "J. Gomez": "England",
  "A. Robertson": "Scotland",
  "K. Tsimikas": "Greece",
  "C. Bradley": "Northern Ireland",
  "W. Endo": "Japan",
  "R. Gravenberch": "Netherlands",
  "A. Mac Allister": "Argentina",
  "D. Szoboszlai": "Hungary",
  "C. Jones": "England",
  "H. Elliott": "England",
  "F. Chiesa": "Italy",
  "C. Gakpo": "Netherlands",
  "L. Díaz": "Colombia",
  "D. Núñez": "Uruguay",
  "Diogo Jota": "Portugal",

  // Manchester City
  "S. Ortega": "Germany",
  "N. Athanasiou": "Greece",
  "N. Aké": "Netherlands",
  "M. Akanji": "Switzerland",
  "Rúben Dias": "Portugal",
  "J. Gvardiol": "Croatia",
  "J. Stones": "England",
  "R. Lewis": "England",
  "M. Kovacic": "Croatia",
  "Matheus Nunes": "Portugal",
  "B. Silva": "Portugal",
  "J. McAtee": "England",
  "Savinho": "Brazil",
  "J. Doku": "Belgium",
  "O. Bobb": "Norway",
  "E. Haaland": "Norway",

  // Manchester United
  "A. Bayındır": "Turkey",
  "K. Darlow": "England",
  "S. Lammens": "Belgium",
  "P. Dorgu": "Denmark",
  "L. Yoro": "France",
  "M. de Ligt": "Netherlands",
  "L. Martínez": "Argentina",
  "H. Maguire": "England",
  "V. Lindelöf": "Sweden",
  "J. Evans": "Northern Ireland",
  "N. Mazraoui": "Morocco",
  "T. Malacia": "Netherlands",
  "L. Shaw": "England",
  "M. Ugarte": "Uruguay",
  "Casemiro": "Brazil",
  "K. Mainoo": "England",
  "C. Eriksen": "Denmark",
  "Mason Mount": "England",
  "Bruno Fernandes": "Portugal",
  "A. Diallo": "Ivory Coast",
  "Antony": "Brazil",
  "A. Garnacho": "Argentina",
  "M. Rashford": "England",
  "R. Højlund": "Denmark",
  "J. Zirkzee": "Netherlands",

  // Newcastle
  "O. Vlachodimos": "Greece",
  "M. Gillespie": "Northern Ireland",
  "L. Hall": "England",
  "S. Botman": "Netherlands",
  "L. Kelly": "England",
  "F. Schär": "Switzerland",
  "J. Lascelles": "England",
  "E. Krafth": "Sweden",
  "T. Livramento": "England",
  "S. Longstaff": "England",
  "J. Willock": "England",
  "L. Miley": "England",
  "Bruno Guimarães": "Brazil",
  "Joelinton": "Brazil",
  "S. Tonali": "Italy",
  "J. Murphy": "England",
  "M. Almirón": "Paraguay",
  "H. Barnes": "England",
  "A. Gordon": "England",
  "A. Isak": "Sweden",
  "C. Wilson": "England",
  "W. Osula": "Denmark",

  // Tottenham
  "F. Forster": "England",
  "A. Phillips": "England",
  "R. Drăgușin": "Romania",
  "M. van de Ven": "Netherlands",
  "C. Romero": "Argentina",
  "B. Davies": "Wales",
  "D. Udogie": "Italy",
  "S. Reguilón": "Spain",
  "P. Porro": "Spain",
  "D. Spence": "England",
  "A. Gray": "England",
  "L. Bergvall": "Sweden",
  "P. Sarr": "Senegal",
  "Y. Bissouma": "Mali",
  "R. Bentancur": "Uruguay",
  "J. Maddison": "England",
  "D. Kulusevski": "Sweden",
  "B. Johnson": "Wales",
  "W. Odobert": "France",
  "T. Werner": "Germany",
  "Son Heung-Min": "South Korea",
  "Richarlison": "Brazil",
  "D. Solanke": "England"
};

function fillNations() {
  const dir = path.join(__dirname, '..', 'data', 'players', 'active', 'premier-league');
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));

  let totalUpdated = 0;

  for (const file of files) {
    const filePath = path.join(dir, file);
    const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    let updatedInFile = 0;

    for (const p of content.players) {
      if ((!p.nation || p.nation === 'Unknown') && NATION_LOOKUP[p.name]) {
        p.nation = NATION_LOOKUP[p.name];
        updatedInFile++;
        totalUpdated++;
      }
    }

    if (updatedInFile > 0) {
      fs.writeFileSync(filePath, JSON.stringify(content, null, 2));
      console.log(`Updated ${updatedInFile} player nations in ${file}`);
    }
  }

  console.log(`\n🎉 Total nations resolved via lookup: ${totalUpdated}`);
}

fillNations();
