import fs from 'fs';
import path from 'path';

const dir = 'data/players/active/global';

// Tier helper
function getTier(rating) {
  if (rating >= 91) return 'ULTIMATE';
  if (rating >= 86) return 'MASTER';
  if (rating >= 81) return 'ELITE';
  if (rating >= 74) return 'GOLD';
  if (rating >= 64) return 'SILVER';
  return 'BRONZE';
}

// Clean position
function cleanPosition(pos) {
  if (!pos) return 'CM';
  // Keep primary or clean common compound
  const parts = pos.split('/');
  if (parts.length === 1) return pos.trim();
  // If compound like CB/RB/CDM, return primary
  return parts[0].trim();
}

// Global player dictionary with exact apiId or name matches
const PLAYER_CALIBRATION = {
  // === INTER MIAMI ===
  154: { rating: 95, tier: 'ULTIMATE', nation: 'Argentina', pos: 'RW' }, // L. Messi
  266: { rating: 84, tier: 'ELITE', nation: 'Uruguay', pos: 'ST' }, // L. Suárez
  754: { rating: 85, tier: 'ELITE', nation: 'Brazil', pos: 'CDM' }, // Casemiro
  2844: { rating: 84, tier: 'ELITE', nation: 'Argentina', pos: 'CM' }, // R. De Paul
  722: { rating: 78, tier: 'GOLD', nation: 'Spain', pos: 'LB' }, // Reguilón
  70341: { rating: 74, tier: 'GOLD', nation: 'USA', pos: 'GK' }, // Drake Callender
  336829: { rating: 73, tier: 'SILVER', nation: 'Argentina', pos: 'CB' }, // Tomás Avilés
  301438: { rating: 71, tier: 'SILVER', nation: 'USA', pos: 'LB' }, // Noah Allen
  183789: { rating: 70, tier: 'SILVER', nation: 'USA', pos: 'CB' }, // Ian Fray
  284322: { rating: 73, tier: 'SILVER', nation: 'USA', pos: 'CM' }, // Benjamin Cremaschi
  301444: { rating: 71, tier: 'SILVER', nation: 'Honduras', pos: 'CM' }, // David Ruiz
  321876: { rating: 76, tier: 'GOLD', nation: 'Argentina', pos: 'CDM' }, // Federico Redondo
  302821: { rating: 76, tier: 'GOLD', nation: 'Paraguay', pos: 'CM' }, // Diego Gómez
  51020: { rating: 74, tier: 'GOLD', nation: 'USA', pos: 'RM' }, // Julian Gressel
  10531: { rating: 76, tier: 'GOLD', nation: 'Brazil', pos: 'LW' }, // Talles Magno
  301826: { rating: 75, tier: 'GOLD', nation: 'Argentina', pos: 'CAM' }, // Baltasar Rodríguez
  2878: { rating: 75, tier: 'GOLD', nation: 'Ecuador', pos: 'ST' }, // Leo Campana

  // === LAFC ===
  186: { rating: 90, tier: 'MASTER', nation: 'South Korea', pos: 'LW' }, // Son Heung-Min
  772: { rating: 80, tier: 'GOLD', nation: 'France', pos: 'GK' }, // Hugo Lloris
  2759: { rating: 81, tier: 'ELITE', nation: 'Gabon', pos: 'LW' }, // Denis Bouanga
  38703: { rating: 76, tier: 'GOLD', nation: 'USA', pos: 'CM' }, // Timothy Tillman
  51457: { rating: 76, tier: 'GOLD', nation: 'Colombia', pos: 'CDM' }, // Eduard Atuesta
  152980: { rating: 76, tier: 'GOLD', nation: 'Uruguay', pos: 'RW' }, // Cristian Olivera
  51052: { rating: 75, tier: 'GOLD', nation: 'USA', pos: 'LB' }, // Ryan Hollingshead
  47318: { rating: 74, tier: 'GOLD', nation: 'Spain', pos: 'RB' }, // Sergi Palencia
  50974: { rating: 75, tier: 'GOLD', nation: 'USA', pos: 'CB' }, // Aaron Long
  51057: { rating: 73, tier: 'SILVER', nation: 'Luxembourg', pos: 'CB' }, // Maxime Chanot
  138676: { rating: 78, tier: 'GOLD', nation: 'Poland', pos: 'CAM' }, // Mateusz Bogusz

  // === LA GALAXY ===
  370: { rating: 83, tier: 'ELITE', nation: 'Germany', pos: 'CAM' }, // Marco Reus
  2296: { rating: 81, tier: 'ELITE', nation: 'Mexico', pos: 'RW' }, // Hirving Lozano
  138: { rating: 79, tier: 'GOLD', nation: 'Spain', pos: 'CM' }, // Sergi Roberto
  2889: { rating: 75, tier: 'GOLD', nation: 'Japan', pos: 'CB' }, // Maya Yoshida
  1134: { rating: 79, tier: 'GOLD', nation: 'Japan', pos: 'ST' }, // Kyogo Furuhashi
  47271: { rating: 78, tier: 'GOLD', nation: 'Ghana', pos: 'RW' }, // Joseph Paintsil
  143: { rating: 80, tier: 'GOLD', nation: 'Spain', pos: 'CAM' }, // Riqui Puig
  308197: { rating: 78, tier: 'GOLD', nation: 'Brazil', pos: 'RW' }, // Gabriel Pec
  50965: { rating: 76, tier: 'GOLD', nation: 'Serbia', pos: 'ST' }, // Dejan Joveljić
  50953: { rating: 75, tier: 'GOLD', nation: 'Uruguay', pos: 'CDM' }, // Gastón Brugman

  // === VANCOUVER WHITECAPS ===
  522: { rating: 90, tier: 'MASTER', nation: 'Germany', pos: 'CAM' }, // Thomas Müller
  44844: { rating: 80, tier: 'GOLD', nation: 'Scotland', pos: 'CAM' }, // Ryan Gauld
  6236: { rating: 78, tier: 'GOLD', nation: 'Paraguay', pos: 'CDM' }, // Andrés Cubas
  50969: { rating: 76, tier: 'GOLD', nation: 'USA', pos: 'ST' }, // Brian White
  39107: { rating: 74, tier: 'GOLD', nation: 'Canada', pos: 'LB' }, // Sam Adekugbe
  45938: { rating: 74, tier: 'GOLD', nation: 'Serbia', pos: 'CB' }, // Ranko Veselinović
  51027: { rating: 74, tier: 'GOLD', nation: 'USA', pos: 'CB' }, // Tristan Blackmon
  33385: { rating: 74, tier: 'GOLD', nation: 'Japan', pos: 'GK' }, // Yohei Takaoka
  15783: { rating: 74, tier: 'GOLD', nation: 'USA', pos: 'RW' }, // Emmanuel Sabbi
  20534: { rating: 73, tier: 'SILVER', nation: 'Senegal', pos: 'LW' }, // Cheikh Sabaly

  // === ORLANDO CITY ===
  51080: { rating: 77, tier: 'GOLD', nation: 'Jamaica', pos: 'GK' }, // Andre Blake
  51083: { rating: 76, tier: 'GOLD', nation: 'Germany', pos: 'LB' }, // Kai Wagner
  462853: { rating: 72, tier: 'SILVER', nation: 'USA', pos: 'CAM' }, // Cavan Sullivan

  // === GALATASARAY ===
  2780: { rating: 89, tier: 'MASTER', nation: 'Nigeria', pos: 'ST' }, // Victor Osimhen
  22236: { rating: 87, tier: 'MASTER', nation: 'Portugal', pos: 'LW' }, // Rafael Leão
  633: { rating: 86, tier: 'MASTER', nation: 'Germany', pos: 'CM' }, // İlkay Gündoğan
  644: { rating: 85, tier: 'ELITE', nation: 'Germany', pos: 'RW' }, // Leroy Sané
  1462: { rating: 82, tier: 'ELITE', nation: 'Uruguay', pos: 'CDM' }, // Lucas Torreira
  168: { rating: 82, tier: 'ELITE', nation: 'Colombia', pos: 'CB' }, // Davinson Sánchez
  80552: { rating: 81, tier: 'ELITE', nation: 'Brazil', pos: 'CM' }, // Gabriel Sara
  63274: { rating: 81, tier: 'ELITE', nation: 'Turkey', pos: 'RW' }, // Barış Alper Yılmaz
  49866: { rating: 81, tier: 'ELITE', nation: 'Turkey', pos: 'GK' }, // Uğurcan Çakır
  25448: { rating: 79, tier: 'GOLD', nation: 'Turkey', pos: 'CB' }, // Kaan Ayhan
  61837: { rating: 80, tier: 'GOLD', nation: 'Turkey', pos: 'CB' }, // Abdülkerim Bardakcı
  30504: { rating: 80, tier: 'GOLD', nation: 'Ivory Coast', pos: 'RB' }, // Wilfried Singo
  158121: { rating: 78, tier: 'GOLD', nation: 'Senegal', pos: 'LB' }, // Ismail Jakobs
  26252: { rating: 79, tier: 'GOLD', nation: 'Hungary', pos: 'RW' }, // Roland Sallai
  454: { rating: 79, tier: 'GOLD', nation: 'Turkey', pos: 'RW' }, // Yunus Akgün
  270508: { rating: 77, tier: 'GOLD', nation: 'France', pos: 'CDM' }, // Lesley Ugochukwu
  18947: { rating: 78, tier: 'GOLD', nation: 'Gabon', pos: 'CDM' }, // Mario Lemina
  268571: { rating: 75, tier: 'GOLD', nation: 'France', pos: 'CB' }, // El Chadaille Bitshiabu
  50057: { rating: 76, tier: 'GOLD', nation: 'Turkey', pos: 'LB' }, // Eren Elmalı
  145057: { rating: 74, tier: 'GOLD', nation: 'Turkey', pos: 'LB' }, // Kazımcan Karataş
  61950: { rating: 74, tier: 'GOLD', nation: 'Turkey', pos: 'GK' }, // Günay Güvenç
  388570: { rating: 74, tier: 'GOLD', nation: 'Sweden', pos: 'ST' }, // Deniz Gül

  // === FENERBAHCE ===
  617: { rating: 87, tier: 'MASTER', nation: 'Brazil', pos: 'GK' }, // Ederson
  2290: { rating: 91, tier: 'ULTIMATE', nation: 'France', pos: 'CDM' }, // N'Golo Kanté
  907: { rating: 84, tier: 'ELITE', nation: 'Belgium', pos: 'ST' }, // Romelu Lukaku
  18861: { rating: 83, tier: 'ELITE', nation: 'Netherlands', pos: 'CB' }, // Nathan Aké
  198: { rating: 86, tier: 'MASTER', nation: 'Slovakia', pos: 'CB' }, // Milan Škriniar
  746: { rating: 81, tier: 'ELITE', nation: 'Spain', pos: 'RW' }, // Marco Asensio
  897: { rating: 82, tier: 'ELITE', nation: 'England', pos: 'RW' }, // Mason Greenwood
  142959: { rating: 81, tier: 'ELITE', nation: 'Turkey', pos: 'LW' }, // Kerem Aktürkoğlu
  1454: { rating: 81, tier: 'ELITE', nation: 'France', pos: 'CM' }, // Mattéo Guendouzi
  214463: { rating: 79, tier: 'GOLD', nation: 'Turkey', pos: 'CDM' }, // İsmail Yüksek
  49857: { rating: 79, tier: 'GOLD', nation: 'Turkey', pos: 'RW' }, // İrfan Can Kahveci
  18776: { rating: 79, tier: 'GOLD', nation: 'Turkey', pos: 'CB' }, // Çağlar Söyüncü
  829: { rating: 78, tier: 'GOLD', nation: 'Brazil', pos: 'CB' }, // Rodrigo Becão
  130: { rating: 79, tier: 'GOLD', nation: 'Portugal', pos: 'RB' }, // Nélson Semedo
  272721: { rating: 78, tier: 'GOLD', nation: 'Netherlands', pos: 'LB' }, // Jayden Oosterwolde
  1719: { rating: 77, tier: 'GOLD', nation: 'Turkey', pos: 'RB' }, // Mert Müldür
  50048: { rating: 79, tier: 'GOLD', nation: 'Kosovo', pos: 'ST' }, // Vedat Muriqi
  49837: { rating: 78, tier: 'GOLD', nation: 'Turkey', pos: 'GK' }, // Mert Günok
  340727: { rating: 73, tier: 'SILVER', nation: 'Serbia', pos: 'RB', name: 'O. Mimović' }, // O. Mimović
  127609: { rating: 74, tier: 'GOLD', nation: 'Turkey', pos: 'LB' }, // Levent Mercan
  134590: { rating: 75, tier: 'GOLD', nation: 'Turkey', pos: 'RW' }, // Oğuz Aydın
  302869: { rating: 75, tier: 'GOLD', nation: 'Mali', pos: 'LW' }, // Nene Dorgeles

  // === BESIKTAS ===
  1946: { rating: 83, tier: 'ELITE', nation: 'Belgium', pos: 'LW' }, // Leandro Trossard
  30415: { rating: 84, tier: 'ELITE', nation: 'Serbia', pos: 'ST' }, // Dušan Vlahović
  37155: { rating: 81, tier: 'ELITE', nation: 'Turkey', pos: 'CM' }, // Orkun Kökçü
  399: { rating: 81, tier: 'ELITE', nation: 'Germany', pos: 'GK' }, // Alexander Nübel
  18786: { rating: 80, tier: 'GOLD', nation: 'Nigeria', pos: 'CDM' }, // Wilfred Ndidi
  336567: { rating: 79, tier: 'GOLD', nation: 'Turkey', pos: 'ST' }, // Semih Kılıçsoy
  24807: { rating: 78, tier: 'GOLD', nation: 'Turkey', pos: 'CDM' }, // Salih Özcan
  25324: { rating: 77, tier: 'GOLD', nation: 'Kosovo', pos: 'RW' }, // Milot Rashica
  1479: { rating: 78, tier: 'GOLD', nation: 'Portugal', pos: 'CB' }, // Tiago Djaló
  135068: { rating: 78, tier: 'GOLD', nation: 'Ivory Coast', pos: 'CB' }, // Emmanuel Agbadou
  2973: { rating: 77, tier: 'GOLD', nation: 'Panama', pos: 'RB' }, // Michael Murillo
  1987: { rating: 78, tier: 'GOLD', nation: 'Turkey', pos: 'LB' }, // Rıdvan Yılmaz
  1998: { rating: 77, tier: 'GOLD', nation: 'Turkey', pos: 'RW' }, // Kerem Yılmaz
  181808: { rating: 76, tier: 'GOLD', nation: 'Italy', pos: 'CM' }, // Fabio Miretti
  549: { rating: 77, tier: 'GOLD', nation: 'Czech Republic', pos: 'RW' }, // Václav Černý
  50046: { rating: 75, tier: 'GOLD', nation: 'Turkey', pos: 'CB' }, // Emirhan Topçu
  50104: { rating: 75, tier: 'GOLD', nation: 'Turkey', pos: 'GK' }, // Doğan Alemdar
  34710: { rating: 75, tier: 'GOLD', nation: 'South Korea', pos: 'ST' }, // Oh Hyeon-Gyu
  312840: { rating: 75, tier: 'GOLD', nation: 'Netherlands', pos: 'RW' }, // Ernest Poku

  // === SPORTING CP ===
  265595: { rating: 83, tier: 'ELITE', nation: 'Portugal', pos: 'CB' }, // Gonçalo Inácio
  41194: { rating: 80, tier: 'GOLD', nation: 'Portugal', pos: 'LWB' }, // Nuno Santos
  51776: { rating: 79, tier: 'GOLD', nation: 'Uruguay', pos: 'LWB' }, // Maximiliano Araújo
  304228: { rating: 79, tier: 'GOLD', nation: 'Belgium', pos: 'CB' }, // Zeno Debast
  46672: { rating: 79, tier: 'GOLD', nation: 'Portugal', pos: 'GK' }, // Rui Silva
  154839: { rating: 78, tier: 'GOLD', nation: 'Mozambique', pos: 'RM' }, // Geny Catamo
  26965: { rating: 79, tier: 'GOLD', nation: 'Greece', pos: 'ST' }, // Fotis Ioannidis
  108563: { rating: 78, tier: 'GOLD', nation: 'Uruguay', pos: 'CM' }, // Rodrigo Zalazar
  262845: { rating: 77, tier: 'GOLD', nation: 'Portugal', pos: 'CB' }, // Eduardo Quaresma
  341700: { rating: 76, tier: 'GOLD', nation: 'Spain', pos: 'RB' }, // Iván Fresneda
  286084: { rating: 76, tier: 'GOLD', nation: 'Spain', pos: 'CM' }, // Sergi Altimira
  47237: { rating: 77, tier: 'GOLD', nation: 'Colombia', pos: 'ST' }, // Luis Javier Suárez
  404574: { rating: 75, tier: 'GOLD', nation: 'Brazil', pos: 'RW' }, // Luis Guilherme
  338014: { rating: 73, tier: 'SILVER', nation: 'Australia', pos: 'RW' }, // Nestory Irankunda
  135839: { rating: 75, tier: 'GOLD', nation: 'Greece', pos: 'RB' }, // Georgios Vagiannidis
  279802: { rating: 74, tier: 'GOLD', nation: 'Brazil', pos: 'RB' }, // Pedro Lima
  341822: { rating: 74, tier: 'GOLD', nation: 'Denmark', pos: 'CM' }, // Sebastian Andersen
  331046: { rating: 73, tier: 'SILVER', nation: 'Ivory Coast', pos: 'CM' }, // Iddrisu Doumbia

  // === BENFICA ===
  675: { rating: 85, tier: 'ELITE', nation: 'Ukraine', pos: 'GK' }, // Anatoliy Trubin
  41104: { rating: 84, tier: 'ELITE', nation: 'Portugal', pos: 'CDM' }, // João Palhinha
  39043: { rating: 81, tier: 'ELITE', nation: 'Norway', pos: 'CM' }, // Fredrik Aursnes
  13489: { rating: 81, tier: 'ELITE', nation: 'Colombia', pos: 'ST' }, // Jhon Durán
  36798: { rating: 81, tier: 'ELITE', nation: 'Greece', pos: 'ST' }, // Vangelis Pavlidis
  161945: { rating: 81, tier: 'ELITE', nation: 'Ukraine', pos: 'CAM' }, // Georgiy Sudakov
  573: { rating: 81, tier: 'ELITE', nation: 'Portugal', pos: 'CAM' }, // Rafa Silva
  161939: { rating: 79, tier: 'GOLD', nation: 'Portugal', pos: 'CB' }, // Tomás Araújo
  15623: { rating: 79, tier: 'GOLD', nation: 'Denmark', pos: 'RB' }, // Alexander Bah
  1163: { rating: 79, tier: 'GOLD', nation: 'Portugal', pos: 'LW' }, // Bruma
  25458: { rating: 79, tier: 'GOLD', nation: 'Belgium', pos: 'RW' }, // Dodi Lukebakio
  133: { rating: 78, tier: 'GOLD', nation: 'France', pos: 'CB' }, // Clément Lenglet
  25918: { rating: 78, tier: 'GOLD', nation: 'Luxembourg', pos: 'CM' }, // Leandro Barreiro
  158378: { rating: 77, tier: 'GOLD', nation: 'Argentina', pos: 'CDM' }, // Enzo Barrenechea
  414385: { rating: 76, tier: 'GOLD', nation: 'Argentina', pos: 'CAM' }, // Claudio Echeverri
  301528: { rating: 77, tier: 'GOLD', nation: 'Norway', pos: 'LW' }, // Andreas Schjelderup
  40560: { rating: 76, tier: 'GOLD', nation: 'Poland', pos: 'LM' }, // Jakub Kamiński
  362755: { rating: 75, tier: 'GOLD', nation: 'Argentina', pos: 'RW' }, // Gianluca Prestianni
  127803: { rating: 76, tier: 'GOLD', nation: 'Morocco', pos: 'LB' }, // Souffian El Karouani
  348568: { rating: 75, tier: 'GOLD', nation: 'Australia', pos: 'CB' }, // Alessandro Circati
  135505: { rating: 74, tier: 'GOLD', nation: 'Sweden', pos: 'LB' }, // Samuel Dahl
  162595: { rating: 74, tier: 'GOLD', nation: 'Portugal', pos: 'GK' }, // Samuel Soares

  // === FC PORTO ===
  369: { rating: 85, tier: 'ELITE', nation: 'Portugal', pos: 'GK' }, // Diogo Costa
  94562: { rating: 82, tier: 'ELITE', nation: 'Mexico', pos: 'ST' }, // Santiago Giménez
  10500: { rating: 81, tier: 'ELITE', nation: 'Brazil', pos: 'RW' }, // Pepê Aquino
  278375: { rating: 81, tier: 'ELITE', nation: 'Argentina', pos: 'CDM' }, // Alan Varela
  182504: { rating: 80, tier: 'GOLD', nation: 'Spain', pos: 'CM' }, // Gabri Veiga
  30807: { rating: 80, tier: 'GOLD', nation: 'Ivory Coast', pos: 'CM' }, // Seko Fofana
  61431: { rating: 79, tier: 'GOLD', nation: 'Poland', pos: 'CB' }, // Jakub Kiwior
  37: { rating: 79, tier: 'GOLD', nation: 'Argentina', pos: 'CB' }, // Nehuén Pérez
  2901: { rating: 79, tier: 'GOLD', nation: 'South Korea', pos: 'CM' }, // Hwang In-Beom
  2999: { rating: 78, tier: 'GOLD', nation: 'Poland', pos: 'CB' }, // Jan Bednarek
  2063: { rating: 78, tier: 'GOLD', nation: 'Portugal', pos: 'ST' }, // André Silva
  133453: { rating: 77, tier: 'GOLD', nation: 'Spain', pos: 'LW' }, // Borja Sainz
  41966: { rating: 77, tier: 'GOLD', nation: 'Portugal', pos: 'LB' }, // Francisco Moura
  336596: { rating: 76, tier: 'GOLD', nation: 'Portugal', pos: 'RB' }, // Martim Fernandes
  126899: { rating: 75, tier: 'GOLD', nation: 'Nigeria', pos: 'LB' }, // Zaidu Sanusi
  240: { rating: 76, tier: 'GOLD', nation: 'Netherlands', pos: 'CDM' }, // Pablo Rosario
  41432: { rating: 75, tier: 'GOLD', nation: 'Portugal', pos: 'GK' }, // Cláudio Ramos
  507527: { rating: 72, tier: 'SILVER', nation: 'Brazil', pos: 'CAM' }, // Gabriel Mec

  // === AJAX ===
  127: { rating: 85, tier: 'ELITE', nation: 'Germany', pos: 'GK' }, // Marc-André ter Stegen
  984: { rating: 83, tier: 'ELITE', nation: 'Germany', pos: 'CAM' }, // Julian Brandt
  10316: { rating: 80, tier: 'GOLD', nation: 'Brazil', pos: 'LB' }, // Caio Henrique
  74: { rating: 80, tier: 'GOLD', nation: 'Morocco', pos: 'CDM' }, // Sofyan Amrabat
  2182: { rating: 80, tier: 'GOLD', nation: 'Ukraine', pos: 'RW' }, // Viktor Tsygankov
  531: { rating: 78, tier: 'GOLD', nation: 'Netherlands', pos: 'CB' }, // Daley Blind
  261: { rating: 78, tier: 'GOLD', nation: 'Germany', pos: 'CB' }, // Thilo Kehrer
  25321: { rating: 78, tier: 'GOLD', nation: 'Netherlands', pos: 'CM' }, // Davy Klaassen
  37160: { rating: 78, tier: 'GOLD', nation: 'Netherlands', pos: 'RW' }, // Steven Berghuis
  550: { rating: 78, tier: 'GOLD', nation: 'Denmark', pos: 'ST' }, // Kasper Dolberg
  267771: { rating: 78, tier: 'GOLD', nation: 'Brazil', pos: 'ST' }, // Marcos Leonardo
  110153: { rating: 76, tier: 'GOLD', nation: 'Nigeria', pos: 'ST' }, // Tolu Arokodare
  301771: { rating: 77, tier: 'GOLD', nation: 'Ivory Coast', pos: 'LW' }, // Simon Adingra
  36893: { rating: 76, tier: 'GOLD', nation: 'Netherlands', pos: 'LB' }, // Owen Wijndal
  294684: { rating: 76, tier: 'GOLD', nation: 'Netherlands', pos: 'CB' }, // Youri Baas
  313941: { rating: 75, tier: 'GOLD', nation: 'Denmark', pos: 'RB' }, // Anton Gaaei
  37167: { rating: 75, tier: 'GOLD', nation: 'Indonesia', pos: 'GK' }, // Maarten Paes
  56283: { rating: 74, tier: 'GOLD', nation: 'Brazil', pos: 'RB' }, // Lucas Rosa
  138753: { rating: 75, tier: 'GOLD', nation: 'Norway', pos: 'LW' }, // Oliver Edvardsen
  443829: { rating: 73, tier: 'SILVER', nation: 'Belgium', pos: 'CDM' }, // Jorthy Mokio
  396202: { rating: 71, tier: 'SILVER', nation: 'Morocco', pos: 'CAM' }, // Rayane Bounida

  // === PSV ===
  37890: { rating: 81, tier: 'ELITE', nation: 'Netherlands', pos: 'CDM' }, // Jerdy Schouten
  207: { rating: 80, tier: 'GOLD', nation: 'Croatia', pos: 'LW' }, // Ivan Perišić
  38735: { rating: 80, tier: 'GOLD', nation: 'USA', pos: 'RB' }, // Sergiño Dest
  36905: { rating: 79, tier: 'GOLD', nation: 'Netherlands', pos: 'CAM' }, // Guus Til
  73868: { rating: 79, tier: 'GOLD', nation: 'USA', pos: 'ST' }, // Ricardo Pepi
  43036: { rating: 80, tier: 'GOLD', nation: 'Romania', pos: 'RW' }, // Dennis Man
  37143: { rating: 79, tier: 'GOLD', nation: 'Netherlands', pos: 'CB' }, // Lutsharel Geertruida
  25646: { rating: 78, tier: 'GOLD', nation: 'France', pos: 'ST' }, // Alassane Pléa
  342054: { rating: 78, tier: 'GOLD', nation: 'Netherlands', pos: 'CB' }, // Ryan Flamingo
  191233: { rating: 77, tier: 'GOLD', nation: 'France', pos: 'RB' }, // Kiliann Sildillia
  37818: { rating: 78, tier: 'GOLD', nation: 'Netherlands', pos: 'GK' }, // Nick Olij
  327895: { rating: 77, tier: 'GOLD', nation: 'Germany', pos: 'CAM' }, // Paul Wanner
  233: { rating: 77, tier: 'GOLD', nation: 'Brazil', pos: 'LB' }, // Mauro Júnior
  361385: { rating: 76, tier: 'GOLD', nation: 'Spain', pos: 'CB' }, // Yarek Gasiorowski
  37438: { rating: 76, tier: 'GOLD', nation: 'Netherlands', pos: 'CAM' }, // Sven Mijnans
  228: { rating: 76, tier: 'GOLD', nation: 'Netherlands', pos: 'CB' }, // Armando Obispo
  36987: { rating: 76, tier: 'GOLD', nation: 'Netherlands', pos: 'ST' }, // Sam Lammers
  365018: { rating: 75, tier: 'GOLD', nation: 'Netherlands', pos: 'LW' }, // Ruben van Bommel
  138804: { rating: 76, tier: 'GOLD', nation: 'Czech Republic', pos: 'GK' }, // Matěj Kovář
  1821: { rating: 78, tier: 'GOLD', nation: 'Serbia', pos: 'LWB' }, // Filip Kostić
  329409: { rating: 74, tier: 'GOLD', nation: 'USA', pos: 'RW' }, // Esmir Bajraktarevic

  // === FEYENOORD ===
  37784: { rating: 80, tier: 'GOLD', nation: 'Netherlands', pos: 'CAM' }, // Sem Steijn
  37148: { rating: 79, tier: 'GOLD', nation: 'Netherlands', pos: 'CB' }, // Jerry St. Juste
  162475: { rating: 78, tier: 'GOLD', nation: 'Spain', pos: 'CB' }, // Mika Mármol
  40911: { rating: 78, tier: 'GOLD', nation: 'Poland', pos: 'CM' }, // Jakub Moder
  326067: { rating: 78, tier: 'GOLD', nation: 'Algeria', pos: 'RW' }, // Anis Hadj-Moussa
  284071: { rating: 77, tier: 'GOLD', nation: 'Morocco', pos: 'CM' }, // Oussama Targhalline
  182636: { rating: 76, tier: 'GOLD', nation: 'Spain', pos: 'LB' }, // Javi López
  37147: { rating: 76, tier: 'GOLD', nation: 'Netherlands', pos: 'RB' }, // Bart Nieuwkoop
  37742: { rating: 76, tier: 'GOLD', nation: 'Netherlands', pos: 'LB' }, // Gijs Smal
  32858: { rating: 76, tier: 'GOLD', nation: 'Japan', pos: 'CB' }, // Tsuyoshi Watanabe
  337587: { rating: 75, tier: 'GOLD', nation: 'Australia', pos: 'LB' }, // Jordy Bos
  8680: { rating: 76, tier: 'GOLD', nation: 'Belgium', pos: 'CDM' }, // Charles Vanhoutte
  727: { rating: 76, tier: 'GOLD', nation: 'England', pos: 'RW' }, // Reiss Nelson
  128385: { rating: 75, tier: 'GOLD', nation: 'Portugal', pos: 'RW' }, // Gonçalo Borges
  37451: { rating: 75, tier: 'GOLD', nation: 'Netherlands', pos: 'RB' }, // Mats Deijl
  203380: { rating: 75, tier: 'GOLD', nation: 'Germany', pos: 'GK' }, // Tjark Ernst
  425819: { rating: 74, tier: 'GOLD', nation: 'Netherlands', pos: 'CM' }, // Gjivai Zechiël

  // === CELTIC ===
  891: { rating: 80, tier: 'GOLD', nation: 'Scotland', pos: 'LB' }, // Kieran Tierney
  284347: { rating: 78, tier: 'GOLD', nation: 'USA', pos: 'CB' }, // Cameron Carter-Vickers
  138856: { rating: 77, tier: 'GOLD', nation: 'Canada', pos: 'RB' }, // Alistair Johnston
  284249: { rating: 76, tier: 'GOLD', nation: 'USA', pos: 'CB' }, // Auston Trusty
  1058: { rating: 79, tier: 'GOLD', nation: 'Scotland', pos: 'CDM' }, // Callum McGregor
  18906: { rating: 76, tier: 'GOLD', nation: 'England', pos: 'CM' }, // Alex Oxlade-Chamberlain
  20387: { rating: 81, tier: 'ELITE', nation: 'Egypt', pos: 'RM' }, // Hossam Hassan ///this haithem and he rm/rw
  20844: { rating: 81, tier: 'ELITE', nation: 'Egypt', pos: 'RM' }, // H. Hassan
  41399: { rating: 76, tier: 'GOLD', nation: 'Sweden', pos: 'RW' }, // Benjamin Nygren
  18925: { rating: 77, tier: 'GOLD', nation: 'England', pos: 'GK' }, // Sam Johnstone
  2477: { rating: 75, tier: 'GOLD', nation: 'Switzerland', pos: 'RB' }, // Jordan Lotomba

  // === CLUB BRUGGE ===
  162: { rating: 84, tier: 'ELITE', nation: 'Switzerland', pos: 'GK' }, // Yann Sommer
  2720: { rating: 80, tier: 'GOLD', nation: 'Belgium', pos: 'CAM' }, // Hans Vanaken
  2725: { rating: 77, tier: 'GOLD', nation: 'Belgium', pos: 'CB' }, // Brandon Mechele
  328574: { rating: 77, tier: 'GOLD', nation: 'Ecuador', pos: 'CB' }, // Joel Ordoñez
  22262: { rating: 77, tier: 'GOLD', nation: 'Norway', pos: 'CM' }, // Hugo Vetlesen
  308006: { rating: 76, tier: 'GOLD', nation: 'Portugal', pos: 'RW' }, // Carlos Forbs
  285098: { rating: 75, tier: 'GOLD', nation: 'Germany', pos: 'ST' }, // Nicolò Tresoldi
  284362: { rating: 75, tier: 'GOLD', nation: 'France', pos: 'CM' }, // Felix Lemaréchal

  // === ANDERLECHT ===
  468: { rating: 76, tier: 'GOLD', nation: 'Sweden', pos: 'LB' }, // Ludwig Augustinsson
  275: { rating: 75, tier: 'GOLD', nation: 'France', pos: 'RB' }, // Giulian Biancone
  138806: { rating: 75, tier: 'GOLD', nation: 'Ireland', pos: 'CB' }, // Andrew Omobamidele
  2743: { rating: 75, tier: 'GOLD', nation: 'Belgium', pos: 'RB' }, // Killian Sardella
  284364: { rating: 76, tier: 'GOLD', nation: 'Belgium', pos: 'CAM' }, // Mario Stroeykens
  134591: { rating: 75, tier: 'GOLD', nation: 'Finland', pos: 'RW' }, // Oliver Antman
  70868: { rating: 76, tier: 'GOLD', nation: 'Ukraine', pos: 'ST' }, // Danylo Sikan
  61830: { rating: 75, tier: 'GOLD', nation: 'Moldova', pos: 'LB' }, // Oleg Reabciuk

  // === OLYMPIACOS ===
  2975: { rating: 81, tier: 'ELITE', nation: 'Morocco', pos: 'ST' }, // Ayoub El Kaabi
  18835: { rating: 81, tier: 'ELITE', nation: 'Jamaica', pos: 'RW' }, // Leon Bailey
  22241: { rating: 78, tier: 'GOLD', nation: 'Portugal', pos: 'RW' }, // Gelson Martins
  284366: { rating: 78, tier: 'GOLD', nation: 'Portugal', pos: 'LW' }, // Jota Silva
  2067: { rating: 77, tier: 'GOLD', nation: 'Ukraine', pos: 'ST' }, // Roman Yaremchuk
  328575: { rating: 79, tier: 'GOLD', nation: 'Argentina', pos: 'CDM' }, // Santiago Hezze
  47278: { rating: 78, tier: 'GOLD', nation: 'Angola', pos: 'CB' }, // David Carmo
  2615: { rating: 77, tier: 'GOLD', nation: 'Greece', pos: 'CB' }, // Panagiotis Retsos
  308008: { rating: 76, tier: 'GOLD', nation: 'Italy', pos: 'CB' }, // Lorenzo Pirola
  6064: { rating: 76, tier: 'GOLD', nation: 'Argentina', pos: 'LB' }, // Francisco Ortega
  2618: { rating: 78, tier: 'GOLD', nation: 'Greece', pos: 'CAM' }, // Konstantinos Fortounis
  1152: { rating: 78, tier: 'GOLD', nation: 'Turkey', pos: 'CAM' }, // Yusuf Yazıcı
  47280: { rating: 76, tier: 'GOLD', nation: 'Spain', pos: 'CDM' }, // Dani García
  41198: { rating: 77, tier: 'GOLD', nation: 'Portugal', pos: 'CM' }, // Chiquinho
  1609: { rating: 78, tier: 'GOLD', nation: 'Switzerland', pos: 'CM' }, // Remo Freuler
  70870: { rating: 76, tier: 'GOLD', nation: 'Armenia', pos: 'LB' }, // Nair Tiknizyan

  // === PANATHINAIKOS ===
  153: { rating: 82, tier: 'ELITE', nation: 'Netherlands', pos: 'CB' }, // Stefan de Vrij
  395: { rating: 79, tier: 'GOLD', nation: 'Italy', pos: 'RB' }, // Davide Calabria
  161: { rating: 77, tier: 'GOLD', nation: 'Spain', pos: 'GK' }, // Iñaki Peña
  2611: { rating: 77, tier: 'GOLD', nation: 'Iceland', pos: 'CB' }, // Sverrir Ingason
  138808: { rating: 77, tier: 'GOLD', nation: 'Denmark', pos: 'LB' }, // Victor Kristiansen
  2614: { rating: 76, tier: 'GOLD', nation: 'Greece', pos: 'LB' }, // Giorgos Kiriakopoulos
  19875: { rating: 77, tier: 'GOLD', nation: 'Spain', pos: 'CDM' }, // Pedro Chirivella
  152982: { rating: 77, tier: 'GOLD', nation: 'Uruguay', pos: 'RW' }, // Facundo Pellistri
  284368: { rating: 77, tier: 'GOLD', nation: 'Nigeria', pos: 'ST' }, // Cyriel Dessers
  134593: { rating: 77, tier: 'GOLD', nation: 'Trinidad and Tobago', pos: 'ST' }, // Levi García
  757: { rating: 76, tier: 'GOLD', nation: 'France', pos: 'CM' }, // Moussa Sissoko
  18928: { rating: 76, tier: 'GOLD', nation: 'Morocco', pos: 'CM' }, // Imran Louza

  // === RED BULL SALZBURG ===
  578: { rating: 78, tier: 'GOLD', nation: 'Ukraine', pos: 'RW' }, // Andriy Yarmolenko
  678: { rating: 79, tier: 'GOLD', nation: 'Ukraine', pos: 'CM' }, // Mykola Shaparenko
  680: { rating: 78, tier: 'GOLD', nation: 'Ukraine', pos: 'CAM' }, // Vitaliy Buyalskyi
  284370: { rating: 77, tier: 'GOLD', nation: 'Ukraine', pos: 'CDM' }, // Volodymyr Brazhko
  682: { rating: 77, tier: 'GOLD', nation: 'Ukraine', pos: 'CM' }, // Oleksandr Pikhalyonok
  684: { rating: 76, tier: 'GOLD', nation: 'Ukraine', pos: 'RB' }, // Oleksandr Tymchyk
  686: { rating: 76, tier: 'GOLD', nation: 'Ukraine', pos: 'CB' }, // Denys Popov
  3000: { rating: 76, tier: 'GOLD', nation: 'Poland', pos: 'CB' }, // Tomasz Kędziora
  676: { rating: 77, tier: 'GOLD', nation: 'Ukraine', pos: 'GK' }, // Georgiy Bushchan
  688: { rating: 76, tier: 'GOLD', nation: 'Ukraine', pos: 'LW' }, // Vladyslav Kabaev
  284372: { rating: 75, tier: 'GOLD', nation: 'Ukraine', pos: 'RW' }, // Nazar Voloshyn
  138810: { rating: 75, tier: 'GOLD', nation: 'Panama', pos: 'ST' }, // Eduardo Guerrero

  // === FC BASEL ===
  535: { rating: 80, tier: 'GOLD', nation: 'Switzerland', pos: 'CAM' }, // Xherdan Shaqiri
  2479: { rating: 78, tier: 'GOLD', nation: 'Switzerland', pos: 'GK' }, // Jonas Omlin
  2482: { rating: 76, tier: 'GOLD', nation: 'Austria', pos: 'CB' }, // Flavius Daniliuc
  2485: { rating: 76, tier: 'GOLD', nation: 'Switzerland', pos: 'CB' }, // Becir Omeragić
  2488: { rating: 76, tier: 'GOLD', nation: 'Slovenia', pos: 'ST' }, // Žan Celar
  284374: { rating: 75, tier: 'GOLD', nation: 'Nigeria', pos: 'LW' }, // Philip Otele

  // === MONTERREY ===
  2846: { rating: 80, tier: 'GOLD', nation: 'Argentina', pos: 'LW' }, // Lucas Ocampos
  152984: { rating: 79, tier: 'GOLD', nation: 'Uruguay', pos: 'LW' }, // Diego Rossi
  136: { rating: 78, tier: 'GOLD', nation: 'Spain', pos: 'CM' }, // Óliver Torres
  2298: { rating: 78, tier: 'GOLD', nation: 'Mexico', pos: 'CAM' }, // Orbelín Pineda
  2300: { rating: 78, tier: 'GOLD', nation: 'Mexico', pos: 'RW' }, // Jesús Corona
  2466: { rating: 77, tier: 'GOLD', nation: 'Argentina', pos: 'GK' }, // Esteban Andrada
  2302: { rating: 77, tier: 'GOLD', nation: 'Colombia', pos: 'RB' }, // Stefan Medina
  2304: { rating: 77, tier: 'GOLD', nation: 'Mexico', pos: 'CB' }, // Carlos Salcedo
  2306: { rating: 77, tier: 'GOLD', nation: 'Mexico', pos: 'CB' }, // Víctor Guzmán
  2308: { rating: 77, tier: 'GOLD', nation: 'Mexico', pos: 'LB' }, // Gerardo Arteaga
  2310: { rating: 76, tier: 'GOLD', nation: 'Mexico', pos: 'RB' }, // Érick Aguirre
  284376: { rating: 76, tier: 'GOLD', nation: 'Mexico', pos: 'CDM' }, // Fidel Ambríz
  2848: { rating: 77, tier: 'GOLD', nation: 'Argentina', pos: 'CDM' }, // Jorge Rodríguez
  2850: { rating: 77, tier: 'GOLD', nation: 'Argentina', pos: 'RW' }, // Luca Orellano
  284378: { rating: 77, tier: 'GOLD', nation: 'Belgium', pos: 'ST' }, // Hugo Cuypers
  2852: { rating: 76, tier: 'GOLD', nation: 'Montenegro', pos: 'ST' }, // Uroš Đurđević

  // === RIVER PLATE ===
  1493: { rating: 81, tier: 'ELITE', nation: 'Argentina', pos: 'LB' }, // Marcos Acuña
  53: { rating: 82, tier: 'ELITE', nation: 'Argentina', pos: 'RW' }, // Ángel Correa
  6067: { rating: 81, tier: 'ELITE', nation: 'Argentina', pos: 'CAM' }, // Thiago Almada
  624: { rating: 80, tier: 'GOLD', nation: 'Argentina', pos: 'CB' }, // Nicolás Otamendi
  2468: { rating: 79, tier: 'GOLD', nation: 'Argentina', pos: 'RB' }, // Gonzalo Montiel
  51572: { rating: 78, tier: 'GOLD', nation: 'Uruguay', pos: 'LB' }, // Matías Viña
  47258: { rating: 79, tier: 'GOLD', nation: 'Uruguay', pos: 'CM' }, // Mauro Arambarri
  6010: { rating: 80, tier: 'GOLD', nation: 'Argentina', pos: 'ST' }, // Lucas Beltrán
  6011: { rating: 79, tier: 'GOLD', nation: 'Colombia', pos: 'ST' }, // Rafael Santos Borré
  1222: { rating: 78, tier: 'GOLD', nation: 'Argentina', pos: 'ST' }, // Sebastián Driussi
  6347: { rating: 80, tier: 'GOLD', nation: 'Argentina', pos: 'CDM' }, // Aníbal Moreno
  6725: { rating: 78, tier: 'GOLD', nation: 'Argentina', pos: 'CDM' }, // Fausto Vera
  6080: { rating: 77, tier: 'GOLD', nation: 'Argentina', pos: 'RB' }, // Fabricio Bustos
  2610: { rating: 77, tier: 'GOLD', nation: 'Uruguay', pos: 'RB' }, // Giovanni González

  // === BOCA JUNIORS ===
  271: { rating: 81, tier: 'ELITE', nation: 'Argentina', pos: 'CDM' }, // Leandro Paredes
  6327: { rating: 80, tier: 'GOLD', nation: 'Uruguay', pos: 'ST' }, // Miguel Merentiel
  288707: { rating: 79, tier: 'GOLD', nation: 'Argentina', pos: 'LM' }, // Kevin Zenón
  26305: { rating: 78, tier: 'GOLD', nation: 'Argentina', pos: 'CDM' }, // Santiago Ascacíbar
  2464: { rating: 78, tier: 'GOLD', nation: 'Argentina', pos: 'GK' }, // Agustín Marchesín
  289444: { rating: 77, tier: 'GOLD', nation: 'Argentina', pos: 'LB' }, // Lautaro Blanco
  6082: { rating: 76, tier: 'GOLD', nation: 'Argentina', pos: 'CB' }, // Nicolás Figal
  212842: { rating: 75, tier: 'GOLD', nation: 'Argentina', pos: 'CB' }, // Marco Pellegrino
  6209: { rating: 76, tier: 'GOLD', nation: 'Argentina', pos: 'CM' }, // Tomás Belmonte
  11463: { rating: 77, tier: 'GOLD', nation: 'Chile', pos: 'RW' }, // Carlos Palacios
  2521: { rating: 77, tier: 'GOLD', nation: 'Paraguay', pos: 'RW' }, // Ángel Romero
  35551: { rating: 77, tier: 'GOLD', nation: 'Paraguay', pos: 'ST' }, // Adam Bareiro
  2494: { rating: 77, tier: 'GOLD', nation: 'Colombia', pos: 'LW' }, // Sebastián Villa
  6092: { rating: 77, tier: 'GOLD', nation: 'Argentina', pos: 'CAM' }, // Alan Velasco
  59229: { rating: 76, tier: 'GOLD', nation: 'Argentina', pos: 'ST' }, // Milton Giménez
  11424: { rating: 76, tier: 'GOLD', nation: 'Chile', pos: 'CM' }, // Williams Alarcón
  5791: { rating: 76, tier: 'GOLD', nation: 'Argentina', pos: 'LM' }, // Malcom Braida

  // === SANTOS ===
  276: { rating: 94, tier: 'ULTIMATE', nation: 'Brazil', pos: 'LW' }, // Neymar
  10534: { rating: 80, tier: 'GOLD', nation: 'Brazil', pos: 'ST' }, // Gabriel Barbosa (Gabigol)
  10536: { rating: 79, tier: 'GOLD', nation: 'Brazil', pos: 'CB' }, // Lucas Veríssimo
  10538: { rating: 78, tier: 'GOLD', nation: 'Brazil', pos: 'CB' }, // Luan Peres
  10540: { rating: 78, tier: 'GOLD', nation: 'Brazil', pos: 'RB' }, // Rodinei
  10542: { rating: 78, tier: 'GOLD', nation: 'Brazil', pos: 'RB' }, // Igor Vinicius
  10544: { rating: 78, tier: 'GOLD', nation: 'Brazil', pos: 'CDM' }, // Willian Arão
  10546: { rating: 77, tier: 'GOLD', nation: 'Brazil', pos: 'CM' }, // Gabriel Menino
  10548: { rating: 77, tier: 'GOLD', nation: 'Brazil', pos: 'CM' }, // João Schmidt
  10550: { rating: 78, tier: 'GOLD', nation: 'Brazil', pos: 'GK' }, // João Paulo
  284380: { rating: 77, tier: 'GOLD', nation: 'Brazil', pos: 'GK' }, // Gabriel Brazão
  2854: { rating: 77, tier: 'GOLD', nation: 'Argentina', pos: 'RW' }, // Benjamín Rollheiser
  2856: { rating: 77, tier: 'GOLD', nation: 'Argentina', pos: 'LW' }, // Álvaro Barreal
  10552: { rating: 77, tier: 'GOLD', nation: 'Brazil', pos: 'ST' }, // Rony
  10554: { rating: 76, tier: 'GOLD', nation: 'Brazil', pos: 'LW' }, // Moisés

  // === FLAMENGO ===
  2757: { rating: 87, tier: 'MASTER', nation: 'Brazil', pos: 'CAM' }, // Lucas Paquetá
  1646: { rating: 87, tier: 'MASTER', nation: 'Brazil', pos: 'CAM' }, // Lucas Paquetá
  10556: { rating: 82, tier: 'ELITE', nation: 'Brazil', pos: 'ST' }, // Pedro
  2470: { rating: 82, tier: 'ELITE', nation: 'Uruguay', pos: 'CAM' }, // Giorgian de Arrascaeta
  2472: { rating: 81, tier: 'ELITE', nation: 'Uruguay', pos: 'CM' }, // Nicolás de la Cruz
  47282: { rating: 81, tier: 'ELITE', nation: 'Brazil', pos: 'LW' }, // Samuel Lino
  2292: { rating: 81, tier: 'ELITE', nation: 'Italy', pos: 'CDM' }, // Jorginho
  278: { rating: 81, tier: 'ELITE', nation: 'Brazil', pos: 'RB' }, // Danilo
  280: { rating: 79, tier: 'GOLD', nation: 'Brazil', pos: 'LB' }, // Alex Sandro
  282: { rating: 79, tier: 'GOLD', nation: 'Brazil', pos: 'RB' }, // Emerson Royal
  10558: { rating: 79, tier: 'GOLD', nation: 'Brazil', pos: 'CB' }, // Léo Ortiz
  10560: { rating: 79, tier: 'GOLD', nation: 'Brazil', pos: 'CB' }, // Léo Pereira
  10562: { rating: 78, tier: 'GOLD', nation: 'Brazil', pos: 'LB' }, // Ayrton Lucas
  2462: { rating: 79, tier: 'GOLD', nation: 'Argentina', pos: 'GK' }, // Agustín Rossi
  2474: { rating: 77, tier: 'GOLD', nation: 'Uruguay', pos: 'RB' }, // Guillermo Varela
  11426: { rating: 77, tier: 'GOLD', nation: 'Chile', pos: 'CDM' }, // Erick Pulgar
  134: { rating: 78, tier: 'GOLD', nation: 'Spain', pos: 'CM' }, // Saúl
  10564: { rating: 78, tier: 'GOLD', nation: 'Brazil', pos: 'LW' }, // Bruno Henrique
  10566: { rating: 78, tier: 'GOLD', nation: 'Brazil', pos: 'LW' }, // Everton (Cebolinha)
  10568: { rating: 77, tier: 'GOLD', nation: 'Brazil', pos: 'RW' }, // Luiz Araújo
  2858: { rating: 77, tier: 'GOLD', nation: 'Colombia', pos: 'CAM' }, // Jorge Carrascal
  138812: { rating: 78, tier: 'GOLD', nation: 'Ecuador', pos: 'RW' }, // Gonzalo Plata

  // === PALMEIRAS ===
  47284: { rating: 81, tier: 'ELITE', nation: 'Brazil', pos: 'ST' }, // Vitor Roque
  18930: { rating: 81, tier: 'ELITE', nation: 'Brazil', pos: 'CM' }, // Andreas Pereira
  2476: { rating: 80, tier: 'GOLD', nation: 'Paraguay', pos: 'CB' }, // Gustavo Gómez
  2860: { rating: 81, tier: 'ELITE', nation: 'Colombia', pos: 'RW' }, // Jhon Arias
  10570: { rating: 80, tier: 'GOLD', nation: 'Brazil', pos: 'RW' }, // Felipe Anderson
  10572: { rating: 80, tier: 'GOLD', nation: 'Brazil', pos: 'ST' }, // Paulinho
  2478: { rating: 79, tier: 'GOLD', nation: 'Uruguay', pos: 'LB' }, // Joaquín Piquerez
  10574: { rating: 79, tier: 'GOLD', nation: 'Brazil', pos: 'CB' }, // Murilo
  10576: { rating: 77, tier: 'GOLD', nation: 'Brazil', pos: 'CB' }, // Bruno Fuchs
  2862: { rating: 77, tier: 'GOLD', nation: 'Argentina', pos: 'CB' }, // Alexander Barboza
  2864: { rating: 76, tier: 'GOLD', nation: 'Argentina', pos: 'RB' }, // Agustín Giay
  284382: { rating: 77, tier: 'GOLD', nation: 'Brazil', pos: 'RB' }, // Khellven
  284384: { rating: 78, tier: 'GOLD', nation: 'Brazil', pos: 'GK' }, // Carlos Miguel
  10578: { rating: 78, tier: 'GOLD', nation: 'Brazil', pos: 'CM' }, // Lucas Evangelista
  10580: { rating: 78, tier: 'GOLD', nation: 'Brazil', pos: 'CM' }, // Marlon Freitas
  10582: { rating: 78, tier: 'GOLD', nation: 'Brazil', pos: 'CAM' }, // Maurício
  2866: { rating: 77, tier: 'GOLD', nation: 'Argentina', pos: 'ST' }, // José Manuel López

  // === BOTAFOGO ===
  284: { rating: 79, tier: 'GOLD', nation: 'Brazil', pos: 'LB' }, // Alex Telles
  10584: { rating: 78, tier: 'GOLD', nation: 'Brazil', pos: 'ST' }, // Tiquinho Soares
  10586: { rating: 78, tier: 'GOLD', nation: 'Brazil', pos: 'RW' }, // Júnior Santos
  10588: { rating: 78, tier: 'GOLD', nation: 'Brazil', pos: 'ST' }, // Arthur Cabral
  10590: { rating: 77, tier: 'GOLD', nation: 'Brazil', pos: 'RW' }, // Vitinho
  10592: { rating: 77, tier: 'GOLD', nation: 'Brazil', pos: 'LB' }, // Marçal
  10594: { rating: 78, tier: 'GOLD', nation: 'Brazil', pos: 'CDM' }, // Allan
  2484: { rating: 77, tier: 'GOLD', nation: 'Uruguay', pos: 'RB' }, // Mateo Ponte
  2868: { rating: 77, tier: 'GOLD', nation: 'Venezuela', pos: 'CB' }, // Nahuel Ferraresi
  2870: { rating: 77, tier: 'GOLD', nation: 'Argentina', pos: 'CM' }, // Cristian Medina
  2486: { rating: 76, tier: 'GOLD', nation: 'Uruguay', pos: 'CAM' }, // Santiago Rodríguez
  10596: { rating: 76, tier: 'GOLD', nation: 'Brazil', pos: 'CM' }, // Edenílson

  // === CORINTHIANS ===
  552: { rating: 83, tier: 'ELITE', nation: 'Netherlands', pos: 'ST' }, // Memphis Depay
  2872: { rating: 80, tier: 'GOLD', nation: 'Argentina', pos: 'CAM' }, // Rodrigo Garro
  10598: { rating: 80, tier: 'GOLD', nation: 'Brazil', pos: 'ST' }, // Yuri Alberto
  10600: { rating: 80, tier: 'GOLD', nation: 'Brazil', pos: 'CAM' }, // Matheus Pereira
  18882: { rating: 78, tier: 'GOLD', nation: 'Brazil', pos: 'CB' }, // Gabriel Paulista
  10602: { rating: 78, tier: 'GOLD', nation: 'Brazil', pos: 'CB' }, // André Ramalho
  10604: { rating: 77, tier: 'GOLD', nation: 'Brazil', pos: 'CB' }, // Gustavo Henrique
  10606: { rating: 77, tier: 'GOLD', nation: 'Brazil', pos: 'CDM' }, // Raniele
  10608: { rating: 77, tier: 'GOLD', nation: 'Brazil', pos: 'RB' }, // Matheuzinho
  10610: { rating: 78, tier: 'GOLD', nation: 'Brazil', pos: 'GK' }, // Hugo Souza
  2874: { rating: 76, tier: 'GOLD', nation: 'Argentina', pos: 'LB' }, // Fabrizio Angileri
  18932: { rating: 76, tier: 'GOLD', nation: 'England', pos: 'CAM' }, // Jesse Lingard
  41200: { rating: 74, tier: 'GOLD', nation: 'Morocco', pos: 'RW' }, // Zakaria Labyad
  2876: { rating: 77, tier: 'GOLD', nation: 'Peru', pos: 'RW' }, // André Carrillo
  10612: { rating: 76, tier: 'GOLD', nation: 'Brazil', pos: 'LB' }, // Matheus Bidu

  // === FLUMINENSE ===
  259: { rating: 91, tier: 'ULTIMATE', nation: 'Brazil', pos: 'CB' }, // Thiago Silva
  10614: { rating: 82, tier: 'ELITE', nation: 'Brazil', pos: 'ST' }, // Hulk
  10616: { rating: 79, tier: 'GOLD', nation: 'Brazil', pos: 'LB' }, // Guilherme Arana
  2878: { rating: 80, tier: 'GOLD', nation: 'Argentina', pos: 'ST' }, // Germán Cano
  10618: { rating: 78, tier: 'GOLD', nation: 'Brazil', pos: 'CAM' }, // Paulo Henrique Ganso
  2880: { rating: 80, tier: 'GOLD', nation: 'Argentina', pos: 'CAM' }, // Luciano Acosta
  2882: { rating: 79, tier: 'GOLD', nation: 'Venezuela', pos: 'LW' }, // Yeferson Soteldo
  2884: { rating: 78, tier: 'GOLD', nation: 'Venezuela', pos: 'RW' }, // Jefferson Savarino
  2488: { rating: 78, tier: 'GOLD', nation: 'Uruguay', pos: 'RW' }, // Agustín Canobbio
  10620: { rating: 77, tier: 'GOLD', nation: 'Brazil', pos: 'CM' }, // Martinelli
  10622: { rating: 77, tier: 'GOLD', nation: 'Brazil', pos: 'ST' }, // John Kennedy
  10624: { rating: 77, tier: 'GOLD', nation: 'Brazil', pos: 'CDM' }, // Otávio
  10626: { rating: 78, tier: 'GOLD', nation: 'Brazil', pos: 'GK' }, // Fábio
  10628: { rating: 76, tier: 'GOLD', nation: 'Brazil', pos: 'RB' }, // Samuel Xavier
  10630: { rating: 76, tier: 'GOLD', nation: 'Brazil', pos: 'RB' }, // Guga

  // === GREMIO ===
  10632: { rating: 79, tier: 'GOLD', nation: 'Brazil', pos: 'GK' }, // Weverton
  554: { rating: 79, tier: 'GOLD', nation: 'Denmark', pos: 'ST' }, // Martin Braithwaite
  18934: { rating: 77, tier: 'GOLD', nation: 'Brazil', pos: 'ST' }, // Carlos Vinícius
  2886: { rating: 78, tier: 'GOLD', nation: 'Argentina', pos: 'RW' }, // Cristian Pavón
  10634: { rating: 78, tier: 'GOLD', nation: 'Brazil', pos: 'RW' }, // Tetê
  2490: { rating: 78, tier: 'GOLD', nation: 'Paraguay', pos: 'CDM' }, // Mathías Villasanti
  2492: { rating: 77, tier: 'GOLD', nation: 'Paraguay', pos: 'CB' }, // Fabián Balbuena
  2888: { rating: 77, tier: 'GOLD', nation: 'Argentina', pos: 'CB' }, // Walter Kannemann
  2890: { rating: 77, tier: 'GOLD', nation: 'Argentina', pos: 'CM' }, // Juan Nardoni
  41202: { rating: 77, tier: 'GOLD', nation: 'Croatia', pos: 'CM' }, // Filip Krovinović
  10636: { rating: 76, tier: 'GOLD', nation: 'Brazil', pos: 'RB' }, // João Pedro
  10638: { rating: 76, tier: 'GOLD', nation: 'Brazil', pos: 'RB' }, // Marcos Rocha
  10640: { rating: 76, tier: 'GOLD', nation: 'Brazil', pos: 'CB' }, // Marlon

  // === SAO PAULO ===
  18936: { rating: 84, tier: 'ELITE', nation: 'Brazil', pos: 'RW' }, // Lucas Moura
  178: { rating: 84, tier: 'ELITE', nation: 'Brazil', pos: 'RW' }, // Lucas Moura
  2892: { rating: 80, tier: 'GOLD', nation: 'Argentina', pos: 'ST' }, // Jonathan Calleri
  10642: { rating: 79, tier: 'GOLD', nation: 'Brazil', pos: 'CDM' }, // Pablo Maia
  10644: { rating: 78, tier: 'GOLD', nation: 'Brazil', pos: 'ST' }, // Luciano
  10646: { rating: 78, tier: 'GOLD', nation: 'Brazil', pos: 'LW' }, // Ferreira
  10648: { rating: 78, tier: 'GOLD', nation: 'Brazil', pos: 'RW' }, // Artur
  286: { rating: 78, tier: 'GOLD', nation: 'Italy', pos: 'CB' }, // Rafael Tolói
  41204: { rating: 76, tier: 'GOLD', nation: 'Portugal', pos: 'RB' }, // Cédric Soares
  288: { rating: 78, tier: 'GOLD', nation: 'Brazil', pos: 'LB' }, // Wendell
  138814: { rating: 78, tier: 'GOLD', nation: 'Ecuador', pos: 'CB' }, // Robert Arboleda
  2494: { rating: 77, tier: 'GOLD', nation: 'Paraguay', pos: 'CM' }, // Damián Bobadilla
  10650: { rating: 78, tier: 'GOLD', nation: 'Brazil', pos: 'GK' }, // Rafael
  10652: { rating: 77, tier: 'GOLD', nation: 'Brazil', pos: 'CM' }, // Marcos Antônio
  10654: { rating: 77, tier: 'GOLD', nation: 'Brazil', pos: 'CAM' }, // Cauly

  // === VASCO DA GAMA ===
  10656: { rating: 78, tier: 'GOLD', nation: 'Brazil', pos: 'GK' }, // Léo Jardim
  10658: { rating: 77, tier: 'GOLD', nation: 'Brazil', pos: 'LB' }, // Lucas Piton
  10660: { rating: 77, tier: 'GOLD', nation: 'Brazil', pos: 'CB' }, // Robert Renan
  2894: { rating: 77, tier: 'GOLD', nation: 'Colombia', pos: 'CB' }, // Carlos Cuesta
  10662: { rating: 77, tier: 'GOLD', nation: 'Brazil', pos: 'CDM' }, // Thiago Mendes
  10664: { rating: 77, tier: 'GOLD', nation: 'Brazil', pos: 'CDM' }, // Jair
  10666: { rating: 76, tier: 'GOLD', nation: 'Brazil', pos: 'CM' }, // Tchê Tchê
  10668: { rating: 76, tier: 'GOLD', nation: 'Brazil', pos: 'RW' }, // Adson
  10670: { rating: 76, tier: 'GOLD', nation: 'Brazil', pos: 'ST' }, // Brenner
  2896: { rating: 76, tier: 'GOLD', nation: 'Argentina', pos: 'ST' }, // Facundo Colidio
  2898: { rating: 76, tier: 'GOLD', nation: 'Colombia', pos: 'RW' }, // Andrés Gómez

  // === ATLETICO MINEIRO ===
  10672: { rating: 79, tier: 'GOLD', nation: 'Brazil', pos: 'GK' }, // Everson
  290: { rating: 79, tier: 'GOLD', nation: 'Brazil', pos: 'LB' }, // Renan Lodi
  10674: { rating: 79, tier: 'GOLD', nation: 'Brazil', pos: 'CAM' }, // Gustavo Scarpa
  10676: { rating: 78, tier: 'GOLD', nation: 'Brazil', pos: 'CM' }, // Fred
  10678: { rating: 78, tier: 'GOLD', nation: 'Brazil', pos: 'CB' }, // Lyanco
  10680: { rating: 78, tier: 'GOLD', nation: 'Brazil', pos: 'CB' }, // Léo Duarte
  10682: { rating: 78, tier: 'GOLD', nation: 'Brazil', pos: 'RW' }, // Dudu
  10684: { rating: 77, tier: 'GOLD', nation: 'Brazil', pos: 'LW' }, // Bernard
  10686: { rating: 77, tier: 'GOLD', nation: 'Brazil', pos: 'CM' }, // Igor Gomes
  10688: { rating: 77, tier: 'GOLD', nation: 'Brazil', pos: 'CDM' }, // Maycon
  10690: { rating: 76, tier: 'GOLD', nation: 'Brazil', pos: 'CAM' }, // Reinier
  2900: { rating: 78, tier: 'GOLD', nation: 'Colombia', pos: 'ST' }, // Mateo Cassierra
  138816: { rating: 77, tier: 'GOLD', nation: 'Ecuador', pos: 'RB' }, // Ángelo Preciado
  138818: { rating: 77, tier: 'GOLD', nation: 'Ecuador', pos: 'CM' }, // Alan Franco
};

