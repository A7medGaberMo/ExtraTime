import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const iconsPath = path.join(ROOT, 'data/players/legends/icons.json');
const heroesPath = path.join(ROOT, 'data/players/legends/heroes.json');
const legendsPath = path.join(ROOT, 'data/players/legends/legends.json');

// Custom Wikipedia title overrides for ambiguous or complex names
const WIKI_TITLE_OVERRIDES = {
  "Pelé": "Pelé",
  "Diego Maradona": "Diego_Maradona",
  "Zinedine Zidane": "Zinedine_Zidane",
  "Ronaldo Nazário": "Ronaldo_(Brazilian_footballer)",
  "Ronaldinho": "Ronaldinho",
  "Paolo Maldini": "Paolo_Maldini",
  "Thierry Henry": "Thierry_Henry",
  "Roberto Carlos": "Roberto_Carlos",
  "Andrés Iniesta": "Andrés_Iniesta",
  "Xavi Hernández": "Xavi",
  "Gianluigi Buffon": "Gianluigi_Buffon",
  "Sergio Ramos": "Sergio_Ramos",
  "Toni Kroos": "Toni_Kroos",
  "Zlatan Ibrahimović": "Zlatan_Ibrahimović",
  "Luís Figo": "Luís_Figo",
  "Carles Puyol": "Carles_Puyol",
  "Fabio Cannavaro": "Fabio_Cannavaro",
  "Alessandro Del Piero": "Alessandro_Del_Piero",
  "Dennis Bergkamp": "Dennis_Bergkamp",
  "Patrick Vieira": "Patrick_Vieira",
  "Steven Gerrard": "Steven_Gerrard",
  "Frank Lampard": "Frank_Lampard",
  "Wayne Rooney": "Wayne_Rooney",
  "Didier Drogba": "Didier_Drogba",
  "Kaká": "Kaká",
  "Rivaldo": "Rivaldo",
  "Samuel Eto'o": "Samuel_Eto'o",
  "Andrea Pirlo": "Andrea_Pirlo",
  "Philipp Lahm": "Philipp_Lahm",
  "Sergio Agüero": "Sergio_Agüero",
  "Xabi Alonso": "Xabi_Alonso",
  "David Beckham": "David_Beckham",
  "Peter Schmeichel": "Peter_Schmeichel",
  "Petr Čech": "Petr_Čech",
  "Iker Casillas": "Iker_Casillas",
  "Roberto Baggio": "Roberto_Baggio",
  "Lothar Matthäus": "Lothar_Matthäus",
  "Ruud Gullit": "Ruud_Gullit",
  "Marco van Basten": "Marco_van_Basten",
  "Gabriel Batistuta": "Gabriel_Batistuta",
  "Romário": "Romário",
  "Alan Shearer": "Alan_Shearer",
  "Paul Gascoigne": "Paul_Gascoigne",
  "Ryan Giggs": "Ryan_Giggs",
  "Eric Cantona": "Eric_Cantona",
  "Roy Keane": "Roy_Keane",
  "Rio Ferdinand": "Rio_Ferdinand",
  "John Terry": "John_Terry",
  "Ashley Cole": "Ashley_Cole",
  "Andrea Barzagli": "Andrea_Barzagli",
  "Clarence Seedorf": "Clarence_Seedorf",
  "Edgar Davids": "Edgar_Davids",
  "Gianfranco Zola": "Gianfranco_Zola",
  "Alessandro Nesta": "Alessandro_Nesta",
  "Christian Vieri": "Christian_Vieri",
  "Hernán Crespo": "Hernán_Crespo",
  "Juan Sebastián Verón": "Juan_Sebastián_Verón",
  "Pavel Nedvěd": "Pavel_Nedvěd",
  "Rui Costa": "Rui_Costa",
  "David Trezeguet": "David_Trezeguet",
  "Cafu": "Cafu",
  "Franco Baresi": "Franco_Baresi",
  "Hristo Stoichkov": "Hristo_Stoichkov",
  "Johan Cruyff": "Johan_Cruyff",
  "Lev Yashin": "Lev_Yashin",
  "Franz Beckenbauer": "Franz_Beckenbauer",
  "Ferenc Puskás": "Ferenc_Puskás",
  "George Best": "George_Best",
  "Michel Platini": "Michel_Platini",
  "Eusébio": "Eusébio",
  "Alfredo Di Stéfano": "Alfredo_Di_Stéfano",
  "Garrincha": "Garrincha",
  "Bobby Charlton": "Bobby_Charlton",
  "Bobby Moore": "Bobby_Moore",
  "Gerd Müller": "Gerd_Müller",
  "Karl-Heinz Rummenigge": "Karl-Heinz_Rummenigge",
  "Sócrates": "Sócrates_(footballer)",
  "Zico": "Zico_(footballer)",
  "Just Fontaine": "Just_Fontaine",
  "Gordon Banks": "Gordon_Banks",
  "Hugo Sánchez": "Hugo_Sánchez",
  "Kenny Dalglish": "Kenny_Dalglish",
  "Dino Zoff": "Dino_Zoff",
  "Andriy Shevchenko": "Andriy_Shevchenko",
  "George Weah": "George_Weah",
  "Paul Scholes": "Paul_Scholes",
  "Michael Ballack": "Michael_Ballack",
  "Nemanja Vidić": "Nemanja_Vidić",
  "Oliver Kahn": "Oliver_Kahn",
  "Lilian Thuram": "Lilian_Thuram",
  "Gheorghe Hagi": "Gheorghe_Hagi",
  "Fernando Hierro": "Fernando_Hierro",
  "Juninho Pernambucano": "Juninho_Pernambucano",
  "Gareth Bale": "Gareth_Bale",
  "Marcelo": "Marcelo_(footballer,_born_1988)",
  "Pepe": "Pepe_(footballer,_born_1983)",
  "Franck Ribéry": "Franck_Ribéry",
  "Arjen Robben": "Arjen_Robben",
  "Gerard Piqué": "Gerard_Piqué",
  "Cesc Fàbregas": "Cesc_Fàbregas",
  "David Silva": "David_Silva",
  "Dani Alves": "Dani_Alves",
  "Javier Zanetti": "Javier_Zanetti",
  "Laurent Blanc": "Laurent_Blanc",
  "Davor Šuker": "Davor_Šuker",
  "Raymond Kopa": "Raymond_Kopa",
  "Giuseppe Meazza": "Giuseppe_Meazza",
  "Gianni Rivera": "Gianni_Rivera",
  "Giacinto Facchetti": "Giacinto_Facchetti",
  "Gaetano Scirea": "Gaetano_Scirea",
  "Jairzinho": "Jairzinho",
  "Rivellino": "Rivellino",
  "Paulo Roberto Falcão": "Paulo_Roberto_Falcão",
  "Daniel Passarella": "Daniel_Passarella",
  "Mario Kempes": "Mario_Kempes",
  "Juan Román Riquelme": "Juan_Román_Riquelme",
  "Sepp Maier": "Sepp_Maier",
  "Paul Breitner": "Paul_Breitner",
  "Uwe Seeler": "Uwe_Seeler",
  "Michael Laudrup": "Michael_Laudrup",
  "Ian Rush": "Ian_Rush",
  "John Charles": "John_Charles",
  "Dejan Savićević": "Dejan_Savićević",
  "Dragan Stojković": "Dragan_Stojković",
  "Zvonimir Boban": "Zvonimir_Boban",
  "Oleg Blokhin": "Oleg_Blokhin",
  "Josef Bican": "Josef_Bican",
  "Sándor Kocsis": "Sándor_Kocsis",
  "Ladislao Kubala": "László_Kubala",
  "Luis Suárez Miramontes": "Luis_Suárez_(footballer,_born_1935)",
  "Enzo Francescoli": "Enzo_Francescoli",
  "Carlos Valderrama": "Carlos_Valderrama",
  "Gunnar Nordahl": "Gunnar_Nordahl",
  "Nils Liedholm": "Nils_Liedholm",
  "Siniša Mihajlović": "Siniša_Mihajlović",
  "Fernando Redondo": "Fernando_Redondo",
  "David Villa": "David_Villa",
  "Jaap Stam": "Jaap_Stam",
  "Lúcio": "Lúcio",
  "Sol Campbell": "Sol_Campbell",
  "Filippo Inzaghi": "Filippo_Inzaghi",
  "Miroslav Klose": "Miroslav_Klose",
  "Gennaro Gattuso": "Gennaro_Gattuso",
  "Robert Pirès": "Robert_Pirès",
  "Marcel Desailly": "Marcel_Desailly",
  "Edwin van der Sar": "Edwin_van_der_Sar",
  "Claude Makélélé": "Claude_Makélélé",
  "Emmanuel Petit": "Emmanuel_Petit",
  "Michael Owen": "Michael_Owen",
  "Bastian Schweinsteiger": "Bastian_Schweinsteiger",
  "Ruud van Nistelrooy": "Ruud_van_Nistelrooy",
  "Robin van Persie": "Robin_van_Persie",
  "Jean-Pierre Papin": "Jean-Pierre_Papin",
  "Gianluca Zambrotta": "Gianluca_Zambrotta",
  "Rafael Márquez": "Rafael_Márquez",
  "Luis Hernández": "Luis_Hernández_(footballer)",
  "Henrik Larsson": "Henrik_Larsson",

  // HEROES
  "Eden Hazard": "Eden_Hazard",
  "Giorgio Chiellini": "Giorgio_Chiellini",
  "Mesut Özil": "Mesut_Özil",
  "Diego Godín": "Diego_Godín",
  "Gonzalo Higuaín": "Gonzalo_Higuaín",
  "Carlos Tevez": "Carlos_Tevez",
  "Marek Hamšík": "Marek_Hamšík",
  "Leonardo Bonucci": "Leonardo_Bonucci",
  "Claudio Bravo": "Claudio_Bravo",
  "Jesús Navas": "Jesús_Navas",
  "Mats Hummels": "Mats_Hummels",
  "Keylor Navas": "Keylor_Navas",
  "Olivier Giroud": "Olivier_Giroud",
  "Ángel Di María": "Ángel_Di_María",
  "Thiago Silva": "Thiago_Silva",
  "Lukas Podolski": "Lukas_Podolski",
  "Nani": "Nani_(footballer)",
  "Marouane Fellaini": "Marouane_Fellaini",
  "Javier Mascherano": "Javier_Mascherano",
  "Michael Essien": "Michael_Essien",
  "Park Ji-sung": "Park_Ji-sung",
  "Yaya Touré": "Yaya_Touré",
  "Mario Mandžukić": "Mario_Mandžukić",
  "Fernando Torres": "Fernando_Torres",
  "Diego Forlán": "Diego_Forlán",
  "Jay-Jay Okocha": "Jay-Jay_Okocha",
  "Wesley Sneijder": "Wesley_Sneijder",
  "Vincent Kompany": "Vincent_Kompany",
  "Jamie Carragher": "Jamie_Carragher",
  "Robbie Fowler": "Robbie_Fowler",
  "Teddy Sheringham": "Teddy_Sheringham",
  "William Gallas": "William_Gallas",
  "Deco": "Deco",
  "Jens Lehmann": "Jens_Lehmann",
  "Fabien Barthez": "Fabien_Barthez",
  "Nicolas Anelka": "Nicolas_Anelka",
  "Radamel Falcao": "Radamel_Falcao",
  "Miralem Pjanić": "Miralem_Pjanić",
  "Santi Cazorla": "Santi_Cazorla",
  "Alexis Sánchez": "Alexis_Sánchez",
  "Ivan Rakitić": "Ivan_Rakitić",
  "Dimitar Berbatov": "Dimitar_Berbatov",
  "Jermain Defoe": "Jermain_Defoe",
  "Juan Mata": "Juan_Mata",
  "Blaise Matuidi": "Blaise_Matuidi",
  "Sami Khedira": "Sami_Khedira",
  "Dirk Kuyt": "Dirk_Kuyt",
  "Tim Cahill": "Tim_Cahill",
  "Landon Donovan": "Landon_Donovan",
  "Clint Dempsey": "Clint_Dempsey",
  "Claudio Marchisio": "Claudio_Marchisio",
  "Antonio Di Natale": "Antonio_Di_Natale",
  "Joe Cole": "Joe_Cole_(footballer)",
  "Peter Crouch": "Peter_Crouch",
  "Ledley King": "Ledley_King",
  "Ole Gunnar Solskjær": "Ole_Gunnar_Solskjær",
  "Dwight Yorke": "Dwight_Yorke",
  "Andy Cole": "Andy_Cole",
  "Ian Wright": "Ian_Wright",
  "Tony Adams": "Tony_Adams_(footballer)",
  "Pablo Zabaleta": "Pablo_Zabaleta",
  "Guti": "Guti_(footballer)",
  "Míchel Salgado": "Míchel_Salgado",
  "Marco Materazzi": "Marco_Materazzi",
  "Dejan Stanković": "Dejan_Stanković",
  "Esteban Cambiasso": "Esteban_Cambiasso",
  "Pedro Rodríguez": "Pedro_(footballer,_born_1987)",
  "Kevin-Prince Boateng": "Kevin-Prince_Boateng",
  "Shunsuke Nakamura": "Shunsuke_Nakamura",
  "Hidetoshi Nakata": "Hidetoshi_Nakata",
  "Iván Córdoba": "Iván_Córdoba",
  "Djibril Cissé": "Djibril_Cissé",
  "Walter Samuel": "Walter_Samuel",
  "Jakub Błaszczykowski": "Jakub_Błaszczykowski",
  "Łukasz Piszczek": "Łukasz_Piszczek",
  "Claudio Pizarro": "Claudio_Pizarro",
  "Giovane Élber": "Giovane_Élber",
  "Roy Makaay": "Roy_Makaay",
  "Bixente Lizarazu": "Bixente_Lizarazu",
  "Sami Hyypiä": "Sami_Hyypiä",
  "John Arne Riise": "John_Arne_Riise",
  "Jan Koller": "Jan_Koller",
  "Karel Poborský": "Karel_Poborský",
  "Hakan Şükür": "Hakan_Şükür",
  "Nihat Kahveci": "Nihat_Kahveci",
  "Rüştü Reçber": "Rüştü_Reçber",
  "Asamoah Gyan": "Asamoah_Gyan",
  "Mustapha Hadji": "Mustapha_Hadji",
  "Sami Al-Jaber": "Sami_Al-Jaber",
  "Saeed Al-Owairan": "Saeed_Al-Owairan",
  "Ali Daei": "Ali_Daei",
  "Mehdi Mahdavikia": "Mehdi_Mahdavikia",
  "Keisuke Honda": "Keisuke_Honda",
  "Shinji Kagawa": "Shinji_Kagawa",
  "Ahn Jung-hwan": "Ahn_Jung-hwan",
  "Tim Howard": "Tim_Howard",
  "Iván Zamorano": "Iván_Zamorano",
  "Marcelo Salas": "Marcelo_Salas",
  "Álvaro Recoba": "Álvaro_Recoba",
  "Javier Saviola": "Javier_Saviola",
  "Diego Milito": "Diego_Milito",
  "Abedi Pele": "Abedi_Pele",
  "David Ginola": "David_Ginola",
  "Gianluca Vialli": "Gianluca_Vialli",
  "Fernando Morientes": "Fernando_Morientes",
  "Joan Capdevila": "Joan_Capdevila",
  "Steve McManaman": "Steve_McManaman",
  "Robbie Keane": "Robbie_Keane",
  "Nwankwo Kanu": "Nwankwo_Kanu",
  "Ludovic Giuly": "Ludovic_Giuly",
  "Sidney Govou": "Sidney_Govou",
  "Tomas Brolin": "Tomas_Brolin",
  "Lars Ricken": "Lars_Ricken",
  "Włodzimierz Smolarek": "Włodzimierz_Smolarek",
  "Jorge Campos": "Jorge_Campos",
  "Ramires": "Ramires",
  "Jerzy Dudek": "Jerzy_Dudek",
  "Paulo Wanchope": "Paulo_Wanchope",
  "Cuauhtémoc Blanco": "Cuauhtémoc_Blanco",
  "Zbigniew Boniek": "Zbigniew_Boniek",
  "Ciro Ferrara": "Ciro_Ferrara",
  "Giuseppe Bergomi": "Giuseppe_Bergomi"
};

