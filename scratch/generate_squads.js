const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, '..', 'data', 'players', 'active');

const squads = {
  'la-liga': {
    'real-madrid': [
      { name: "Kylian Mbappé", position: "ST", nation: "France", tier: "ELITE_PLUS", kitNumber: 9 },
      { name: "Vinícius Júnior", position: "LW", nation: "Brazil", tier: "ELITE_PLUS", kitNumber: 7 },
      { name: "Jude Bellingham", position: "CAM", nation: "England", tier: "ELITE_PLUS", kitNumber: 5 },
      { name: "Federico Valverde", position: "CM", nation: "Uruguay", tier: "ELITE", kitNumber: 8 },
      { name: "Rodrygo", position: "RW", nation: "Brazil", tier: "ELITE", kitNumber: 11 },
      { name: "Luka Modrić", position: "CM", nation: "Croatia", tier: "ELITE", kitNumber: 10 },
      { name: "Endrick", position: "ST", nation: "Brazil", tier: "GOLD", kitNumber: 16 },
      { name: "Aurélien Tchouaméni", position: "CDM", nation: "France", tier: "GOLD", kitNumber: 14 },
      { name: "Eduardo Camavinga", position: "CM", nation: "France", tier: "GOLD", kitNumber: 6 },
      { name: "Antonio Rüdiger", position: "CB", nation: "Germany", tier: "ELITE", kitNumber: 22 },
      { name: "Dani Carvajal", position: "RB", nation: "Spain", tier: "ELITE", kitNumber: 2 },
      { name: "Thibaut Courtois", position: "GK", nation: "Belgium", tier: "ELITE", kitNumber: 1 }
    ],
    'barcelona': [
      { name: "Lamine Yamal", position: "RW", nation: "Spain", tier: "ELITE_PLUS", kitNumber: 19 },
      { name: "Robert Lewandowski", position: "ST", nation: "Poland", tier: "ELITE", kitNumber: 9 },
      { name: "Dani Olmo", position: "CAM", nation: "Spain", tier: "ELITE", kitNumber: 20 },
      { name: "Raphinha", position: "LW", nation: "Brazil", tier: "ELITE", kitNumber: 11 },
      { name: "Pedri", position: "CM", nation: "Spain", tier: "ELITE", kitNumber: 8 },
      { name: "Gavi", position: "CM", nation: "Spain", tier: "GOLD", kitNumber: 6 },
      { name: "Frenkie de Jong", position: "CM", nation: "Netherlands", tier: "GOLD", kitNumber: 21 },
      { name: "Jules Koundé", position: "RB", nation: "France", tier: "GOLD", kitNumber: 23 },
      { name: "Ronald Araújo", position: "CB", nation: "Uruguay", tier: "GOLD", kitNumber: 4 },
      { name: "Marc-André ter Stegen", position: "GK", nation: "Germany", tier: "GOLD", kitNumber: 1 }
    ],
    'atletico-madrid': [
      { name: "Antoine Griezmann", position: "ST", nation: "France", tier: "ELITE", kitNumber: 7 },
      { name: "Julián Álvarez", position: "ST", nation: "Argentina", tier: "ELITE", kitNumber: 19 },
      { name: "Rodrigo De Paul", position: "CM", nation: "Argentina", tier: "GOLD", kitNumber: 5 },
      { name: "Jan Oblak", position: "GK", nation: "Slovenia", tier: "GOLD", kitNumber: 13 }
    ]
  },
  'premier-league': {
    'manchester-city': [
      { name: "Erling Haaland", position: "ST", nation: "Norway", tier: "ELITE_PLUS", kitNumber: 9 },
      { name: "Kevin De Bruyne", position: "CM", nation: "Belgium", tier: "ELITE_PLUS", kitNumber: 17 },
      { name: "Rodri", position: "CDM", nation: "Spain", tier: "ELITE_PLUS", kitNumber: 16 },
      { name: "Phil Foden", position: "RW", nation: "England", tier: "ELITE", kitNumber: 47 },
      { name: "Bernardo Silva", position: "CM", nation: "Portugal", tier: "ELITE", kitNumber: 20 },
      { name: "Jérémy Doku", position: "LW", nation: "Belgium", tier: "GOLD", kitNumber: 11 },
      { name: "Rúben Dias", position: "CB", nation: "Portugal", tier: "ELITE", kitNumber: 3 },
      { name: "Josko Gvardiol", position: "LB", nation: "Croatia", tier: "GOLD", kitNumber: 24 },
      { name: "Kyle Walker", position: "RB", nation: "England", tier: "GOLD", kitNumber: 2 },
      { name: "Ederson", position: "GK", nation: "Brazil", tier: "GOLD", kitNumber: 31 }
    ],
    'arsenal': [
      { name: "Bukayo Saka", position: "RW", nation: "England", tier: "ELITE", kitNumber: 7 },
      { name: "Martin Ødegaard", position: "CAM", nation: "Norway", tier: "ELITE", kitNumber: 8 },
      { name: "Declan Rice", position: "CDM", nation: "England", tier: "ELITE", kitNumber: 41 },
      { name: "Kai Havertz", position: "ST", nation: "Germany", tier: "GOLD", kitNumber: 29 },
      { name: "Gabriel Martinelli", position: "LW", nation: "Brazil", tier: "GOLD", kitNumber: 11 },
      { name: "William Saliba", position: "CB", nation: "France", tier: "ELITE", kitNumber: 2 },
      { name: "Gabriel Magalhães", position: "CB", nation: "Brazil", tier: "GOLD", kitNumber: 6 },
      { name: "David Raya", position: "GK", nation: "Spain", tier: "GOLD", kitNumber: 22 }
    ],
    'liverpool': [
      { name: "Mohamed Salah", position: "RW", nation: "Egypt", tier: "ELITE_PLUS", kitNumber: 11 },
      { name: "Virgil van Dijk", position: "CB", nation: "Netherlands", tier: "ELITE", kitNumber: 4 },
      { name: "Trent Alexander-Arnold", position: "RB", nation: "England", tier: "GOLD", kitNumber: 66 },
      { name: "Alexis Mac Allister", position: "CM", nation: "Argentina", tier: "GOLD", kitNumber: 10 },
      { name: "Dominik Szoboszlai", position: "CM", nation: "Hungary", tier: "GOLD", kitNumber: 8 },
      { name: "Luis Díaz", position: "LW", nation: "Colombia", tier: "GOLD", kitNumber: 7 },
      { name: "Darwin Núñez", position: "ST", nation: "Uruguay", tier: "GOLD", kitNumber: 9 },
      { name: "Alisson Becker", position: "GK", nation: "Brazil", tier: "ELITE", kitNumber: 1 }
    ],
    'manchester-united': [
      { name: "Bruno Fernandes", position: "CAM", nation: "Portugal", tier: "ELITE", kitNumber: 8 },
      { name: "Kobbie Mainoo", position: "CM", nation: "England", tier: "GOLD", kitNumber: 37 },
      { name: "Alejandro Garnacho", position: "LW", nation: "Argentina", tier: "GOLD", kitNumber: 17 },
      { name: "Lisandro Martínez", position: "CB", nation: "Argentina", tier: "GOLD", kitNumber: 6 },
      { name: "Marcus Rashford", position: "LW", nation: "England", tier: "GOLD", kitNumber: 10 }
    ],
    'chelsea': [
      { name: "Cole Palmer", position: "CAM", nation: "England", tier: "ELITE", kitNumber: 20 },
      { name: "Enzo Fernández", position: "CM", nation: "Argentina", tier: "GOLD", kitNumber: 8 },
      { name: "Moisés Caicedo", position: "CDM", nation: "Ecuador", tier: "GOLD", kitNumber: 25 },
      { name: "Reece James", position: "RB", nation: "England", tier: "GOLD", kitNumber: 2 }
    ]
  },
  'bundesliga': {
    'bayern-munich': [
      { name: "Harry Kane", position: "ST", nation: "England", tier: "ELITE_PLUS", kitNumber: 9 },
      { name: "Jamal Musiala", position: "CAM", nation: "Germany", tier: "ELITE", kitNumber: 42 },
      { name: "Michael Olise", position: "RW", nation: "France", tier: "GOLD", kitNumber: 17 },
      { name: "Joshua Kimmich", position: "CDM", nation: "Germany", tier: "GOLD", kitNumber: 6 },
      { name: "Leroy Sané", position: "RW", nation: "Germany", tier: "GOLD", kitNumber: 10 },
      { name: "Alphonso Davies", position: "LB", nation: "Canada", tier: "GOLD", kitNumber: 19 },
      { name: "Manuel Neuer", position: "GK", nation: "Germany", tier: "GOLD", kitNumber: 1 }
    ],
    'bayer-leverkusen': [
      { name: "Florian Wirtz", position: "CAM", nation: "Germany", tier: "ELITE", kitNumber: 10 },
      { name: "Jeremie Frimpong", position: "RB", nation: "Netherlands", tier: "GOLD", kitNumber: 30 },
      { name: "Alejandro Grimaldo", position: "LB", nation: "Spain", tier: "GOLD", kitNumber: 20 },
      { name: "Granit Xhaka", position: "CM", nation: "Switzerland", tier: "GOLD", kitNumber: 34 }
    ]
  },
  'serie-a': {
    'inter-milan': [
      { name: "Lautaro Martínez", position: "ST", nation: "Argentina", tier: "ELITE", kitNumber: 10 },
      { name: "Marcus Thuram", position: "ST", nation: "France", tier: "GOLD", kitNumber: 9 },
      { name: "Nicolò Barella", position: "CM", nation: "Italy", tier: "GOLD", kitNumber: 23 },
      { name: "Alessandro Bastoni", position: "CB", nation: "Italy", tier: "GOLD", kitNumber: 95 },
      { name: "Hakan Çalhanoğlu", position: "CDM", nation: "Turkey", tier: "GOLD", kitNumber: 20 }
    ],
    'ac-milan': [
      { name: "Rafael Leão", position: "LW", nation: "Portugal", tier: "ELITE", kitNumber: 10 },
      { name: "Christian Pulisic", position: "RW", nation: "USA", tier: "GOLD", kitNumber: 11 },
      { name: "Álvaro Morata", position: "ST", nation: "Spain", tier: "GOLD", kitNumber: 7 },
      { name: "Theo Hernández", position: "LB", nation: "France", tier: "GOLD", kitNumber: 19 },
      { name: "Mike Maignan", position: "GK", nation: "France", tier: "GOLD", kitNumber: 16 }
    ],
    'juventus': [
      { name: "Dušan Vlahović", position: "ST", nation: "Serbia", tier: "GOLD", kitNumber: 9 },
      { name: "Kenan Yıldız", position: "CAM", nation: "Turkey", tier: "GOLD", kitNumber: 10 },
      { name: "Teun Koopmeiners", position: "CM", nation: "Netherlands", tier: "GOLD", kitNumber: 8 },
      { name: "Bremer", position: "CB", nation: "Brazil", tier: "GOLD", kitNumber: 3 }
    ]
  },
  'ligue-1': {
    'paris-saint-germain': [
      { name: "Ousmane Dembélé", position: "RW", nation: "France", tier: "GOLD", kitNumber: 10 },
      { name: "Bradley Barcola", position: "LW", nation: "France", tier: "GOLD", kitNumber: 29 },
      { name: "Vitinha", position: "CM", nation: "Portugal", tier: "GOLD", kitNumber: 17 },
      { name: "Warren Zaïre-Emery", position: "CM", nation: "France", tier: "GOLD", kitNumber: 33 },
      { name: "Achraf Hakimi", position: "RB", nation: "Morocco", tier: "GOLD", kitNumber: 2 },
      { name: "Marquinhos", position: "CB", nation: "Brazil", tier: "GOLD", kitNumber: 5 },
      { name: "Gianluigi Donnarumma", position: "GK", nation: "Italy", tier: "GOLD", kitNumber: 99 }
    ]
  },
  'other-leagues': {
    'inter-miami': [
      { name: "Lionel Messi", position: "RW", nation: "Argentina", tier: "MASTER", kitNumber: 10 },
      { name: "Luis Suárez", position: "ST", nation: "Uruguay", tier: "GOLD", kitNumber: 9 },
      { name: "Sergio Busquets", position: "CDM", nation: "Spain", tier: "GOLD", kitNumber: 5 },
      { name: "Jordi Alba", position: "LB", nation: "Spain", tier: "GOLD", kitNumber: 18 }
    ],
    'al-nassr': [
      { name: "Cristiano Ronaldo", position: "ST", nation: "Portugal", tier: "MASTER", kitNumber: 7 },
      { name: "Sadio Mané", position: "LW", nation: "Senegal", tier: "GOLD", kitNumber: 10 },
      { name: "Aymeric Laporte", position: "CB", nation: "Spain", tier: "GOLD", kitNumber: 27 }
    ]
  }
};