// Name-based mappings for players where apiId might differ slightly
const NAME_MAP = {
  // World Class / Legends
  'L. Messi': { rating: 95, tier: 'ULTIMATE', nation: 'Argentina', pos: 'RW' },
  'Lionel Messi': { rating: 95, tier: 'ULTIMATE', nation: 'Argentina', pos: 'RW' },
  'Neymar': { rating: 91, tier: 'ULTIMATE', nation: 'Brazil', pos: 'LW' },
  'Neymar Jr': { rating: 91, tier: 'ULTIMATE', nation: 'Brazil', pos: 'LW' },
  'V. Osimhen': { rating: 89, tier: 'MASTER', nation: 'Nigeria', pos: 'ST' },
  'Rafael Leão': { rating: 87, tier: 'MASTER', nation: 'Portugal', pos: 'LW' },
  'Son Heung-Min': { rating: 87, tier: 'MASTER', nation: 'South Korea', pos: 'LW' },
  'Ederson': { rating: 87, tier: 'MASTER', nation: 'Brazil', pos: 'GK' },
  'İ. Gündoğan': { rating: 86, tier: 'MASTER', nation: 'Germany', pos: 'CM' },
  'N. Kanté': { rating: 86, tier: 'MASTER', nation: 'France', pos: 'CDM' },
  'Casemiro': { rating: 85, tier: 'ELITE', nation: 'Brazil', pos: 'CDM' },
  'M. ter Stegen': { rating: 85, tier: 'ELITE', nation: 'Germany', pos: 'GK' },
  'Diogo Costa': { rating: 85, tier: 'ELITE', nation: 'Portugal', pos: 'GK' },
  'L. Sané': { rating: 85, tier: 'ELITE', nation: 'Germany', pos: 'RW' },
  'Y. Sommer': { rating: 84, tier: 'ELITE', nation: 'Switzerland', pos: 'GK' },
  'L. Suárez': { rating: 84, tier: 'ELITE', nation: 'Uruguay', pos: 'ST' },
  'T. Müller': { rating: 84, tier: 'ELITE', nation: 'Germany', pos: 'CAM' },
  'R. Lukaku': { rating: 84, tier: 'ELITE', nation: 'Belgium', pos: 'ST' },
  'D. Vlahović': { rating: 84, tier: 'ELITE', nation: 'Serbia', pos: 'ST' },
  'R. De Paul': { rating: 84, tier: 'ELITE', nation: 'Argentina', pos: 'CM' },
  'João Palhinha': { rating: 84, tier: 'ELITE', nation: 'Portugal', pos: 'CDM' },
  'Lucas Paquetá': { rating: 84, tier: 'ELITE', nation: 'Brazil', pos: 'CAM' },
  'M. Reus': { rating: 83, tier: 'ELITE', nation: 'Germany', pos: 'CAM' },
  'M. Depay': { rating: 83, tier: 'ELITE', nation: 'Netherlands', pos: 'ST' },
  'L. Trossard': { rating: 83, tier: 'ELITE', nation: 'Belgium', pos: 'LW' },
  'J. Brandt': { rating: 83, tier: 'ELITE', nation: 'Germany', pos: 'CAM' },
  'Gonçalo Inácio': { rating: 83, tier: 'ELITE', nation: 'Portugal', pos: 'CB' },
  'N. Aké': { rating: 83, tier: 'ELITE', nation: 'Netherlands', pos: 'CB' },
  'D. Sánchez': { rating: 82, tier: 'ELITE', nation: 'Colombia', pos: 'CB' },
  'M. Škriniar': { rating: 86, tier: 'MASTER', nation: 'Slovakia', pos: 'CB' },
  'A. Trubin': { rating: 85, tier: 'ELITE', nation: 'Ukraine', pos: 'GK' },
  'L. Torreira': { rating: 82, tier: 'ELITE', nation: 'Uruguay', pos: 'CDM' },
  'S. Giménez': { rating: 82, tier: 'ELITE', nation: 'Mexico', pos: 'ST' },
  'Thiago Silva': { rating: 91, tier: 'ULTIMATE', nation: 'Brazil', pos: 'CB' },
  'Lucas Paquetá': { rating: 87, tier: 'MASTER', nation: 'Brazil', pos: 'CAM' },
  'Hulk': { rating: 82, tier: 'ELITE', nation: 'Brazil', pos: 'ST' },
  'Pedro': { rating: 82, tier: 'ELITE', nation: 'Brazil', pos: 'ST' },
  'G. de Arrascaeta': { rating: 82, tier: 'ELITE', nation: 'Uruguay', pos: 'CAM' },
  'Á. Correa': { rating: 82, tier: 'ELITE', nation: 'Argentina', pos: 'RW' },
  'S. de Vrij': { rating: 82, tier: 'ELITE', nation: 'Netherlands', pos: 'CB' },
  'M. Greenwood': { rating: 82, tier: 'ELITE', nation: 'England', pos: 'RW' },
  'D. Bouanga': { rating: 81, tier: 'ELITE', nation: 'Gabon', pos: 'LW' },
  'H. Lozano': { rating: 81, tier: 'ELITE', nation: 'Mexico', pos: 'RW' },
  'Marco Asensio': { rating: 81, tier: 'ELITE', nation: 'Spain', pos: 'RW' },
  'M. Guendouzi': { rating: 81, tier: 'ELITE', nation: 'France', pos: 'CM' },
  'K. Aktürkoğlu': { rating: 81, tier: 'ELITE', nation: 'Turkey', pos: 'LW' },
  'B. Yılmaz': { rating: 81, tier: 'ELITE', nation: 'Turkey', pos: 'RW' },
  'U. Çakır': { rating: 81, tier: 'ELITE', nation: 'Turkey', pos: 'GK' },
  'O. Kökçü': { rating: 81, tier: 'ELITE', nation: 'Turkey', pos: 'CM' },
  'O. Kökçü': { rating: 81, tier: 'ELITE', nation: 'Turkey', pos: 'CM' },
  'A. Nübel': { rating: 81, tier: 'ELITE', nation: 'Germany', pos: 'GK' },
  'A. El Kaabi': { rating: 81, tier: 'ELITE', nation: 'Morocco', pos: 'ST' },
  'L. Bailey': { rating: 81, tier: 'ELITE', nation: 'Jamaica', pos: 'RW' },
  'F. Aursnes': { rating: 81, tier: 'ELITE', nation: 'Norway', pos: 'CM' },
  'J. Durán': { rating: 81, tier: 'ELITE', nation: 'Colombia', pos: 'ST' },
  'V. Pavlidis': { rating: 81, tier: 'ELITE', nation: 'Greece', pos: 'ST' },
  'H. Sudakov': { rating: 81, tier: 'ELITE', nation: 'Ukraine', pos: 'CAM' },
  'Rafa': { rating: 81, tier: 'ELITE', nation: 'Portugal', pos: 'CAM' },
  'Pepê Aquino': { rating: 81, tier: 'ELITE', nation: 'Brazil', pos: 'RW' },
  'A. Varela': { rating: 81, tier: 'ELITE', nation: 'Argentina', pos: 'CDM' },
  'Gabriel Sara': { rating: 81, tier: 'ELITE', nation: 'Brazil', pos: 'CM' },
  'J. Schouten': { rating: 81, tier: 'ELITE', nation: 'Netherlands', pos: 'CDM' },
  'M. Acuña': { rating: 81, tier: 'ELITE', nation: 'Argentina', pos: 'LB' },
  'T. Almada': { rating: 81, tier: 'ELITE', nation: 'Argentina', pos: 'CAM' },
  'L. Paredes': { rating: 81, tier: 'ELITE', nation: 'Argentina', pos: 'CDM' },
  'N. de la Cruz': { rating: 81, tier: 'ELITE', nation: 'Uruguay', pos: 'CM' },
  'Samuel Lino': { rating: 81, tier: 'ELITE', nation: 'Brazil', pos: 'LW' },
  'Jorginho': { rating: 81, tier: 'ELITE', nation: 'Italy', pos: 'CDM' },
  'Danilo': { rating: 81, tier: 'ELITE', nation: 'Brazil', pos: 'RB' },
  'Vitor Roque': { rating: 81, tier: 'ELITE', nation: 'Brazil', pos: 'ST' },
  'Andreas Pereira': { rating: 81, tier: 'ELITE', nation: 'Brazil', pos: 'CM' },
  'J. Arias': { rating: 81, tier: 'ELITE', nation: 'Colombia', pos: 'RW' },
  'Lucas Moura': { rating: 84, tier: 'ELITE', nation: 'Brazil', pos: 'RW' },
  'H. Hassan': { rating: 81, tier: 'ELITE', nation: 'Egypt', pos: 'RM' },
};

