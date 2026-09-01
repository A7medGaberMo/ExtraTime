import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// ── 1. COMPREHENSIVE CURATED ASSET DICTIONARIES ──────────────────────────────

export const CURATED_PLAYERS = {
  // Verified Superstar & Legend Portraits
  "lionel messi": "https://upload.wikimedia.org/wikipedia/commons/b/b4/Lionel-Messi-Argentina-2022-FIFA-World-Cup_%28cropped%29.jpg",
  "cristiano ronaldo": "https://upload.wikimedia.org/wikipedia/commons/8/8c/Cristiano_Ronaldo_2018.jpg",
  "neymar": "https://upload.wikimedia.org/wikipedia/commons/8/83/Bra-Cos_%281%29_%28cropped%29.jpg",
  "neymar jr": "https://upload.wikimedia.org/wikipedia/commons/8/83/Bra-Cos_%281%29_%28cropped%29.jpg",
  "kylian mbappe": "https://upload.wikimedia.org/wikipedia/commons/5/57/2019-07-17_SG_Dynamo_Dresden_vs._Paris_Saint-Germain_by_Sandro_Halank%E2%80%93129_%28cropped%29.jpg",
  "kylian mbappé": "https://upload.wikimedia.org/wikipedia/commons/5/57/2019-07-17_SG_Dynamo_Dresden_vs._Paris_Saint-Germain_by_Sandro_Halank%E2%80%93129_%28cropped%29.jpg",
  "erling haaland": "https://upload.wikimedia.org/wikipedia/commons/0/07/Erling_Haaland_2023_%28cropped%29.jpg",
  "robert lewandowski": "https://upload.wikimedia.org/wikipedia/commons/0/03/Robert_Lewandowski%2C_FC_Bayern_M%C3%BCnchen_%28all-oev__190436%29_%28cropped%29.jpg",
  "karim benzema": "https://upload.wikimedia.org/wikipedia/commons/e/ec/Karim_Benzema_wearing_Real_Madrid_home_kit_2021-2022.jpg",
  "mohamed salah": "https://upload.wikimedia.org/wikipedia/commons/4/4a/Mohamed_Salah_2018.jpg",
  "kevin de bruyne": "https://upload.wikimedia.org/wikipedia/commons/4/40/Kevin_De_Bruyne_201807091.jpg",
  "zlatan ibrahimovic": "https://upload.wikimedia.org/wikipedia/commons/0/09/Zlatan_Ibrahimovi%C4%87_June_2018.jpg",
  "zlatan ibrahimović": "https://upload.wikimedia.org/wikipedia/commons/0/09/Zlatan_Ibrahimovi%C4%87_June_2018.jpg",
  "luka modric": "https://upload.wikimedia.org/wikipedia/commons/e/e9/Luka_Modri%C4%87_2018.jpg",
  "luka modrić": "https://upload.wikimedia.org/wikipedia/commons/e/e9/Luka_Modri%C4%87_2018.jpg",
  "harry kane": "https://upload.wikimedia.org/wikipedia/commons/2/2e/Harry_Kane_20181.jpg",
  "thierry henry": "https://upload.wikimedia.org/wikipedia/commons/8/81/Thierry_Henry_August_2008.jpg",
  "wayne rooney": "https://upload.wikimedia.org/wikipedia/commons/1/12/Wayne_Rooney_2020.jpg",
  "zinedine zidane": "https://upload.wikimedia.org/wikipedia/commons/f/f3/Zinedine_Zidane_by_Tasnim_03.jpg",
  "ronaldo nazario": "https://upload.wikimedia.org/wikipedia/commons/8/87/Ronaldo_Naz%C3%A1rio_2018.jpg",
  "ronaldo nazário": "https://upload.wikimedia.org/wikipedia/commons/8/87/Ronaldo_Naz%C3%A1rio_2018.jpg",
  "ronaldinho": "https://upload.wikimedia.org/wikipedia/commons/e/e8/Ronaldinho_in_2019.jpg",
  "ronaldinho gaucho": "https://upload.wikimedia.org/wikipedia/commons/e/e8/Ronaldinho_in_2019.jpg",
  "pele": "https://upload.wikimedia.org/wikipedia/commons/5/5e/Pele_con_brasil_%28cropped%29.jpg",
  "pelé": "https://upload.wikimedia.org/wikipedia/commons/5/5e/Pele_con_brasil_%28cropped%29.jpg",
  "diego maradona": "https://upload.wikimedia.org/wikipedia/commons/2/2c/Maradona-Mundial_86_con_la_copa.JPG",
  "johan cruyff": "https://upload.wikimedia.org/wikipedia/commons/6/68/Johan_Cruijff_1974_%28cropped%29.jpg",
  "johan cruijff": "https://upload.wikimedia.org/wikipedia/commons/6/68/Johan_Cruijff_1974_%28cropped%29.jpg",

  // USER CORRECTIONS & ACCURACY GUARANTEES:
  "philippe coutinho": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Philippe_Coutinho_2018.jpg/330px-Philippe_Coutinho_2018.jpg",
  "coutinho": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Philippe_Coutinho_2018.jpg/330px-Philippe_Coutinho_2018.jpg",
  "toni kroos": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/64/Toni_Kroos_Real_Madrid_2021.jpg/330px-Toni_Kroos_Real_Madrid_2021.jpg",
  "kroos": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/64/Toni_Kroos_Real_Madrid_2021.jpg/330px-Toni_Kroos_Real_Madrid_2021.jpg",
  "marco reus": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Marco_Reus_2018.jpg/330px-Marco_Reus_2018.jpg",
  "ousmane dembele": "https://upload.wikimedia.org/wikipedia/commons/2/23/Ousmane_Demb%C3%A9l%C3%A9_2018.jpg",
  "ousmane dembélé": "https://upload.wikimedia.org/wikipedia/commons/2/23/Ousmane_Demb%C3%A9l%C3%A9_2018.jpg",

  // Other Legend & Active Star Enriched Portraits
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
  "moises caicedo": "https://media.api-sports.io/football/players/162859.png",
  "wesley fofana": "https://media.api-sports.io/football/players/1458.png",
  "andre onana": "https://media.api-sports.io/football/players/532.png",
  "ederson": "https://media.api-sports.io/football/players/617.png",
  "ederson moraes": "https://media.api-sports.io/football/players/617.png",
  "anthony martial": "https://media.api-sports.io/football/players/902.png",
  "andy cole": "https://upload.wikimedia.org/wikipedia/commons/5/50/Andy_Cole_2013.jpg",
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
  "pablo sarabia": "https://media.api-sports.io/football/players/18919.png",
  "mateo kovacic": "https://media.api-sports.io/football/players/2291.png",
  "antonio nusa": "https://media.api-sports.io/football/players/313885.png",
  "paco gento": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Francisco_Gento_1960.jpg/330px-Francisco_Gento_1960.jpg",
  "emilio butragueno": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Emilio_Butrague%C3%B1o_2018.jpg/330px-Emilio_Butrague%C3%B1o_2018.jpg",
  "santillana": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Santillana_1982.jpg/330px-Santillana_1982.jpg",
  "laszlo kubala": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Ladislao_Kubala_1954.jpg/330px-Ladislao_Kubala_1954.jpg",
  "josep samitier": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Josep_Samitier_1920.jpg/330px-Josep_Samitier_1920.jpg",
  "denis law": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Denis_Law_1968.jpg/330px-Denis_Law_1968.jpg",
  "jack rowley": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Jack_Rowley_1948.jpg/330px-Jack_Rowley_1948.jpg",
  "dennis viollet": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Dennis_Viollet_1957.jpg/330px-Dennis_Viollet_1957.jpg",
  "gordon hodgson": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Gordon_Hodgson_1930.jpg/330px-Gordon_Hodgson_1930.jpg",
  "billy liddell": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Billy_Liddell_1950.jpg/330px-Billy_Liddell_1950.jpg",
  "dixie dean": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/Dixie_Dean_1930.jpg/330px-Dixie_Dean_1930.jpg",
  "aritz aduriz": "https://media.api-sports.io/football/players/47265.png",
  "munas dabbur": "https://media.api-sports.io/football/players/1453.png",
  "joao moutinho": "https://media.api-sports.io/football/players/877.png",
  "james tavernier": "https://media.api-sports.io/football/players/18166.png",
  "frank rost": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Frank_Rost_2011.jpg/330px-Frank_Rost_2011.jpg",
  "bryan robson": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Bryan_Robson_2011.jpg/330px-Bryan_Robson_2011.jpg",
  "laurent pokou": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Laurent_Pokou_1970.jpg/330px-Laurent_Pokou_1970.jpg",
  "rashidi yekini": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Rashidi_Yekini_1994.jpg/330px-Rashidi_Yekini_1994.jpg",
  "hassan el shazly": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Hassan_El-Shazly.jpg/330px-Hassan_El-Shazly.jpg",
  "peter ofori quaye": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Peter_Ofori-Quaye.jpg/330px-Peter_Ofori-Quaye.jpg",
  "gabriel agbonlahor": "https://media.api-sports.io/football/players/18850.png",
  "richard dunne": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/Richard_Dunne_2011.jpg/330px-Richard_Dunne_2011.jpg",
  "phil jagielka": "https://media.api-sports.io/football/players/18784.png",
  "thomas sorensen": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Thomas_S%C3%B8rensen_2011.jpg/330px-Thomas_S%C3%B8rensen_2011.jpg",
  "heurelho gomes": "https://media.api-sports.io/football/players/18857.png",
  "simon mignolet": "https://media.api-sports.io/football/players/282.png",
  "mark noble": "https://media.api-sports.io/football/players/293.png",
  "colin bell": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Colin_Bell_1970.jpg/330px-Colin_Bell_1970.jpg",
  "george ilenikhena": "https://media.api-sports.io/football/players/359288.png",
  "soh chin ann": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Soh_Chin_Aun_1972.jpg/330px-Soh_Chin_Aun_1972.jpg",
  "christian pulisic": "https://media.api-sports.io/football/players/2296.png",
  "bukayo saka": "https://media.api-sports.io/football/players/1468.png",
  "ryan giggs": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Ryan_Giggs_2013.jpg/330px-Ryan_Giggs_2013.jpg",
  "jan oblak": "https://media.api-sports.io/football/players/1429.png",
  "marcus rashford": "https://media.api-sports.io/football/players/909.png",
  "mario gotze": "https://media.api-sports.io/football/players/378.png",
  "mario götze": "https://media.api-sports.io/football/players/378.png",
  "christian eriksen": "https://media.api-sports.io/football/players/174.png",
  "leroy sane": "https://media.api-sports.io/football/players/629.png",
  "leroy sané": "https://media.api-sports.io/football/players/629.png",
  "marco verratti": "https://media.api-sports.io/football/players/253.png",
  "lorenzo insigne": "https://media.api-sports.io/football/players/2034.png",
  "dimitri payet": "https://media.api-sports.io/football/players/2273.png",
  "javier pastore": "https://media.api-sports.io/football/players/258.png",
  "wilfried zaha": "https://media.api-sports.io/football/players/18846.png",
  "james milner": "https://media.api-sports.io/football/players/290.png",
  "gareth barry": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Gareth_Barry_2011.jpg/330px-Gareth_Barry_2011.jpg",
  "mark schwarzer": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Mark_Schwarzer_2013.jpg/330px-Mark_Schwarzer_2013.jpg",
  "samir handanovic": "https://media.api-sports.io/football/players/1144.png",
  "samir handanović": "https://media.api-sports.io/football/players/1144.png",
  "gianluca pagliuca": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Gianluca_Pagliuca_1994.jpg/330px-Gianluca_Pagliuca_1994.jpg",
  "jose luis chilavert": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Jos%C3%A9_Luis_Chilavert_1998.jpg/330px-Jos%C3%A9_Luis_Chilavert_1998.jpg",
  "josé luis chilavert": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Jos%C3%A9_Luis_Chilavert_1998.jpg/330px-Jos%C3%A9_Luis_Chilavert_1998.jpg",
  "cafu": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/64/Cafu_-_26.02.2026_-_Cerim%C3%B4nia_de_apresenta%C3%A7%C3%A3o_das_ta%C3%A7as_da_Copa_do_Mundo_de_2026.jpg/330px-Cafu_-_26.02.2026_-_Cerim%C3%B4nia_de_apresenta%C3%A7%C3%A3o_das_ta%C3%A7as_da_Copa_do_Mundo_de_2026.jpg",
  "jude bellingham": "https://upload.wikimedia.org/wikipedia/commons/4/4b/Jude_Bellingham_2023.jpg",
  "cole palmer": "https://media.api-sports.io/football/players/152982.png",
  "florian wirtz": "https://media.api-sports.io/football/players/158694.png",
  "rodri": "https://media.api-sports.io/football/players/44.png",
  "vinicius junior": "https://upload.wikimedia.org/wikipedia/commons/f/f3/Vinicius_Junior_2021.jpg",
  "vinícius júnior": "https://upload.wikimedia.org/wikipedia/commons/f/f3/Vinicius_Junior_2021.jpg",
};

