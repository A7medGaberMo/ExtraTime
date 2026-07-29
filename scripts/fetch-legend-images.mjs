import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const legendsPath = path.join(__dirname, '../data/players/legends/legends.json');
const legends = JSON.parse(fs.readFileSync(legendsPath, 'utf8'));

// Specific Wikipedia article mapping overrides for famous legends to ensure 100% precision
const wikiOverrides = {
  'Pelé': 'Pelé',
  'Diego Maradona': 'Diego_Maradona',
  'Zinedine Zidane': 'Zinedine_Zidane',
  'Ronaldo Nazário': 'Ronaldo_(Brazilian_footballer)',
  'Ronaldinho': 'Ronaldinho',
  'Johan Cruyff': 'Johan_Cruyff',
  'Paolo Maldini': 'Paolo_Maldini',
  'Franz Beckenbauer': 'Franz_Beckenbauer',
  'Thierry Henry': 'Thierry_Henry',
  'Lev Yashin': 'Lev_Yashin',
  'Roberto Carlos': 'Roberto_Carlos_(footballer)',
  'Cafu': 'Cafu',
  'Andrés Iniesta': 'Andrés_Iniesta',
  'Xavi Hernández': 'Xavi',
  'Ferenc Puskás': 'Ferenc_Puskás',
  'George Best': 'George_Best',
  'Michel Platini': 'Michel_Platini',
  'Eusébio': 'Eusébio',
  'Ruud Gullit': 'Ruud_Gullit',
  'Bobby Charlton': 'Bobby_Charlton',
  'Marco van Basten': 'Marco_van_Basten',
  'Zico': 'Zico_(footballer)',
  'Romário': 'Romário',
  'Garrincha': 'Garrincha',
  'Franco Baresi': 'Franco_Baresi',
  'Lothar Matthäus': 'Lothar_Matthäus',
  'Roberto Baggio': 'Roberto_Baggio',
  'Iker Casillas': 'Iker_Casillas',
  'Gianluigi Buffon': 'Gianluigi_Buffon',
  'Javier Zanetti': 'Javier_Zanetti',
  'Luís Figo': 'Luís_Figo',
  'Carles Puyol': 'Carles_Puyol',
  'Fabio Cannavaro': 'Fabio_Cannavaro',
  'Alessandro Del Piero': 'Alessandro_Del_Piero',
  'Dennis Bergkamp': 'Dennis_Bergkamp',
  'Patrick Vieira': 'Patrick_Vieira',
  'Roy Keane': 'Roy_Keane',
  'Paul Scholes': 'Paul_Scholes',
  'Steven Gerrard': 'Steven_Gerrard',
  'Frank Lampard': 'Frank_Lampard',
  'Wayne Rooney': 'Wayne_Rooney',
  'Didier Drogba': 'Didier_Drogba',
  'Eric Cantona': 'Eric_Cantona',
  'Alan Shearer': 'Alan_Shearer',
  'Alessandro Nesta': 'Alessandro_Nesta',
  'Ryan Giggs': 'Ryan_Giggs',
  'Kaká': 'Kaká',
  'Rivaldo': 'Rivaldo',
  'Samuel Eto\'o': 'Samuel_Eto\'o',
  'Andriy Shevchenko': 'Andriy_Shevchenko',
  'Peter Schmeichel': 'Peter_Schmeichel',
  'Sócrates': 'Sócrates',
  'Hugo Sánchez': 'Hugo_Sánchez',
  'Hristo Stoichkov': 'Hristo_Stoichkov',
  'Michael Laudrup': 'Michael_Laudrup',
  'Pavel Nedvěd': 'Pavel_Nedvěd',
  'Clarence Seedorf': 'Clarence_Seedorf',
  'Andrea Pirlo': 'Andrea_Pirlo',
  'Philipp Lahm': 'Philipp_Lahm',
  'Bastian Schweinsteiger': 'Bastian_Schweinsteiger',
  'Sergio Agüero': 'Sergio_Agüero',
  'Vincent Kompany': 'Vincent_Kompany',
  'Nemanja Vidić': 'Nemanja_Vidić',
  'Rio Ferdinand': 'Rio_Ferdinand',
  'Ashley Cole': 'Ashley_Cole',
  'Petr Čech': 'Petr_Čech',
  'Xabi Alonso': 'Xabi_Alonso',
  'David Beckham': 'David_Beckham',
  'Gareth Bale': 'Gareth_Bale',
  'Franck Ribéry': 'Franck_Ribéry',
  'Arjen Robben': 'Arjen_Robben',
  'Toni Kroos': 'Toni_Kroos',
  'Zlatan Ibrahimović': 'Zlatan_Ibrahimović',
  'Eden Hazard': 'Eden_Hazard',
  'Giorgio Chiellini': 'Giorgio_Chiellini',
  'Cesc Fàbregas': 'Cesc_Fàbregas',
  'Mesut Özil': 'Mesut_Özil',
  'Gerard Piqué': 'Gerard_Piqué',
  'Marcelo': 'Marcelo_(footballer,_born_1988)',
  'David Silva': 'David_Silva',
  'Diego Godín': 'Diego_Godín',
  'Gonzalo Higuaín': 'Gonzalo_Higuaín',
  'Carlos Tevez': 'Carlos_Tevez',
  'Marek Hamšík': 'Marek_Hamšík',
  'Pepe': 'Pepe_(footballer,_born_1983)',
  'Leonardo Bonucci': 'Leonardo_Bonucci',
  'Claudio Bravo': 'Claudio_Bravo',
  'Jesús Navas': 'Jesús_Navas',
  'Mats Hummels': 'Mats_Hummels',
  'Keylor Navas': 'Keylor_Navas',
  'Olivier Giroud': 'Olivier_Giroud',
  'Ángel Di María': 'Ángel_Di_María',
  'Thiago Silva': 'Thiago_Silva',
  'Lukas Podolski': 'Lukas_Podolski',
  'Nani': 'Nani',
  'Marouane Fellaini': 'Marouane_Fellaini'
};