const formatClubName = (slug) => {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
    .replace('Ac Milan', 'AC Milan')
    .replace('Psg', 'Paris Saint-Germain')
    .replace('Al Nassr', 'Al Nassr')
    .replace('Inter Miami', 'Inter Miami CF');
};

let allPlayersCombined = [];

Object.keys(squads).forEach(leagueSlug => {
  const leagueDir = path.join(baseDir, leagueSlug);
  if (!fs.existsSync(leagueDir)) {
    fs.mkdirSync(leagueDir, { recursive: true });
  }

  Object.keys(squads[leagueSlug]).forEach(clubSlug => {
    const clubName = formatClubName(clubSlug);
    const clubPlayers = squads[leagueSlug][clubSlug].map((p, idx) => ({
      apiId: `act_${clubSlug}_${idx + 1}`,
      name: p.name,
      position: p.position,
      club: clubName,
      nation: p.nation,
      tier: p.tier,
      isLegend: false,
      kitNumber: p.kitNumber,
      imageUrl: "https://resources.premierleague.com/premierleague/photos/players/250x250/Photo-Missing.png"
    }));

    const filePath = path.join(leagueDir, `${clubSlug}.json`);
    fs.writeFileSync(filePath, JSON.stringify(clubPlayers, null, 2));
    allPlayersCombined.push(...clubPlayers);
  });
});

fs.writeFileSync(path.join(baseDir, 'active.json'), JSON.stringify(allPlayersCombined, null, 2));
console.log(`Generated ${allPlayersCombined.length} players across ${Object.keys(squads).length} leagues and custom team folders!`);