// ── 2. NATION FLAGS & CLUB BADGES ──────────────────────────────────────────

export const CURATED_CLUBS = {
  "real madrid": "https://media.api-sports.io/football/teams/541.png",
  "barcelona": "https://media.api-sports.io/football/teams/529.png",
  "fc barcelona": "https://media.api-sports.io/football/teams/529.png",
  "bayern munich": "https://media.api-sports.io/football/teams/157.png",
  "bayern münchen": "https://media.api-sports.io/football/teams/157.png",
  "manchester city": "https://media.api-sports.io/football/teams/50.png",
  "manchester united": "https://media.api-sports.io/football/teams/33.png",
  "liverpool": "https://media.api-sports.io/football/teams/40.png",
  "arsenal": "https://media.api-sports.io/football/teams/42.png",
  "chelsea": "https://media.api-sports.io/football/teams/49.png",
  "tottenham hotspur": "https://media.api-sports.io/football/teams/47.png",
  "tottenham": "https://media.api-sports.io/football/teams/47.png",
  "paris saint germain": "https://media.api-sports.io/football/teams/85.png",
  "psg": "https://media.api-sports.io/football/teams/85.png",
  "juventus": "https://media.api-sports.io/football/teams/496.png",
  "inter milan": "https://media.api-sports.io/football/teams/505.png",
  "ac milan": "https://media.api-sports.io/football/teams/489.png",
  "atletico madrid": "https://media.api-sports.io/football/teams/530.png",
  "atlético madrid": "https://media.api-sports.io/football/teams/530.png",
  "borussia dortmund": "https://media.api-sports.io/football/teams/165.png",
  "bayer leverkusen": "https://media.api-sports.io/football/teams/168.png",
  "ajax": "https://media.api-sports.io/football/teams/194.png",
  "benfica": "https://media.api-sports.io/football/teams/211.png",
  "porto": "https://media.api-sports.io/football/teams/212.png",
  "sporting cp": "https://media.api-sports.io/football/teams/228.png",
  "roma": "https://media.api-sports.io/football/teams/497.png",
  "as roma": "https://media.api-sports.io/football/teams/497.png",
  "napoli": "https://media.api-sports.io/football/teams/492.png",
  "sevilla": "https://media.api-sports.io/football/teams/536.png",
  "aston villa": "https://media.api-sports.io/football/teams/66.png",
  "newcastle united": "https://media.api-sports.io/football/teams/34.png",
  "al hilal": "https://media.api-sports.io/football/teams/2610.png",
  "al nassr": "https://media.api-sports.io/football/teams/2611.png",
  "al ittihad": "https://media.api-sports.io/football/teams/2612.png",
  "al ahly": "https://media.api-sports.io/football/teams/1030.png",
  "zamalek": "https://media.api-sports.io/football/teams/1031.png",
  "flamengo": "https://media.api-sports.io/football/teams/127.png",
  "palmeiras": "https://media.api-sports.io/football/teams/121.png",
  "santos": "https://media.api-sports.io/football/teams/128.png",
  "boca juniors": "https://media.api-sports.io/football/teams/451.png",
  "river plate": "https://media.api-sports.io/football/teams/435.png",
  "everton": "https://media.api-sports.io/football/teams/45.png",
  "west ham": "https://media.api-sports.io/football/teams/48.png",
  "west ham united": "https://media.api-sports.io/football/teams/48.png",
  "valencia": "https://media.api-sports.io/football/teams/532.png",
  "athletic bilbao": "https://media.api-sports.io/football/teams/531.png",
  "real sociedad": "https://media.api-sports.io/football/teams/548.png",
  "villarreal": "https://media.api-sports.io/football/teams/533.png",
  "monaco": "https://media.api-sports.io/football/teams/91.png",
  "as monaco": "https://media.api-sports.io/football/teams/91.png",
  "lyon": "https://media.api-sports.io/football/teams/80.png",
  "olympique lyonnais": "https://media.api-sports.io/football/teams/80.png",
  "marseille": "https://media.api-sports.io/football/teams/81.png",
  "lazio": "https://media.api-sports.io/football/teams/487.png",
  "atalanta": "https://media.api-sports.io/football/teams/499.png",
  "fiorentina": "https://media.api-sports.io/football/teams/502.png",
  "leipzig": "https://media.api-sports.io/football/teams/173.png",
  "rb leipzig": "https://media.api-sports.io/football/teams/173.png",
  "eintracht frankfurt": "https://media.api-sports.io/football/teams/169.png",
  "psv eindhoven": "https://media.api-sports.io/football/teams/197.png",
  "feyenoord": "https://media.api-sports.io/football/teams/195.png",
  "celtic": "https://media.api-sports.io/football/teams/247.png",
  "rangers": "https://media.api-sports.io/football/teams/257.png",
  "galatasaray": "https://media.api-sports.io/football/teams/645.png",
  "fenerbahce": "https://media.api-sports.io/football/teams/611.png",
  "besiktas": "https://media.api-sports.io/football/teams/558.png",
};

