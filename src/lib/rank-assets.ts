/**
 * Rich visual entity assets (vector badges, colors, and crest identifiers)
 * for football clubs, nations, legends, and tournament entities.
 * Includes automatic public image mappings for players, clubs, and nations.
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

export const PLAYER_VISUALS: Record<string, EntityVisualProfile> = {
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
  "Kaká": {
    primaryColor: "#AC141B",
    secondaryColor: "#000000",
    accentColor: "#FFDF00",
    initials: "KAKA",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/d/df/Kak%C3%A1_2010.jpg",
  },
  "Petr Čech": {
    primaryColor: "#034694",
    secondaryColor: "#EF0107",
    accentColor: "#FFFFFF",
    initials: "PC1",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/e/eb/Petr_Cech_2015.jpg",
  },
  "Iker Casillas": {
    primaryColor: "#00529F",
    secondaryColor: "#AA151B",
    accentColor: "#F1BF00",
    initials: "IK1",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/9/91/Iker_Casillas_2018.jpg",
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
    primaryColor: "#000000",
    secondaryColor: "#FFFFFF",
    accentColor: "#000000",
    initials: "AS9",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/f/fc/Alan_Shearer_2018.jpg",
  },
};

export const CLUB_VISUALS: Record<string, EntityVisualProfile> = {
  // Premier League
  "Chelsea": { primaryColor: "#034694", secondaryColor: "#FFFFFF", accentColor: "#DBA111", initials: "CFC" },
  "Arsenal": { primaryColor: "#EF0107", secondaryColor: "#FFFFFF", accentColor: "#9C824A", initials: "ARS" },
  "Liverpool": { primaryColor: "#C8102E", secondaryColor: "#00B2A9", accentColor: "#F6EB61", initials: "LFC" },
  "Manchester City": { primaryColor: "#6CABDD", secondaryColor: "#1C2C5B", accentColor: "#98C5E9", initials: "MCI" },
  "Manchester United": { primaryColor: "#DA291C", secondaryColor: "#FBE122", accentColor: "#000000", initials: "MUN" },
  "Tottenham Hotspur": { primaryColor: "#132257", secondaryColor: "#FFFFFF", accentColor: "#132257", initials: "TOT" },
  "Aston Villa": { primaryColor: "#670E36", secondaryColor: "#95BFE5", accentColor: "#FEE12B", initials: "AVL" },
  "Newcastle United": { primaryColor: "#241F20", secondaryColor: "#FFFFFF", accentColor: "#41B6E6", initials: "NEW" },

  // La Liga
  "Real Madrid": { primaryColor: "#00529F", secondaryColor: "#FEBE10", accentColor: "#FFFFFF", initials: "RMA" },
  "Barcelona": { primaryColor: "#004D98", secondaryColor: "#A50044", accentColor: "#EDBB00", initials: "FCB" },
  "Atlético Madrid": { primaryColor: "#CB3524", secondaryColor: "#272E61", accentColor: "#FFFFFF", initials: "ATM" },
  "Sevilla": { primaryColor: "#D4001F", secondaryColor: "#FFFFFF", accentColor: "#D4001F", initials: "SEV" },
  "Athletic Bilbao": { primaryColor: "#EE2524", secondaryColor: "#FFFFFF", accentColor: "#000000", initials: "ATH" },
  "Valencia": { primaryColor: "#000000", secondaryColor: "#EE7500", accentColor: "#FFFFFF", initials: "VAL" },

  // Serie A
  "Juventus": { primaryColor: "#000000", secondaryColor: "#FFFFFF", accentColor: "#D4AF37", initials: "JUV" },
  "AC Milan": { primaryColor: "#AC141B", secondaryColor: "#000000", accentColor: "#FFFFFF", initials: "ACM" },
  "Inter Milan": { primaryColor: "#001489", secondaryColor: "#000000", accentColor: "#010E80", initials: "INT" },
  "AS Roma": { primaryColor: "#8E1F2F", secondaryColor: "#F0BC42", accentColor: "#1E1E1E", initials: "ROM" },
  "Napoli": { primaryColor: "#0080FF", secondaryColor: "#FFFFFF", accentColor: "#0038A8", initials: "NAP" },

  // Bundesliga
  "Bayern Munich": { primaryColor: "#DC052D", secondaryColor: "#0066B2", accentColor: "#FFFFFF", initials: "BAY" },
  "Borussia Dortmund": { primaryColor: "#FDE100", secondaryColor: "#000000", accentColor: "#FDE100", initials: "BVB" },
  "Bayer Leverkusen": { primaryColor: "#E32219", secondaryColor: "#000000", accentColor: "#FFFFFF", initials: "B04" },
  "RB Leipzig": { primaryColor: "#E30613", secondaryColor: "#FFFFFF", accentColor: "#0C1B33", initials: "RBL" },

  // Ligue 1 & Global
  "Paris Saint-Germain": { primaryColor: "#004170", secondaryColor: "#DA291C", accentColor: "#FFFFFF", initials: "PSG" },
  "Ajax": { primaryColor: "#D2122E", secondaryColor: "#FFFFFF", accentColor: "#000000", initials: "AJX" },
  "Benfica": { primaryColor: "#E30613", secondaryColor: "#FFFFFF", accentColor: "#FFE600", initials: "SLB" },
  "Porto": { primaryColor: "#0038A8", secondaryColor: "#FFFFFF", accentColor: "#D4AF37", initials: "FCP" },
  "Sporting CP": { primaryColor: "#006633", secondaryColor: "#FFFFFF", accentColor: "#D4AF37", initials: "SCP" },
  "Al Hilal": { primaryColor: "#003CA6", secondaryColor: "#FFFFFF", accentColor: "#003CA6", initials: "HIL" },
  "Al Ahly": { primaryColor: "#E30613", secondaryColor: "#FFFFFF", accentColor: "#000000", initials: "AHL" },
  "Zamalek": { primaryColor: "#FFFFFF", secondaryColor: "#E30613", accentColor: "#000000", initials: "ZAM" },
};

export const NATION_VISUALS: Record<string, EntityVisualProfile> = {
  "Brazil": { primaryColor: "#FFDF00", secondaryColor: "#009C3B", accentColor: "#002776", initials: "BRA" },
  "Germany": { primaryColor: "#000000", secondaryColor: "#DD0000", accentColor: "#FFCE00", initials: "GER" },
  "Argentina": { primaryColor: "#75AADB", secondaryColor: "#FFFFFF", accentColor: "#F6B40E", initials: "ARG" },
  "France": { primaryColor: "#002395", secondaryColor: "#FFFFFF", accentColor: "#ED2939", initials: "FRA" },
  "England": { primaryColor: "#CE1124", secondaryColor: "#FFFFFF", accentColor: "#00247D", initials: "ENG" },
  "Spain": { primaryColor: "#AA151B", secondaryColor: "#F1BF00", accentColor: "#AA151B", initials: "ESP" },
  "Italy": { primaryColor: "#0064AA", secondaryColor: "#FFFFFF", accentColor: "#009246", initials: "ITA" },
  "Netherlands": { primaryColor: "#F36C21", secondaryColor: "#FFFFFF", accentColor: "#21468B", initials: "NED" },
  "Portugal": { primaryColor: "#046A38", secondaryColor: "#DA291C", accentColor: "#FFE900", initials: "POR" },
  "Egypt": { primaryColor: "#C8102E", secondaryColor: "#000000", accentColor: "#C09300", initials: "EGY" },
  "Cameroon": { primaryColor: "#007A3D", secondaryColor: "#CE1126", accentColor: "#FCD116", initials: "CMR" },
  "Nigeria": { primaryColor: "#008751", secondaryColor: "#FFFFFF", accentColor: "#008751", initials: "NGA" },
  "Morocco": { primaryColor: "#C1272D", secondaryColor: "#006233", accentColor: "#FFFFFF", initials: "MAR" },
  "Croatia": { primaryColor: "#FF0000", secondaryColor: "#FFFFFF", accentColor: "#171796", initials: "CRO" },
  "Uruguay": { primaryColor: "#75AADB", secondaryColor: "#000000", accentColor: "#FFFFFF", initials: "URU" },
};

/**
 * Resolves visual profile (colors, initials, and public image URL) for any entity name
 */
export function getEntityVisual(name: string, type?: string): EntityVisualProfile | null {
  const normalized = name.trim();

  // 1. Direct player lookup
  if (type === "player" || type === "stint" || !type) {
    for (const [playerKey, profile] of Object.entries(PLAYER_VISUALS)) {
      if (normalized.toLowerCase().includes(playerKey.toLowerCase())) {
        return profile;
      }
    }
  }

  // 2. Direct club lookup
  if (type === "club" || !type) {
    for (const [clubKey, profile] of Object.entries(CLUB_VISUALS)) {
      if (normalized.toLowerCase().includes(clubKey.toLowerCase())) {
        return profile;
      }
    }
  }

  // 3. Direct nation lookup
  if (type === "nation" || !type) {
    for (const [nationKey, profile] of Object.entries(NATION_VISUALS)) {
      if (normalized.toLowerCase().includes(nationKey.toLowerCase())) {
        return profile;
      }
    }
  }

  return null;
}
