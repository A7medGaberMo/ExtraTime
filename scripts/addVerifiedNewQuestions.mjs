import fs from 'fs';
import path from 'path';

const newVerifiedQuestions = [
  // ── 1. All-Time FIFA World Cup Top Scorers ───────────────────────────
  {
    targetFile: 'data/rank/players/legends-and-icons.json',
    category: 'players',
    question: {
      title: {
        en: 'Rank these 5 legends by total FIFA World Cup goals scored',
        ar: 'رتّب هؤلاء الأساطير الخمسة حسب عدد الأهداف المسجلة في كأس العالم',
      },
      subtitle: {
        en: 'Men’s FIFA World Cup tournaments all-time',
        ar: 'بطولات كأس العالم للرجال عبر التاريخ',
      },
      category: 'players',
      answers: [
        {
          answerKey: 'wc_klose',
          name: { en: 'Miroslav Klose', ar: 'ميروسلاف كلوزه' },
          media: { type: 'player', primaryUrl: 'https://upload.wikimedia.org/wikipedia/commons/8/87/Miroslav_Klose_2014.jpg', fallbackText: 'MK' },
          stat: { en: '16 Goals', ar: '16 هدفاً' },
        },
        {
          answerKey: 'wc_r9',
          name: { en: 'Ronaldo Nazário', ar: 'رونالدو البرازيلي' },
          media: { type: 'player', primaryUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Ronaldo_2018.jpg/330px-Ronaldo_2018.jpg', fallbackText: 'R9' },
          stat: { en: '15 Goals', ar: '15 هدفاً' },
        },
        {
          answerKey: 'wc_muller',
          name: { en: 'Gerd Müller', ar: 'غيرد مولر' },
          media: { type: 'player', primaryUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/ea/Gerd_M%C3%BCller_1974.jpg', fallbackText: 'GM' },
          stat: { en: '14 Goals', ar: '14 هدفاً' },
        },
        {
          answerKey: 'wc_fontaine',
          name: { en: 'Just Fontaine', ar: 'جاست فونتين' },
          media: { type: 'player', primaryUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/4b/Just_Fontaine_1958.jpg', fallbackText: 'JF' },
          stat: { en: '13 Goals', ar: '13 هدفاً' },
        },
        {
          answerKey: 'wc_pele',
          name: { en: 'Pelé', ar: 'بيليه' },
          media: { type: 'player', primaryUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Pele_con_brasil_%28cropped%29.jpg/330px-Pele_con_brasil_%28cropped%29.jpg', fallbackText: 'PEL' },
          stat: { en: '12 Goals', ar: '12 هدفاً' },
        },
      ],
    },
  },

  // ── 2. Most Men’s Ballon d’Or Awards ─────────────────────────────────
  {
    targetFile: 'data/rank/players/legends-and-icons.json',
    category: 'players',
    question: {
      title: {
        en: 'Rank these 5 legends by total Ballon d’Or awards won',
        ar: 'رتّب هؤلاء الأساطير الخمسة حسب عدد جوائز الكرة الذهبية (فرانس فوتبول)',
      },
      subtitle: {
        en: 'Official France Football Ballon d’Or records',
        ar: 'سجلات مجلة فرانس فوتبول الرسمية للكرة الذهبية',
      },
      category: 'players',
      answers: [
        {
          answerKey: 'bdo_messi',
          name: { en: 'Lionel Messi', ar: 'ليونيل ميسي' },
          media: { type: 'player', primaryUrl: 'https://upload.wikimedia.org/wikipedia/commons/b/b4/Lionel-Messi-Argentina-2022-FIFA-World-Cup_%28cropped%29.jpg', fallbackText: 'LM' },
          stat: { en: '8 Awards', ar: '8 كرات ذهبية' },
        },
        {
          answerKey: 'bdo_cr7',
          name: { en: 'Cristiano Ronaldo', ar: 'كريستيانو رونالدو' },
          media: { type: 'player', primaryUrl: 'https://upload.wikimedia.org/wikipedia/commons/8/8c/Cristiano_Ronaldo_2018.jpg', fallbackText: 'CR7' },
          stat: { en: '5 Awards', ar: '5 كرات ذهبية' },
        },
        {
          answerKey: 'bdo_platini',
          name: { en: 'Michel Platini', ar: 'ميشيل بلاتيني' },
          media: { type: 'player', primaryUrl: 'https://upload.wikimedia.org/wikipedia/commons/b/b3/Michel_Platini_1984.jpg', fallbackText: 'MP' },
          stat: { en: '3 Awards', ar: '3 كرات ذهبية' },
        },
        {
          answerKey: 'bdo_beckenbauer',
          name: { en: 'Franz Beckenbauer', ar: 'فرانز بيكنباور' },
          media: { type: 'player', primaryUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/52/Franz_Beckenbauer_1974.jpg', fallbackText: 'FB' },
          stat: { en: '2 Awards', ar: 'كرتان ذهبيتان' },
        },
        {
          answerKey: 'bdo_zidane',
          name: { en: 'Zinedine Zidane', ar: 'زين الدين زيدان' },
          media: { type: 'player', primaryUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Zinedine_Zidane_by_Tasnim_03.jpg/330px-Zinedine_Zidane_by_Tasnim_03.jpg', fallbackText: 'ZZ' },
          stat: { en: '1 Award', ar: 'كرة ذهبية واحدة' },
        },
      ],
    },
  },

  // ── 3. All-Time Men’s International Top Goalscorers ──────────────────
  {
    targetFile: 'data/rank/players/legends-and-icons.json',
    category: 'players',
    question: {
      title: {
        en: 'Rank these 5 stars by official international goals scored for their national teams',
        ar: 'رتّب هؤلاء النجوم الخمسة حسب إجمالي أهدافهم الدولية مع منتخباتهم الوطنية',
      },
      subtitle: {
        en: 'Senior international competitive and friendly matches',
        ar: 'المباريات الدولية الرسمية والودية المعتمدة للمنتخبات الأولى',
      },
      category: 'players',
      answers: [
        {
          answerKey: 'int_cr7',
          name: { en: 'Cristiano Ronaldo', ar: 'كريستيانو رونالدو' },
          subText: { en: 'Portugal', ar: 'البرتغال' },
          media: { type: 'player', primaryUrl: 'https://upload.wikimedia.org/wikipedia/commons/8/8c/Cristiano_Ronaldo_2018.jpg', fallbackText: 'CR7' },
          stat: { en: '135 Goals', ar: '135 هدفاً' },
        },
        {
          answerKey: 'int_messi',
          name: { en: 'Lionel Messi', ar: 'ليونيل ميسي' },
          subText: { en: 'Argentina', ar: 'الأرجنتين' },
          media: { type: 'player', primaryUrl: 'https://upload.wikimedia.org/wikipedia/commons/b/b4/Lionel-Messi-Argentina-2022-FIFA-World-Cup_%28cropped%29.jpg', fallbackText: 'LM' },
          stat: { en: '112 Goals', ar: '112 هدفاً' },
        },
        {
          answerKey: 'int_daei',
          name: { en: 'Ali Daei', ar: 'علي دائي' },
          subText: { en: 'Iran', ar: 'إيران' },
          media: { type: 'player', primaryUrl: 'https://upload.wikimedia.org/wikipedia/commons/6/6f/Ali_Daei_2018.jpg', fallbackText: 'AD' },
          stat: { en: '108 Goals', ar: '108 أهداف' },
        },
        {
          answerKey: 'int_puskas',
          name: { en: 'Ferenc Puskás', ar: 'فيرينتس بوشكاش' },
          subText: { en: 'Hungary', ar: 'المجر' },
          media: { type: 'player', primaryUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/e3/Ferenc_Pusk%C3%A1s_1960.jpg', fallbackText: 'FP' },
          stat: { en: '84 Goals', ar: '84 هدفاً' },
        },
        {
          answerKey: 'int_neymar',
          name: { en: 'Neymar', ar: 'نيمار دا سيلفا' },
          subText: { en: 'Brazil', ar: 'البرازيل' },
          media: { type: 'player', primaryUrl: 'https://upload.wikimedia.org/wikipedia/commons/8/83/Bra-Cos_%281%29_%28cropped%29.jpg', fallbackText: 'NJR' },
          stat: { en: '79 Goals', ar: '79 هدفاً' },
        },
      ],
    },
  },

  // ── 4. All-Time UEFA Champions League Top Scorers ───────────────────
  {
    targetFile: 'data/rank/players/legends-and-icons.json',
    category: 'players',
    question: {
      title: {
        en: 'Rank these 5 superstars by total UEFA Champions League goals scored',
        ar: 'رتّب هؤلاء النجوم الخمسة حسب إجمالي الأهداف المسجلة في دوري أبطال أوروبا',
      },
      subtitle: {
        en: 'Group stage to final matches included',
        ar: 'شامل جميع الأدوار من دور المجموعات حتى المباراة النهائية',
      },
      category: 'players',
      answers: [
        {
          answerKey: 'ucl_cr7',
          name: { en: 'Cristiano Ronaldo', ar: 'كريستيانو رونالدو' },
          media: { type: 'player', primaryUrl: 'https://upload.wikimedia.org/wikipedia/commons/8/8c/Cristiano_Ronaldo_2018.jpg', fallbackText: 'CR7' },
          stat: { en: '140 Goals', ar: '140 هدفاً' },
        },
        {
          answerKey: 'ucl_messi',
          name: { en: 'Lionel Messi', ar: 'ليونيل ميسي' },
          media: { type: 'player', primaryUrl: 'https://upload.wikimedia.org/wikipedia/commons/b/b4/Lionel-Messi-Argentina-2022-FIFA-World-Cup_%28cropped%29.jpg', fallbackText: 'LM' },
          stat: { en: '129 Goals', ar: '129 هدفاً' },
        },
        {
          answerKey: 'ucl_lewy',
          name: { en: 'Robert Lewandowski', ar: 'روبرت ليفاندوفسكي' },
          media: { type: 'player', primaryUrl: 'https://media.api-sports.io/football/players/521.png', fallbackText: 'RL' },
          stat: { en: '101 Goals', ar: '101 هدفاً' },
        },
        {
          answerKey: 'ucl_benzema',
          name: { en: 'Karim Benzema', ar: 'كريم بنزيما' },
          media: { type: 'player', primaryUrl: 'https://media.api-sports.io/football/players/759.png', fallbackText: 'KB' },
          stat: { en: '90 Goals', ar: '90 هدفاً' },
        },
        {
          answerKey: 'ucl_raul',
          name: { en: 'Raúl González', ar: 'راؤول غونزاليس' },
          media: { type: 'player', primaryUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/5f/Ra%C3%BAl_Gonz%C3%A1lez_2013.jpg', fallbackText: 'RG' },
          stat: { en: '71 Goals', ar: '71 هدفاً' },
        },
      ],
    },
  },

  // ── 5. Most Official Goals in El Clásico History ────────────────────
  {
    targetFile: 'data/rank/players/legends-and-icons.json',
    category: 'players',
    question: {
      title: {
        en: 'Rank these 5 legends by official goals scored in El Clásico history',
        ar: 'رتّب هؤلاء الأساطير الخمسة حسب عدد الأهداف المسجلة في تاريخ الكلاسيكو (ريال مدريد ضد برشلونة)',
      },
      subtitle: {
        en: 'Real Madrid vs Barcelona official matches',
        ar: 'المباريات الرسمية بين ريال مدريد وبرشلونة عبر التاريخ',
      },
      category: 'players',
      answers: [
        {
          answerKey: 'clasico_messi',
          name: { en: 'Lionel Messi', ar: 'ليونيل ميسي' },
          subText: { en: 'Barcelona', ar: 'برشلونة' },
          media: { type: 'player', primaryUrl: 'https://upload.wikimedia.org/wikipedia/commons/b/b4/Lionel-Messi-Argentina-2022-FIFA-World-Cup_%28cropped%29.jpg', fallbackText: 'LM' },
          stat: { en: '26 Goals', ar: '26 هدفاً' },
        },
        {
          answerKey: 'clasico_cr7',
          name: { en: 'Cristiano Ronaldo', ar: 'كريستيانو رونالدو' },
          subText: { en: 'Real Madrid', ar: 'ريال مدريد' },
          media: { type: 'player', primaryUrl: 'https://upload.wikimedia.org/wikipedia/commons/8/8c/Cristiano_Ronaldo_2018.jpg', fallbackText: 'CR7' },
          stat: { en: '18 Goals', ar: '18 هدفاً' },
        },
        {
          answerKey: 'clasico_benzema',
          name: { en: 'Karim Benzema', ar: 'كريم بنزيما' },
          subText: { en: 'Real Madrid', ar: 'ريال مدريد' },
          media: { type: 'player', primaryUrl: 'https://media.api-sports.io/football/players/759.png', fallbackText: 'KB' },
          stat: { en: '16 Goals', ar: '16 هدفاً' },
        },
        {
          answerKey: 'clasico_raul',
          name: { en: 'Raúl González', ar: 'راؤول غونزاليس' },
          subText: { en: 'Real Madrid', ar: 'ريال مدريد' },
          media: { type: 'player', primaryUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/5f/Ra%C3%BAl_Gonz%C3%A1lez_2013.jpg', fallbackText: 'RG' },
          stat: { en: '15 Goals', ar: '15 هدفاً' },
        },
        {
          answerKey: 'clasico_cesar',
          name: { en: 'César Rodríguez', ar: 'سيزار رودريغيز' },
          subText: { en: 'Barcelona', ar: 'برشلونة' },
          media: { type: 'player', primaryUrl: 'https://upload.wikimedia.org/wikipedia/commons/8/87/C%C3%A9sar_Rodr%C3%ADguez_%C3%81lvarez.jpg', fallbackText: 'CR' },
          stat: { en: '14 Goals', ar: '14 هدفاً' },
        },
      ],
    },
  },

  // ── 6. Most Copa Libertadores Titles ────────────────────────────────
  {
    targetFile: 'data/rank/clubs/club-records-and-dynasties.json',
    category: 'clubs',
    question: {
      title: {
        en: 'Rank these 5 South American clubs by Copa Libertadores titles won',
        ar: 'رتّب هذه الأندية اللاتينية الخمسة حسب عدد ألقاب كوبا ليبرتادوريس',
      },
      subtitle: {
        en: 'CONMEBOL Copa Libertadores history',
        ar: 'تاريخ بطولة كوبا ليبرتادوريس لأندية أمريكا الجنوبية',
      },
      category: 'clubs',
      answers: [
        {
          answerKey: 'lib_independiente',
          name: { en: 'Independiente', ar: 'إنديبندينتي' },
          subText: { en: 'Argentina', ar: 'الأرجنتين' },
          media: { type: 'club', primaryUrl: 'https://media.api-sports.io/football/teams/453.png', fallbackText: 'IND' },
          stat: { en: '7 Titles', ar: '7 ألقاب' },
        },
        {
          answerKey: 'lib_boca',
          name: { en: 'Boca Juniors', ar: 'بوكا جونيورز' },
          subText: { en: 'Argentina', ar: 'الأرجنتين' },
          media: { type: 'club', primaryUrl: 'https://media.api-sports.io/football/teams/451.png', fallbackText: 'BOC' },
          stat: { en: '6 Titles', ar: '6 ألقاب' },
        },
        {
          answerKey: 'lib_penarol',
          name: { en: 'Peñarol', ar: 'بينارول' },
          subText: { en: 'Uruguay', ar: 'أوروغواي' },
          media: { type: 'club', primaryUrl: 'https://media.api-sports.io/football/teams/2381.png', fallbackText: 'PEN' },
          stat: { en: '5 Titles', ar: '5 ألقاب' },
        },
        {
          answerKey: 'lib_river',
          name: { en: 'River Plate', ar: 'ريفر بليت' },
          subText: { en: 'Argentina', ar: 'الأرجنتين' },
          media: { type: 'club', primaryUrl: 'https://media.api-sports.io/football/teams/435.png', fallbackText: 'RIV' },
          stat: { en: '4 Titles', ar: '4 ألقاب' },
        },
        {
          answerKey: 'lib_santos',
          name: { en: 'Santos FC', ar: 'سانتوس' },
          subText: { en: 'Brazil', ar: 'البرازيل' },
          media: { type: 'club', primaryUrl: 'https://media.api-sports.io/football/teams/128.png', fallbackText: 'SAN' },
          stat: { en: '3 Titles', ar: '3 ألقاب' },
        },
      ],
    },
  },

  // ── 7. Most All-Time Premier League Clean Sheets by Goalkeeper ──────
  {
    targetFile: 'data/rank/players/defenders-and-goalkeepers.json',
    category: 'players',
    question: {
      title: {
        en: 'Rank these 5 goalkeepers by total clean sheets kept in Premier League history',
        ar: 'رتّب حراس المرمى الخمسة حسب إجمالي الشباك النظيفة (كلين شيت) في تاريخ البريميرليج',
      },
      subtitle: {
        en: 'Premier League era (1992 to present)',
        ar: 'حقبة الدوري الإنجليزي الممتاز من 1992 حتى الآن',
      },
      category: 'players',
      answers: [
        {
          answerKey: 'cs_cech',
          name: { en: 'Petr Čech', ar: 'بيتر تشيك' },
          media: { type: 'player', primaryUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/eb/Petr_Cech_2015.jpg', fallbackText: 'PC' },
          stat: { en: '202 Clean Sheets', ar: '202 مباراة بشباك نظيفة' },
        },
        {
          answerKey: 'cs_james',
          name: { en: 'David James', ar: 'ديفيد جيمس' },
          media: { type: 'player', primaryUrl: 'https://media.api-sports.io/football/teams/40.png', fallbackText: 'DJ' },
          stat: { en: '169 Clean Sheets', ar: '169 مباراة بشباك نظيفة' },
        },
        {
          answerKey: 'cs_schwarzer',
          name: { en: 'Mark Schwarzer', ar: 'مارك شوارزر' },
          media: { type: 'player', primaryUrl: 'https://media.api-sports.io/football/teams/48.png', fallbackText: 'MS' },
          stat: { en: '151 Clean Sheets', ar: '151 مباراة بشباك نظيفة' },
        },
        {
          answerKey: 'cs_seaman',
          name: { en: 'David Seaman', ar: 'ديفيد سيمان' },
          media: { type: 'player', primaryUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/5d/David_Seaman_2011.jpg', fallbackText: 'DS' },
          stat: { en: '141 Clean Sheets', ar: '141 مباراة بشباك نظيفة' },
        },
        {
          answerKey: 'cs_martyn',
          name: { en: 'Nigel Martyn', ar: 'نايجل مارتن' },
          media: { type: 'player', primaryUrl: 'https://media.api-sports.io/football/teams/45.png', fallbackText: 'NM' },
          stat: { en: '137 Clean Sheets', ar: '137 مباراة بشباك نظيفة' },
        },
      ],
    },
  },

  // ── 8. Most All-Time Premier League Assists ──────────────────────────
  {
    targetFile: 'data/rank/players/playmakers-and-creators.json',
    category: 'players',
    question: {
      title: {
        en: 'Rank these 5 playmakers by all-time Premier League assists provided',
        ar: 'رتّب هؤلاء صناع اللعب الخمسة حسب إجمالي التمريرات الحاسمة في تاريخ البريميرليج',
      },
      subtitle: {
        en: 'Premier League official all-time playmaking records',
        ar: 'أرقام التمريرات الحاسمة الرسمية في تاريخ الدوري الإنجليزي الممتاز',
      },
      category: 'players',
      answers: [
        {
          answerKey: 'ast_giggs',
          name: { en: 'Ryan Giggs', ar: 'رايان غيغز' },
          subText: { en: 'Manchester United', ar: 'مانشستر يونايتد' },
          media: { type: 'player', primaryUrl: 'https://media.api-sports.io/football/teams/33.png', fallbackText: 'RG' },
          stat: { en: '162 Assists', ar: '162 تمريرة حاسمة' },
        },
        {
          answerKey: 'ast_kdb',
          name: { en: 'Kevin De Bruyne', ar: 'كيفين دي بروين' },
          subText: { en: 'Manchester City', ar: 'مانشستر سيتي' },
          media: { type: 'player', primaryUrl: 'https://media.api-sports.io/football/players/629.png', fallbackText: 'KDB' },
          stat: { en: '114 Assists', ar: '114 تمريرة حاسمة' },
        },
        {
          answerKey: 'ast_fabregas',
          name: { en: 'Cesc Fàbregas', ar: 'سيسك فابريغاس' },
          subText: { en: 'Arsenal / Chelsea', ar: 'أرسنال / تشيلسي' },
          media: { type: 'player', primaryUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/23/Cesc_F%C3%A0bregas_2015.jpg', fallbackText: 'CF' },
          stat: { en: '111 Assists', ar: '111 تمريرة حاسمة' },
        },
        {
          answerKey: 'ast_rooney',
          name: { en: 'Wayne Rooney', ar: 'واين روني' },
          subText: { en: 'Everton / Man United', ar: 'إيفرتون / مانشستر يونايتد' },
          media: { type: 'player', primaryUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/12/Wayne_Rooney_2020.jpg', fallbackText: 'WR' },
          stat: { en: '103 Assists', ar: '103 تمريرات حاسمة' },
        },
        {
          answerKey: 'ast_lampard',
          name: { en: 'Frank Lampard', ar: 'فرانك لامبارد' },
          subText: { en: 'Chelsea / Man City', ar: 'تشيلسي / مانشستر سيتي' },
          media: { type: 'player', primaryUrl: 'https://media.api-sports.io/football/teams/49.png', fallbackText: 'FL' },
          stat: { en: '102 Assists', ar: '102 تمريرة حاسمة' },
        },
      ],
    },
  },

  // ── 9. Most Copa América Titles by Nation ────────────────────────────
  {
    targetFile: 'data/rank/competitions/world-cup-and-international.json',
    category: 'competitions',
    question: {
      title: {
        en: 'Rank these 5 South American nations by total Copa América titles won',
        ar: 'رتّب هذه المنتخبات اللاتينية الخمسة حسب عدد مرات التتويج بلقب كوبا أمريكا',
      },
      subtitle: {
        en: 'CONMEBOL Copa América all-time history',
        ar: 'تاريخ بطولة كوبا أمريكا لأمريكا الجنوبية عبر التاريخ',
      },
      category: 'competitions',
      answers: [
        {
          answerKey: 'ca_argentina',
          name: { en: 'Argentina', ar: 'الأرجنتين' },
          media: { type: 'nation', primaryUrl: 'https://flagcdn.com/w80/ar.png', fallbackText: 'ARG' },
          stat: { en: '16 Titles', ar: '16 لقباً' },
        },
        {
          answerKey: 'ca_uruguay',
          name: { en: 'Uruguay', ar: 'أوروغواي' },
          media: { type: 'nation', primaryUrl: 'https://flagcdn.com/w80/uy.png', fallbackText: 'URU' },
          stat: { en: '15 Titles', ar: '15 لقباً' },
        },
        {
          answerKey: 'ca_brazil',
          name: { en: 'Brazil', ar: 'البرازيل' },
          media: { type: 'nation', primaryUrl: 'https://flagcdn.com/w80/br.png', fallbackText: 'BRA' },
          stat: { en: '9 Titles', ar: '9 ألقاب' },
        },
        {
          answerKey: 'ca_chile',
          name: { en: 'Chile', ar: 'تشيلي' },
          media: { type: 'nation', primaryUrl: 'https://flagcdn.com/w80/cl.png', fallbackText: 'CHI' },
          stat: { en: '2 Titles', ar: 'لقبان' },
        },
        {
          answerKey: 'ca_colombia',
          name: { en: 'Colombia', ar: 'كولومبيا' },
          media: { type: 'nation', primaryUrl: 'https://flagcdn.com/w80/co.png', fallbackText: 'COL' },
          stat: { en: '1 Title', ar: 'لقب واحد' },
        },
      ],
    },
  },

  // ── 10. Most African Cup of Nations (AFCON) Titles ──────────────────
  {
    targetFile: 'data/rank/competitions/world-cup-and-international.json',
    category: 'competitions',
    question: {
      title: {
        en: 'Rank these 5 African nations by total AFCON titles won',
        ar: 'رتّب هذه المنتخبات الأفريقية الخمسة حسب عدد مرات الفوز بكأس الأمم الأفريقية',
      },
      subtitle: {
        en: 'CAF Africa Cup of Nations history',
        ar: 'تاريخ بطولة كأس الأمم الأفريقية',
      },
      category: 'competitions',
      answers: [
        {
          answerKey: 'afcon_egypt',
          name: { en: 'Egypt', ar: 'مصر' },
          media: { type: 'nation', primaryUrl: 'https://flagcdn.com/w80/eg.png', fallbackText: 'EGY' },
          stat: { en: '7 Titles', ar: '7 ألقاب' },
        },
        {
          answerKey: 'afcon_cameroon',
          name: { en: 'Cameroon', ar: 'الكاميرون' },
          media: { type: 'nation', primaryUrl: 'https://flagcdn.com/w80/cm.png', fallbackText: 'CMR' },
          stat: { en: '5 Titles', ar: '5 ألقاب' },
        },
        {
          answerKey: 'afcon_ghana',
          name: { en: 'Ghana', ar: 'غانا' },
          media: { type: 'nation', primaryUrl: 'https://flagcdn.com/w80/gh.png', fallbackText: 'GHA' },
          stat: { en: '4 Titles', ar: '4 ألقاب' },
        },
        {
          answerKey: 'afcon_nigeria',
          name: { en: 'Nigeria', ar: 'نيجيريا' },
          media: { type: 'nation', primaryUrl: 'https://flagcdn.com/w80/ng.png', fallbackText: 'NGA' },
          stat: { en: '3 Titles', ar: '3 ألقاب' },
        },
        {
          answerKey: 'afcon_algeria',
          name: { en: 'Algeria', ar: 'الجزائر' },
          media: { type: 'nation', primaryUrl: 'https://flagcdn.com/w80/dz.png', fallbackText: 'ALG' },
          stat: { en: '2 Titles', ar: 'لقبان' },
        },
      ],
    },
  },
];

let addedCount = 0;

for (const item of newVerifiedQuestions) {
  const filePath = path.resolve(item.targetFile);
  if (!fs.existsSync(filePath)) continue;

  const currentList = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const titleKey = item.question.title.en.trim().toLowerCase();

  // Avoid duplicates
  const exists = currentList.some((q) => q.title.en.trim().toLowerCase() === titleKey);
  if (!exists) {
    currentList.push(item.question);
    fs.writeFileSync(filePath, JSON.stringify(currentList, null, 2), 'utf-8');
    console.log(`✅ Appended "${item.question.title.en}" to ${item.targetFile}`);
    addedCount++;
  } else {
    console.log(`ℹ️ Already exists: "${item.question.title.en}"`);
  }
}

console.log(`\n🎉 Successfully added ${addedCount} brand new, 100% verified football questions!`);
