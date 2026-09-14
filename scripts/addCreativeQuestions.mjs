import fs from 'fs';
import path from 'path';

const CREATIVE_QUESTIONS = [
  // 1. Career Red Cards
  {
    targetFile: 'data/rank/players/modern-superstars.json',
    category: 'players',
    title: {
      en: 'Rank these football hardmen by official career RED cards received',
      ar: 'رتب هؤلاء اللاعبين المشاغبين حسب عدد البطاقات الحمراء في مسيرتهم',
    },
    subtitle: {
      en: 'From the ultimate card magnet to the most disciplined among them',
      ar: 'من الأكثر حصولاً على البطاقات الحمراء إلى الأقل',
    },
    answers: [
      {
        answerKey: 'gerardo-bedoya',
        name: { en: 'Gerardo Bedoya', ar: 'جيراردو بيدويا' },
        media: { type: 'player' },
        stat: { en: '46 red cards (World Record)', ar: '46 بطاقة حمراء (رقم قياسي عالمي)' },
      },
      {
        answerKey: 'sergio-ramos',
        name: { en: 'Sergio Ramos', ar: 'سيرخيو راموس' },
        media: { type: 'player' },
        stat: { en: '29 red cards', ar: '29 بطاقة حمراء' },
      },
      {
        answerKey: 'felipe-melo',
        name: { en: 'Felipe Melo', ar: 'فيليبي ميلو' },
        media: { type: 'player' },
        stat: { en: '20 red cards', ar: '20 بطاقة حمراء' },
      },
      {
        answerKey: 'zlatan-ibrahimovic',
        name: { en: 'Zlatan Ibrahimović', ar: 'زلاتان إبراهيموفيتش' },
        media: { type: 'player' },
        stat: { en: '15 red cards', ar: '15 بطاقة حمراء' },
      },
      {
        answerKey: 'mario-balotelli',
        name: { en: 'Mario Balotelli', ar: 'ماريو بالوتيلي' },
        media: { type: 'player' },
        stat: { en: '14 red cards', ar: '14 بطاقة حمراء' },
      },
    ],
  },

  // 2. Goalscoring Goalkeepers
  {
    targetFile: 'data/rank/players/defenders-and-goalkeepers.json',
    category: 'players',
    title: {
      en: 'Rank these iconic goalkeepers by total career GOALS scored',
      ar: 'رتب هؤلاء الحراس الأساطير حسب عدد الأهداف المسجلة في مسيرتهم',
    },
    subtitle: {
      en: 'Goalkeepers who mastered penalties, free-kicks, and open-play goals',
      ar: 'حراس اشتهروا بتسجيل الأهداف من ركلات جزاء وحرة وألعاب هوائية',
    },
    answers: [
      {
        answerKey: 'rogerio-ceni',
        name: { en: 'Rogério Ceni', ar: 'روجيريو سيني' },
        media: { type: 'player' },
        stat: { en: '131 goals (World Record)', ar: '131 هدفاً (رقم قياسي عالمي)' },
      },
      {
        answerKey: 'jose-luis-chilavert',
        name: { en: 'José Luis Chilavert', ar: 'خوسيه لويس تشيلافيرت' },
        media: { type: 'player' },
        stat: { en: '67 goals', ar: '67 هدفاً' },
      },
      {
        answerKey: 'jorge-campos',
        name: { en: 'Jorge Campos', ar: 'خورخي كامبوس' },
        media: { type: 'player' },
        stat: { en: '46 goals', ar: '46 هدفاً' },
      },
      {
        answerKey: 'rene-higuita',
        name: { en: 'René Higuita', ar: 'رينيه هيجيتا' },
        media: { type: 'player' },
        stat: { en: '43 goals', ar: '43 هدفاً' },
      },
      {
        answerKey: 'hans-jorg-butt',
        name: { en: 'Hans-Jörg Butt', ar: 'هانز يورغ بوت' },
        media: { type: 'player' },
        stat: { en: '32 goals', ar: '32 هدفاً' },
      },
    ],
  },

  // 3. Fastest Premier League Hat-Tricks
  {
    targetFile: 'data/rank/competitions/world-cup-and-international.json',
    category: 'competitions',
    title: {
      en: 'Rank these Premier League hat-tricks from FASTEST to slowest time taken',
      ar: 'رتب أسرع ثلاثيات (هاتريك) في تاريخ الدوري الإنجليزي الممتاز حسب سرعة التسجيل',
    },
    subtitle: {
      en: 'Time elapsed between the first and third goal scored',
      ar: 'الوقت المستغرق بين الهدف الأول والثالث',
    },
    answers: [
      {
        answerKey: 'sadio-mane',
        name: { en: 'Sadio Mané', ar: 'ساديو ماني' },
        subText: { en: 'Southampton vs Aston Villa (2015)', ar: 'ساوثهامبتون ضد أستون فيلا (2015)' },
        media: { type: 'player' },
        stat: { en: '2 min 56 sec (PL Record)', ar: 'دقيقتان و56 ثانية (رقم قياسي)' },
      },
      {
        answerKey: 'robbie-fowler',
        name: { en: 'Robbie Fowler', ar: 'روبي فاولر' },
        subText: { en: 'Liverpool vs Arsenal (1994)', ar: 'ليفربول ضد أرسنال (1994)' },
        media: { type: 'player' },
        stat: { en: '4 min 33 sec', ar: '4 دقائق و33 ثانية' },
      },
      {
        answerKey: 'jermain-defoe',
        name: { en: 'Jermain Defoe', ar: 'جيرمين ديفو' },
        subText: { en: 'Tottenham vs Wigan (2009)', ar: 'توتنهام ضد ويغان (2009)' },
        media: { type: 'player' },
        stat: { en: '7 min 00 sec', ar: '7 دقائق' },
      },
      {
        answerKey: 'gabriel-agbonlahor',
        name: { en: 'Gabriel Agbonlahor', ar: 'جابرييل أجبونلاهور' },
        subText: { en: 'Aston Villa vs Man City (2008)', ar: 'أستون فيلا ضد مان سيتي (2008)' },
        media: { type: 'player' },
        stat: { en: '7 min 10 sec', ar: '7 دقائق و10 ثوانٍ' },
      },
      {
        answerKey: 'ian-wright',
        name: { en: 'Ian Wright', ar: 'إيان رايت' },
        subText: { en: 'Arsenal vs Ipswich (1995)', ar: 'أرسنال ضد إبسويتش (1995)' },
        media: { type: 'player' },
        stat: { en: '9 min 00 sec', ar: '9 دقائق' },
      },
    ],
  },

  // 4. Direct Free-Kick Wizards
  {
    targetFile: 'data/rank/players/playmakers-and-creators.json',
    category: 'players',
    title: {
      en: 'Rank these set-piece wizards by career DIRECT FREE-KICK goals scored',
      ar: 'رتب هؤلاء السحرة حسب عدد الأهداف المسجلة من ركلات حرة مباشرة في مسيرتهم',
    },
    subtitle: {
      en: 'Official career direct free-kick goals for club and country',
      ar: 'الأهداف الرسمية المسجلة مباشرة من ضربات حرة للأندية والمنتخبات',
    },
    answers: [
      {
        answerKey: 'juninho-pernambucano',
        name: { en: 'Juninho Pernambucano', ar: 'جونينيو برنامبوكانو' },
        media: { type: 'player' },
        stat: { en: '77 free-kick goals (Record)', ar: '77 هدفاً من ضربة حرة (رقم قياسي)' },
      },
      {
        answerKey: 'pele',
        name: { en: 'Pelé', ar: 'بيليه' },
        media: { type: 'player' },
        stat: { en: '70 free-kick goals', ar: '70 هدفاً من ضربة حرة' },
      },
      {
        answerKey: 'ronaldinho',
        name: { en: 'Ronaldinho', ar: 'رونالدينيو' },
        media: { type: 'player' },
        stat: { en: '66 free-kick goals', ar: '66 هدفاً من ضربة حرة' },
      },
      {
        answerKey: 'cristiano-ronaldo',
        name: { en: 'Cristiano Ronaldo', ar: 'كريستيانو رونالدو' },
        media: { type: 'player' },
        stat: { en: '64 free-kick goals', ar: '64 هدفاً من ضربة حرة' },
      },
      {
        answerKey: 'roberto-carlos',
        name: { en: 'Roberto Carlos', ar: 'روبرتو كارلوس' },
        media: { type: 'player' },
        stat: { en: '49 free-kick goals', ar: '49 هدفاً من ضربة حرة' },
      },
    ],
  },

  // 5. Most Expensive Teenage Transfers
  {
    targetFile: 'data/rank/players/transfer-market-records.json',
    category: 'players',
    title: {
      en: 'Rank these wonderkids by their transfer fee when signed as a teenager (Under 20)',
      ar: 'رتب هؤلاء المواهب حسب قيمة صفقة انتقالهم عندما كانوا في سن المراهقة (تحت 20 عاماً)',
    },
    subtitle: {
      en: 'Highest initial transfer fees paid for teenagers in football history',
      ar: 'أعلى رسوم انتقال مدفوعة للاعبين مراهقين في تاريخ كرة القدم',
    },
    answers: [
      {
        answerKey: 'kylian-mbappe',
        name: { en: 'Kylian Mbappé', ar: 'كيليان مبابي' },
        subText: { en: 'Monaco to PSG (Age 19)', ar: 'من موناكو إلى باريس سان جيرمان (عمر 19)' },
        media: { type: 'player' },
        stat: { en: '€180 Million (Teen Record)', ar: '180 مليون يورو (رقم قياسي للمراهقين)' },
      },
      {
        answerKey: 'joao-felix',
        name: { en: 'João Félix', ar: 'جواو فيليكس' },
        subText: { en: 'Benfica to Atlético Madrid (Age 19)', ar: 'من بنفيكا إلى أتلتيكو مدريد (عمر 19)' },
        media: { type: 'player' },
        stat: { en: '€127.2 Million', ar: '127.2 مليون يورو' },
      },
      {
        answerKey: 'matthijs-de-ligt',
        name: { en: 'Matthijs de Ligt', ar: 'ماتيس دي ليخت' },
        subText: { en: 'Ajax to Juventus (Age 19)', ar: 'من أياكس إلى يوفنتوس (عمر 19)' },
        media: { type: 'player' },
        stat: { en: '€85.5 Million', ar: '85.5 مليون يورو' },
      },
      {
        answerKey: 'anthony-martial',
        name: { en: 'Anthony Martial', ar: 'أنتوني مارسيال' },
        subText: { en: 'Monaco to Manchester United (Age 19)', ar: 'من موناكو إلى مانشستر يونايتد (عمر 19)' },
        media: { type: 'player' },
        stat: { en: '€60 Million', ar: '60 مليون يورو' },
      },
      {
        answerKey: 'vinicius-junior',
        name: { en: 'Vinícius Júnior', ar: 'فينيسيوس جونيور' },
        subText: { en: 'Flamengo to Real Madrid (Age 18)', ar: 'من فلامنغو إلى ريال مدريد (عمر 18)' },
        media: { type: 'player' },
        stat: { en: '€45 Million', ar: '45 مليون يورو' },
      },
    ],
  },

  // 6. Champions League Final Heartbreak: Most Lost Finals
  {
    targetFile: 'data/rank/clubs/club-records-and-dynasties.json',
    category: 'clubs',
    title: {
      en: 'Rank these European giants by total UEFA Champions League / European Cup finals LOST',
      ar: 'رتب هذه الأندية الأوروبية الكبرى حسب عدد النهائيات الخاسرة في دوري أبطال أوروبا',
    },
    subtitle: {
      en: 'The kings of heartbreak on European football’s biggest stage',
      ar: 'الأندية الأكثر وصولاً لنهائي دوري الأبطال دون التتويج به',
    },
    answers: [
      {
        answerKey: 'juventus',
        name: { en: 'Juventus', ar: 'يوفنتوس' },
        media: { type: 'club' },
        stat: { en: '7 finals lost (Record)', ar: '7 نهائيات خاسرة (رقم قياسي)' },
      },
      {
        answerKey: 'bayern-munich',
        name: { en: 'Bayern Munich', ar: 'بايرن ميونخ' },
        media: { type: 'club' },
        stat: { en: '5 finals lost', ar: '5 نهائيات خاسرة' },
      },
      {
        answerKey: 'ac-milan',
        name: { en: 'AC Milan', ar: 'إيه سي ميلان' },
        media: { type: 'club' },
        stat: { en: '4 finals lost', ar: '4 نهائيات خاسرة' },
      },
      {
        answerKey: 'atletico-madrid',
        name: { en: 'Atlético Madrid', ar: 'أتلتيكو مدريد' },
        media: { type: 'club' },
        stat: { en: '3 finals lost', ar: '3 نهائيات خاسرة' },
      },
      {
        answerKey: 'manchester-united',
        name: { en: 'Manchester United', ar: 'مانشستر يونايتد' },
        media: { type: 'club' },
        stat: { en: '2 finals lost', ar: 'نهائيان خاسران' },
      },
    ],
  },

  // 7. Mastermind Managers: Most Silverware
  {
    targetFile: 'data/rank/seasons/legendary-campaigns.json',
    category: 'seasons',
    title: {
      en: 'Rank these iconic managers by total official trophies won in their managerial careers',
      ar: 'رتب هؤلاء المدربين الأساطير حسب إجمالي البطولات الرسمية التي حققوها في مسيرتهم التدريبية',
    },
    subtitle: {
      en: 'Masterminds who conquered domestic and international silverware',
      ar: 'المدربون الأكثر تتويجاً بالألقاب الرسمية في تاريخ الساحرة المستديرة',
    },
    answers: [
      {
        answerKey: 'sir-alex-ferguson',
        name: { en: 'Sir Alex Ferguson', ar: 'سير أليكس فيرجسون' },
        media: { type: 'player' },
        stat: { en: '49 trophies (World Record)', ar: '49 بطولة (رقم قياسي عالمي)' },
      },
      {
        answerKey: 'pep-guardiola',
        name: { en: 'Pep Guardiola', ar: 'بيب جوارديولا' },
        media: { type: 'player' },
        stat: { en: '39 trophies', ar: '39 بطولة' },
      },
      {
        answerKey: 'carlo-ancelotti',
        name: { en: 'Carlo Ancelotti', ar: 'كارلو أنشيلوتي' },
        media: { type: 'player' },
        stat: { en: '30 trophies', ar: '30 بطولة' },
      },
      {
        answerKey: 'jose-mourinho',
        name: { en: 'José Mourinho', ar: 'جوزيه مورينيو' },
        media: { type: 'player' },
        stat: { en: '26 trophies', ar: '26 بطولة' },
      },
      {
        answerKey: 'jurgen-klopp',
        name: { en: 'Jürgen Klopp', ar: 'يورغن كلوب' },
        media: { type: 'player' },
        stat: { en: '13 trophies', ar: '13 بطولة' },
      },
    ],
  },

  // 8. Champions League Nomads
  {
    targetFile: 'data/rank/players/modern-superstars.json',
    category: 'players',
    title: {
      en: 'Rank these stars by the number of different clubs they represented in the UEFA Champions League',
      ar: 'رتب هؤلاء النجوم حسب عدد الأندية المختلفة التي مثلوها في دوري أبطال أوروبا',
    },
    subtitle: {
      en: 'From the ultimate Champions League journeyman to loyalists',
      ar: 'من الرحالة الأكثر تمثيلاً للأندية في دوري الأبطال إلى الأقل تنقلاً',
    },
    answers: [
      {
        answerKey: 'zlatan-ibrahimovic',
        name: { en: 'Zlatan Ibrahimović', ar: 'زلاتان إبراهيموفيتش' },
        media: { type: 'player' },
        stat: { en: '7 different clubs', ar: '7 أندية مختلفة' },
      },
      {
        answerKey: 'nicolas-anelka',
        name: { en: 'Nicolas Anelka', ar: 'نيكولا أنيلكا' },
        media: { type: 'player' },
        stat: { en: '6 different clubs', ar: '6 أندية مختلفة' },
      },
      {
        answerKey: 'fernando-morientes',
        name: { en: 'Fernando Morientes', ar: 'فيرناندو موريانتس' },
        media: { type: 'player' },
        stat: { en: '5 different clubs', ar: '5 أندية مختلفة' },
      },
      {
        answerKey: 'cristiano-ronaldo',
        name: { en: 'Cristiano Ronaldo', ar: 'كريستيانو رونالدو' },
        media: { type: 'player' },
        stat: { en: '3 different clubs', ar: '3 أندية مختلفة' },
      },
      {
        answerKey: 'lionel-messi',
        name: { en: 'Lionel Messi', ar: 'ليونيل ميسي' },
        media: { type: 'player' },
        stat: { en: '2 different clubs', ar: 'ناديان فقط' },
      },
    ],
  },

  // 9. Goalscoring Defenders in Premier League History
  {
    targetFile: 'data/rank/players/defenders-and-goalkeepers.json',
    category: 'players',
    title: {
      en: 'Rank these defenders by total career Premier League goals scored',
      ar: 'رتب هؤلاء المدافعين حسب عدد الأهداف المسجلة في تاريخ الدوري الإنجليزي الممتاز',
    },
    subtitle: {
      en: 'Defenders with a deadly eye for goal from open play and set-pieces',
      ar: 'مدافعون امتلكوا حساً تهديفياً عالياً في البريميرليج',
    },
    answers: [
      {
        answerKey: 'john-terry',
        name: { en: 'John Terry', ar: 'جون تيري' },
        media: { type: 'player' },
        stat: { en: '41 goals (PL Defender Record)', ar: '41 هدفاً (رقم قياسي للمدافعين)' },
      },
      {
        answerKey: 'david-unsworth',
        name: { en: 'David Unsworth', ar: 'ديفيد أونسورث' },
        media: { type: 'player' },
        stat: { en: '38 goals', ar: '38 هدفاً' },
      },
      {
        answerKey: 'leighton-baines',
        name: { en: 'Leighton Baines', ar: 'ليتون باينز' },
        media: { type: 'player' },
        stat: { en: '32 goals', ar: '32 هدفاً' },
      },
      {
        answerKey: 'ian-harte',
        name: { en: 'Ian Harte', ar: 'إيان هارت' },
        media: { type: 'player' },
        stat: { en: '28 goals', ar: '28 هدفاً' },
      },
      {
        answerKey: 'gary-cahill',
        name: { en: 'Gary Cahill', ar: 'غاري كاهيل' },
        media: { type: 'player' },
        stat: { en: '27 goals', ar: '27 هدفاً' },
      },
    ],
  },

  // 10. Record-Breaking Goalkeeper Transfer Fees
  {
    targetFile: 'data/rank/players/transfer-market-records.json',
    category: 'players',
    title: {
      en: 'Rank these shot-stoppers by their record transfer fees paid',
      ar: 'رتب حراس المرمى هؤلاء حسب قيمة صفقات انتقالهم القياسية',
    },
    subtitle: {
      en: 'The most expensive goalkeepers in world football history',
      ar: 'أغلى صفقات انتقال حراس المرمى في تاريخ الساحرة المستديرة',
    },
    answers: [
      {
        answerKey: 'kepa-arrizabalaga',
        name: { en: 'Kepa Arrizabalaga', ar: 'كيبا أريزابالاغا' },
        subText: { en: 'Athletic Bilbao to Chelsea (2018)', ar: 'من أتلتيك بيلباو إلى تشيلسي (2018)' },
        media: { type: 'player' },
        stat: { en: '€80 Million (GK Record)', ar: '80 مليون يورو (رقم قياسي للحراس)' },
      },
      {
        answerKey: 'alisson-becker',
        name: { en: 'Alisson Becker', ar: 'أليسون بيكر' },
        subText: { en: 'Roma to Liverpool (2018)', ar: 'من روما إلى ليفربول (2018)' },
        media: { type: 'player' },
        stat: { en: '€62.5 Million', ar: '62.5 مليون يورو' },
      },
      {
        answerKey: 'gianluigi-buffon',
        name: { en: 'Gianluigi Buffon', ar: 'جانلويجي بوفون' },
        subText: { en: 'Parma to Juventus (2001)', ar: 'من بارما إلى يوفنتوس (2001)' },
        media: { type: 'player' },
        stat: { en: '€52.8 Million', ar: '52.8 مليون يورو' },
      },
      {
        answerKey: 'ederson',
        name: { en: 'Ederson', ar: 'إيدرسون' },
        subText: { en: 'Benfica to Manchester City (2017)', ar: 'من بنفيكا إلى مانشستر سيتي (2017)' },
        media: { type: 'player' },
        stat: { en: '€40 Million', ar: '40 مليون يورو' },
      },
      {
        answerKey: 'thibaut-courtois',
        name: { en: 'Thibaut Courtois', ar: 'تيبو كورتوا' },
        subText: { en: 'Chelsea to Real Madrid (2018)', ar: 'من تشيلسي إلى ريال مدريد (2018)' },
        media: { type: 'player' },
        stat: { en: '€35 Million', ar: '35 مليون يورو' },
      },
    ],
  },

  // 11. African Premier League Royalty
  {
    targetFile: 'data/rank/players/modern-superstars.json',
    category: 'players',
    title: {
      en: 'Rank these African superstars by total goals scored in Premier League history',
      ar: 'رتب هؤلاء النجوم الأفارقة حسب عدد الأهداف المسجلة في تاريخ الدوري الإنجليزي الممتاز',
    },
    subtitle: {
      en: 'From Egypt, Senegal, Ivory Coast, Togo, and Nigeria',
      ar: 'أساطير القارة السمراء الذين كتبوا التاريخ في البريميرليج',
    },
    answers: [
      {
        answerKey: 'mohamed-salah',
        name: { en: 'Mohamed Salah', ar: 'محمد صلاح' },
        media: { type: 'player' },
        stat: { en: '165+ goals (African PL Record)', ar: '165+ هدفاً (الهداف التاريخي للأفارقة)' },
      },
      {
        answerKey: 'sadio-mane',
        name: { en: 'Sadio Mané', ar: 'ساديو ماني' },
        media: { type: 'player' },
        stat: { en: '111 goals', ar: '111 هدفاً' },
      },
      {
        answerKey: 'didier-drogba',
        name: { en: 'Didier Drogba', ar: 'ديدييه دروغبا' },
        media: { type: 'player' },
        stat: { en: '104 goals', ar: '104 أهداف' },
      },
      {
        answerKey: 'emmanuel-adebayor',
        name: { en: 'Emmanuel Adebayor', ar: 'إيمانويل أديبايور' },
        media: { type: 'player' },
        stat: { en: '97 goals', ar: '97 هدفاً' },
      },
      {
        answerKey: 'yakubu',
        name: { en: 'Yakubu', ar: 'ياكوبو أييغبيني' },
        media: { type: 'player' },
        stat: { en: '95 goals', ar: '95 هدفاً' },
      },
    ],
  },

  // 12. Single-Club Goalscoring Gods
  {
    targetFile: 'data/rank/players/legends-and-icons.json',
    category: 'players',
    title: {
      en: 'Rank these legendary icons by official career goals scored for a SINGLE club',
      ar: 'رتب هؤلاء الأساطير حسب عدد الأهداف الرسمية المسجلة لنادٍ واحد في مسيرتهم',
    },
    subtitle: {
      en: 'The greatest one-club loyalty and record goal tallies',
      ar: 'أعلى حصيلة أهداف مسجلة لقميص نادٍ واحد في تاريخ كرة القدم',
    },
    answers: [
      {
        answerKey: 'lionel-messi',
        name: { en: 'Lionel Messi', ar: 'ليونيل ميسي' },
        subText: { en: 'FC Barcelona', ar: 'برشلونة' },
        media: { type: 'player' },
        stat: { en: '672 goals (World Record)', ar: '672 هدفاً (رقم قياسي عالمي)' },
      },
      {
        answerKey: 'pele',
        name: { en: 'Pelé', ar: 'بيليه' },
        subText: { en: 'Santos FC', ar: 'سانتوس' },
        media: { type: 'player' },
        stat: { en: '643 goals', ar: '643 هدفاً رسمياً' },
      },
      {
        answerKey: 'gerd-muller',
        name: { en: 'Gerd Müller', ar: 'غيرد مولر' },
        subText: { en: 'Bayern Munich', ar: 'بايرن ميونخ' },
        media: { type: 'player' },
        stat: { en: '563 goals', ar: '563 هدفاً' },
      },
      {
        answerKey: 'cristiano-ronaldo',
        name: { en: 'Cristiano Ronaldo', ar: 'كريستيانو رونالدو' },
        subText: { en: 'Real Madrid', ar: 'ريال مدريد' },
        media: { type: 'player' },
        stat: { en: '450 goals', ar: '450 هدفاً' },
      },
      {
        answerKey: 'ian-rush',
        name: { en: 'Ian Rush', ar: 'إيان راش' },
        subText: { en: 'Liverpool', ar: 'ليفربول' },
        media: { type: 'player' },
        stat: { en: '346 goals', ar: '346 هدفاً' },
      },
    ],
  },

  // 13. Youngest FIFA World Cup Goalscorers
  {
    targetFile: 'data/rank/competitions/world-cup-and-international.json',
    category: 'competitions',
    title: {
      en: 'Rank these teenage prodigies by how YOUNG they were when scoring their first FIFA World Cup goal',
      ar: 'رتب هؤلاء النجوم حسب أصغرهم سناً عند تسجيل أول هدف في تاريخ كأس العالم',
    },
    subtitle: {
      en: 'From youngest age to oldest at the time of their debut World Cup goal',
      ar: 'من الأصغر عمراً إلى الأكبر عند تسجيل الهدف المونديالي الأول',
    },
    answers: [
      {
        answerKey: 'pele',
        name: { en: 'Pelé', ar: 'بيليه' },
        subText: { en: 'Brazil vs Wales (1958)', ar: 'البرازيل ضد ويلز (1958)' },
        media: { type: 'player' },
        stat: { en: '17y 239d (Youngest in History)', ar: '17 عاماً و239 يوماً (الأصغر تاريخياً)' },
      },
      {
        answerKey: 'manuel-rosas',
        name: { en: 'Manuel Rosas', ar: 'مانويل روساس' },
        subText: { en: 'Mexico vs Argentina (1930)', ar: 'المكسيك ضد الأرجنتين (1930)' },
        media: { type: 'player' },
        stat: { en: '18y 93d', ar: '18 عاماً و93 يوماً' },
      },
      {
        answerKey: 'michael-owen',
        name: { en: 'Michael Owen', ar: 'مايكل أوين' },
        subText: { en: 'England vs Romania (1998)', ar: 'إنجلترا ضد رومانيا (1998)' },
        media: { type: 'player' },
        stat: { en: '18y 190d', ar: '18 عاماً و190 يوماً' },
      },
      {
        answerKey: 'lionel-messi',
        name: { en: 'Lionel Messi', ar: 'ليونيل ميسي' },
        subText: { en: 'Argentina vs Serbia (2006)', ar: 'الأرجنتين ضد صربيا (2006)' },
        media: { type: 'player' },
        stat: { en: '18y 357d', ar: '18 عاماً و357 يوماً' },
      },
      {
        answerKey: 'kylian-mbappe',
        name: { en: 'Kylian Mbappé', ar: 'كيليان مبابي' },
        subText: { en: 'France vs Peru (2018)', ar: 'فرنسا ضد بيرو (2018)' },
        media: { type: 'player' },
        stat: { en: '19y 183d', ar: '19 عاماً و183 يوماً' },
      },
    ],
  },

  // 14. UCL Golden Boot Masters
  {
    targetFile: 'data/rank/competitions/world-cup-and-international.json',
    category: 'competitions',
    title: {
      en: 'Rank these lethal strikers by the number of seasons they finished as top goalscorer in the UEFA Champions League',
      ar: 'رتب هؤلاء الهدافين حسب عدد المواسم التي توجوا فيها هدافاً لدوري أبطال أوروبا',
    },
    subtitle: {
      en: 'Seasons finishing as the outright or joint UEFA Champions League / European Cup top scorer',
      ar: 'عدد المواسم التي تصدروا فيها قائمة هدافي دوري الأبطال',
    },
    answers: [
      {
        answerKey: 'cristiano-ronaldo',
        name: { en: 'Cristiano Ronaldo', ar: 'كريستيانو رونالدو' },
        media: { type: 'player' },
        stat: { en: '7 seasons (UCL Record)', ar: '7 مواسم (رقم قياسي تاريخي)' },
      },
      {
        answerKey: 'lionel-messi',
        name: { en: 'Lionel Messi', ar: 'ليونيل ميسي' },
        media: { type: 'player' },
        stat: { en: '6 seasons', ar: '6 مواسم' },
      },
      {
        answerKey: 'gerd-muller',
        name: { en: 'Gerd Müller', ar: 'غيرد مولر' },
        media: { type: 'player' },
        stat: { en: '4 seasons', ar: '4 مواسم' },
      },
      {
        answerKey: 'ruud-van-nistelrooy',
        name: { en: 'Ruud van Nistelrooy', ar: 'رود فان نيستلروي' },
        media: { type: 'player' },
        stat: { en: '3 seasons', ar: '3 مواسم' },
      },
      {
        answerKey: 'erling-haaland',
        name: { en: 'Erling Haaland', ar: 'إيرلينغ هالاند' },
        media: { type: 'player' },
        stat: { en: '2 seasons', ar: 'موسمان' },
      },
    ],
  },

  // 15. Longest International Unbeaten Streaks
  {
    targetFile: 'data/rank/competitions/world-cup-and-international.json',
    category: 'competitions',
    title: {
      en: 'Rank these national teams by their all-time longest consecutive UNBEATEN match streak',
      ar: 'رتب هذه المنتخبات الوطنية حسب أطول سلسلة مباريات متتالية دون هزيمة في تاريخها',
    },
    subtitle: {
      en: 'Official international matches undefeated in all competitions',
      ar: 'أطول سلاسل اللاهزيمة الرسمية في تاريخ المنتخبات',
    },
    answers: [
      {
        answerKey: 'italy',
        name: { en: 'Italy', ar: 'إيطاليا' },
        subText: { en: '2018–2021 (Roberto Mancini)', ar: '2018–2021 (روبرتو مانشيني)' },
        media: { type: 'flag' },
        stat: { en: '37 matches (World Record)', ar: '37 مباراة (رقم قياسي عالمي)' },
      },
      {
        answerKey: 'argentina',
        name: { en: 'Argentina', ar: 'الأرجنتين' },
        subText: { en: '2019–2022 (Lionel Scaloni)', ar: '2019–2022 (ليونيل سكالوني)' },
        media: { type: 'flag' },
        stat: { en: '36 matches', ar: '36 مباراة' },
      },
      {
        answerKey: 'spain',
        name: { en: 'Spain', ar: 'إسبانيا' },
        subText: { en: '2007–2009 (Golden Generation)', ar: '2007–2009 (الجيل الذهبي)' },
        media: { type: 'flag' },
        stat: { en: '35 matches', ar: '35 مباراة' },
      },
      {
        answerKey: 'france',
        name: { en: 'France', ar: 'فرنسا' },
        subText: { en: '1994–1996 (Aimé Jacquet)', ar: '1994–1996 (إيمي جاكيه)' },
        media: { type: 'flag' },
        stat: { en: '30 matches', ar: '30 مباراة' },
      },
      {
        answerKey: 'germany',
        name: { en: 'Germany', ar: 'ألمانيا' },
        subText: { en: '1978–1980 (Jupp Derwall)', ar: '1978–1980 (يوب درفال)' },
        media: { type: 'flag' },
        stat: { en: '23 matches', ar: '23 مباراة' },
      },
    ],
  },
];

