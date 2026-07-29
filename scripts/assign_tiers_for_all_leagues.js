const fs = require('fs');
const path = require('path');

function getAllJsonFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getAllJsonFiles(filePath, fileList);
    } else if (file.endsWith('.json') && file !== 'README.md' && file !== 'legends.json') {
      fileList.push(filePath);
    }
  });
  return fileList;
}

const TOP_STARS = {
  // MASTER
  MASTER: new Set([
    "Kylian Mbappé", "Erling Haaland", "Jude Bellingham", "Vinícius Júnior", "Kevin De Bruyne",
    "Mohamed Salah", "Harry Kane", "Rodri", "Lionel Messi", "Cristiano Ronaldo", "Lamine Yamal",
    "Florian Wirtz", "Jamal Musiala", "Lautaro Martínez", "Robert Lewandowski", "Virgil van Dijk",
    "Gianluigi Donnarumma", "G. Donnarumma", "Ousmane Dembélé", "O. Dembélé", "Achraf Hakimi", "A. Hakimi",
    "Pedri", "Raphinha", "Pau Cubarsí", "D. Rice", "W. Saliba", "A. Mac Allister", "Bruno Fernandes", "J. Álvarez"
  ]),

  // ELITE_PLUS
  ELITE_PLUS: new Set([
    "Bukayo Saka", "Antoine Griezmann", "Victor Osimhen", "Thibaut Courtois", "Alisson Becker",
    "Federico Valverde", "F. Valverde", "Bernardo Silva", "Phil Foden", "Cole Palmer", "Alexander Isak",
    "William Saliba", "Rúben Dias", "Trent Alexander-Arnold", "Rafael Leão", "R. Leão", "Khvicha Kvaratskhelia",
    "K. Kvaratskhelia", "Hakan Çalhanoğlu", "H. Çalhanoğlu", "Nicolò Barella", "N. Barella", "Alessandro Bastoni",
    "A. Bastoni", "Mike Maignan", "M. Maignan", "Theo Hernández", "T. Hernández", "Bremer", "G. Bremer",
    "Dušan Vlahović", "D. Vlahović", "Marcus Thuram", "M. Thuram", "Piotr Zieliński", "P. Zieliński",
    "Scott McTominay", "S. McTominay", "Marquinhos", "Warren Zaïre-Emery", "W. Zaïre-Emery", "Bradley Barcola",
    "B. Barcola", "Vitinha", "João Neves", "J. Neves", "Nuno Mendes", "N. Mendes", "Willian Pacho", "W. Pacho",
    "Manuel Neuer", "M. Neuer", "Joshua Kimmich", "J. Kimmich", "Michael Olise", "M. Olise", "Leroy Sané", "L. Sané",
    "Alphonso Davies", "T. Davies", "Dayot Upamecano", "D. Upamecano", "Min-jae Kim", "Kim Min-jae", "Kingsley Coman",
    "K. Coman", "Serge Gnabry", "S. Gnabry", "Jeremie Frimpong", "J. Frimpong", "Álex Grimaldo", "Á. Grimaldo",
    "Exequiel Palacios", "E. Palacios", "Granit Xhaka", "G. Xhaka", "Edmond Tapsoba", "E. Tapsoba", "Jonathan Tah",
    "J. Tah", "Piero Hincapié", "P. Hincapié", "Victor Boniface", "V. Boniface", "Patrik Schick", "P. Schick",
    "Gregor Kobel", "G. Kobel", "Nico Schlotterbeck", "M. Schlotterbeck", "Serhou Guirassy", "S. Guirassy",
    "Julian Brandt", "J. Brandt", "Donyell Malen", "D. Malen", "Castello Lukeba", "C. Lukeba", "Xavi Simons", "X. Simons",
    "Loïs Openda", "L. Openda", "Benjamin Šeško", "B. Šeško", "Omar Marmoush", "O. Marmoush", "Hugo Ekitike", "H. Ekitike"
  ]),

  // ELITE
  ELITE: new Set([
    "Christian Pulisic", "C. Pulisic", "Tijjani Reijnders", "T. Reijnders", "Fikayo Tomori", "F. Tomori",
    "Youssouf Fofana", "Y. Fofana", "Benjamin Pavard", "B. Pavard", "Yann Sommer", "Y. Sommer",
    "Federico Dimarco", "F. Dimarco", "Denzel Dumfries", "D. Dumfries", "Mehdi Taremi", "M. Taremi",
    "Teun Koopmeiners", "T. Koopmeiners", "Douglas Luiz", "Khéphren Thuram", "K. Thuram", "Manuel Locatelli",
    "M. Locatelli", "Kenan Yıldız", "K. Yildiz", "Nicolas González", "N. González", "Francisco Conceição",
    "F. Conceição", "Amir Rrahmani", "A. Rrahmani", "Alessandro Buongiorno", "A. Buongiorno", "Stanislav Lobotka",
    "S. Lobotka", "Frank Anguissa", "A. Zambo Anguissa", "David Neres", "Romelu Lukaku", "R. Lukaku",
    "Giorgio Scalvini", "G. Scalvini", "Berat Djimsiti", "B. Djimsiti", "Mario Pašalić", "M. Pašalić",
    "Éderson", "Ademola Lookman", "A. Lookman", "Charles De Ketelaere", "C. De Ketelaere", "Mateo Retegui",
    "M. Retegui", "Gianluca Mancini", "G. Mancini", "Evan Ndicka", "E. Ndicka", "Mario Hermoso", "M. Hermoso",
    "Mats Hummels", "M. Hummels", "Alexis Saelemaekers", "A. Saelemaekers", "Bryan Cristante", "B. Cristante",
    "Lorenzo Pellegrini", "L. Pellegrini", "Manu Koné", "M. Koné", "Paulo Dybala", "P. Dybala", "Matías Soulé",
    "M. Soulé", "Artem Dovbyk", "A. Dovbyk", "Mattéo Guendouzi", "M. Guendouzi", "Nicolò Rovella", "N. Rovella",
    "Mattia Zaccagni", "M. Zaccagni", "Valentín Castellanos", "V. Castellanos", "Boulaye Dia", "B. Dia",
    "Sam Beukema", "S. Beukema", "Jhon Lucumí", "J. Lucumí", "Remo Freuler", "R. Freuler", "Dan Ndoye", "D. Ndoye",
    "Thijs Dallinga", "T. Dallinga", "Santiago Castro", "S. Castro", "David de Gea", "D. de Gea", "Robin Gosens",
    "R. Gosens", "Dodô", "D. Dodô", "Yacine Adli", "Y. Adli", "Edoardo Bove", "E. Bove", "Albert Guðmundsson",
    "A. Gudmundsson", "Andrea Colpani", "A. Colpani", "Moise Kean", "M. Kean", "Lucas Beltrán", "L. Beltrán",
    "Johan Vásquez", "J. Vásquez", "Morten Frendrup", "M. Frendrup", "Ruslan Malinovskyi", "R. Malinovskyi",
    "Andrea Pinamonti", "A. Pinamonti", "Saúl Coco", "S. Coco", "Guillermo Maripán", "G. Maripán", "Samuele Ricci",
    "S. Ricci", "Ivan Ilić", "I. Ilić", "Nikola Vlašić", "N. Vlašić", "Duván Zapata", "D. Zapata", "Ché Adams", "C. Adams",
    "Jaka Bijol", "J. Bijol", "Florian Thauvin", "F. Thauvin", "Lorenzo Lucca", "L. Lucca", "Lucas Chevalier", "L. Chevalier",
    "Bafodé Diakité", "B. Diakité", "Tiago Santos", "Angel Gomes", "A. Gomes", "Edon Zhegrova", "E. Zhegrova",
    "Jonathan David", "J. David", "Brice Samba", "B. Samba", "Kevin Danso", "K. Danso", "Facundo Medina", "F. Medina",
    "Przemysław Frankowski", "P. Frankowski", "Andy Diouf", "A. Diouf", "Elye Wahi", "E. Wahi", "Lucas Perri",
    "Moussa Niakhaté", "M. Niakhaté", "Maxence Caqueret", "M. Caqueret", "Corentin Tolisso", "C. Tolisso",
    "Rayan Cherki", "R. Cherki", "Malick Fofana", "M. Fofana", "Alexandre Lacazette", "A. Lacazette", "Georges Mikautadze",
    "G. Mikautadze", "Gerónimo Rulli", "G. Rulli", "Leonardo Balerdi", "L. Balerdi", "Chancel Mbemba", "C. Mbemba",
    "Pierre-Emile Højbjerg", "P. Højbjerg", "Adrien Rabiot", "A. Rabiot", "Mason Greenwood", "M. Greenwood",
    "Elye Wahi", "Valentin Carboni", "Takumi Minamino", "T. Minamino", "Aleksandr Golovin", "A. Golovin",
    "Maghnes Akliouche", "M. Akliouche", "Folarin Balogun", "F. Balogun", "Breel Embolo", "B. Embolo",
    "Konrad Laimer", "K. Laimer", "Aleksandar Pavlović", "A. Pavlovic", "Leon Goretzka", "L. Goretzka",
    "Mathys Tel", "M. Tel", "Thomas Müller", "T. Müller", "Robert Andrich", "R. Andrich", "Aleix García", "A. García",
    "Jonas Hofmann", "J. Hofmann", "Nathan Tella", "N. Tella", "Amine Adli", "A. Adli", "Martin Terrier", "M. Terrier",
    "Niklas Süle", "N. Süle", "Waldemar Anton", "W. Anton", "Ramy Bensebaini", "R. Bensebaini", "Julian Ryerson", "J. Ryerson",
    "Yan Couto", "Y. Couto", "Emre Can", "E. Can", "Pascal Groß", "P. Groß", "Marcel Sabitzer", "M. Sabitzer",
    "Felix Nmecha", "F. Nmecha", "Karim Adeyemi", "K. Adeyemi", "Jamie Gittens", "J. Bynoe-Gittens", "Maximilian Beier", "M. Beier",
    "Lutsharel Geertruida", "L. Geertruida", "Lukas Klostermann", "L. Klostermann", "David Raum", "D. Raum",
    "Benjamin Henrichs", "B. Henrichs", "Amadou Haidara", "A. Haidara", "Nicolas Seiwald", "N. Seiwald", "Xaver Schlager", "X. Schlager",
    "Kevin Kampl", "K. Kampl", "Christoph Baumgartner", "C. Baumgartner", "Eljif Elmas", "E. Elmas", "Antonio Nusa", "A. Nusa",
    "Willian Pacho", "Robin Koch", "R. Koch", "Arthur Theate", "A. Theate", "Rasmus Kristensen", "R. Kristensen",
    "Ellyes Skhiri", "E. Skhiri", "Hugo Larsson", "H. Larsson", "Mahmoud Dahoud", "M. Dahoud", "Farès Chaïbi", "F. Chaïbi",
    "Mario Götze", "M. Götze", "Junior Dina Ebimbe", "F. Ebimbe", "Julian Chabot", "J. Chabot", "Anthony Rouault", "A. Rouault",
    "Maximilian Mittelstädt", "M. Mittelstädt", "Josha Vagnoman", "J. Vagnoman", "Angelo Stiller", "A. Stiller",
    "Atakan Karazor", "A. Karazor", "Enzo Millot", "E. Millot", "Chris Führich", "C. Führich", "Ermedin Demirović", "E. Demirović",
    "Deniz Undav", "D. Undav", "Nick Woltemade", "N. Woltemade", "El Bilal Touré", "E. Touré"
  ])
};

const activeDir = path.join(__dirname, '..', 'data', 'players', 'active');
const allFiles = getAllJsonFiles(activeDir);

let totalAssigned = 0;
let totalProcessed = 0;

allFiles.forEach(filePath => {
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  data.players.forEach(p => {
    totalProcessed++;
    if (!p.tier || p.tier.trim() === '') {
      let tier = "GOLD";
      if (TOP_STARS.MASTER.has(p.name)) tier = "MASTER";
      else if (TOP_STARS.ELITE_PLUS.has(p.name)) tier = "ELITE_PLUS";
      else if (TOP_STARS.ELITE.has(p.name)) tier = "ELITE";
      else {
        // Fallback by kit number
        if (p.kitNumber && p.kitNumber > 35) tier = "BRONZE";
        else if (p.kitNumber && p.kitNumber > 22) tier = "SILVER";
        else tier = "GOLD";
      }

      p.tier = tier;
      totalAssigned++;
    }
  });

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
});

console.log(`\n🎉 Tier Assignment Complete across ALL leagues!`);
console.log(`   Total Players Processed: ${totalProcessed}`);
console.log(`   New Explicit Tiers Assigned: ${totalAssigned}`);