async function fetchWikiImage(playerName) {
  const wikiTitle = wikiOverrides[playerName] || playerName.replace(/\s+/g, '_');
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(wikiTitle)}`;
  
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'ExtraTimeLegendFetcher/1.0 (contact@extratime.app)'
      }
    });
    if (!res.ok) {
      console.warn(`[WARN] Failed response ${res.status} for ${playerName} (${wikiTitle})`);
      return null;
    }
    const data = await res.json();
    if (data.thumbnail && data.thumbnail.source) {
      // Use thumbnail or original image
      return data.originalimage?.source || data.thumbnail.source;
    } else {
      console.warn(`[WARN] No image found in Wikipedia summary for ${playerName}`);
    }
  } catch (err) {
    console.error(`[ERROR] Fetch error for ${playerName}:`, err.message);
  }
  return null;
}

async function main() {
  console.log(`Processing ${legends.length} legends...`);
  let updatedCount = 0;
  
  for (let i = 0; i < legends.length; i++) {
    const player = legends[i];
    console.log(`[${i + 1}/${legends.length}] Fetching Wikipedia image for ${player.name}...`);
    const imgUrl = await fetchWikiImage(player.name);
    
    if (imgUrl) {
      player.imageUrl = imgUrl;
      updatedCount++;
      console.log(`  └─ SUCCESS: ${imgUrl}`);
    } else {
      console.log(`  └─ FAILED to find image.`);
    }
    // Small delay to be polite to Wikipedia API
    await new Promise(r => setTimeout(r, 100));
  }
  
  fs.writeFileSync(legendsPath, JSON.stringify(legends, null, 2), 'utf8');
  console.log(`\nDONE! Successfully updated ${updatedCount}/${legends.length} legends in legends.json`);
}

main();