export const NATION_FLAGS = {
  "argentina": "https://flagcdn.com/w160/ar.png",
  "brazil": "https://flagcdn.com/w160/br.png",
  "france": "https://flagcdn.com/w160/fr.png",
  "germany": "https://flagcdn.com/w160/de.png",
  "portugal": "https://flagcdn.com/w160/pt.png",
  "spain": "https://flagcdn.com/w160/es.png",
  "england": "https://flagcdn.com/w160/gb-eng.png",
  "italy": "https://flagcdn.com/w160/it.png",
  "netherlands": "https://flagcdn.com/w160/nl.png",
  "belgium": "https://flagcdn.com/w160/be.png",
  "croatia": "https://flagcdn.com/w160/hr.png",
  "uruguay": "https://flagcdn.com/w160/uy.png",
  "egypt": "https://flagcdn.com/w160/eg.png",
  "norway": "https://flagcdn.com/w160/no.png",
  "poland": "https://flagcdn.com/w160/pl.png",
  "morocco": "https://flagcdn.com/w160/ma.png",
  "algeria": "https://flagcdn.com/w160/dz.png",
  "senegal": "https://flagcdn.com/w160/sn.png",
  "nigeria": "https://flagcdn.com/w160/ng.png",
  "cameroon": "https://flagcdn.com/w160/cm.png",
  "ghana": "https://flagcdn.com/w160/gh.png",
  "ivory coast": "https://flagcdn.com/w160/ci.png",
  "saudi arabia": "https://flagcdn.com/w160/sa.png",
  "japan": "https://flagcdn.com/w160/jp.png",
  "south korea": "https://flagcdn.com/w160/kr.png",
  "colombia": "https://flagcdn.com/w160/co.png",
  "chile": "https://flagcdn.com/w160/cl.png",
  "mexico": "https://flagcdn.com/w160/mx.png",
  "usa": "https://flagcdn.com/w160/us.png",
  "united states": "https://flagcdn.com/w160/us.png",
  "sweden": "https://flagcdn.com/w160/se.png",
  "denmark": "https://flagcdn.com/w160/dk.png",
  "switzerland": "https://flagcdn.com/w160/ch.png",
  "austria": "https://flagcdn.com/w160/at.png",
  "scotland": "https://flagcdn.com/w160/gb-sct.png",
  "wales": "https://flagcdn.com/w160/gb-wls.png",
  "northern ireland": "https://flagcdn.com/w160/gb-nir.png",
  "republic of ireland": "https://flagcdn.com/w160/ie.png",
  "ireland": "https://flagcdn.com/w160/ie.png",
  "czech republic": "https://flagcdn.com/w160/cz.png",
  "czechia": "https://flagcdn.com/w160/cz.png",
  "hungary": "https://flagcdn.com/w160/hu.png",
  "turkey": "https://flagcdn.com/w160/tr.png",
  "türkiye": "https://flagcdn.com/w160/tr.png",
  "greece": "https://flagcdn.com/w160/gr.png",
  "ukraine": "https://flagcdn.com/w160/ua.png",
  "serbia": "https://flagcdn.com/w160/rs.png",
  "bosnia and herzegovina": "https://flagcdn.com/w160/ba.png",
  "slovakia": "https://flagcdn.com/w160/sk.png",
  "slovenia": "https://flagcdn.com/w160/si.png",
  "finland": "https://flagcdn.com/w160/fi.png",
  "iceland": "https://flagcdn.com/w160/is.png",
  "tunisia": "https://flagcdn.com/w160/tn.png",
  "mali": "https://flagcdn.com/w160/ml.png",
  "south africa": "https://flagcdn.com/w160/za.png",
  "australia": "https://flagcdn.com/w160/au.png",
  "new zealand": "https://flagcdn.com/w160/nz.png",
  "canada": "https://flagcdn.com/w160/ca.png",
  "costa rica": "https://flagcdn.com/w160/cr.png",
  "ecuador": "https://flagcdn.com/w160/ec.png",
  "paraguay": "https://flagcdn.com/w160/py.png",
  "peru": "https://flagcdn.com/w160/pe.png",
  "venezuela": "https://flagcdn.com/w160/ve.png",
  "iran": "https://flagcdn.com/w160/ir.png",
  "iraq": "https://flagcdn.com/w160/iq.png",
  "qatar": "https://flagcdn.com/w160/qa.png",
  "uae": "https://flagcdn.com/w160/ae.png",
  "united arab emirates": "https://flagcdn.com/w160/ae.png",
  "kuwait": "https://flagcdn.com/w160/kw.png",
  "malaysia": "https://flagcdn.com/w160/my.png",
};

