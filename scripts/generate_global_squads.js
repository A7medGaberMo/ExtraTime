const fs = require('fs');
const path = require('path');

const outputDir = path.join(__dirname, '..', 'data', 'players', 'active', 'global');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const GLOBAL_CLUBS_DATA = [
  {
    club: {
      apiId: 645,
      name: "Galatasaray",
      logo: "https://media.api-sports.io/football/teams/645.png",
      league: "Süper Lig",
      leagueId: 203
    },
    players: [
      { apiId: 153, name: "Victor Osimhen", position: "ST", club: "Galatasaray", nation: "Nigeria", tier: "MASTER", isLegend: false, imageUrl: "https://media.api-sports.io/football/players/153.png", kitNumber: 45 },
      { apiId: 1478, name: "Mauro Icardi", position: "ST", club: "Galatasaray", nation: "Argentina", tier: "ELITE", isLegend: false, imageUrl: "https://media.api-sports.io/football/players/1478.png", kitNumber: 99 },
      { apiId: 629, name: "İlkay Gündoğan", position: "CM/CDM", club: "Galatasaray", nation: "Germany", tier: "ELITE", isLegend: false, imageUrl: "https://media.api-sports.io/football/players/629.png", kitNumber: 22 },
      { apiId: 635, name: "Leroy Sané", position: "RW/LW", club: "Galatasaray", nation: "Germany", tier: "ELITE", isLegend: false, imageUrl: "https://media.api-sports.io/football/players/635.png", kitNumber: 19 },
      { apiId: 27958, name: "Barış Alper Yılmaz", position: "RW/ST", club: "Galatasaray", nation: "Turkey", tier: "ELITE", isLegend: false, imageUrl: "https://media.api-sports.io/football/players/27958.png", kitNumber: 53 },
      { apiId: 114, name: "Lucas Torreira", position: "CDM/CM", club: "Galatasaray", nation: "Uruguay", tier: "GOLD", isLegend: false, imageUrl: "https://media.api-sports.io/football/players/114.png", kitNumber: 34 },
      { apiId: 38166, name: "Yunus Akgün", position: "LW/RW", club: "Galatasaray", nation: "Turkey", tier: "GOLD", isLegend: false, imageUrl: "https://media.api-sports.io/football/players/38166.png", kitNumber: 11 },
      { apiId: 20359, name: "Abdülkerim Bardakçı", position: "CB", club: "Galatasaray", nation: "Turkey", tier: "GOLD", isLegend: false, imageUrl: "https://media.api-sports.io/football/players/20359.png", kitNumber: 42 }
    ]
  },
  {
    club: {
      apiId: 611,
      name: "Fenerbahçe",
      logo: "https://media.api-sports.io/football/teams/611.png",
      league: "Süper Lig",
      leagueId: 203
    },
    players: [
      { apiId: 750, name: "Marco Asensio", position: "RW/CAM", club: "Fenerbahçe", nation: "Spain", tier: "ELITE", isLegend: false, imageUrl: "https://media.api-sports.io/football/players/750.png", kitNumber: 11 },
      { apiId: 617, name: "Ederson", position: "GK", club: "Fenerbahçe", nation: "Brazil", tier: "ELITE", isLegend: false, imageUrl: "https://media.api-sports.io/football/players/617.png", kitNumber: 31 },
      { apiId: 735, name: "Milan Škriniar", position: "CB", club: "Fenerbahçe", nation: "Slovakia", tier: "GOLD", isLegend: false, imageUrl: "https://media.api-sports.io/football/players/735.png", kitNumber: 3 },
      { apiId: 38167, name: "İsmail Yüksek", position: "CDM/CM", club: "Fenerbahçe", nation: "Turkey", tier: "GOLD", isLegend: false, imageUrl: "https://media.api-sports.io/football/players/38167.png", kitNumber: 5 },
      { apiId: 30421, name: "Anderson Talisca", position: "CAM/ST", club: "Fenerbahçe", nation: "Brazil", tier: "GOLD", isLegend: false, imageUrl: "https://media.api-sports.io/football/players/30421.png", kitNumber: 94 },
      { apiId: 642, name: "Nélson Semedo", position: "RB", club: "Fenerbahçe", nation: "Portugal", tier: "GOLD", isLegend: false, imageUrl: "https://media.api-sports.io/football/players/642.png", kitNumber: 2 },
      { apiId: 1636, name: "Mert Müldür", position: "RB/LB", club: "Fenerbahçe", nation: "Turkey", tier: "SILVER", isLegend: false, imageUrl: "https://media.api-sports.io/football/players/1636.png", kitNumber: 18 },
      { apiId: 1205, name: "N'Golo Kanté", position: "CDM/CM", club: "Fenerbahçe", nation: "France", tier: "SILVER", isLegend: false, imageUrl: "https://media.api-sports.io/football/players/1205.png", kitNumber: 7 }
    ]
  },
  {
    club: {
      apiId: 211,
      name: "Benfica",
      logo: "https://media.api-sports.io/football/teams/211.png",
      league: "Primeira Liga",
      leagueId: 94
    },
    players: [
      { apiId: 27306, name: "Andreas Schjelderup", position: "LW/RW", club: "Benfica", nation: "Norway", tier: "ELITE_PLUS", isLegend: false, imageUrl: "https://media.api-sports.io/football/players/27306.png", kitNumber: 21 },
      { apiId: 144577, name: "António Silva", position: "CB", club: "Benfica", nation: "Portugal", tier: "ELITE_PLUS", isLegend: false, imageUrl: "https://media.api-sports.io/football/players/144577.png", kitNumber: 4 },
      { apiId: 161833, name: "Tomás Araújo", position: "CB", club: "Benfica", nation: "Portugal", tier: "ELITE", isLegend: false, imageUrl: "https://media.api-sports.io/football/players/161833.png", kitNumber: 44 },
      { apiId: 215443, name: "Richard Ríos", position: "CM/CDM", club: "Benfica", nation: "Colombia", tier: "ELITE", isLegend: false, imageUrl: "https://media.api-sports.io/football/players/215443.png", kitNumber: 27 },
      { apiId: 138802, name: "Heorhii Sudakov", position: "CAM/CM", club: "Benfica", nation: "Ukraine", tier: "ELITE", isLegend: false, imageUrl: "https://media.api-sports.io/football/players/138802.png", kitNumber: 10 },
      { apiId: 1515, name: "Vangelis Pavlidis", position: "ST", club: "Benfica", nation: "Greece", tier: "ELITE", isLegend: false, imageUrl: "https://media.api-sports.io/football/players/1515.png", kitNumber: 14 },
      { apiId: 138808, name: "Anatoliy Trubin", position: "GK", club: "Benfica", nation: "Ukraine", tier: "ELITE", isLegend: false, imageUrl: "https://media.api-sports.io/football/players/138808.png", kitNumber: 1 },
      { apiId: 1637, name: "Leandro Barreiro", position: "CM/CDM", club: "Benfica", nation: "Luxembourg", tier: "GOLD", isLegend: false, imageUrl: "https://media.api-sports.io/football/players/1637.png", kitNumber: 18 },
      { apiId: 2487, name: "Fredrik Aursnes", position: "CM/LB", club: "Benfica", nation: "Norway", tier: "GOLD", isLegend: false, imageUrl: "https://media.api-sports.io/football/players/2487.png", kitNumber: 8 }
    ]
  },
  {
    club: {
      apiId: 212,
      name: "FC Porto",
      logo: "https://media.api-sports.io/football/teams/212.png",
      league: "Primeira Liga",
      leagueId: 94
    },
    players: [
      { apiId: 338169, name: "Samu Aghehowa", position: "ST", club: "FC Porto", nation: "Spain", tier: "ELITE_PLUS", isLegend: false, imageUrl: "https://media.api-sports.io/football/players/338169.png", kitNumber: 9 },
      { apiId: 2146, name: "Diogo Costa", position: "GK", club: "FC Porto", nation: "Portugal", tier: "ELITE_PLUS", isLegend: false, imageUrl: "https://media.api-sports.io/football/players/2146.png", kitNumber: 99 },
      { apiId: 114940, name: "Alan Varela", position: "CDM/CM", club: "FC Porto", nation: "Argentina", tier: "ELITE", isLegend: false, imageUrl: "https://media.api-sports.io/football/players/114940.png", kitNumber: 22 },
      { apiId: 127909, name: "Gabri Veiga", position: "CM/CAM", club: "FC Porto", nation: "Spain", tier: "ELITE", isLegend: false, imageUrl: "https://media.api-sports.io/football/players/127909.png", kitNumber: 20 },
      { apiId: 1989, name: "Pepê", position: "RW/LW", club: "FC Porto", nation: "Brazil", tier: "GOLD", isLegend: false, imageUrl: "https://media.api-sports.io/football/players/1989.png", kitNumber: 11 },
      { apiId: 445212, name: "Alberto Costa", position: "LB", club: "FC Porto", nation: "Portugal", tier: "GOLD", isLegend: false, imageUrl: "https://media.api-sports.io/football/players/445212.png", kitNumber: 5 },
      { apiId: 495812, name: "William Gomes", position: "LW/RW", club: "FC Porto", nation: "Brazil", tier: "GOLD", isLegend: false, imageUrl: "https://media.api-sports.io/football/players/495812.png", kitNumber: 17 },
      { apiId: 739, name: "Thiago Silva", position: "CB", club: "FC Porto", nation: "Brazil", tier: "GOLD", isLegend: false, imageUrl: "https://media.api-sports.io/football/players/739.png", kitNumber: 3 }
    ]
  },
  {
    club: {
      apiId: 127,
      name: "Flamengo",
      logo: "https://media.api-sports.io/football/teams/127.png",
      league: "Brasileirão",
      leagueId: 71
    },
    players: [
      { apiId: 1152, name: "Lucas Paquetá", position: "CAM/CM", club: "Flamengo", nation: "Brazil", tier: "ELITE_PLUS", isLegend: false, imageUrl: "https://media.api-sports.io/football/players/1152.png", kitNumber: 10 },
      { apiId: 1009, name: "Giorgian de Arrascaeta", position: "CAM/LM", club: "Flamengo", nation: "Uruguay", tier: "ELITE_PLUS", isLegend: false, imageUrl: "https://media.api-sports.io/football/players/1009.png", kitNumber: 14 },
      { apiId: 2541, name: "Pedro", position: "ST", club: "Flamengo", nation: "Brazil", tier: "ELITE", isLegend: false, imageUrl: "https://media.api-sports.io/football/players/2541.png", kitNumber: 9 },
      { apiId: 10640, name: "Samuel Lino", position: "LM/LB", club: "Flamengo", nation: "Brazil", tier: "ELITE", isLegend: false, imageUrl: "https://media.api-sports.io/football/players/10640.png", kitNumber: 22 },
      { apiId: 9687, name: "Léo Ortiz", position: "CB", club: "Flamengo", nation: "Brazil", tier: "GOLD", isLegend: false, imageUrl: "https://media.api-sports.io/football/players/9687.png", kitNumber: 3 },
      { apiId: 1010, name: "Léo Pereira", position: "CB", club: "Flamengo", nation: "Brazil", tier: "GOLD", isLegend: false, imageUrl: "https://media.api-sports.io/football/players/1010.png", kitNumber: 4 },
      { apiId: 1102, name: "Erick Pulgar", position: "CDM/CM", club: "Flamengo", nation: "Chile", tier: "GOLD", isLegend: false, imageUrl: "https://media.api-sports.io/football/players/1102.png", kitNumber: 5 },
      { apiId: 1209, name: "Jorginho", position: "CM/CDM", club: "Flamengo", nation: "Italy", tier: "GOLD", isLegend: false, imageUrl: "https://media.api-sports.io/football/players/1209.png", kitNumber: 8 },
      { apiId: 2153, name: "Bruno Henrique", position: "LW/ST", club: "Flamengo", nation: "Brazil", tier: "SILVER", isLegend: false, imageUrl: "https://media.api-sports.io/football/players/2153.png", kitNumber: 27 }
    ]
  },
  {
    club: {
      apiId: 121,
      name: "Palmeiras",
      logo: "https://media.api-sports.io/football/teams/121.png",
      league: "Brasileirão",
      leagueId: 71
    },
    players: [
      { apiId: 342203, name: "Vitor Roque", position: "ST/LW", club: "Palmeiras", nation: "Brazil", tier: "ELITE", isLegend: false, imageUrl: "https://media.api-sports.io/football/players/342203.png", kitNumber: 19 },
      { apiId: 2101, name: "Gustavo Gómez", position: "CB", club: "Palmeiras", nation: "Paraguay", tier: "ELITE", isLegend: false, imageUrl: "https://media.api-sports.io/football/players/2101.png", kitNumber: 15 },
      { apiId: 627, name: "Andreas Pereira", position: "CAM/CM", club: "Palmeiras", nation: "Brazil", tier: "GOLD", isLegend: false, imageUrl: "https://media.api-sports.io/football/players/627.png", kitNumber: 18 },
      { apiId: 4721, name: "Jhon Arias", position: "RW/LW", club: "Palmeiras", nation: "Colombia", tier: "GOLD", isLegend: false, imageUrl: "https://media.api-sports.io/football/players/4721.png", kitNumber: 21 },
      { apiId: 1012, name: "Joaquín Piquerez", position: "LB/LM", club: "Palmeiras", nation: "Uruguay", tier: "GOLD", isLegend: false, imageUrl: "https://media.api-sports.io/football/players/1012.png", kitNumber: 22 },
      { apiId: 47822, name: "Flaco López", position: "ST", club: "Palmeiras", nation: "Argentina", tier: "GOLD", isLegend: false, imageUrl: "https://media.api-sports.io/football/players/47822.png", kitNumber: 42 },
      { apiId: 1104, name: "Felipe Anderson", position: "RW/CAM", club: "Palmeiras", nation: "Brazil", tier: "GOLD", isLegend: false, imageUrl: "https://media.api-sports.io/football/players/1104.png", kitNumber: 9 },
      { apiId: 2004, name: "Paulinho", position: "LW/ST", club: "Palmeiras", nation: "Brazil", tier: "GOLD", isLegend: false, imageUrl: "https://media.api-sports.io/football/players/2004.png", kitNumber: 7 }
    ]
  },
  {
    club: {
      apiId: 1598,
      name: "Inter Miami",
      logo: "https://media.api-sports.io/football/teams/1598.png",
      league: "MLS",
      leagueId: 253
    },
    players: [
      { apiId: 154, name: "Lionel Messi", position: "RW/ST", club: "Inter Miami", nation: "Argentina", tier: "MASTER", isLegend: false, imageUrl: "https://media.api-sports.io/football/players/154.png", kitNumber: 10 },
      { apiId: 147, name: "Sergio Busquets", position: "CDM", club: "Inter Miami", nation: "Spain", tier: "ELITE", isLegend: false, imageUrl: "https://media.api-sports.io/football/players/147.png", kitNumber: 5 },
      { apiId: 153, name: "Luis Suárez", position: "ST", club: "Inter Miami", nation: "Uruguay", tier: "GOLD", isLegend: false, imageUrl: "https://media.api-sports.io/football/players/153.png", kitNumber: 9 },
      { apiId: 146, name: "Jordi Alba", position: "LB", club: "Inter Miami", nation: "Spain", tier: "GOLD", isLegend: false, imageUrl: "https://media.api-sports.io/football/players/146.png", kitNumber: 18 }
    ]
  },
  {
    club: {
      apiId: 2506,
      name: "Al-Nassr",
      logo: "https://media.api-sports.io/football/teams/2506.png",
      league: "Saudi Pro League",
      leagueId: 307
    },
    players: [
      { apiId: 874, name: "Cristiano Ronaldo", position: "ST", club: "Al-Nassr", nation: "Portugal", tier: "ELITE", isLegend: false, imageUrl: "https://media.api-sports.io/football/players/874.png", kitNumber: 7 },
      { apiId: 184, name: "Sadio Mané", position: "LW/ST", club: "Al-Nassr", nation: "Senegal", tier: "ELITE", isLegend: false, imageUrl: "https://media.api-sports.io/football/players/184.png", kitNumber: 10 },
      { apiId: 731, name: "Marcelo Brozović", position: "CDM/CM", club: "Al-Nassr", nation: "Croatia", tier: "GOLD", isLegend: false, imageUrl: "https://media.api-sports.io/football/players/731.png", kitNumber: 77 },
      { apiId: 1991, name: "Otávio", position: "CAM/RW", club: "Al-Nassr", nation: "Portugal", tier: "GOLD", isLegend: false, imageUrl: "https://media.api-sports.io/football/players/1991.png", kitNumber: 25 }
    ]
  },
  {
    club: {
      apiId: 2501,
      name: "Al-Hilal",
      logo: "https://media.api-sports.io/football/teams/2501.png",
      league: "Saudi Pro League",
      leagueId: 307
    },
    players: [
      { apiId: 1100, name: "Darwin Núñez", position: "ST/LW", club: "Al-Hilal", nation: "Uruguay", tier: "ELITE", isLegend: false, imageUrl: "https://media.api-sports.io/football/players/1100.png", kitNumber: 9 },
      { apiId: 738, name: "Theo Hernández", position: "LB/LM", club: "Al-Hilal", nation: "France", tier: "ELITE", isLegend: false, imageUrl: "https://media.api-sports.io/football/players/738.png", kitNumber: 6 },
      { apiId: 1150, name: "Rúben Neves", position: "CDM/CM", club: "Al-Hilal", nation: "Portugal", tier: "ELITE", isLegend: false, imageUrl: "https://media.api-sports.io/football/players/1150.png", kitNumber: 8 },
      { apiId: 734, name: "Sergej Milinković-Savić", position: "CM/CAM", club: "Al-Hilal", nation: "Serbia", tier: "GOLD", isLegend: false, imageUrl: "https://media.api-sports.io/football/players/734.png", kitNumber: 22 },
      { apiId: 752, name: "Malcom", position: "RW/CAM", club: "Al-Hilal", nation: "Brazil", tier: "GOLD", isLegend: false, imageUrl: "https://media.api-sports.io/football/players/752.png", kitNumber: 77 },
      { apiId: 640, name: "João Cancelo", position: "RB/LB", club: "Al-Hilal", nation: "Portugal", tier: "GOLD", isLegend: false, imageUrl: "https://media.api-sports.io/football/players/640.png", kitNumber: 27 },
      { apiId: 733, name: "Kalidou Koulibaly", position: "CB", club: "Al-Hilal", nation: "Senegal", tier: "GOLD", isLegend: false, imageUrl: "https://media.api-sports.io/football/players/733.png", kitNumber: 3 },
      { apiId: 25010, name: "Salem Al-Dawsari", position: "LW/LM", club: "Al-Hilal", nation: "Saudi Arabia", tier: "GOLD", isLegend: false, imageUrl: "https://media.api-sports.io/football/players/25010.png", kitNumber: 29 }
    ]
  },
  {
    club: {
      apiId: 2502,
      name: "Al-Ahli",
      logo: "https://media.api-sports.io/football/teams/2502.png",
      league: "Saudi Pro League",
      leagueId: 307
    },
    players: [
      { apiId: 18911, name: "Ivan Toney", position: "ST", club: "Al-Ahli", nation: "England", tier: "ELITE", isLegend: false, imageUrl: "https://media.api-sports.io/football/players/18911.png", kitNumber: 99 },
      { apiId: 1153, name: "Riyad Mahrez", position: "RW", club: "Al-Ahli", nation: "Algeria", tier: "GOLD", isLegend: false, imageUrl: "https://media.api-sports.io/football/players/1153.png", kitNumber: 7 },
      { apiId: 158, name: "Roberto Firmino", position: "ST/CAM", club: "Al-Ahli", nation: "Brazil", tier: "GOLD", isLegend: false, imageUrl: "https://media.api-sports.io/football/players/158.png", kitNumber: 10 },
      { apiId: 732, name: "Franck Kessié", position: "CM/CDM", club: "Al-Ahli", nation: "Ivory Coast", tier: "GOLD", isLegend: false, imageUrl: "https://media.api-sports.io/football/players/732.png", kitNumber: 79 },
      { apiId: 2112, name: "Wenderson Galeno", position: "LW/LM", club: "Al-Ahli", nation: "Brazil", tier: "GOLD", isLegend: false, imageUrl: "https://media.api-sports.io/football/players/2112.png", kitNumber: 9 },
      { apiId: 1582, name: "Édouard Mendy", position: "GK", club: "Al-Ahli", nation: "Senegal", tier: "GOLD", isLegend: false, imageUrl: "https://media.api-sports.io/football/players/1582.png", kitNumber: 16 },
      { apiId: 27301, name: "Enzo Millot", position: "CAM/CM", club: "Al-Ahli", nation: "France", tier: "GOLD", isLegend: false, imageUrl: "https://media.api-sports.io/football/players/27301.png", kitNumber: 8 }
    ]
  },
  {
    club: {
      apiId: 2503,
      name: "Al-Ittihad",
      logo: "https://media.api-sports.io/football/teams/2503.png",
      league: "Saudi Pro League",
      leagueId: 307
    },
    players: [
      { apiId: 751, name: "Karim Benzema", position: "ST", club: "Al-Ittihad", nation: "France", tier: "ELITE", isLegend: false, imageUrl: "https://media.api-sports.io/football/players/751.png", kitNumber: 9 },
      { apiId: 1206, name: "Moussa Diaby", position: "RW/LW", club: "Al-Ittihad", nation: "France", tier: "GOLD", isLegend: false, imageUrl: "https://media.api-sports.io/football/players/1206.png", kitNumber: 19 },
      { apiId: 1108, name: "Predrag Rajković", position: "GK", club: "Al-Ittihad", nation: "Serbia", tier: "GOLD", isLegend: false, imageUrl: "https://media.api-sports.io/football/players/1108.png", kitNumber: 1 }
    ]
  },
  {
    club: {
      apiId: 194,
      name: "Ajax",
      logo: "https://media.api-sports.io/football/teams/194.png",
      league: "Eredivisie",
      leagueId: 88
    },
    players: [
      { apiId: 626, name: "Jordan Henderson", position: "CDM/CM", club: "Ajax", nation: "England", tier: "GOLD", isLegend: false, imageUrl: "https://media.api-sports.io/football/players/626.png", kitNumber: 6 },
      { apiId: 27329, name: "Kenneth Taylor", position: "CM/CDM", club: "Ajax", nation: "Netherlands", tier: "GOLD", isLegend: false, imageUrl: "https://media.api-sports.io/football/players/27329.png", kitNumber: 8 },
      { apiId: 138815, name: "Brian Brobbey", position: "ST", club: "Ajax", nation: "Netherlands", tier: "GOLD", isLegend: false, imageUrl: "https://media.api-sports.io/football/players/138815.png", kitNumber: 9 },
      { apiId: 2489, name: "Steven Berghuis", position: "RW/CAM", club: "Ajax", nation: "Netherlands", tier: "GOLD", isLegend: false, imageUrl: "https://media.api-sports.io/football/players/2489.png", kitNumber: 23 },
      { apiId: 138816, name: "Josip Šutalo", position: "CB", club: "Ajax", nation: "Croatia", tier: "GOLD", isLegend: false, imageUrl: "https://media.api-sports.io/football/players/138816.png", kitNumber: 37 },
      { apiId: 348212, name: "Jorrel Hato", position: "CB/LB", club: "Ajax", nation: "Netherlands", tier: "ELITE", isLegend: false, imageUrl: "https://media.api-sports.io/football/players/348212.png", kitNumber: 4 },
      { apiId: 27328, name: "Devyne Rensch", position: "RB/LB", club: "Ajax", nation: "Netherlands", tier: "GOLD", isLegend: false, imageUrl: "https://media.api-sports.io/football/players/27328.png", kitNumber: 2 }
    ]
  },
  {
    club: {
      apiId: 569,
      name: "Club Brugge",
      logo: "https://media.api-sports.io/football/teams/569.png",
      league: "Belgian Pro League",
      leagueId: 144
    },
    players: [
      { apiId: 1509, name: "Andreas Skov Olsen", position: "RW/RM", club: "Club Brugge", nation: "Denmark", tier: "ELITE", isLegend: false, imageUrl: "https://media.api-sports.io/football/players/1509.png", kitNumber: 7 },
      { apiId: 27311, name: "Hans Vanaken", position: "CAM/CM", club: "Club Brugge", nation: "Belgium", tier: "GOLD", isLegend: false, imageUrl: "https://media.api-sports.io/football/players/27311.png", kitNumber: 20 },
      { apiId: 27312, name: "Maxim De Cuyper", position: "LB/LM", club: "Club Brugge", nation: "Belgium", tier: "GOLD", isLegend: false, imageUrl: "https://media.api-sports.io/football/players/27312.png", kitNumber: 55 },
      { apiId: 27313, name: "Christos Tzolis", position: "LW/ST", club: "Club Brugge", nation: "Greece", tier: "GOLD", isLegend: false, imageUrl: "https://media.api-sports.io/football/players/27313.png", kitNumber: 8 },
      { apiId: 27314, name: "Ferran Jutglà", position: "ST/CF", club: "Club Brugge", nation: "Spain", tier: "GOLD", isLegend: false, imageUrl: "https://media.api-sports.io/football/players/27314.png", kitNumber: 9 },
      { apiId: 18910, name: "Simon Mignolet", position: "GK", club: "Club Brugge", nation: "Belgium", tier: "GOLD", isLegend: false, imageUrl: "https://media.api-sports.io/football/players/18910.png", kitNumber: 22 }
    ]
  }
];

function generateFiles() {
  for (const c of GLOBAL_CLUBS_DATA) {
    const fileName = c.club.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '.json';
    const filePath = path.join(outputDir, fileName);
    fs.writeFileSync(filePath, JSON.stringify(c, null, 2));
    console.log(`Saved global squad file: ${fileName}`);
  }
}

generateFiles();