async function getWikiImage(name) {
  let title = WIKI_TITLE_OVERRIDES[name];
  
  if (!title) {
    title = name.replace(/ /g, '_');
  }

  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
  
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'ExtraTimeBot/1.0 (https://extratime.app; contact@extratime.app)'
      }
    });

    if (res.status === 200) {
      const data = await res.json();
      let rawImg = data.thumbnail?.source || data.originalimage?.source || null;
      if (rawImg) {
        rawImg = rawImg.split('?')[0];
      }
      return { ok: true, imageUrl: rawImg, title: data.title };
    }

    // Fallback search if title gave 404
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(name + ' footballer')}&format=json&origin=*`;
    const searchRes = await fetch(searchUrl, {
      headers: { 'User-Agent': 'ExtraTimeBot/1.0 (https://extratime.app; contact@extratime.app)' }
    });
    const searchData = await searchRes.json();
    const firstResult = searchData.query?.search?.[0];
    if (firstResult) {
      const fallbackTitle = firstResult.title.replace(/ /g, '_');
      const fallbackSummaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(fallbackTitle)}`;
      const sumRes = await fetch(fallbackSummaryUrl, {
        headers: { 'User-Agent': 'ExtraTimeBot/1.0 (https://extratime.app; contact@extratime.app)' }
      });
      if (sumRes.status === 200) {
        const sumData = await sumRes.json();
        let rawImg = sumData.thumbnail?.source || sumData.originalimage?.source || null;
        if (rawImg) rawImg = rawImg.split('?')[0];
        return { ok: true, imageUrl: rawImg, title: sumData.title, fallback: true };
      }
    }
  } catch (err) {
    return { ok: false, error: err.message };
  }

  return { ok: false, imageUrl: null };
}