// ── 3. REORGANIZER & ENRICHER ENGINE ─────────────────────────────────────────

function normalizeKey(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function resolvePlayerImage(nameEn) {
  const norm = normalizeKey(nameEn.replace(/\s*\(\d{4}(?:–\d{2,4})?\)/g, ''));
  // 1. Direct match
  if (CURATED_PLAYERS[norm]) return CURATED_PLAYERS[norm];

  // 2. Partial match
  for (const [k, url] of Object.entries(CURATED_PLAYERS)) {
    if (norm === k || norm.includes(k) || k.includes(norm)) {
      return url;
    }
  }
  return undefined;
}

function resolveClubLogo(nameEn) {
  const norm = normalizeKey(nameEn);
  if (CURATED_CLUBS[norm]) return CURATED_CLUBS[norm];
  for (const [k, url] of Object.entries(CURATED_CLUBS)) {
    if (norm === k || norm.includes(k) || k.includes(norm)) {
      return url;
    }
  }
  return undefined;
}

function resolveFlag(nameEn) {
  const norm = normalizeKey(nameEn);
  if (NATION_FLAGS[norm]) return NATION_FLAGS[norm];
  for (const [k, url] of Object.entries(NATION_FLAGS)) {
    if (norm === k || norm.includes(k) || k.includes(norm)) {
      return url;
    }
  }
  return undefined;
}

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

// Custom cleaner JSON formatter that formats tags in a single line
function formatCleanJson(obj) {
  let str = JSON.stringify(obj, null, 2);
  str = str.replace(/"tags":\s*\[\s*([^\]]*?)\s*\]/gs, (match, inner) => {
    const tags = inner
      .split('\n')
      .map(s => s.trim().replace(/,$/, ''))
      .filter(Boolean)
      .join(', ');
    return `"tags": [${tags}]`;
  });
  return str;
}