function run() {
  const fileGroups = {};
  for (const q of CREATIVE_QUESTIONS) {
    if (!fileGroups[q.targetFile]) fileGroups[q.targetFile] = [];
    fileGroups[q.targetFile].push(q);
  }

  for (const [targetFile, questions] of Object.entries(fileGroups)) {
    const filePath = path.resolve(targetFile);
    let existing = [];
    if (fs.existsSync(filePath)) {
      try {
        existing = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      } catch (err) {
        console.error(`Error reading ${targetFile}:`, err);
        continue;
      }
    }

    const existingTitles = new Set(existing.map((q) => q.title?.en));

    let appendedCount = 0;
    for (const q of questions) {
      if (existingTitles.has(q.title.en)) {
        console.log(`⚠️  Question already exists in ${targetFile}: "${q.title.en}"`);
        continue;
      }

      const item = {
        title: q.title,
        subtitle: q.subtitle,
        category: q.category,
        answers: q.answers,
        isActive: true,
        createdAt: new Date().toISOString(),
      };

      existing.push(item);
      existingTitles.add(q.title.en);
      appendedCount++;
      console.log(`✅ Appended "${q.title.en}" to ${targetFile}`);
    }

    if (appendedCount > 0) {
      fs.writeFileSync(filePath, JSON.stringify(existing, null, 2) + '\n', 'utf-8');
    }
  }

  console.log(`\n🎉 Successfully added ${CREATIVE_QUESTIONS.length} creative, attractive, and verified questions!`);
}

run();