async function processList(filePath, label) {
  const players = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  console.log(`\nProcessing ${label} (${players.length} players)...`);
  
  let successCount = 0;
  let missingCount = 0;
  
  for (let i = 0; i < players.length; i++) {
    const p = players[i];
    const res = await getWikiImage(p.name);
    
    if (res.ok && res.imageUrl) {
      p.imageUrl = res.imageUrl;
      successCount++;
      console.log(`[${i+1}/${players.length}] ✓ ${p.name} -> ${res.imageUrl}`);
    } else {
      missingCount++;
      console.log(`[${i+1}/${players.length}] ✗ ${p.name} -> MISSING`);
    }

    await new Promise(r => setTimeout(r, 100));
  }

  console.log(`Finished ${label}: ${successCount} updated, ${missingCount} missing.`);
  return players;
}

async function main() {
  console.log('🚀 Updating Legend Player Images from Wikipedia/Wikimedia...');
  
  const updatedIcons = await processList(iconsPath, 'ICONS');
  fs.writeFileSync(iconsPath, JSON.stringify(updatedIcons, null, 2) + '\n');
  console.log(`✅ Saved ${iconsPath}`);

  const updatedHeroes = await processList(heroesPath, 'HEROES');
  fs.writeFileSync(heroesPath, JSON.stringify(updatedHeroes, null, 2) + '\n');
  console.log(`✅ Saved ${heroesPath}`);

  const allLegends = [...updatedIcons, ...updatedHeroes];
  fs.writeFileSync(legendsPath, JSON.stringify(allLegends, null, 2) + '\n');
  console.log(`✅ Regenerated ${legendsPath} (${allLegends.length} players)`);
}

main().catch(console.error);