// Nationality fixes for known players
const NATION_FIXES = {
  'M. Lemina': 'Gabon',
  'S. Amrabat': 'Morocco',
  'V. Tsygankov': 'Ukraine',
  'C. Echeverri': 'Argentina',
  'D. Vlahović': 'Serbia',
  'S. Fofana': 'Ivory Coast',
  'R. Freuler': 'Switzerland',
  'N. Tiknizyan': 'Armenia',
  'I. Louza': 'Morocco',
  'G. Bushchan': 'Ukraine',
  'O. Reabciuk': 'Moldova',
  'E. Andrada': 'Argentina',
  'S. Adingra': 'Ivory Coast',
  'F. Kostić': 'Serbia',
  'J. Kamiński': 'Poland',
  'F. Miretti': 'Italy',
  'D. Lukebakio': 'Belgium',
  'K. Tierney': 'Scotland',
  'R. Nelson': 'England',
  'G. Montiel': 'Argentina',
  'Á. Correa': 'Argentina',
  'T. Almada': 'Argentina',
  'L. Beltrán': 'Argentina',
  'R. Borré': 'Colombia',
  'S. Driussi': 'Argentina',
  'N. Otamendi': 'Argentina',
  'M. Acuña': 'Argentina',
  'M. Arambarri': 'Uruguay',
  'M. Viña': 'Uruguay',
  'G. González': 'Uruguay',
  'A. Marchesín': 'Argentina',
  'M. Merentiel': 'Uruguay',
  'Á. Romero': 'Paraguay',
  'A. Bareiro': 'Paraguay',
  'S. Villa': 'Colombia',
  'A. Velasco': 'Argentina',
  'C. Palacios': 'Chile',
  'W. Alarcón': 'Chile',
  'K. Zenón': 'Argentina',
  'S. Ascacíbar': 'Argentina',
  'T. Belmonte': 'Argentina',
  'M. Braida': 'Argentina',
  'M. Giménez': 'Argentina',
  'Marco Pellegrino': 'Argentina',
  'L. Blanco': 'Argentina',
  'N. Figal': 'Argentina',
};

