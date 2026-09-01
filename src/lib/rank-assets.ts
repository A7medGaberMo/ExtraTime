/**
 * Comprehensive visual entity assets (logos, crests, flags, player portraits, and colors)
 * for football players, clubs, nations, and tournaments.
 * Supports direct lookups by English or Arabic names, IDs, and type.
 */

export interface EntityVisualProfile {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  imageUrl?: string;
  badgeSvg?: string;
  customIcon?: string;
  initials: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. PLAYER VISUALS & PORTRAITS
// ─────────────────────────────────────────────────────────────────────────────
export const PLAYER_VISUALS: Record<string, EntityVisualProfile> = {
  // Global Superstars & Legends
  "Lionel Messi": {
    primaryColor: "#75AADB",
    secondaryColor: "#FFFFFF",
    accentColor: "#F6B40E",
    initials: "LM10",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/b/b4/Lionel-Messi-Argentina-2022-FIFA-World-Cup_%28cropped%29.jpg",
  },
  "Cristiano Ronaldo": {
    primaryColor: "#DA291C",
    secondaryColor: "#046A38",
    accentColor: "#FFE900",
    initials: "CR7",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/8/8c/Cristiano_Ronaldo_2018.jpg",
  },
  "Neymar": {
    primaryColor: "#009C3B",
    secondaryColor: "#FFDF00",
    accentColor: "#002776",
    initials: "NJR",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/8/83/Bra-Cos_%281%29_%28cropped%29.jpg",
  },
  "Kylian Mbappé": {
    primaryColor: "#002395",
    secondaryColor: "#FFFFFF",
    accentColor: "#ED2939",
    initials: "KM7",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/5/57/2019-07-17_SG_Dynamo_Dresden_vs._Paris_Saint-Germain_by_Sandro_Halank%E2%80%93129_%28cropped%29.jpg",
  },
  "Erling Haaland": {
    primaryColor: "#6CABDD",
    secondaryColor: "#BA0C2F",
    accentColor: "#00205B",
    initials: "EH9",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/0/07/Erling_Haaland_2023_%28cropped%29.jpg",
  },
  "Robert Lewandowski": {
    primaryColor: "#DC143C",
    secondaryColor: "#FFFFFF",
    accentColor: "#DC143C",
    initials: "RL9",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/0/03/Robert_Lewandowski%2C_FC_Bayern_M%C3%BCnchen_%28all-oev__190436%29_%28cropped%29.jpg",
  },
  "Karim Benzema": {
    primaryColor: "#00529F",
    secondaryColor: "#FEBE10",
    accentColor: "#FFFFFF",
    initials: "KB9",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/e/ec/Karim_Benzema_wearing_Real_Madrid_home_kit_2021-2022.jpg",
  },
  "Mohamed Salah": {
    primaryColor: "#C8102E",
    secondaryColor: "#000000",
    accentColor: "#C09300",
    initials: "MO11",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/4/4a/Mohamed_Salah_2018.jpg",
  },
  "Kevin De Bruyne": {
    primaryColor: "#6CABDD",
    secondaryColor: "#E30613",
    accentColor: "#FFE600",
    initials: "KDB",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/4/40/Kevin_De_Bruyne_201807091.jpg",
  },
  "Zlatan Ibrahimović": {
    primaryColor: "#AC141B",
    secondaryColor: "#000000",
    accentColor: "#FFE900",
    initials: "IBRA",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/0/09/Zlatan_Ibrahimovi%C4%87_June_2018.jpg",
  },
  "Luka Modrić": {
    primaryColor: "#FF0000",
    secondaryColor: "#FFFFFF",
    accentColor: "#00529F",
    initials: "LM10",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/e/e9/Luka_Modri%C4%87_2018.jpg",
  },
  "Antoine Griezmann": {
    primaryColor: "#CB3524",
    secondaryColor: "#1B325F",
    accentColor: "#FFFFFF",
    initials: "AG7",
    imageUrl: "https://media.api-sports.io/football/players/56.png",
  },
  "Harry Kane": {
    primaryColor: "#CE1124",
    secondaryColor: "#FFFFFF",
    accentColor: "#00247D",
    initials: "HK9",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/2/2e/Harry_Kane_20181.jpg",
  },
  "Thierry Henry": {
    primaryColor: "#EF0107",
    secondaryColor: "#FFFFFF",
    accentColor: "#002395",
    initials: "TH14",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/8/81/Thierry_Henry_August_2008.jpg",
  },
  "Wayne Rooney": {
    primaryColor: "#DA291C",
    secondaryColor: "#000000",
    accentColor: "#FFFFFF",
    initials: "WR10",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/1/12/Wayne_Rooney_2020.jpg",
  },
  "Zinedine Zidane": {
    primaryColor: "#002395",
    secondaryColor: "#00529F",
    accentColor: "#FFFFFF",
    initials: "ZZ",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/f/f3/Zinedine_Zidane_by_Tasnim_03.jpg",
  },
  "Ronaldo Nazário": {
    primaryColor: "#FFDF00",
    secondaryColor: "#009C3B",
    accentColor: "#002776",
    initials: "R9",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/8/87/Ronaldo_Naz%C3%A1rio_2018.jpg",
  },
  "Ronaldinho": {
    primaryColor: "#FFDF00",
    secondaryColor: "#004D98",
    accentColor: "#A50044",
    initials: "R10",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/e/e8/Ronaldinho_in_2019.jpg",
  },
  "Pelé": {
    primaryColor: "#FFDF00",
    secondaryColor: "#009C3B",
    accentColor: "#002776",
    initials: "PELE",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Pele_con_brasil_%28cropped%29.jpg",
  },
  "Diego Maradona": {
    primaryColor: "#75AADB",
    secondaryColor: "#FFFFFF",
    accentColor: "#0080FF",
    initials: "D10S",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/4/48/Argentina_celebrando_copa_%28cropped%29.jpg",
  },
  "Johan Cruyff": {
    primaryColor: "#F36C21",
    secondaryColor: "#004D98",
    accentColor: "#FFFFFF",
    initials: "JC14",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/e/ea/Johan_Cruyff_1974c.jpg",
  },
  "Kaká": {
    primaryColor: "#AC141B",
    secondaryColor: "#000000",
    accentColor: "#FFDF00",
    initials: "KAKA",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/d/df/Kak%C3%A1_2010.jpg",
  },
  "Andrés Iniesta": {
    primaryColor: "#004D98",
    secondaryColor: "#A50044",
    accentColor: "#AA151B",
    initials: "AI8",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/6/67/Andr%C3%A9s_Iniesta.jpg",
  },
  "Xavi Hernández": {
    primaryColor: "#004D98",
    secondaryColor: "#A50044",
    accentColor: "#EDBB00",
    initials: "X6",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/5/52/Xavi_Hernandez_2011.jpg",
  },
  "Sergio Ramos": {
    primaryColor: "#00529F",
    secondaryColor: "#AA151B",
    accentColor: "#FEBE10",
    initials: "SR4",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/0/07/Sergio_Ramos_2018.jpg",
  },
  "Virgil van Dijk": {
    primaryColor: "#C8102E",
    secondaryColor: "#F36C21",
    accentColor: "#FFFFFF",
    initials: "VVD",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/1/1d/Virgil_van_Dijk_2021.jpg",
  },
  "Jude Bellingham": {
    primaryColor: "#00529F",
    secondaryColor: "#FEBE10",
    accentColor: "#FFFFFF",
    initials: "JB5",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/4/4b/Jude_Bellingham_2023.jpg",
  },
  "Vinícius Júnior": {
    primaryColor: "#00529F",
    secondaryColor: "#FEBE10",
    accentColor: "#FFDF00",
    initials: "VJR",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/f/f3/Vinicius_Junior_2021.jpg",
  },
  "Manuel Neuer": {
    primaryColor: "#DC052D",
    secondaryColor: "#000000",
    accentColor: "#FFFFFF",
    initials: "MN1",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/1/10/Manuel_Neuer_2018.jpg",
  },
  "Gianluigi Buffon": {
    primaryColor: "#000000",
    secondaryColor: "#0064AA",
    accentColor: "#D4AF37",
    initials: "GIGI",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/2/26/Gianluigi_Buffon_%2831818228963%29_%28cropped%29.jpg",
  },
  "Iker Casillas": {
    primaryColor: "#00529F",
    secondaryColor: "#AA151B",
    accentColor: "#F1BF00",
    initials: "IK1",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/9/91/Iker_Casillas_2018.jpg",
  },
  "Petr Čech": {
    primaryColor: "#034694",
    secondaryColor: "#EF0107",
    accentColor: "#FFFFFF",
    initials: "PC1",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/e/eb/Petr_Cech_2015.jpg",
  },
  "Samuel Eto'o": {
    primaryColor: "#007A3D",
    secondaryColor: "#CE1126",
    accentColor: "#FCD116",
    initials: "SE9",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/7/75/Samuel_Eto%27o_2018.jpg",
  },
  "Didier Drogba": {
    primaryColor: "#F77F00",
    secondaryColor: "#009E60",
    accentColor: "#FFFFFF",
    initials: "DD11",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/d/db/Didier_Drogba_2014.jpg",
  },
  "Luis Suárez": {
    primaryColor: "#004D98",
    secondaryColor: "#75AADB",
    accentColor: "#FFFFFF",
    initials: "LS9",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/8/81/Luis_Suarez_2018.jpg",
  },
  "Alan Shearer": {
    primaryColor: "#241F20",
    secondaryColor: "#FFFFFF",
    accentColor: "#000000",
    initials: "AS9",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/f/fc/Alan_Shearer_2018.jpg",
  },
  "Sergio Agüero": {
    primaryColor: "#6CABDD",
    secondaryColor: "#75AADB",
    accentColor: "#FFFFFF",
    initials: "KUN",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/d/d4/Sergio_Ag%C3%BCero_2018.jpg",
  },
  "Romelu Lukaku": {
    primaryColor: "#001489",
    secondaryColor: "#E30613",
    accentColor: "#FFE600",
    initials: "RL9",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/f/fb/Romelu_Lukaku_2018.jpg",
  },
  "Álvaro Morata": {
    primaryColor: "#AA151B",
    secondaryColor: "#CB3524",
    accentColor: "#FFFFFF",
    initials: "AM7",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/4/4c/%C3%81lvaro_Morata_2018.jpg",
  },
  "Ousmane Dembélé": {
    primaryColor: "#004170",
    secondaryColor: "#002395",
    accentColor: "#FFFFFF",
    initials: "OD7",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/2/23/Ousmane_Demb%C3%A9l%C3%A9_2018.jpg",
  },
  "Son Heung-min": {
    primaryColor: "#132257",
    secondaryColor: "#0047A0",
    accentColor: "#CD2E3A",
    initials: "SON7",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/c/c1/Son_Heung-min_2018.jpg",
  },
  "Sadio Mané": {
    primaryColor: "#00853F",
    secondaryColor: "#FDEF42",
    accentColor: "#E31B23",
    initials: "SM10",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/7/7b/Sadio_Man%C3%A9_2018.jpg",
  },
  "Riyad Mahrez": {
    primaryColor: "#006233",
    secondaryColor: "#FFFFFF",
    accentColor: "#D21034",
    initials: "RM26",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/4/4e/Riyad_Mahrez_2018.jpg",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. CLUB VISUALS & OFFICIAL LOGOS (API-Sports CDN + High-Res Crests)
// ─────────────────────────────────────────────────────────────────────────────
export const CLUB_VISUALS: Record<string, EntityVisualProfile> = {
  // Premier League
  "Manchester City": {
    primaryColor: "#6CABDD",
    secondaryColor: "#1C2C5B",
    accentColor: "#98C5E9",
    initials: "MCI",
    imageUrl: "https://media.api-sports.io/football/teams/50.png",
  },
  "Arsenal": {
    primaryColor: "#EF0107",
    secondaryColor: "#FFFFFF",
    accentColor: "#9C824A",
    initials: "ARS",
    imageUrl: "https://media.api-sports.io/football/teams/42.png",
  },
  "Liverpool": {
    primaryColor: "#C8102E",
    secondaryColor: "#00B2A9",
    accentColor: "#F6EB61",
    initials: "LFC",
    imageUrl: "https://media.api-sports.io/football/teams/40.png",
  },
  "Chelsea": {
    primaryColor: "#034694",
    secondaryColor: "#FFFFFF",
    accentColor: "#DBA111",
    initials: "CFC",
    imageUrl: "https://media.api-sports.io/football/teams/49.png",
  },
  "Manchester United": {
    primaryColor: "#DA291C",
    secondaryColor: "#FBE122",
    accentColor: "#000000",
    initials: "MUN",
    imageUrl: "https://media.api-sports.io/football/teams/33.png",
  },
  "Tottenham Hotspur": {
    primaryColor: "#132257",
    secondaryColor: "#FFFFFF",
    accentColor: "#132257",
    initials: "TOT",
    imageUrl: "https://media.api-sports.io/football/teams/47.png",
  },
  "Aston Villa": {
    primaryColor: "#670E36",
    secondaryColor: "#95BFE5",
    accentColor: "#FEE12B",
    initials: "AVL",
    imageUrl: "https://media.api-sports.io/football/teams/66.png",
  },
  "Newcastle United": {
    primaryColor: "#241F20",
    secondaryColor: "#FFFFFF",
    accentColor: "#41B6E6",
    initials: "NEW",
    imageUrl: "https://media.api-sports.io/football/teams/34.png",
  },
  "Everton": {
    primaryColor: "#003399",
    secondaryColor: "#FFFFFF",
    accentColor: "#003399",
    initials: "EVE",
    imageUrl: "https://media.api-sports.io/football/teams/45.png",
  },
  "West Ham United": {
    primaryColor: "#7A263A",
    secondaryColor: "#1BB1E7",
    accentColor: "#F3D459",
    initials: "WHU",
    imageUrl: "https://media.api-sports.io/football/teams/48.png",
  },

  // La Liga
  "Real Madrid": {
    primaryColor: "#00529F",
    secondaryColor: "#FEBE10",
    accentColor: "#FFFFFF",
    initials: "RMA",
    imageUrl: "https://media.api-sports.io/football/teams/541.png",
  },
  "Barcelona": {
    primaryColor: "#004D98",
    secondaryColor: "#A50044",
    accentColor: "#EDBB00",
    initials: "FCB",
    imageUrl: "https://media.api-sports.io/football/teams/529.png",
  },
  "Atlético Madrid": {
    primaryColor: "#CB3524",
    secondaryColor: "#272E61",
    accentColor: "#FFFFFF",
    initials: "ATM",
    imageUrl: "https://media.api-sports.io/football/teams/530.png",
  },
  "Sevilla": {
    primaryColor: "#D4001F",
    secondaryColor: "#FFFFFF",
    accentColor: "#D4001F",
    initials: "SEV",
    imageUrl: "https://media.api-sports.io/football/teams/536.png",
  },
  "Athletic Bilbao": {
    primaryColor: "#EE2524",
    secondaryColor: "#FFFFFF",
    accentColor: "#000000",
    initials: "ATH",
    imageUrl: "https://media.api-sports.io/football/teams/531.png",
  },
  "Valencia": {
    primaryColor: "#000000",
    secondaryColor: "#EE7500",
    accentColor: "#FFFFFF",
    initials: "VAL",
    imageUrl: "https://media.api-sports.io/football/teams/532.png",
  },
  "Villarreal": {
    primaryColor: "#00529F",
    secondaryColor: "#FFE600",
    accentColor: "#FFE600",
    initials: "VIL",
    imageUrl: "https://media.api-sports.io/football/teams/533.png",
  },

  // Serie A
  "Juventus": {
    primaryColor: "#000000",
    secondaryColor: "#FFFFFF",
    accentColor: "#D4AF37",
    initials: "JUV",
    imageUrl: "https://media.api-sports.io/football/teams/496.png",
  },
  "AC Milan": {
    primaryColor: "#AC141B",
    secondaryColor: "#000000",
    accentColor: "#FFFFFF",
    initials: "ACM",
    imageUrl: "https://media.api-sports.io/football/teams/489.png",
  },
  "Inter Milan": {
    primaryColor: "#001489",
    secondaryColor: "#000000",
    accentColor: "#010E80",
    initials: "INT",
    imageUrl: "https://media.api-sports.io/football/teams/505.png",
  },
  "AS Roma": {
    primaryColor: "#8E1F2F",
    secondaryColor: "#F0BC42",
    accentColor: "#1E1E1E",
    initials: "ROM",
    imageUrl: "https://media.api-sports.io/football/teams/497.png",
  },
  "Napoli": {
    primaryColor: "#0080FF",
    secondaryColor: "#FFFFFF",
    accentColor: "#0038A8",
    initials: "NAP",
    imageUrl: "https://media.api-sports.io/football/teams/492.png",
  },

  // Bundesliga
  "Bayern Munich": {
    primaryColor: "#DC052D",
    secondaryColor: "#0066B2",
    accentColor: "#FFFFFF",
    initials: "BAY",
    imageUrl: "https://media.api-sports.io/football/teams/157.png",
  },
  "Borussia Dortmund": {
    primaryColor: "#FDE100",
    secondaryColor: "#000000",
    accentColor: "#FDE100",
    initials: "BVB",
    imageUrl: "https://media.api-sports.io/football/teams/165.png",
  },
  "Bayer Leverkusen": {
    primaryColor: "#E32219",
    secondaryColor: "#000000",
    accentColor: "#FFFFFF",
    initials: "B04",
    imageUrl: "https://media.api-sports.io/football/teams/168.png",
  },
  "RB Leipzig": {
    primaryColor: "#E30613",
    secondaryColor: "#FFFFFF",
    accentColor: "#0C1B33",
    initials: "RBL",
    imageUrl: "https://media.api-sports.io/football/teams/173.png",
  },

  // Ligue 1 & Global
  "Paris Saint-Germain": {
    primaryColor: "#004170",
    secondaryColor: "#DA291C",
    accentColor: "#FFFFFF",
    initials: "PSG",
    imageUrl: "https://media.api-sports.io/football/teams/85.png",
  },
  "Ajax": {
    primaryColor: "#D2122E",
    secondaryColor: "#FFFFFF",
    accentColor: "#000000",
    initials: "AJX",
    imageUrl: "https://media.api-sports.io/football/teams/194.png",
  },
  "Benfica": {
    primaryColor: "#E30613",
    secondaryColor: "#FFFFFF",
    accentColor: "#FFE600",
    initials: "SLB",
    imageUrl: "https://media.api-sports.io/football/teams/211.png",
  },
  "Porto": {
    primaryColor: "#0038A8",
    secondaryColor: "#FFFFFF",
    accentColor: "#D4AF37",
    initials: "FCP",
    imageUrl: "https://media.api-sports.io/football/teams/212.png",
  },
  "Sporting CP": {
    primaryColor: "#006633",
    secondaryColor: "#FFFFFF",
    accentColor: "#D4AF37",
    initials: "SCP",
    imageUrl: "https://media.api-sports.io/football/teams/228.png",
  },

  // Arab & South American Giants
  "Al Ahly": {
    primaryColor: "#E30613",
    secondaryColor: "#FFFFFF",
    accentColor: "#D4AF37",
    initials: "AHL",
    imageUrl: "https://media.api-sports.io/football/teams/1030.png",
  },
  "Zamalek": {
    primaryColor: "#FFFFFF",
    secondaryColor: "#E30613",
    accentColor: "#000000",
    initials: "ZAM",
    imageUrl: "https://media.api-sports.io/football/teams/1031.png",
  },
  "Al Hilal": {
    primaryColor: "#003CA6",
    secondaryColor: "#FFFFFF",
    accentColor: "#003CA6",
    initials: "HIL",
    imageUrl: "https://media.api-sports.io/football/teams/2939.png",
  },
  "Al Nassr": {
    primaryColor: "#FFE600",
    secondaryColor: "#003CA6",
    accentColor: "#003CA6",
    initials: "NAS",
    imageUrl: "https://media.api-sports.io/football/teams/2932.png",
  },
  "Al Ittihad": {
    primaryColor: "#FFE600",
    secondaryColor: "#000000",
    accentColor: "#FFE600",
    initials: "ITT",
    imageUrl: "https://media.api-sports.io/football/teams/2938.png",
  },
  "Santos FC": {
    primaryColor: "#000000",
    secondaryColor: "#FFFFFF",
    accentColor: "#D4AF37",
    initials: "SAN",
    imageUrl: "https://media.api-sports.io/football/teams/128.png",
  },
  "Boca Juniors": {
    primaryColor: "#0038A8",
    secondaryColor: "#FFD100",
    accentColor: "#0038A8",
    initials: "BOC",
    imageUrl: "https://media.api-sports.io/football/teams/451.png",
  },
  "River Plate": {
    primaryColor: "#FFFFFF",
    secondaryColor: "#E30613",
    accentColor: "#000000",
    initials: "RIV",
    imageUrl: "https://media.api-sports.io/football/teams/435.png",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. NATION VISUALS & FLAGS (FlagCDN High-Res 80px Vector/PNG)
// ─────────────────────────────────────────────────────────────────────────────
export const NATION_VISUALS: Record<string, EntityVisualProfile> = {
  "Brazil": { primaryColor: "#FFDF00", secondaryColor: "#009C3B", accentColor: "#002776", initials: "BRA", imageUrl: "https://flagcdn.com/w80/br.png" },
  "Argentina": { primaryColor: "#75AADB", secondaryColor: "#FFFFFF", accentColor: "#F6B40E", initials: "ARG", imageUrl: "https://flagcdn.com/w80/ar.png" },
  "Portugal": { primaryColor: "#046A38", secondaryColor: "#DA291C", accentColor: "#FFE900", initials: "POR", imageUrl: "https://flagcdn.com/w80/pt.png" },
  "France": { primaryColor: "#002395", secondaryColor: "#FFFFFF", accentColor: "#ED2939", initials: "FRA", imageUrl: "https://flagcdn.com/w80/fr.png" },
  "Germany": { primaryColor: "#000000", secondaryColor: "#DD0000", accentColor: "#FFCE00", initials: "GER", imageUrl: "https://flagcdn.com/w80/de.png" },
  "Spain": { primaryColor: "#AA151B", secondaryColor: "#F1BF00", accentColor: "#AA151B", initials: "ESP", imageUrl: "https://flagcdn.com/w80/es.png" },
  "England": { primaryColor: "#CE1124", secondaryColor: "#FFFFFF", accentColor: "#00247D", initials: "ENG", imageUrl: "https://flagcdn.com/w80/gb-eng.png" },
  "Italy": { primaryColor: "#0064AA", secondaryColor: "#FFFFFF", accentColor: "#009246", initials: "ITA", imageUrl: "https://flagcdn.com/w80/it.png" },
  "Netherlands": { primaryColor: "#F36C21", secondaryColor: "#FFFFFF", accentColor: "#21468B", initials: "NED", imageUrl: "https://flagcdn.com/w80/nl.png" },
  "Belgium": { primaryColor: "#000000", secondaryColor: "#E30613", accentColor: "#FFE600", initials: "BEL", imageUrl: "https://flagcdn.com/w80/be.png" },
  "Croatia": { primaryColor: "#FF0000", secondaryColor: "#FFFFFF", accentColor: "#171796", initials: "CRO", imageUrl: "https://flagcdn.com/w80/hr.png" },
  "Uruguay": { primaryColor: "#75AADB", secondaryColor: "#000000", accentColor: "#FFFFFF", initials: "URU", imageUrl: "https://flagcdn.com/w80/uy.png" },
  "Egypt": { primaryColor: "#C8102E", secondaryColor: "#000000", accentColor: "#C09300", initials: "EGY", imageUrl: "https://flagcdn.com/w80/eg.png" },
  "Morocco": { primaryColor: "#C1272D", secondaryColor: "#006233", accentColor: "#FFFFFF", initials: "MAR", imageUrl: "https://flagcdn.com/w80/ma.png" },
  "Algeria": { primaryColor: "#006233", secondaryColor: "#FFFFFF", accentColor: "#D21034", initials: "ALG", imageUrl: "https://flagcdn.com/w80/dz.png" },
  "Saudi Arabia": { primaryColor: "#006C35", secondaryColor: "#FFFFFF", accentColor: "#006C35", initials: "KSA", imageUrl: "https://flagcdn.com/w80/sa.png" },
  "Cameroon": { primaryColor: "#007A3D", secondaryColor: "#CE1126", accentColor: "#FCD116", initials: "CMR", imageUrl: "https://flagcdn.com/w80/cm.png" },
  "Nigeria": { primaryColor: "#008751", secondaryColor: "#FFFFFF", accentColor: "#008751", initials: "NGA", imageUrl: "https://flagcdn.com/w80/ng.png" },
  "Senegal": { primaryColor: "#00853F", secondaryColor: "#FDEF42", accentColor: "#E31B23", initials: "SEN", imageUrl: "https://flagcdn.com/w80/sn.png" },
  "Ivory Coast": { primaryColor: "#F77F00", secondaryColor: "#009E60", accentColor: "#FFFFFF", initials: "CIV", imageUrl: "https://flagcdn.com/w80/ci.png" },
  "Ghana": { primaryColor: "#006B3F", secondaryColor: "#FCD116", accentColor: "#CE1126", initials: "GHA", imageUrl: "https://flagcdn.com/w80/gh.png" },
  "Japan": { primaryColor: "#000080", secondaryColor: "#BC002D", accentColor: "#FFFFFF", initials: "JPN", imageUrl: "https://flagcdn.com/w80/jp.png" },
  "South Korea": { primaryColor: "#CD2E3A", secondaryColor: "#0047A0", accentColor: "#000000", initials: "KOR", imageUrl: "https://flagcdn.com/w80/kr.png" },
  "Iran": { primaryColor: "#239F40", secondaryColor: "#DA0000", accentColor: "#FFFFFF", initials: "IRN", imageUrl: "https://flagcdn.com/w80/ir.png" },
  "India": { primaryColor: "#FF9933", secondaryColor: "#138808", accentColor: "#000080", initials: "IND", imageUrl: "https://flagcdn.com/w80/in.png" },
  "Malaysia": { primaryColor: "#CC0000", secondaryColor: "#000066", accentColor: "#FFCC00", initials: "MAS", imageUrl: "https://flagcdn.com/w80/my.png" },
  "United States": { primaryColor: "#002868", secondaryColor: "#BF0A30", accentColor: "#FFFFFF", initials: "USA", imageUrl: "https://flagcdn.com/w80/us.png" },
  "Poland": { primaryColor: "#DC143C", secondaryColor: "#FFFFFF", accentColor: "#DC143C", initials: "POL", imageUrl: "https://flagcdn.com/w80/pl.png" },
  "Sweden": { primaryColor: "#006AA7", secondaryColor: "#FECC00", accentColor: "#006AA7", initials: "SWE", imageUrl: "https://flagcdn.com/w80/se.png" },
  "Norway": { primaryColor: "#BA0C2F", secondaryColor: "#00205B", accentColor: "#FFFFFF", initials: "NOR", imageUrl: "https://flagcdn.com/w80/no.png" },
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. ARABIC & ENGLISH ALIAS MAPPINGS (Ensures seamless resolution across languages)
// ─────────────────────────────────────────────────────────────────────────────
const ENTITY_ALIASES: Record<string, string> = {
  // Players (Arabic -> Standard English Name)
  "ليونيل ميسي": "Lionel Messi",
  "ميسي": "Lionel Messi",
  "كريستيانو رونالدو": "Cristiano Ronaldo",
  "رونالدو": "Cristiano Ronaldo",
  "نيمار": "Neymar",
  "نيمار دا سيلفا": "Neymar",
  "كيليان مبابي": "Kylian Mbappé",
  "مبابي": "Kylian Mbappé",
  "إيرلينج هالاند": "Erling Haaland",
  "هالاند": "Erling Haaland",
  "روبرت ليفاندوفسكي": "Robert Lewandowski",
  "ليفاندوفسكي": "Robert Lewandowski",
  "كريم بنزيما": "Karim Benzema",
  "بنزيما": "Karim Benzema",
  "محمد صلاح": "Mohamed Salah",
  "صلاح": "Mohamed Salah",
  "كيفين دي بروين": "Kevin De Bruyne",
  "دي بروين": "Kevin De Bruyne",
  "زلاتان إبراهيموفيتش": "Zlatan Ibrahimović",
  "إبراهيموفيتش": "Zlatan Ibrahimović",
  "لوكا مودريتش": "Luka Modrić",
  "مودريتش": "Luka Modrić",
  "أنطوان جريزمان": "Antoine Griezmann",
  "جريزمان": "Antoine Griezmann",
  "انطوان جريزمان": "Antoine Griezmann",
  "هاري كين": "Harry Kane",
  "تيري هنري": "Thierry Henry",
  "هنري": "Thierry Henry",
  "واين روني": "Wayne Rooney",
  "روني": "Wayne Rooney",
  "زين الدين زيدان": "Zinedine Zidane",
  "زيدان": "Zinedine Zidane",
  "رونالدو الظاهرة": "Ronaldo Nazário",
  "رونالدو البرازيلي": "Ronaldo Nazário",
  "رونالدينيو": "Ronaldinho",
  "بيليه": "Pelé",
  "دييجو مارادونا": "Diego Maradona",
  "مارادونا": "Diego Maradona",
  "يوهان كرويف": "Johan Cruyff",
  "كرويف": "Johan Cruyff",
  "كاكا": "Kaká",
  "أندريس إنييستا": "Andrés Iniesta",
  "إنييستا": "Andrés Iniesta",
  "تشافي هيرنانديز": "Xavi Hernández",
  "تشافي": "Xavi Hernández",
  "سيرجيو راموس": "Sergio Ramos",
  "راموس": "Sergio Ramos",
  "فيرجيل فان دايك": "Virgil van Dijk",
  "فان دايك": "Virgil van Dijk",
  "جود بيلينجهام": "Jude Bellingham",
  "بيلينجهام": "Jude Bellingham",
  "فينيسيوس جونيور": "Vinícius Júnior",
  "فينيسيوس": "Vinícius Júnior",
  "مانويل نوير": "Manuel Neuer",
  "نوير": "Manuel Neuer",
  "جانلويجي بوفون": "Gianluigi Buffon",
  "بوفون": "Gianluigi Buffon",
  "إيكر كاسياس": "Iker Casillas",
  "كاسياس": "Iker Casillas",
  "بيتر تشيك": "Petr Čech",
  "صامويل إيتو": "Samuel Eto'o",
  "إيتو": "Samuel Eto'o",
  "ديدييه دروجبا": "Didier Drogba",
  "دروجبا": "Didier Drogba",
  "لويس سواريز": "Luis Suárez",
  "سواريز": "Luis Suárez",
  "ألان شيرار": "Alan Shearer",
  "سيرجيو أجويرو": "Sergio Agüero",
  "أجويرو": "Sergio Agüero",
  "روميلو لوكاكو": "Romelu Lukaku",
  "لوكاكو": "Romelu Lukaku",
  "ألفارو موراتا": "Álvaro Morata",
  "موراتا": "Álvaro Morata",
  "عثمان ديمبيلي": "Ousmane Dembélé",
  "ديمبيلي": "Ousmane Dembélé",
  "سون هيونج مين": "Son Heung-min",
  "ساديو ماني": "Sadio Mané",
  "ماني": "Sadio Mané",
  "رياض محرز": "Riyad Mahrez",
  "محرز": "Riyad Mahrez",
  "علي دائي": "Iran",
  "سونيل تشيتري": "India",
  "مختار دهاري": "Malaysia",

  // Clubs (Arabic -> Standard English Name)
  "ريال مدريد": "Real Madrid",
  "برشلونة": "Barcelona",
  "أتلتيكو مدريد": "Atlético Madrid",
  "إشبيلية": "Sevilla",
  "أتلتيك بيلباو": "Athletic Bilbao",
  "فالنسيا": "Valencia",
  "مانشستر سيتي": "Manchester City",
  "مانشستر يونايتد": "Manchester United",
  "أرسنال": "Arsenal",
  "ليفربول": "Liverpool",
  "تشيلسي": "Chelsea",
  "توتنهام": "Tottenham Hotspur",
  "أستون فيلا": "Aston Villa",
  "نيوكاسل يونايتد": "Newcastle United",
  "بايرن ميونخ": "Bayern Munich",
  "بوروسيا دورتموند": "Borussia Dortmund",
  "باير ليفركوزن": "Bayer Leverkusen",
  "لايبزيج": "RB Leipzig",
  "يوفنتوس": "Juventus",
  "إيه سي ميلان": "AC Milan",
  "ميلان": "AC Milan",
  "إنتر ميلان": "Inter Milan",
  "إنتر": "Inter Milan",
  "روما": "AS Roma",
  "نابولي": "Napoli",
  "باريس سان جيرمان": "Paris Saint-Germain",
  "أياكس": "Ajax",
  "بنفيكا": "Benfica",
  "بورتو": "Porto",
  "سبورتينج لشبونة": "Sporting CP",
  "الأهلي": "Al Ahly",
  "الزمالك": "Zamalek",
  "الهلال": "Al Hilal",
  "النصر": "Al Nassr",
  "الاتحاد": "Al Ittihad",
  "بوكا جونيورز": "Boca Juniors",
  "ريفر بليت": "River Plate",
  "سانتوس": "Santos FC",

  // Nations (Arabic -> Standard English Name)
  "البرازيل": "Brazil",
  "الأرجنتين": "Argentina",
  "البرتغال": "Portugal",
  "فرنسا": "France",
  "ألمانيا": "Germany",
  "إسبانيا": "Spain",
  "إنجلترا": "England",
  "إيطاليا": "Italy",
  "هولندا": "Netherlands",
  "بلجيكا": "Belgium",
  "كرواتيا": "Croatia",
  "الأوروجواي": "Uruguay",
  "أوروجواي": "Uruguay",
  "مصر": "Egypt",
  "المغرب": "Morocco",
  "الجزائر": "Algeria",
  "السعودية": "Saudi Arabia",
  "الكاميرون": "Cameroon",
  "نيجيريا": "Nigeria",
  "السنغال": "Senegal",
  "كوت ديفوار": "Ivory Coast",
  "غانا": "Ghana",
  "اليابان": "Japan",
  "كوريا الجنوبية": "South Korea",
  "إيران": "Iran",
  "الهند": "India",
  "ماليزيا": "Malaysia",
  "الولايات المتحدة": "United States",
  "بولندا": "Poland",
  "السويد": "Sweden",
  "النرويج": "Norway",
};

/**
 * Resolves visual profile (colors, initials, and public image URL) for any entity name
 * Supports English names, Arabic names, normalized tokens, and entity types.
 */
export function getEntityVisual(name: string, type?: string): EntityVisualProfile | null {
  if (!name) return null;
  const raw = name.trim();

  // 1. Check direct alias translation
  const mappedName = ENTITY_ALIASES[raw] || raw;

  // 2. Direct player lookup
  if (type === "player" || type === "stint" || !type) {
    if (PLAYER_VISUALS[mappedName]) return PLAYER_VISUALS[mappedName];
    for (const [playerKey, profile] of Object.entries(PLAYER_VISUALS)) {
      if (
        mappedName.toLowerCase().includes(playerKey.toLowerCase()) ||
        playerKey.toLowerCase().includes(mappedName.toLowerCase())
      ) {
        return profile;
      }
    }
  }

  // 3. Direct club lookup
  if (type === "club" || !type) {
    if (CLUB_VISUALS[mappedName]) return CLUB_VISUALS[mappedName];
    for (const [clubKey, profile] of Object.entries(CLUB_VISUALS)) {
      if (
        mappedName.toLowerCase().includes(clubKey.toLowerCase()) ||
        clubKey.toLowerCase().includes(mappedName.toLowerCase())
      ) {
        return profile;
      }
    }
  }

  // 4. Direct nation lookup
  if (type === "nation" || !type) {
    if (NATION_VISUALS[mappedName]) return NATION_VISUALS[mappedName];
    for (const [nationKey, profile] of Object.entries(NATION_VISUALS)) {
      if (
        mappedName.toLowerCase().includes(nationKey.toLowerCase()) ||
        nationKey.toLowerCase().includes(mappedName.toLowerCase())
      ) {
        return profile;
      }
    }
  }

  // 5. Fallback generic check across all collections
  if (PLAYER_VISUALS[mappedName]) return PLAYER_VISUALS[mappedName];
  if (CLUB_VISUALS[mappedName]) return CLUB_VISUALS[mappedName];
  if (NATION_VISUALS[mappedName]) return NATION_VISUALS[mappedName];

  return null;
}
