import fs from 'fs';
import path from 'path';

// 1. Recursive file finder
function getAllFiles(dirPath, arrayOfFiles = []) {
  if (!fs.existsSync(dirPath)) return arrayOfFiles;
  const files = fs.readdirSync(dirPath);
  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else if (file.endsWith('.json')) {
      arrayOfFiles.push(fullPath);
    }
  }
  return arrayOfFiles;
}

// 2. Load all active and legend players from JSON files
const activeFiles = getAllFiles('data/players/active');
const legendFiles = getAllFiles('data/players/legends');

console.log(`📂 Indexing players from ${activeFiles.length} active club files & ${legendFiles.length} legend files...`);

const playerDb = new Map(); // normalized name -> player info
const clubDb = new Map();   // normalized club name -> logo url

// Helper for string normalization
function norm(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Helper to register club
function registerClub(rawName, logoUrl) {
  if (!rawName || !logoUrl) return;
  clubDb.set(norm(rawName), logoUrl);
  // Also register common variations
  const n = norm(rawName);
  clubDb.set(n.replace(/^fc /, ''), logoUrl);
  clubDb.set(n.replace(/ fc$/, ''), logoUrl);
  clubDb.set(n.replace(/^as /, ''), logoUrl);
  clubDb.set(n.replace(/^ss /, ''), logoUrl);
  clubDb.set(n.replace(/^cf /, ''), logoUrl);
}

// Helper to register player
function registerPlayer(rawName, data) {
  if (!rawName) return;
  const n = norm(rawName);
  if (!playerDb.has(n)) {
    playerDb.set(n, data);
  }
  // Register last name and first initial variations
  const parts = n.split(' ');
  if (parts.length > 1) {
    const lastName = parts[parts.length - 1];
    const initialLast = `${parts[0][0]} ${lastName}`;
    if (!playerDb.has(initialLast)) {
      playerDb.set(initialLast, data);
    }
  }
}

// Ingest active squads
for (const file of activeFiles) {
  try {
    const content = JSON.parse(fs.readFileSync(file, 'utf-8'));
    const club = content.club || {};
    if (club.name && club.logo) {
      registerClub(club.name, club.logo);
    }
    for (const p of content.players || []) {
      if (p.name && p.imageUrl) {
        registerPlayer(p.name, {
          name: p.name,
          imageUrl: p.imageUrl,
          club: p.club || club.name,
          clubLogo: club.logo,
          nation: p.nation,
        });
      }
    }
  } catch (e) {
    console.error(`Error reading ${file}:`, e.message);
  }
}

// Ingest legends
for (const file of legendFiles) {
  try {
    const content = JSON.parse(fs.readFileSync(file, 'utf-8'));
    const list = Array.isArray(content) ? content : content.players || [];
    for (const p of list) {
      if (p.name && p.imageUrl) {
        registerPlayer(p.name, {
          name: p.name,
          imageUrl: p.imageUrl,
          club: p.club,
          clubLogo: p.clubLogo,
          nation: p.nation,
        });
        if (p.club && p.clubLogo) {
          registerClub(p.club, p.clubLogo);
        }
      }
    }
  } catch (e) {
    console.error(`Error reading legend ${file}:`, e.message);
  }
}

// 3. Known Global High-Res Entity Visuals & Curated Direct Mappings
const CURATED_PLAYERS = {
  "lionel messi": "https://upload.wikimedia.org/wikipedia/commons/b/b4/Lionel-Messi-Argentina-2022-FIFA-World-Cup_%28cropped%29.jpg",
  "cristiano ronaldo": "https://upload.wikimedia.org/wikipedia/commons/8/8c/Cristiano_Ronaldo_2018.jpg",
  "neymar": "https://upload.wikimedia.org/wikipedia/commons/8/83/Bra-Cos_%281%29_%28cropped%29.jpg",
  "neymar jr": "https://upload.wikimedia.org/wikipedia/commons/8/83/Bra-Cos_%281%29_%28cropped%29.jpg",
  "kylian mbappe": "https://upload.wikimedia.org/wikipedia/commons/5/57/2019-07-17_SG_Dynamo_Dresden_vs._Paris_Saint-Germain_by_Sandro_Halank%E2%80%93129_%28cropped%29.jpg",
  "erling haaland": "https://upload.wikimedia.org/wikipedia/commons/0/07/Erling_Haaland_2023_%28cropped%29.jpg",
  "robert lewandowski": "https://upload.wikimedia.org/wikipedia/commons/0/03/Robert_Lewandowski%2C_FC_Bayern_M%C3%BCnchen_%28all-oev__190436%29_%28cropped%29.jpg",
  "karim benzema": "https://upload.wikimedia.org/wikipedia/commons/e/ec/Karim_Benzema_wearing_Real_Madrid_home_kit_2021-2022.jpg",
  "mohamed salah": "https://upload.wikimedia.org/wikipedia/commons/4/4a/Mohamed_Salah_2018.jpg",
  "kevin de bruyne": "https://upload.wikimedia.org/wikipedia/commons/4/40/Kevin_De_Bruyne_201807091.jpg",
  "zlatan ibrahimovic": "https://upload.wikimedia.org/wikipedia/commons/0/09/Zlatan_Ibrahimovi%C4%87_June_2018.jpg",
  "luka modric": "https://upload.wikimedia.org/wikipedia/commons/e/e9/Luka_Modri%C4%87_2018.jpg",
  "harry kane": "https://upload.wikimedia.org/wikipedia/commons/2/2e/Harry_Kane_20181.jpg",
  "thierry henry": "https://upload.wikimedia.org/wikipedia/commons/8/81/Thierry_Henry_August_2008.jpg",
  "wayne rooney": "https://upload.wikimedia.org/wikipedia/commons/1/12/Wayne_Rooney_2020.jpg",
  "zinedine zidane": "https://upload.wikimedia.org/wikipedia/commons/f/f3/Zinedine_Zidane_by_Tasnim_03.jpg",
  "ronaldo nazario": "https://upload.wikimedia.org/wikipedia/commons/8/87/Ronaldo_Naz%C3%A1rio_2018.jpg",
  "ronaldinho": "https://upload.wikimedia.org/wikipedia/commons/e/e8/Ronaldinho_in_2019.jpg",
  "pele": "https://upload.wikimedia.org/wikipedia/commons/5/5e/Pele_con_brasil_%28cropped%29.jpg",
  "diego maradona": "https://upload.wikimedia.org/wikipedia/commons/4/48/Argentina_celebrando_copa_%28cropped%29.jpg",
  "johan cruyff": "https://upload.wikimedia.org/wikipedia/commons/e/ea/Johan_Cruyff_1974c.jpg",
  "kaka": "https://upload.wikimedia.org/wikipedia/commons/d/df/Kak%C3%A1_2010.jpg",
  "andres iniesta": "https://upload.wikimedia.org/wikipedia/commons/6/67/Andr%C3%A9s_Iniesta.jpg",
  "xavi hernandez": "https://upload.wikimedia.org/wikipedia/commons/5/52/Xavi_Hernandez_2011.jpg",
  "sergio ramos": "https://upload.wikimedia.org/wikipedia/commons/0/07/Sergio_Ramos_2018.jpg",
  "virgil van dijk": "https://upload.wikimedia.org/wikipedia/commons/1/1d/Virgil_van_Dijk_2021.jpg",
  "jude bellingham": "https://upload.wikimedia.org/wikipedia/commons/4/4b/Jude_Bellingham_2023.jpg",
  "vinicius junior": "https://upload.wikimedia.org/wikipedia/commons/f/f3/Vinicius_Junior_2021.jpg",
  "manuel neuer": "https://upload.wikimedia.org/wikipedia/commons/1/10/Manuel_Neuer_2018.jpg",
  "gianluigi buffon": "https://upload.wikimedia.org/wikipedia/commons/2/26/Gianluigi_Buffon_%2831818228963%29_%28cropped%29.jpg",
  "iker casillas": "https://upload.wikimedia.org/wikipedia/commons/9/91/Iker_Casillas_2018.jpg",
  "petr cech": "https://upload.wikimedia.org/wikipedia/commons/e/eb/Petr_Cech_2015.jpg",
  "samuel etoo": "https://upload.wikimedia.org/wikipedia/commons/7/75/Samuel_Eto%27o_2018.jpg",
  "didier drogba": "https://upload.wikimedia.org/wikipedia/commons/d/db/Didier_Drogba_2014.jpg",
  "luis suarez": "https://upload.wikimedia.org/wikipedia/commons/8/81/Luis_Suarez_2018.jpg",
  "alan shearer": "https://upload.wikimedia.org/wikipedia/commons/f/fc/Alan_Shearer_2018.jpg",
  "sergio aguero": "https://upload.wikimedia.org/wikipedia/commons/d/d4/Sergio_Ag%C3%BCero_2018.jpg",
  "romelu lukaku": "https://upload.wikimedia.org/wikipedia/commons/f/fb/Romelu_Lukaku_2018.jpg",
  "alvaro morata": "https://upload.wikimedia.org/wikipedia/commons/4/4c/%C3%81lvaro_Morata_2018.jpg",
  "ousmane dembele": "https://upload.wikimedia.org/wikipedia/commons/2/23/Ousmane_Demb%C3%A9l%C3%A9_2018.jpg",
  "son heung min": "https://upload.wikimedia.org/wikipedia/commons/c/c1/Son_Heung-min_2018.jpg",
  "sadio mane": "https://upload.wikimedia.org/wikipedia/commons/7/7b/Sadio_Man%C3%A9_2018.jpg",
  "riyad mahrez": "https://upload.wikimedia.org/wikipedia/commons/4/4e/Riyad_Mahrez_2018.jpg",
  "gerd muller": "https://upload.wikimedia.org/wikipedia/commons/e/ea/Gerd_M%C3%BCller_1974.jpg",
  "miroslav klose": "https://upload.wikimedia.org/wikipedia/commons/8/87/Miroslav_Klose_2014.jpg",
  "paolo maldini": "https://upload.wikimedia.org/wikipedia/commons/9/91/Paolo_Maldini_2008.jpg",
  "lothar matthaus": "https://upload.wikimedia.org/wikipedia/commons/6/6c/Lothar_Matth%C3%A4us_2014.jpg",
  "david beckham": "https://upload.wikimedia.org/wikipedia/commons/8/8b/David_Beckham_2018.jpg",
  "juninho pernambucano": "https://upload.wikimedia.org/wikipedia/commons/0/05/Juninho_Pernambucano_2008.jpg",
  "edwin van der sar": "https://upload.wikimedia.org/wikipedia/commons/9/94/Edwin_van_der_Sar_2011.jpg",
  "alisson becker": "https://media.api-sports.io/football/players/280.png",
  "kepa arrizabalaga": "https://media.api-sports.io/football/players/18959.png",
  "josko gvardiol": "https://media.api-sports.io/football/players/129033.png",
  "harry maguire": "https://media.api-sports.io/football/players/2934.png",
  "matthijs de ligt": "https://media.api-sports.io/football/players/538.png",
  "jack grealish": "https://media.api-sports.io/football/players/19187.png",
  "declan rice": "https://media.api-sports.io/football/players/292.png",
  "enzo fernandez": "https://media.api-sports.io/football/players/6008.png",
  "philippe coutinho": "https://media.api-sports.io/football/players/153.png",
  "joao felix": "https://media.api-sports.io/football/players/1243.png",
  "paul pogba": "https://media.api-sports.io/football/players/882.png",
  "antoine griezmann": "https://media.api-sports.io/football/players/56.png",
  "gareth bale": "https://upload.wikimedia.org/wikipedia/commons/4/41/Gareth_Bale_2018.jpg",
  "mesut ozil": "https://upload.wikimedia.org/wikipedia/commons/1/12/Mesut_%C3%96zil_at_Baku_before_2019_UEFA_Europe_League_Final.jpg",
  "cesc fabregas": "https://upload.wikimedia.org/wikipedia/commons/2/23/Cesc_F%C3%A0bregas_2015.jpg",
  "eden hazard": "https://upload.wikimedia.org/wikipedia/commons/e/ec/Eden_Hazard_2018.jpg",
  "thomas muller": "https://media.api-sports.io/football/players/521.png",
  "alessandro del piero": "https://upload.wikimedia.org/wikipedia/commons/4/47/Alessandro_Del_Piero_2008.jpg",
  "rivaldo": "https://upload.wikimedia.org/wikipedia/commons/4/46/Rivaldo_2014.jpg",
  "roberto carlos": "https://upload.wikimedia.org/wikipedia/commons/c/c9/Roberto_Carlos_2018.jpg",
  "salif keita": "https://upload.wikimedia.org/wikipedia/commons/e/e0/Salif_Ke%C3%AFta_1971.jpg",
  "just fontaine": "https://upload.wikimedia.org/wikipedia/commons/4/4b/Just_Fontaine_1958.jpg",
  "eusebio": "https://upload.wikimedia.org/wikipedia/commons/9/91/Eus%C3%A9bio_1966.jpg",
  "sandor kocsis": "https://upload.wikimedia.org/wikipedia/commons/5/52/S%C3%A1ndor_Kocsis_1954.jpg",
  "francesco totti": "https://upload.wikimedia.org/wikipedia/commons/a/a2/Francesco_Totti_2017.jpg",
  "dani alves": "https://upload.wikimedia.org/wikipedia/commons/f/fe/Dani_Alves_2018.jpg",
  "gerard pique": "https://upload.wikimedia.org/wikipedia/commons/e/e8/Gerard_Piqu%C3%A9_2018.jpg",
  "raul gonzalez": "https://upload.wikimedia.org/wikipedia/commons/5/5f/Ra%C3%BAl_Gonz%C3%A1lez_2013.jpg",
  "michel platini": "https://upload.wikimedia.org/wikipedia/commons/b/b3/Michel_Platini_1984.jpg",
  "george best": "https://upload.wikimedia.org/wikipedia/commons/a/a6/George_Best_1976.jpg",
  "michael owen": "https://upload.wikimedia.org/wikipedia/commons/d/d3/Michael_Owen_2013.jpg",
  "romario": "https://upload.wikimedia.org/wikipedia/commons/9/9f/Rom%C3%A1rio_2018.jpg",
  "ferenc puskas": "https://upload.wikimedia.org/wikipedia/commons/e/e3/Ferenc_Pusk%C3%A1s_1960.jpg",
  "ansu fati": "https://media.api-sports.io/football/players/127814.png",
  "lamine yamal": "https://media.api-sports.io/football/players/388480.png",
  "victor osimhen": "https://media.api-sports.io/football/players/19088.png",
  "gonzalo higuain": "https://upload.wikimedia.org/wikipedia/commons/e/e4/Gonzalo_Higua%C3%ADn_2018.jpg",
  "ruud van nistelrooy": "https://upload.wikimedia.org/wikipedia/commons/a/a1/Ruud_van_Nistelrooy_2010.jpg",
  "sebastien haller": "https://media.api-sports.io/football/players/219.png",
  "pepe reina": "https://media.api-sports.io/football/players/18928.png",
  "joe hart": "https://media.api-sports.io/football/players/18859.png",
  "david seaman": "https://upload.wikimedia.org/wikipedia/commons/5/5d/David_Seaman_2011.jpg",
  "pepe": "https://media.api-sports.io/football/players/742.png",
  "toni kroos": "https://media.api-sports.io/football/players/738.png",
  "moises caicedo": "https://media.api-sports.io/football/players/162859.png",
  "wesley fofana": "https://media.api-sports.io/football/players/1458.png",
  "andre onana": "https://media.api-sports.io/football/players/532.png",
  "ederson": "https://media.api-sports.io/football/players/617.png",
  "ederson moraes": "https://media.api-sports.io/football/players/617.png",
  "anthony martial": "https://media.api-sports.io/football/players/902.png",
  "andy cole": "https://upload.wikimedia.org/wikipedia/commons/5/50/Andy_Cole_2013.jpg",
  "andrew cole": "https://upload.wikimedia.org/wikipedia/commons/5/50/Andy_Cole_2013.jpg",
  "telmo zarra": "https://upload.wikimedia.org/wikipedia/commons/1/1d/Telmo_Zarra_1950.jpg",
  "hugo sanchez": "https://upload.wikimedia.org/wikipedia/commons/4/4b/Hugo_S%C3%A1nchez_2017.jpg",
  "cesar rodriguez": "https://upload.wikimedia.org/wikipedia/commons/8/87/C%C3%A9sar_Rodr%C3%ADguez_%C3%81lvarez.jpg",
  "hossam ashour": "https://media.api-sports.io/football/players/1030.png",
  "bader al mutawa": "https://upload.wikimedia.org/wikipedia/commons/8/83/Bader_Al-Mutawa_2019.jpg",
  "ahmed hassan": "https://upload.wikimedia.org/wikipedia/commons/4/44/Ahmed_Hassan_2010.jpg",
  "pierre littbarski": "https://upload.wikimedia.org/wikipedia/commons/4/4a/Pierre_Littbarski_1982.jpg",
  "silvio piola": "https://upload.wikimedia.org/wikipedia/commons/2/23/Silvio_Piola_1938.jpg",
  "gunnar nordahl": "https://upload.wikimedia.org/wikipedia/commons/1/1f/Gunnar_Nordahl_1950.jpg",
  "giuseppe meazza": "https://upload.wikimedia.org/wikipedia/commons/6/6f/Giuseppe_Meazza_1934.jpg",
  "antonio di natale": "https://upload.wikimedia.org/wikipedia/commons/e/e0/Antonio_Di_Natale_2012.jpg",
  "klaus fischer": "https://upload.wikimedia.org/wikipedia/commons/5/54/Klaus_Fischer_1978.jpg",
  "jupp heynckes": "https://upload.wikimedia.org/wikipedia/commons/3/30/Jupp_Heynckes_2013.jpg",
  "manfred burgsmuller": "https://upload.wikimedia.org/wikipedia/commons/3/3d/Manfred_Burgsm%C3%BCller_1986.jpg",
  "klaas jan huntelaar": "https://media.api-sports.io/football/players/548.png",
  "pierre emerick aubameyang": "https://media.api-sports.io/football/players/244.png",
  "edinson cavani": "https://upload.wikimedia.org/wikipedia/commons/e/e1/Edinson_Cavani_2018.jpg",
  "josip skoblar": "https://upload.wikimedia.org/wikipedia/commons/8/8f/Josip_Skoblar_1971.jpg",
  "pablo sarabia": "https://media.api-sports.io/football/players/18919.png",
  "mateo kovacic": "https://media.api-sports.io/football/players/2291.png",
  "antonio nusa": "https://media.api-sports.io/football/players/313885.png",
};

// 4. Curated Club Logo Direct Mappings
const CURATED_CLUBS = {
  "real madrid": "https://media.api-sports.io/football/teams/541.png",
  "barcelona": "https://media.api-sports.io/football/teams/529.png",
  "fc barcelona": "https://media.api-sports.io/football/teams/529.png",
  "manchester city": "https://media.api-sports.io/football/teams/50.png",
  "man city": "https://media.api-sports.io/football/teams/50.png",
  "manchester united": "https://media.api-sports.io/football/teams/33.png",
  "man united": "https://media.api-sports.io/football/teams/33.png",
  "liverpool": "https://media.api-sports.io/football/teams/40.png",
  "chelsea": "https://media.api-sports.io/football/teams/49.png",
  "arsenal": "https://media.api-sports.io/football/teams/42.png",
  "bayern munich": "https://media.api-sports.io/football/teams/157.png",
  "bayern": "https://media.api-sports.io/football/teams/157.png",
  "juventus": "https://media.api-sports.io/football/teams/496.png",
  "ac milan": "https://media.api-sports.io/football/teams/489.png",
  "milan": "https://media.api-sports.io/football/teams/489.png",
  "inter milan": "https://media.api-sports.io/football/teams/505.png",
  "inter": "https://media.api-sports.io/football/teams/505.png",
  "paris saint germain": "https://media.api-sports.io/football/teams/85.png",
  "psg": "https://media.api-sports.io/football/teams/85.png",
  "atletico madrid": "https://media.api-sports.io/football/teams/530.png",
  "atletico": "https://media.api-sports.io/football/teams/530.png",
  "borussia dortmund": "https://media.api-sports.io/football/teams/165.png",
  "dortmund": "https://media.api-sports.io/football/teams/165.png",
  "ajax": "https://media.api-sports.io/football/teams/194.png",
  "tottenham hotspur": "https://media.api-sports.io/football/teams/47.png",
  "tottenham": "https://media.api-sports.io/football/teams/47.png",
  "aston villa": "https://media.api-sports.io/football/teams/66.png",
  "newcastle united": "https://media.api-sports.io/football/teams/34.png",
  "newcastle": "https://media.api-sports.io/football/teams/34.png",
  "everton": "https://media.api-sports.io/football/teams/45.png",
  "west ham united": "https://media.api-sports.io/football/teams/48.png",
  "west ham": "https://media.api-sports.io/football/teams/48.png",
  "sevilla": "https://media.api-sports.io/football/teams/536.png",
  "athletic bilbao": "https://media.api-sports.io/football/teams/531.png",
  "valencia": "https://media.api-sports.io/football/teams/532.png",
  "valencia cf": "https://media.api-sports.io/football/teams/532.png",
  "villarreal": "https://media.api-sports.io/football/teams/533.png",
  "as roma": "https://media.api-sports.io/football/teams/497.png",
  "roma": "https://media.api-sports.io/football/teams/497.png",
  "napoli": "https://media.api-sports.io/football/teams/492.png",
  "lazio": "https://media.api-sports.io/football/teams/487.png",
  "ss lazio": "https://media.api-sports.io/football/teams/487.png",
  "fiorentina": "https://media.api-sports.io/football/teams/502.png",
  "bayer leverkusen": "https://media.api-sports.io/football/teams/168.png",
  "rb leipzig": "https://media.api-sports.io/football/teams/173.png",
  "benfica": "https://media.api-sports.io/football/teams/211.png",
  "sl benfica": "https://media.api-sports.io/football/teams/211.png",
  "porto": "https://media.api-sports.io/football/teams/212.png",
  "fc porto": "https://media.api-sports.io/football/teams/212.png",
  "sporting cp": "https://media.api-sports.io/football/teams/228.png",
  "sporting": "https://media.api-sports.io/football/teams/228.png",
  "al ahly": "https://media.api-sports.io/football/teams/1030.png",
  "zamalek": "https://media.api-sports.io/football/teams/1031.png",
  "al hilal": "https://media.api-sports.io/football/teams/2939.png",
  "al nassr": "https://media.api-sports.io/football/teams/2932.png",
  "al ittihad": "https://media.api-sports.io/football/teams/2938.png",
  "santos": "https://media.api-sports.io/football/teams/128.png",
  "santos fc": "https://media.api-sports.io/football/teams/128.png",
  "boca juniors": "https://media.api-sports.io/football/teams/451.png",
  "river plate": "https://media.api-sports.io/football/teams/435.png",
  "flamengo": "https://media.api-sports.io/football/teams/127.png",
  "palmeiras": "https://media.api-sports.io/football/teams/121.png",
  "rangers": "https://media.api-sports.io/football/teams/257.png",
  "rangers fc": "https://media.api-sports.io/football/teams/257.png",
  "celtic": "https://media.api-sports.io/football/teams/247.png",
  "celtic fc": "https://media.api-sports.io/football/teams/247.png",
  "corinthians": "https://media.api-sports.io/football/teams/131.png",
  "olympique lyon": "https://media.api-sports.io/football/teams/80.png",
  "lyon": "https://media.api-sports.io/football/teams/80.png",
  "olympique marseille": "https://media.api-sports.io/football/teams/81.png",
  "marseille": "https://media.api-sports.io/football/teams/81.png",
  "werder bremen": "https://media.api-sports.io/football/teams/162.png",
  "1 fc koln": "https://media.api-sports.io/football/teams/192.png",
  "koln": "https://media.api-sports.io/football/teams/192.png",
  "vfb stuttgart": "https://media.api-sports.io/football/teams/172.png",
  "stuttgart": "https://media.api-sports.io/football/teams/172.png",
  "schalke": "https://media.api-sports.io/football/teams/174.png",
  "schalke 04": "https://media.api-sports.io/football/teams/174.png",
  "fc schalke 04": "https://media.api-sports.io/football/teams/174.png",
  "monaco": "https://media.api-sports.io/football/teams/91.png",
  "as monaco": "https://media.api-sports.io/football/teams/91.png",
  "brighton": "https://media.api-sports.io/football/teams/51.png",
  "leicester city": "https://media.api-sports.io/football/teams/46.png",
  "leicester": "https://media.api-sports.io/football/teams/46.png",
  "southampton": "https://media.api-sports.io/football/teams/41.png",
  "inter miami": "https://media.api-sports.io/football/teams/9568.png",
  "independiente": "https://media.api-sports.io/football/teams/453.png",
  "penarol": "https://media.api-sports.io/football/teams/2381.png",
};

// 5. Curated Nations Flag Map
const NATIONS_FLAGS = {
  "brazil": "https://flagcdn.com/w80/br.png",
  "argentina": "https://flagcdn.com/w80/ar.png",
  "portugal": "https://flagcdn.com/w80/pt.png",
  "france": "https://flagcdn.com/w80/fr.png",
  "germany": "https://flagcdn.com/w80/de.png",
  "spain": "https://flagcdn.com/w80/es.png",
  "england": "https://flagcdn.com/w80/gb-eng.png",
  "italy": "https://flagcdn.com/w80/it.png",
  "netherlands": "https://flagcdn.com/w80/nl.png",
  "belgium": "https://flagcdn.com/w80/be.png",
  "croatia": "https://flagcdn.com/w80/hr.png",
  "uruguay": "https://flagcdn.com/w80/uy.png",
  "egypt": "https://flagcdn.com/w80/eg.png",
  "morocco": "https://flagcdn.com/w80/ma.png",
  "algeria": "https://flagcdn.com/w80/dz.png",
  "saudi arabia": "https://flagcdn.com/w80/sa.png",
  "cameroon": "https://flagcdn.com/w80/cm.png",
  "nigeria": "https://flagcdn.com/w80/ng.png",
  "senegal": "https://flagcdn.com/w80/sn.png",
  "ivory coast": "https://flagcdn.com/w80/ci.png",
  "ghana": "https://flagcdn.com/w80/gh.png",
  "japan": "https://flagcdn.com/w80/jp.png",
  "south korea": "https://flagcdn.com/w80/kr.png",
  "korea": "https://flagcdn.com/w80/kr.png",
  "iran": "https://flagcdn.com/w80/ir.png",
  "india": "https://flagcdn.com/w80/in.png",
  "malaysia": "https://flagcdn.com/w80/my.png",
  "united states": "https://flagcdn.com/w80/us.png",
  "usa": "https://flagcdn.com/w80/us.png",
  "poland": "https://flagcdn.com/w80/pl.png",
  "sweden": "https://flagcdn.com/w80/se.png",
  "norway": "https://flagcdn.com/w80/no.png",
  "chile": "https://flagcdn.com/w80/cl.png",
  "colombia": "https://flagcdn.com/w80/co.png",
  "paraguay": "https://flagcdn.com/w80/py.png",
  "mexico": "https://flagcdn.com/w80/mx.png",
  "australia": "https://flagcdn.com/w80/au.png",
  "china": "https://flagcdn.com/w80/cn.png",
  "hungary": "https://flagcdn.com/w80/hu.png",
  "austria": "https://flagcdn.com/w80/at.png",
  "switzerland": "https://flagcdn.com/w80/ch.png",
  "kuwait": "https://flagcdn.com/w80/kw.png",
  "qatar": "https://flagcdn.com/w80/qa.png",
};

// Resolution functions
function resolvePlayerImage(name) {
  const n = norm(name.replace(/\s*\(\d{4}[–-]?\d{0,4}\)/g, '')); // strip (2011-12)
  if (CURATED_PLAYERS[n]) return CURATED_PLAYERS[n];
  
  // Try direct playerDb lookup
  if (playerDb.has(n)) return playerDb.get(n).imageUrl;

  // Try substring lookup
  for (const [key, p] of playerDb.entries()) {
    if (n.length > 4 && (key.includes(n) || n.includes(key))) {
      return p.imageUrl;
    }
  }

  // Try matching against curated keys
  for (const [key, url] of Object.entries(CURATED_PLAYERS)) {
    if (n.length > 4 && (key.includes(n) || n.includes(key))) {
      return url;
    }
  }

  return undefined;
}

function resolveClubLogo(name) {
  const n = norm(name.replace(/\s*\(\d{4}[–-]?\d{0,4}\)/g, ''));
  if (CURATED_CLUBS[n]) return CURATED_CLUBS[n];
  if (clubDb.has(n)) return clubDb.get(n);

  for (const [key, url] of Object.entries(CURATED_CLUBS)) {
    if (n.length > 3 && (key.includes(n) || n.includes(key))) {
      return url;
    }
  }

  for (const [key, logo] of clubDb.entries()) {
    if (n.length > 3 && (key.includes(n) || n.includes(key))) {
      return logo;
    }
  }

  return undefined;
}

function resolveNationFlag(name) {
  const n = norm(name);
  if (NATIONS_FLAGS[n]) return NATIONS_FLAGS[n];
  for (const [key, url] of Object.entries(NATIONS_FLAGS)) {
    if (n.includes(key) || key.includes(n)) return url;
  }
  return undefined;
}

// 6. Enrich all question files in data/rank
const rankFiles = getAllFiles('data/rank');
console.log(`\n🚀 Enriching assets across ${rankFiles.length} rank question files...`);

let totalQuestionsEnriched = 0;
let totalAnswersEnriched = 0;

for (const file of rankFiles) {
  try {
    const questions = JSON.parse(fs.readFileSync(file, 'utf-8'));
    let modified = false;

    for (const q of questions) {
      for (const a of q.answers || []) {
        if (!a.media) a.media = { type: 'custom' };

        const enName = a.name?.en || '';
        const enSub = a.subText?.en || '';

        // A. Resolve primary image based on type
        if (a.media.type === 'player' || a.media.type === 'stint' || (!a.media.type && q.scopeType?.includes('PLAYER'))) {
          a.media.type = 'player';
          const pImg = resolvePlayerImage(enName);
          if (pImg) {
            a.media.primaryUrl = pImg;
            totalAnswersEnriched++;
          }
          // Also resolve secondary badge if subText contains a club
          if (enSub) {
            const cLogo = resolveClubLogo(enSub);
            if (cLogo) {
              a.media.secondaryBadgeUrl = cLogo;
            }
          }
        } else if (a.media.type === 'club' || (!a.media.type && q.scopeType?.includes('CLUB'))) {
          a.media.type = 'club';
          const cLogo = resolveClubLogo(enName) || (enSub ? resolveClubLogo(enSub) : undefined);
          if (cLogo) {
            a.media.primaryUrl = cLogo;
            totalAnswersEnriched++;
          }
        } else if (a.media.type === 'nation' || (!a.media.type && q.tags?.includes('national-teams'))) {
          a.media.type = 'nation';
          const flag = resolveNationFlag(enName) || (enSub ? resolveNationFlag(enSub) : undefined);
          if (flag) {
            a.media.primaryUrl = flag;
            totalAnswersEnriched++;
          }
        }

        // Clean up broken relative badges like /badges/real-madrid.png -> real club logo
        if (a.media.secondaryBadgeUrl && a.media.secondaryBadgeUrl.startsWith('/badges/')) {
          const clubName = a.media.secondaryBadgeUrl.replace('/badges/', '').replace('.png', '').replace(/-/g, ' ');
          const realClubLogo = resolveClubLogo(clubName) || (enSub ? resolveClubLogo(enSub) : undefined);
          if (realClubLogo) {
            a.media.secondaryBadgeUrl = realClubLogo;
          } else {
            delete a.media.secondaryBadgeUrl;
          }
        }
      }
      totalQuestionsEnriched++;
    }

    fs.writeFileSync(file, JSON.stringify(questions, null, 2), 'utf-8');
  } catch (e) {
    console.error(`Error processing ${file}:`, e.message);
  }
}

console.log(`\n✨ Successfully enriched ${totalQuestionsEnriched} questions and ${totalAnswersEnriched} answers!`);