// Smart rating calculator for unmapped players
function calibratePlayer(player, clubFile) {
  // 1. Check exact API ID
  if (PLAYER_CALIBRATION[player.apiId]) {
    const ov = PLAYER_CALIBRATION[player.apiId];
    return {
      ...player,
      rating: ov.rating,
      tier: ov.tier || getTier(ov.rating),
      nation: ov.nation || player.nation,
      position: ov.pos || cleanPosition(player.position),
    };
  }

  // 2. Check Name map
  if (NAME_MAP[player.name]) {
    const ov = NAME_MAP[player.name];
    return {
      ...player,
      rating: ov.rating,
      tier: ov.tier || getTier(ov.rating),
      nation: ov.nation || player.nation,
      position: ov.pos || cleanPosition(player.position),
    };
  }

  // 3. General calibration based on age / apiId / current rating
  let pos = cleanPosition(player.position);
  let nat = NATION_FIXES[player.name] || player.nation;
  let r = player.rating;

  // Clean corrupted names
  let name = player.name;
  if (name.includes('MimoviÄ‡')) name = 'O. Mimović';
  if (name.includes('CvetkoviÄ‡')) name = 'M. Cvetković';

  // API Sports IDs:
  // > 450000 are typically young / youth academy prospects
  // If an unmapped player has rating 81 and apiId > 350000, that was an API-fetch artifact
  if (player.apiId > 450000) {
    if (r >= 75) {
      r = 68; // Promising youth
    } else if (r >= 70) {
      r = 66;
    } else if (r < 55) {
      r = 58;
    }
  } else if (player.apiId > 300000) {
    if (r >= 81) {
      r = 75; // Rotation / solid youngster
    }
  } else {
    // Senior player
    if (r > 80 && !NAME_MAP[player.name] && !PLAYER_CALIBRATION[player.apiId]) {
      // Regular senior starter for global clubs is normally 76-79 GOLD
      r = 78;
    }
  }

  // Keep rating within realistic bound [50, 95]
  r = Math.min(95, Math.max(50, r));
  const t = getTier(r);

  return {
    ...player,
    name,
    position: pos,
    nation: nat,
    rating: r,
    tier: t,
  };
}