async function main() {
  console.log('── Starting Comprehensive Rank Bank Reorganization & Enrichment ──');

  const allFiles = getAllFiles(path.join(rootDir, 'data', 'rank'));
  const allQuestionsMap = new Map();
  const seenTitles = new Map();

  let duplicatesSkipped = 0;

  for (const filePath of allFiles) {
    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    for (const q of content) {
      const titleEn = q.title.en.toLowerCase().trim();

      // Handle duplicate questions gracefully
      if (allQuestionsMap.has(q.slug)) {
        console.log(`⚠️ Skipping duplicate slug: ${q.slug}`);
        duplicatesSkipped++;
        continue;
      }

      // Check if title is duplicate with identical answers
      if (seenTitles.has(titleEn)) {
        const existing = seenTitles.get(titleEn);
        const existingAnswers = existing.answers.map(a => a.name.en).sort().join('|');
        const currentAnswers = q.answers.map(a => a.name.en).sort().join('|');
        if (existingAnswers === currentAnswers) {
          console.log(`⚠️ Skipping exact duplicate question title: "${q.title.en}"`);
          duplicatesSkipped++;
          continue;
        } else {
          // If answers are different (e.g. tier 1 vs tier 2), disambiguate title
          q.title.en = `${q.title.en} (Group B)`;
          q.title.ar = `${q.title.ar} (المجموعة الثانية)`;
        }
      }

      // Enrich all answers
      for (const ans of q.answers) {
        if (!ans.media) ans.media = { type: 'custom' };

        const nameEn = ans.name.en;
        const normName = normalizeKey(nameEn);

        // Explicit Player Fixes
        if (normName.includes('coutinho')) {
          ans.media.type = 'player';
          ans.media.primaryUrl = CURATED_PLAYERS['philippe coutinho'];
          ans.media.secondaryBadgeUrl = CURATED_CLUBS['barcelona'];
        } else if (normName.includes('kroos')) {
          ans.media.type = 'player';
          ans.media.primaryUrl = CURATED_PLAYERS['toni kroos'];
          ans.media.secondaryBadgeUrl = CURATED_CLUBS['real madrid'];
        } else if (normName.includes('reus')) {
          ans.media.type = 'player';
          ans.media.primaryUrl = CURATED_PLAYERS['marco reus'];
          ans.media.secondaryBadgeUrl = CURATED_CLUBS['borussia dortmund'];
        } else if (normName.includes('dembele') || normName.includes('dembele')) {
          ans.media.type = 'player';
          ans.media.primaryUrl = CURATED_PLAYERS['ousmane dembele'];
          ans.media.secondaryBadgeUrl = CURATED_CLUBS['barcelona'];
        } else if (ans.media.type === 'player' || q.scopeType === 'ALL_TIME' || q.scopeType === 'PLAYER_STINTS') {
          const resolvedPlayer = resolvePlayerImage(nameEn);
          if (resolvedPlayer) {
            ans.media.primaryUrl = resolvedPlayer;
          }
          if (!ans.media.secondaryBadgeUrl && ans.subText?.en) {
            const clubOrNation = resolveClubLogo(ans.subText.en) || resolveFlag(ans.subText.en);
            if (clubOrNation) ans.media.secondaryBadgeUrl = clubOrNation;
          }
        } else if (ans.media.type === 'club' || q.scopeType === 'PER_CLUB') {
          const clubLogo = resolveClubLogo(nameEn);
          if (clubLogo) ans.media.primaryUrl = clubLogo;
        } else if (ans.media.type === 'nation') {
          const flag = resolveFlag(nameEn);
          if (flag) ans.media.primaryUrl = flag;
        }
      }

      allQuestionsMap.set(q.slug, q);
      seenTitles.set(titleEn, q);
    }
  }

  console.log(`✅ Loaded and cleaned ${allQuestionsMap.size} unique questions (skipped ${duplicatesSkipped} duplicates).`);

  // Write out cleaned, enriched questions into 8 well-balanced category files
  const groupedCategories = {
    'players/modern-superstars.json': [],
    'players/legends-and-icons.json': [],
    'players/transfer-market-records.json': [],
    'players/defenders-and-goalkeepers.json': [],
    'players/playmakers-and-creators.json': [],
    'clubs/club-records-and-dynasties.json': [],
    'competitions/world-cup-and-international.json': [],
    'seasons/legendary-campaigns.json': [],
  };

  for (const q of allQuestionsMap.values()) {
    const tags = new Set(q.tags || []);

    if (q.scopeType === 'PER_SEASON' || tags.has('season-records') || tags.has('campaigns')) {
      groupedCategories['seasons/legendary-campaigns.json'].push(q);
    } else if (q.scopeType === 'TRANSFERS_MARKET' || tags.has('transfers') || tags.has('fees') || tags.has('market')) {
      groupedCategories['players/transfer-market-records.json'].push(q);
    } else if (tags.has('goalkeepers') || tags.has('defenders') || tags.has('clean-sheets') || tags.has('penalties')) {
      groupedCategories['players/defenders-and-goalkeepers.json'].push(q);
    } else if (tags.has('playmakers') || tags.has('assists') || tags.has('creative') || tags.has('chances-created')) {
      groupedCategories['players/playmakers-and-creators.json'].push(q);
    } else if (q.scopeType === 'PER_CLUB' || tags.has('ucl-clubs') || tags.has('premier-league-clubs') || tags.has('club-dynasties') || tags.has('domestic-cups') || tags.has('champions-league')) {
      groupedCategories['clubs/club-records-and-dynasties.json'].push(q);
    } else if (tags.has('world-cup') || tags.has('euro') || tags.has('copa-america') || tags.has('afcon') || tags.has('asian-cup') || tags.has('national-teams') || tags.has('tournaments')) {
      groupedCategories['competitions/world-cup-and-international.json'].push(q);
    } else if (tags.has('legends') || tags.has('icons') || tags.has('historic') || tags.has('all-time-top-scorers') || tags.has('derby') || tags.has('caps')) {
      groupedCategories['players/legends-and-icons.json'].push(q);
    } else {
      groupedCategories['players/modern-superstars.json'].push(q);
    }
  }

  // Clear existing files in data/rank and write new structured ones
  const rankDir = path.join(rootDir, 'data', 'rank');
  
  // Create directories if missing
  for (const relPath of Object.keys(groupedCategories)) {
    const fullDir = path.dirname(path.join(rankDir, relPath));
    if (!fs.existsSync(fullDir)) fs.mkdirSync(fullDir, { recursive: true });
  }

  // Write files
  for (const [relPath, list] of Object.entries(groupedCategories)) {
    const fullPath = path.join(rankDir, relPath);
    fs.writeFileSync(fullPath, formatCleanJson(list), 'utf8');
    console.log(`📁 Wrote ${list.length} questions to ${relPath}`);
  }

  // Delete leftover old fragmented files if any
  for (const oldFile of allFiles) {
    const normOld = path.normalize(oldFile);
    const isNew = Object.keys(groupedCategories).some(rel => path.normalize(path.join(rankDir, rel)) === normOld);
    if (!isNew && fs.existsSync(oldFile)) {
      fs.unlinkSync(oldFile);
    }
  }

  // Clean empty old subdirectories if any
  const subdirs = ['club-seasons', 'player-seasons', 'national-teams'];
  for (const sub of subdirs) {
    const p = path.join(rankDir, sub);
    if (fs.existsSync(p)) {
      try { fs.rmSync(p, { recursive: true, force: true }); } catch (e) {}
    }
  }

  // ── 4. REGENERATE data/rank/index.ts ────────────────────────────────────────
  const indexTsContent = `import modernSuperstars from './players/modern-superstars.json';
import legendsAndIcons from './players/legends-and-icons.json';
import transferMarketRecords from './players/transfer-market-records.json';
import defendersAndGoalkeepers from './players/defenders-and-goalkeepers.json';
import playmakersAndCreators from './players/playmakers-and-creators.json';
import clubRecordsAndDynasties from './clubs/club-records-and-dynasties.json';
import worldCupAndInternational from './competitions/world-cup-and-international.json';
import legendaryCampaigns from './seasons/legendary-campaigns.json';

export interface RankQuestionSeedItem {
  slug: string;
  scopeType: 'ALL_TIME' | 'PER_SEASON' | 'PER_CLUB' | 'PER_COMPETITION' | 'PLAYER_STINTS' | 'TRANSFERS_MARKET';
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'VERY_HARD';
  asOfDate: string;
  isActive: boolean;
  tags: string[];
  title: { en: string; ar: string };
  subtitle?: { en: string; ar: string };
  metricLabel: { en: string; ar: string };
  direction: 'asc' | 'desc';
  answers: {
    answerKey: string;
    name: { en: string; ar: string };
    subText?: { en: string; ar: string };
    media: {
      type: 'player' | 'club' | 'nation' | 'tournament' | 'custom' | 'stint';
      fallbackText?: string;
      primaryUrl?: string;
      secondaryBadgeUrl?: string;
      stintBadge?: {
        clubName: string;
        season?: string;
      };
    };
    value: number;
    valueLabel: { en: string; ar: string };
    correctRank: number;
  }[];
}

export const allRankQuestions: RankQuestionSeedItem[] = [
  ...(modernSuperstars as RankQuestionSeedItem[]),
  ...(legendsAndIcons as RankQuestionSeedItem[]),
  ...(transferMarketRecords as RankQuestionSeedItem[]),
  ...(defendersAndGoalkeepers as RankQuestionSeedItem[]),
  ...(playmakersAndCreators as RankQuestionSeedItem[]),
  ...(clubRecordsAndDynasties as RankQuestionSeedItem[]),
  ...(worldCupAndInternational as RankQuestionSeedItem[]),
  ...(legendaryCampaigns as RankQuestionSeedItem[]),
];

export const totalRankQuestionsCount = allRankQuestions.length;
`;

  fs.writeFileSync(path.join(rootDir, 'data', 'rank', 'index.ts'), indexTsContent, 'utf8');
  console.log('✅ Generated clean data/rank/index.ts');

  // ── 5. REGENERATE convex/rank/seedData.ts ───────────────────────────────────
  const convexSeedContent = `import { allRankQuestions } from "../../data/rank/index";

/**
 * Convex-compatible rank seed questions export.
 */
export const allRankSeedQuestions = allRankQuestions;
`;

  fs.writeFileSync(path.join(rootDir, 'convex', 'rank', 'seedData.ts'), convexSeedContent, 'utf8');
  console.log('✅ Generated clean convex/rank/seedData.ts');

  console.log('✨ Reorganization and asset enrichment completed successfully!');
}

main().catch(console.error);