// Process clubs
const doneClubs = new Set([
  'trabzonspor.json',
  'al-hilal.json',
  'al-nassr.json',
  'al-ittihad.json',
  'al-ahli.json',
  'al-shabab.json',
  'al-ettifaq.json',
  'al-qadsiah.json'
]);

const files = fs.readdirSync(dir).filter(f => !doneClubs.has(f));
console.log(`Processing ${files.length} clubs...`);

let totalUpdated = 0;

for (const file of files) {
  const filePath = path.join(dir, file);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const prevCount = data.players.length;

  const calibrated = data.players.map(p => calibratePlayer(p, file));

  // Verify no deletions
  if (calibrated.length !== prevCount) {
    throw new Error(`Player count mismatch in ${file}: expected ${prevCount}, got ${calibrated.length}`);
  }

  // Verify zero tier mismatches
  for (const p of calibrated) {
    const expectedTier = getTier(p.rating);
    if (p.tier !== expectedTier) {
      throw new Error(`Tier mismatch for ${p.name} in ${file}: rating ${p.rating} but tier ${p.tier}`);
    }
  }

  data.players = calibrated;
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  totalUpdated += calibrated.length;
  console.log(`✓ ${file.padEnd(25)}: ${calibrated.length} players calibrated.`);
}

console.log(`\nSuccessfully calibrated all 34 clubs (${totalUpdated} players).`);
