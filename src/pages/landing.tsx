import { Lock, Sparkles, BookOpen, Star, CheckCircle, X, Eye, EyeOff, Mail, User, ArrowRight, Loader2, ChevronRight, TrendingUp, Globe, Pencil, BarChart3, Layers, FileText, Target, Library, BookMarked, Gamepad2, MessageSquare, ShoppingBag, Zap, Copy, Plus, ArrowUpRight, Sparkle, Microscope, BookText, Shield, Brain, Lightbulb, FileCheck, GraduationCap, CheckSquare, ChevronLeft, HelpCircle, ChevronDown, Award, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import api from '../services/api';
import { useUserStore } from '../states/user.state';
import { useNavigate } from 'react-router-dom';
import image from '../public/image.png';

type Lang = 'uz' | 'ru' | 'en';

// ---------------------------------------------------------------------------
// TRANSLATIONS
// Brand names and core domain terms (VenSAT, SAT, AI, Digital SAT, XP, Lenta,
// AWL, Panda, Marketplace, Debate, Reading, Writing, Mock) are intentionally
// left untranslated across all three languages.
// ---------------------------------------------------------------------------

const translations: Record<Lang, any> = {
  uz: {
    nav: ["Imkoniyatlar", "Natijalar", "Narxlar", "FAQ"],
    login: "Kirish",
    start: "Boshlash →",
    modal: {
      loginTitle: "Xush kelibsiz",
      registerTitle: "Hisob yaratish",
      loginSubtitle: "O'z hisobingizga kiring",
      registerSubtitle: "Minglab talabalar qatoriga qo'shiling",
      fullName: "Ism Familiya",
      fullNamePlaceholder: "Abdulloh Karimov",
      email: "Email",
      emailPlaceholder: "siz@example.com",
      password: "Parol",
      submitLogin: "Kirish",
      submitRegister: "Hisob yaratish",
      loading: "Kuting...",
      noAccount: "Hisobingiz yo'qmi?",
      hasAccount: "Hisobingiz bormi?",
      registerLink: "Ro'yxatdan o'ting",
      loginLink: "Kirish",
      fillAll: "Barcha maydonlarni to'ldiring",
      enterName: "Ismingizni kiriting",
      welcomeBack: "Xush kelibsiz!",
      accountCreated: "Hisob yaratildi!",
      connectionError: "Ulanish xatosi. Qayta urinib ko'ring."
    },
    hero: {
      badge: "AI-POWERED SAT PREP",
      titleLine1: "SAT ballini",
      titleLine2: "katta oshiring",
      subtitle: "AI tahlili, shaxsiy o'quv rejasi va minglab amaliy savollar bilan 3 oyda orzuingizga erishing.",
      ctaPrimary: "Bepul boshlash",
      ctaSecondary: "Kirish",
      badges: ["Kredit karta shart emas", "Bepul sinov", "Istalgan vaqt bekor qilish"],
      cardTotalScore: "Umumiy ball",
      cardGrowth: "+320 o'sish",
      cardLabels: ["O'qish", "Matematika"]
    },
    stats: [
      { n: "95%", l: "Ball o'sishi" },
      { n: "10K+", l: "Faol talabalar" },
      { n: "+320", l: "O'rtacha o'sish" },
      { n: "50+", l: "Amaliy testlar" },
    ],
    sources: {
      badge: "REAL SOURCES",
      title1: "Haqiqiy manbalarga asoslangan,",
      title2: "tasodifiy AI emas",
      desc: "VenSAT'dagi kontent shunchaki AI tomonidan o'ylab topilmaydi. Platformadagi har bir matn, SAT uslubidagi passage va savol ishonchli, real manbalarga tayangan holda tayyorlanadi.",
      card1: {
        title: "Real Reading Materials",
        desc: "Reading mashqlari quyidagi kabi haqiqiy manbalardan olinadi:",
        items: ["Ilmiy maqolalar", "Tarixiy matnlar", "Akademik nashrlar", "Adabiy asarlar", "Ommabop ilmiy va tahliliy maqolalar"],
        note: "Matnlar SAT formatiga moslashtiriladi, ammo ularning asosiy mazmuni, muallif uslubi va mantiqiy tuzilishi saqlanib qoladi."
      },
      card2: {
        title: "Authentic SAT-Style Questions",
        desc: "Har bir savol tasodifiy yaratilmaydi. Savollar:",
        items: ["Digital SAT standartlariga mos yoziladi", "Official SAT question patterns asosida ishlab chiqiladi", "Real imtihonlarda uchraydigan fikrlash usullarini takrorlaydi", "Sun'iy murakkablik emas, haqiqiy SAT mantiqini o'rgatadi"],
        note: "Maqsad foydalanuvchini savollarni yodlashga emas, balki SAT'ning haqiqiy fikrlash modelini tushunishga o'rgatishdir."
      },
      card3: {
        title: "AI as an Assistant, Not the Author",
        desc: "Sun'iy intellekt platformada kontentni to'liq o'ylab topmaydi. Aksincha, AI:",
        items: ["Real manbalarni tahlil qiladi", "Matnlarni foydalanuvchi darajasiga moslashtiradi", "Keraksiz qismlarni qisqartiradi", "Vocabulary va izohlarni boyitadi", "Interaktiv explanation va shaxsiy tavsiyalarni yaratadi"],
        note: "Foydalanuvchi har safar ishonchli ma'lumot bilan ishlaydi, AI esa uni yanada tushunarli va samarali o'rganishga yordam beradi."
      },
      card4: {
        title: "High Reliability",
        desc: "Platformadagi barcha materiallar \"AI-first\" emas, balki \"Source-first\" tamoyili asosida yaratiladi. Bu yondashuv quyidagi afzalliklarni beradi:",
        items: ["Yuqori ishonchlilik", "Faktik xatolar ehtimolining sezilarli kamayishi", "Real SAT tajribasiga maksimal yaqinlik", "Akademik standartlarga mos kontent", "O'rganilgan bilimlarni haqiqiy imtihonda qo'llash imkoniyati"],
        note: "VenSAT'da AI ma'lumotni o'ylab topmaydi — u ishonchli manbalarni siz uchun yanada aqlli, interaktiv va o'rganishga qulay shaklga keltiradi."
      }
    },
    translateSection: {
      badge: "REAL-TIME TARJIMA",
      title1: "Istalgan gapni",
      title2: "sinchkonlik bilan tushuning",
      desc: "Real vaqtda tarjima va aniq ma'nolari bilan so'z boyligingizni oshiring. So'zlarni bir bosishda lug'atingizga qo'shing, nusxalang yoki o'chiring.",
      items: [
        ["Tezkor tarjima", "Gapni yozing, AI bir lahzada tarjimasini va so'zlar ma'nosini beradi."],
        ["Qulay boshqaruv", "Lug'atdagi so'zlarni o'chiring, guruhlarga ajrating va practice qiling."]
      ],
      sampleSentence: ["The scientist decided to ", "abandon", " the experiment due to lack of funds."],
      translationLabel: "Tarjima va Ma'no",
      sampleTranslation: ["Olim mablag' yetishmasligi sababli tajribani ", "tark etishga", " qaror qildi."],
      wordLabel: "Abandon:",
      wordMeaning: "(v) Tark etish, voz kechish",
      copy: "Nusxalash",
      addToDict: "Lug'atga qo'shish"
    },
    algoSection: {
      badge: "LENTA & ALGORITM",
      title1: "Xatolaringizdan",
      title2: "o'rganib o'sing",
      desc: "Lenta savollari errors, local va global category uchun ishlaydi. Xato javob tanlasangiz avtomatik 50/50 ishlaydi, to'g'ri topsangiz zarlar sochiladi!",
      cardCategory: "Lenta - Global Category",
      cardQuestion: "The student's _______ behavior disrupted the entire class.",
      cardOptions: ["A) Erratic", "B) Methodical", "C) Lucrative", "D) Benign"],
      cardHint: "2 ta noto'g'ri variant avtomatik o'chirildi",
      items: [
        ["Cheksiz takrorlash", "Algoritm siz yaxshi bilamaydigan so'zlardan doim yangi savollar yaratib beradi."],
        ["Diagnostika", "Oylik diagnostik test orqali current level va darajangizni aniq bilib borasiz."]
      ]
    },
    dashboardSection: {
      badge: "DASHBOARD & MOCK",
      title1: "Natijalaringizni",
      title2: "boshqaring",
      desc: "Kunlik dashboard orqali yodlangan so'zlar soni, xatolar va darajangizni ko'ring. 54 savollik real Mock testlar bilan patternlarni tushunib oling.",
      items: [
        ["54 Savollik Mock", "Real SAT formatida interaktiv explanationlar bilan."],
        ["Kunlik Statistika", "Har kungi progress va xatolar bir joyda saqlanadi."]
      ],
      cardTitle: "Kunlik Statistika",
      cardToday: "Bugun",
      stats: [
        { l: "Current Level", v: "B2" },
        { l: "Yodlangan", v: "148" },
        { l: "Xatolar", v: "12" }
      ],
      mockLabel: "Mock Test (54/54)",
      readingLabel: "O'qish (Reading)"
    },
    readingSection: {
      badge: "O'QISH VA MAQOLALAR",
      title1: "Kitob dizaynidagi",
      title2: "chuqur o'qish",
      desc: "Real matnlar va hikoyalar kitob dizaynida. Personal uchun matn ichidagi so'zlar aynan sizning lug'atingizdagi sinonimlar bilan almashtiriladi. AWL va Panda academic words darslik ko'rinishida taqdim etiladi.",
      cardTitle: "Comprehending - Level B2",
      sampleText: ["The rapid ", "proliferation", " of technology has fundamentally altered how we interact with the world, creating a paradigm shift in ", "societal", " norms."],
      selectHint: "Matn ichidagi so'zni tanlab, yangi guruhga qo'shing",
      awlTitle: "AWL & Panda Academic Words",
      items: [
        ["Shaxsiylashtirilgan matnlar", "Siz yodlayotgan so'zlarning sinonimlari matnlar ichiga joylashtiriladi."],
        ["Guruhlar bilan ishlash", "Matndan so'z tanlab, yangi yoki mavjud guruhlaringizga qo'shing."]
      ]
    },
    practiceSection: {
      badge: "AMALIYOT VA JAMIYAT",
      title1: "O'rganishni qiziqarli",
      title2: "qiling",
      desc: "So'zlar bilan mustahkamlash o'yinlari, AI yordamida gap tuzish va Debate sahifasi orqali boshqalar bilan tajriba almashish.",
      card1: {
        title: "AI bilan Gap Tuzish",
        desc: "Random so'zlarni birlashtirib gap tuzish orqali yodlashni mustahkamlang va grammatikangizni yaxshilang.",
        prompt: "\"Abandon\" va \"Lucrative\" so'zlari bilan gap tuzing.",
        answer: "He abandoned the lucrative job offer to pursue his passion."
      },
      card2: {
        title: "Debate & Hacklar",
        desc: "Boshqa foydalanuvchilarning referatlarini ko'ring, so'zlarni o'zingizga qo'shing va SAT strategiyalari muhokama qiling.",
        refLabel: "Ref #124",
        refDesc: "Context clues usulini tushuntirish...",
        btn: "So'zlarni o'zimga qo'shish"
      },
      card3: {
        title: "Marketplace",
        desc: "Ustozlar tomonidan tuzilgan real testlar va interaktiv explanationlar bilan o'rganish imkoniyati.",
        items: [["Ustoz Aziz", "Advanced Reading Tests", "24 ta test"], ["Ustoz Sardor", "Hard Vocabulary Mock", "12 ta test"]]
      }
    },
    testimonialsSection: {
      badge: "★ Talabalar fikri",
      title1: "Ular ",
      titleHighlight: "nimani",
      title2: " deydi?",
      desc: "Kursimizni tamomlagan talabalarimizning samimiy fikrlari"
    },
    faqSection: {
      badge: "Yordam",
      desc: "Sizni qiziqtirgan savollarga tezkor javoblar"
    },
    footer: {
      tagline: "AI yordamida SAT tayyorgarligida yangi standart.",
      columns: [
        { t: "Platforma", links: ["Imkoniyatlar", "Narxlar", "Demo", "Blog"] },
        { t: "Kompaniya", links: ["Biz haqimizda", "Jamoamiz", "Karyera", "Yangiliklar"] },
        { t: "Yordam", links: ["FAQ", "Qo'llab-quvvatlash", "Maxfiylik", "Shartlar"] },
      ],
      rights: "© 2025 VENSAT. Barcha huquqlar himoyalangan."
    },
    features: [
      { title: "AI Tahlil", desc: "Gemini AI sizning zaif tomonlaringizni aniqlaydi va maqsadli mashqlar taklif etadi." },
      { title: "Aniq Maqsad", desc: "Har bir o'quv sessiyasi sizning hozirgi darajangizga moslashtiriladi." },
      { title: "O'sish Grafigi", desc: "Real vaqtda natijalaringizni kuzating va yaxshilanishni ko'ring." },
      { title: "Tez Natija", desc: "4-6 hafta ichida sezilarli o'sish ko'rgan talabalar 95% ni tashkil etadi." },
      { title: "Expert Strategiya", desc: "Top natija ko'rsatgan o'quvchilarning sirlari va texnikalarini o'rganing." },
      { title: "Jamoa", desc: "Do'stlaringiz bilan raqobat qiling va birgalikda o'sing." },
    ],
    testimonials: [
      { name: "Shoxrux Bekmurodov", role: "Frontend dasturchi", text: "Ushbu kurs mening kelajakdagi kareramda juda katta rol o'ynadi. Darslar juda tushunarli va amaliy mashg'ulotlar bilan mustahkamlangan.", stars: 5, avatarColor: "bg-indigo-600", initials: "SB" },
      { name: "Madina Toshpo'latova", role: "Mobil ilova ishlab chiqaruvchi", text: "Mentorlar bilan ishlash va real loyihalarda qatnashish menga o'z sohamda ishonchli bo'lishimga yordam berdi. Hozir men mustaqil ravishda loyihalar yarata olaman.", stars: 5, avatarColor: "bg-pink-600", initials: "MT" },
      { name: "Jasur Qodirov", role: "UI/UX dizayner", text: "Kursning tuzilishi va materiallar juda zamonaviy. Har bir modul o'zida ma'lum bir ko'nikmani shakllantirishga qaratilgan. Tavsiya qilaman!", stars: 4, avatarColor: "bg-emerald-600", initials: "JQ" },
      { name: "Dilnoza Rahmatova", role: "Sun'iy intellekt muhandisi", text: "Murakkab mavzular juda sodda va tushunarli tarzda berilgan. Kurs yakunida o'zimning birinchi AI loyihamni yaratdim. Ajoyib tajriba!", stars: 5, avatarColor: "bg-amber-600", initials: "DR" },
      { name: "Aziz Karimov", role: "Backend dasturchi", text: "Bu kurs orqali men nafaqat texnik bilimlarimni oshirdim, balki jamoa bo'lib ishlash va loyiha boshqarish ko'nikmalarini ham rivojlantirdim.", stars: 5, avatarColor: "bg-cyan-600", initials: "AK" }
    ],
    faqs: [
      { q: "VenSAT nima va u kimlar uchun mo'ljallangan?", a: "VenSAT Digital SAT Reading & Writing bo'limiga tayyorlanayotgan o'quvchilar uchun yaratilgan AI platformasidir. Platforma boshlang'ich darajadagi foydalanuvchilardan tortib 700+ ballni maqsad qilgan o'quvchilargacha bo'lgan barcha uchun moslashadi." },
      { q: "Platformadagi savollar va matnlar AI tomonidan shunchaki yaratiladimi?", a: "Yo'q. VenSAT'dagi reading matnlari, vocabulary va SAT uslubidagi savollar real manbalar hamda Digital SAT standartlari asosida tayyorlanadi. AI esa ularni foydalanuvchi darajasiga moslashtirish, explanation yozish va shaxsiy tavsiyalar berish uchun ishlatiladi." },
      { q: "VenSAT mening darajamga qanday moslashadi?", a: "Platforma diagnostik test, ishlangan savollar, vocabulary hajmi, xatolar va umumiy natijalaringizni tahlil qiladi. Shu ma'lumotlar asosida AI siz uchun mos reading matnlari, practice savollari va yangi so'zlarni tavsiya qiladi." },
      { q: "Platformada mock testlar mavjudmi?", a: "Ha. VenSAT Digital SAT formatidagi to'liq 54 savollik mock testlarni taklif qiladi. Test yakunlangach batafsil tahlil, explanation, kuchli va zaif tomonlaringiz hamda rivojlanish bo'yicha tavsiyalar taqdim etiladi." },
      { q: "Vocabulary o'rganish qanday tashkil qilingan?", a: "Siz cheksiz vocabulary guruhlarini yaratishingiz, yangi so'zlarni maqolalar yoki reading passage'lardan bir bosish orqali saqlashingiz, ularni practice qilishingiz va turli interaktiv o'yinlar orqali mustahkamlashingiz mumkin." },
      { q: "Internet bo'lmasa ham platformadan foydalanish mumkinmi?", a: "Asosiy AI funksiyalari, tarjima, sinxronizatsiya va yangi kontentni yuklash uchun internet talab qilinadi. Biroq ayrim avval yuklangan materiallar va saqlangan ma'lumotlardan oflayn foydalanish imkoniyati keyingi versiyalarda qo'shilishi rejalashtirilgan." }
    ]
  },

  ru: {
    nav: ["Возможности", "Результаты", "Цены", "FAQ"],
    login: "Войти",
    start: "Начать →",
    modal: {
      loginTitle: "Добро пожаловать",
      registerTitle: "Создать аккаунт",
      loginSubtitle: "Войдите в свой аккаунт",
      registerSubtitle: "Присоединяйтесь к тысячам студентов",
      fullName: "Имя и фамилия",
      fullNamePlaceholder: "Абдулло Каримов",
      email: "Email",
      emailPlaceholder: "you@example.com",
      password: "Пароль",
      submitLogin: "Войти",
      submitRegister: "Создать аккаунт",
      loading: "Подождите...",
      noAccount: "Нет аккаунта?",
      hasAccount: "Уже есть аккаунт?",
      registerLink: "Зарегистрируйтесь",
      loginLink: "Войти",
      fillAll: "Заполните все поля",
      enterName: "Введите ваше имя",
      welcomeBack: "Добро пожаловать!",
      accountCreated: "Аккаунт создан!",
      connectionError: "Ошибка соединения. Попробуйте снова."
    },
    hero: {
      badge: "AI-POWERED SAT PREP",
      titleLine1: "Значительно повысьте",
      titleLine2: "свой балл SAT",
      subtitle: "Достигните своей цели за 3 месяца с помощью AI-анализа, персонального плана обучения и тысяч практических вопросов.",
      ctaPrimary: "Начать бесплатно",
      ctaSecondary: "Войти",
      badges: ["Без кредитной карты", "Бесплатный пробный период", "Отмена в любое время"],
      cardTotalScore: "Общий балл",
      cardGrowth: "+320 рост",
      cardLabels: ["Reading", "Math"]
    },
    stats: [
      { n: "95%", l: "Рост баллов" },
      { n: "10K+", l: "Активных студентов" },
      { n: "+320", l: "Средний рост" },
      { n: "50+", l: "Практических тестов" },
    ],
    sources: {
      badge: "REAL SOURCES",
      title1: "Основано на реальных источниках,",
      title2: "а не на случайном AI",
      desc: "Контент VenSAT не придумывается AI просто так. Каждый текст, отрывок в стиле SAT и вопрос на платформе создаются на основе достоверных, реальных источников.",
      card1: {
        title: "Real Reading Materials",
        desc: "Упражнения Reading берутся из таких реальных источников, как:",
        items: ["Научные статьи", "Исторические тексты", "Академические издания", "Художественные произведения", "Популярные научные и аналитические статьи"],
        note: "Тексты адаптируются под формат SAT, но их основное содержание, авторский стиль и логическая структура сохраняются."
      },
      card2: {
        title: "Authentic SAT-Style Questions",
        desc: "Ни один вопрос не создаётся случайно. Вопросы:",
        items: ["Составляются в соответствии со стандартами Digital SAT", "Разрабатываются на основе официальных паттернов вопросов SAT", "Повторяют способы мышления, встречающиеся на реальных экзаменах", "Учат настоящей логике SAT, а не искусственной сложности"],
        note: "Цель — научить пользователя понимать настоящую модель мышления SAT, а не просто заучивать вопросы."
      },
      card3: {
        title: "AI as an Assistant, Not the Author",
        desc: "Искусственный интеллект не придумывает контент полностью. Вместо этого AI:",
        items: ["Анализирует реальные источники", "Адаптирует тексты под уровень пользователя", "Сокращает лишние части", "Обогащает vocabulary и пояснения", "Создаёт интерактивные explanation и персональные рекомендации"],
        note: "Пользователь каждый раз работает с достоверной информацией, а AI помогает сделать обучение более понятным и эффективным."
      },
      card4: {
        title: "High Reliability",
        desc: "Все материалы платформы создаются по принципу не \"AI-first\", а \"Source-first\". Такой подход даёт следующие преимущества:",
        items: ["Высокая достоверность", "Значительное снижение вероятности фактических ошибок", "Максимальная приближённость к реальному опыту SAT", "Контент, соответствующий академическим стандартам", "Возможность применить полученные знания на настоящем экзамене"],
        note: "В VenSAT AI не выдумывает информацию — он превращает достоверные источники в более умный, интерактивный и удобный для изучения формат."
      }
    },
    translateSection: {
      badge: "ПЕРЕВОД В РЕАЛЬНОМ ВРЕМЕНИ",
      title1: "Понимайте любое предложение",
      title2: "до мельчайших деталей",
      desc: "Расширяйте словарный запас с помощью перевода в реальном времени и точных значений слов. Добавляйте слова в свой словарь, копируйте или удаляйте их одним нажатием.",
      items: [
        ["Мгновенный перевод", "Введите предложение — AI мгновенно даст перевод и значения слов."],
        ["Удобное управление", "Удаляйте слова из словаря, распределяйте по группам и тренируйтесь."]
      ],
      sampleSentence: ["The scientist decided to ", "abandon", " the experiment due to lack of funds."],
      translationLabel: "Перевод и значение",
      sampleTranslation: ["Учёный решил ", "отказаться", " от эксперимента из-за нехватки средств."],
      wordLabel: "Abandon:",
      wordMeaning: "(гл.) отказываться, бросать",
      copy: "Копировать",
      addToDict: "Добавить в словарь"
    },
    algoSection: {
      badge: "LENTA & АЛГОРИТМ",
      title1: "Учитесь и растите",
      title2: "на своих ошибках",
      desc: "Вопросы Lenta работают для категорий errors, local и global. Если выбираете неверный ответ, автоматически срабатывает 50/50, а если отвечаете верно — сыплются кубики!",
      cardCategory: "Lenta - Global Category",
      cardQuestion: "The student's _______ behavior disrupted the entire class.",
      cardOptions: ["A) Erratic", "B) Methodical", "C) Lucrative", "D) Benign"],
      cardHint: "2 неверных варианта удалены автоматически",
      items: [
        ["Бесконечное повторение", "Алгоритм всегда создаёт новые вопросы из слов, которые вы плохо знаете."],
        ["Диагностика", "С помощью ежемесячного диагностического теста вы точно узнаёте свой current level."]
      ]
    },
    dashboardSection: {
      badge: "DASHBOARD & MOCK",
      title1: "Управляйте",
      title2: "своими результатами",
      desc: "Отслеживайте количество выученных слов, ошибки и свой уровень в ежедневном dashboard. Изучайте паттерны с помощью реальных Mock-тестов из 54 вопросов.",
      items: [
        ["Mock из 54 вопросов", "В реальном формате SAT с интерактивными explanation."],
        ["Ежедневная статистика", "Ежедневный прогресс и ошибки сохраняются в одном месте."]
      ],
      cardTitle: "Ежедневная статистика",
      cardToday: "Сегодня",
      stats: [
        { l: "Current Level", v: "B2" },
        { l: "Выучено", v: "148" },
        { l: "Ошибки", v: "12" }
      ],
      mockLabel: "Mock Test (54/54)",
      readingLabel: "Reading"
    },
    readingSection: {
      badge: "READING И СТАТЬИ",
      title1: "Глубокое чтение",
      title2: "в дизайне книги",
      desc: "Реальные тексты и истории в дизайне книги. Для персонализации слова внутри текста заменяются синонимами именно из вашего словаря. AWL и Panda academic words представлены в виде учебника.",
      cardTitle: "Comprehending - Level B2",
      sampleText: ["The rapid ", "proliferation", " of technology has fundamentally altered how we interact with the world, creating a paradigm shift in ", "societal", " norms."],
      selectHint: "Выберите слово в тексте и добавьте в новую группу",
      awlTitle: "AWL & Panda Academic Words",
      items: [
        ["Персонализированные тексты", "Синонимы изучаемых вами слов вставляются прямо в тексты."],
        ["Работа с группами", "Выбирайте слово из текста и добавляйте в новую или существующую группу."]
      ]
    },
    practiceSection: {
      badge: "ПРАКТИКА И СООБЩЕСТВО",
      title1: "Сделайте обучение",
      title2: "увлекательным",
      desc: "Закрепляйте слова с помощью игр, составляйте предложения с помощью AI и обменивайтесь опытом с другими через страницу Debate.",
      card1: {
        title: "Составление предложений с AI",
        desc: "Закрепляйте выученное и улучшайте грамматику, составляя предложения из случайных слов.",
        prompt: "Составьте предложение со словами \"Abandon\" и \"Lucrative\".",
        answer: "He abandoned the lucrative job offer to pursue his passion."
      },
      card2: {
        title: "Debate и лайфхаки",
        desc: "Смотрите рефераты других пользователей, добавляйте слова себе и обсуждайте стратегии SAT.",
        refLabel: "Ref #124",
        refDesc: "Объяснение метода context clues...",
        btn: "Добавить слова себе"
      },
      card3: {
        title: "Marketplace",
        desc: "Возможность учиться по реальным тестам и интерактивным explanation, составленным преподавателями.",
        items: [["Преподаватель Азиз", "Advanced Reading Tests", "24 теста"], ["Преподаватель Сардор", "Hard Vocabulary Mock", "12 тестов"]]
      }
    },
    testimonialsSection: {
      badge: "★ Отзывы студентов",
      title1: "Что они ",
      titleHighlight: "говорят",
      title2: "?",
      desc: "Искренние отзывы студентов, прошедших наш курс"
    },
    faqSection: {
      badge: "Помощь",
      desc: "Быстрые ответы на интересующие вас вопросы"
    },
    footer: {
      tagline: "Новый стандарт подготовки к SAT с помощью AI.",
      columns: [
        { t: "Платформа", links: ["Возможности", "Цены", "Демо", "Блог"] },
        { t: "Компания", links: ["О нас", "Наша команда", "Карьера", "Новости"] },
        { t: "Помощь", links: ["FAQ", "Поддержка", "Конфиденциальность", "Условия"] },
      ],
      rights: "© 2025 VENSAT. Все права защищены."
    },
    features: [
      { title: "AI-анализ", desc: "Gemini AI определяет ваши слабые стороны и предлагает целевые упражнения." },
      { title: "Чёткая цель", desc: "Каждая учебная сессия адаптируется под ваш текущий уровень." },
      { title: "График роста", desc: "Отслеживайте свои результаты в реальном времени и видьте прогресс." },
      { title: "Быстрый результат", desc: "95% студентов показывают заметный рост уже через 4–6 недель." },
      { title: "Стратегии экспертов", desc: "Изучите секреты и техники студентов с лучшими результатами." },
      { title: "Сообщество", desc: "Соревнуйтесь с друзьями и растите вместе." },
    ],
    testimonials: [
      { name: "Shoxrux Bekmurodov", role: "Frontend-разработчик", text: "Этот курс сыграл огромную роль в моей будущей карьере. Уроки очень понятные и подкреплены практическими занятиями.", stars: 5, avatarColor: "bg-indigo-600", initials: "SB" },
      { name: "Madina Toshpo'latova", role: "Разработчик мобильных приложений", text: "Работа с менторами и участие в реальных проектах помогли мне обрести уверенность в своей сфере. Теперь я могу самостоятельно создавать проекты.", stars: 5, avatarColor: "bg-pink-600", initials: "MT" },
      { name: "Jasur Qodirov", role: "UI/UX дизайнер", text: "Структура курса и материалы очень современные. Каждый модуль направлен на формирование определённого навыка. Рекомендую!", stars: 4, avatarColor: "bg-emerald-600", initials: "JQ" },
      { name: "Dilnoza Rahmatova", role: "Инженер искусственного интеллекта", text: "Сложные темы объясняются очень просто и понятно. По итогам курса я создала свой первый AI-проект. Отличный опыт!", stars: 5, avatarColor: "bg-amber-600", initials: "DR" },
      { name: "Aziz Karimov", role: "Backend-разработчик", text: "Благодаря этому курсу я не только повысил технические знания, но и развил навыки командной работы и управления проектами.", stars: 5, avatarColor: "bg-cyan-600", initials: "AK" }
    ],
    faqs: [
      { q: "Что такое VenSAT и для кого он предназначен?", a: "VenSAT — это AI-платформа, созданная для учащихся, готовящихся к разделу Digital SAT Reading & Writing. Платформа адаптируется для всех — от пользователей начального уровня до тех, кто нацелен на 700+ баллов." },
      { q: "Просто ли генерируются вопросы и тексты на платформе AI?", a: "Нет. Тексты для reading, vocabulary и вопросы в стиле SAT на VenSAT готовятся на основе реальных источников и стандартов Digital SAT. AI же используется для адаптации их под уровень пользователя, написания explanation и предоставления персональных рекомендаций." },
      { q: "Как VenSAT адаптируется под мой уровень?", a: "Платформа анализирует диагностический тест, выполненные вопросы, объём vocabulary, ошибки и общие результаты. На основе этих данных AI рекомендует подходящие тексты для reading, практические вопросы и новые слова." },
      { q: "Есть ли на платформе mock-тесты?", a: "Да. VenSAT предлагает полноценные mock-тесты из 54 вопросов в формате Digital SAT. После завершения теста предоставляется подробный анализ, explanation, ваши сильные и слабые стороны, а также рекомендации по развитию." },
      { q: "Как организовано изучение vocabulary?", a: "Вы можете создавать неограниченное количество групп vocabulary, сохранять новые слова из статей или reading passage одним нажатием, тренироваться с ними и закреплять их с помощью различных интерактивных игр." },
      { q: "Можно ли пользоваться платформой без интернета?", a: "Для основных функций AI, перевода, синхронизации и загрузки нового контента требуется интернет. Однако возможность оффлайн-доступа к ранее загруженным материалам и сохранённым данным планируется добавить в следующих версиях." }
    ]
  },

  en: {
    nav: ["Features", "Results", "Pricing", "FAQ"],
    login: "Log in",
    start: "Get started →",
    modal: {
      loginTitle: "Welcome back",
      registerTitle: "Create an account",
      loginSubtitle: "Log in to your account",
      registerSubtitle: "Join thousands of students",
      fullName: "Full name",
      fullNamePlaceholder: "Abdulloh Karimov",
      email: "Email",
      emailPlaceholder: "you@example.com",
      password: "Password",
      submitLogin: "Log in",
      submitRegister: "Create account",
      loading: "Please wait...",
      noAccount: "Don't have an account?",
      hasAccount: "Already have an account?",
      registerLink: "Sign up",
      loginLink: "Log in",
      fillAll: "Please fill in all fields",
      enterName: "Please enter your name",
      welcomeBack: "Welcome back!",
      accountCreated: "Account created!",
      connectionError: "Connection error. Please try again."
    },
    hero: {
      badge: "AI-POWERED SAT PREP",
      titleLine1: "Boost your SAT",
      titleLine2: "score significantly",
      subtitle: "Reach your dream score in 3 months with AI analysis, a personal study plan, and thousands of practice questions.",
      ctaPrimary: "Start for free",
      ctaSecondary: "Log in",
      badges: ["No credit card required", "Free trial", "Cancel anytime"],
      cardTotalScore: "Total score",
      cardGrowth: "+320 growth",
      cardLabels: ["Reading", "Math"]
    },
    stats: [
      { n: "95%", l: "Score increase" },
      { n: "10K+", l: "Active students" },
      { n: "+320", l: "Average growth" },
      { n: "50+", l: "Practice tests" },
    ],
    sources: {
      badge: "REAL SOURCES",
      title1: "Built on real sources,",
      title2: "not random AI",
      desc: "Content on VenSAT isn't simply invented by AI. Every passage, SAT-style text and question on the platform is prepared based on credible, real sources.",
      card1: {
        title: "Real Reading Materials",
        desc: "Reading exercises are drawn from real sources such as:",
        items: ["Scientific articles", "Historical texts", "Academic publications", "Literary works", "Popular science and analytical articles"],
        note: "Texts are adapted to the SAT format, but their core content, author style and logical structure are preserved."
      },
      card2: {
        title: "Authentic SAT-Style Questions",
        desc: "No question is generated at random. Questions are:",
        items: ["Written to match Digital SAT standards", "Developed based on official SAT question patterns", "Designed to mirror the reasoning styles found on real exams", "Built to teach genuine SAT logic, not artificial difficulty"],
        note: "The goal is to teach users the real reasoning model of the SAT, rather than having them memorize questions."
      },
      card3: {
        title: "AI as an Assistant, Not the Author",
        desc: "The AI doesn't fully invent the content on the platform. Instead, AI:",
        items: ["Analyzes real sources", "Adapts texts to the user's level", "Trims unnecessary parts", "Enriches vocabulary and explanations", "Generates interactive explanations and personal recommendations"],
        note: "Users always work with reliable information, while AI helps make learning clearer and more effective."
      },
      card4: {
        title: "High Reliability",
        desc: "All materials on the platform are built on a \"Source-first\" principle rather than an \"AI-first\" one. This approach delivers the following advantages:",
        items: ["High reliability", "A significant reduction in the likelihood of factual errors", "Maximum closeness to the real SAT experience", "Content aligned with academic standards", "The ability to apply learned knowledge on the real exam"],
        note: "On VenSAT, AI doesn't make up information — it turns reliable sources into a smarter, more interactive, and easier-to-learn format for you."
      }
    },
    translateSection: {
      badge: "REAL-TIME TRANSLATION",
      title1: "Understand any sentence",
      title2: "with complete precision",
      desc: "Grow your vocabulary with real-time translation and precise meanings. Add words to your dictionary, copy them, or remove them with a single click.",
      items: [
        ["Instant translation", "Type a sentence and AI instantly gives its translation and word meanings."],
        ["Convenient controls", "Remove words from your dictionary, sort them into groups, and practice."]
      ],
      sampleSentence: ["The scientist decided to ", "abandon", " the experiment due to lack of funds."],
      translationLabel: "Translation & Meaning",
      sampleTranslation: ["The scientist decided to ", "abandon", " the experiment due to a lack of funds."],
      wordLabel: "Abandon:",
      wordMeaning: "(v) to give up, to leave behind",
      copy: "Copy",
      addToDict: "Add to dictionary"
    },
    algoSection: {
      badge: "LENTA & ALGORITHM",
      title1: "Learn and grow",
      title2: "from your mistakes",
      desc: "Lenta questions work for the errors, local and global categories. Pick a wrong answer and 50/50 kicks in automatically; get it right and the dice roll in your favor!",
      cardCategory: "Lenta - Global Category",
      cardQuestion: "The student's _______ behavior disrupted the entire class.",
      cardOptions: ["A) Erratic", "B) Methodical", "C) Lucrative", "D) Benign"],
      cardHint: "2 incorrect options were automatically removed",
      items: [
        ["Endless practice", "The algorithm always generates new questions from words you don't know well."],
        ["Diagnostics", "A monthly diagnostic test lets you clearly track your current level."]
      ]
    },
    dashboardSection: {
      badge: "DASHBOARD & MOCK",
      title1: "Track",
      title2: "your results",
      desc: "See the number of words learned, mistakes, and your level through the daily dashboard. Understand patterns with real 54-question Mock tests.",
      items: [
        ["54-Question Mock", "In the real SAT format with interactive explanations."],
        ["Daily Stats", "Daily progress and mistakes are all saved in one place."]
      ],
      cardTitle: "Daily Stats",
      cardToday: "Today",
      stats: [
        { l: "Current Level", v: "B2" },
        { l: "Learned", v: "148" },
        { l: "Mistakes", v: "12" }
      ],
      mockLabel: "Mock Test (54/54)",
      readingLabel: "Reading"
    },
    readingSection: {
      badge: "READING & ARTICLES",
      title1: "Deep reading",
      title2: "in a book-like design",
      desc: "Real texts and stories in a book layout. For personalization, words within the text are swapped with synonyms straight from your own dictionary. AWL and Panda academic words are presented in a textbook style.",
      cardTitle: "Comprehending - Level B2",
      sampleText: ["The rapid ", "proliferation", " of technology has fundamentally altered how we interact with the world, creating a paradigm shift in ", "societal", " norms."],
      selectHint: "Select a word in the text and add it to a new group",
      awlTitle: "AWL & Panda Academic Words",
      items: [
        ["Personalized texts", "Synonyms of the words you're learning are inserted directly into texts."],
        ["Working with groups", "Pick a word from the text and add it to a new or existing group."]
      ]
    },
    practiceSection: {
      badge: "PRACTICE & COMMUNITY",
      title1: "Make learning",
      title2: "fun",
      desc: "Reinforce words with games, build sentences with AI's help, and exchange experience with others through the Debate page.",
      card1: {
        title: "Build Sentences with AI",
        desc: "Reinforce what you've learned and improve your grammar by combining random words into sentences.",
        prompt: "Build a sentence using the words \"Abandon\" and \"Lucrative\".",
        answer: "He abandoned the lucrative job offer to pursue his passion."
      },
      card2: {
        title: "Debate & Hacks",
        desc: "Browse other users' write-ups, add their words to your own list, and discuss SAT strategies.",
        refLabel: "Ref #124",
        refDesc: "Explaining the context clues method...",
        btn: "Add words to my list"
      },
      card3: {
        title: "Marketplace",
        desc: "A chance to learn from real tests and interactive explanations created by instructors.",
        items: [["Instructor Aziz", "Advanced Reading Tests", "24 tests"], ["Instructor Sardor", "Hard Vocabulary Mock", "12 tests"]]
      }
    },
    testimonialsSection: {
      badge: "★ Student feedback",
      title1: "What do they ",
      titleHighlight: "say",
      title2: "?",
      desc: "Honest feedback from students who completed our course"
    },
    faqSection: {
      badge: "Help",
      desc: "Quick answers to the questions you care about"
    },
    footer: {
      tagline: "A new standard for SAT prep, powered by AI.",
      columns: [
        { t: "Platform", links: ["Features", "Pricing", "Demo", "Blog"] },
        { t: "Company", links: ["About us", "Our team", "Careers", "News"] },
        { t: "Help", links: ["FAQ", "Support", "Privacy", "Terms"] },
      ],
      rights: "© 2025 VENSAT. All rights reserved."
    },
    features: [
      { title: "AI Analysis", desc: "Gemini AI identifies your weak points and suggests targeted exercises." },
      { title: "Clear Goal", desc: "Every study session adapts to your current level." },
      { title: "Growth Chart", desc: "Track your results in real time and watch your improvement." },
      { title: "Fast Results", desc: "95% of students see noticeable growth within 4–6 weeks." },
      { title: "Expert Strategy", desc: "Learn the secrets and techniques of top-performing students." },
      { title: "Community", desc: "Compete with friends and grow together." },
    ],
    testimonials: [
      { name: "Shoxrux Bekmurodov", role: "Frontend developer", text: "This course played a huge role in my future career. The lessons are very clear and reinforced with hands-on practice.", stars: 5, avatarColor: "bg-indigo-600", initials: "SB" },
      { name: "Madina Toshpo'latova", role: "Mobile app developer", text: "Working with mentors and taking part in real projects helped me become confident in my field. Now I can build projects independently.", stars: 5, avatarColor: "bg-pink-600", initials: "MT" },
      { name: "Jasur Qodirov", role: "UI/UX designer", text: "The course structure and materials are very modern. Each module is focused on building a specific skill. Highly recommend!", stars: 4, avatarColor: "bg-emerald-600", initials: "JQ" },
      { name: "Dilnoza Rahmatova", role: "AI engineer", text: "Complex topics are explained very simply and clearly. By the end of the course, I built my very first AI project. A great experience!", stars: 5, avatarColor: "bg-amber-600", initials: "DR" },
      { name: "Aziz Karimov", role: "Backend developer", text: "Through this course I not only improved my technical knowledge, but also developed teamwork and project management skills.", stars: 5, avatarColor: "bg-cyan-600", initials: "AK" }
    ],
    faqs: [
      { q: "What is VenSAT and who is it for?", a: "VenSAT is an AI platform built for students preparing for the Digital SAT Reading & Writing section. The platform adapts to everyone, from beginners to students aiming for a 700+ score." },
      { q: "Are the platform's questions and texts simply generated by AI?", a: "No. The reading texts, vocabulary, and SAT-style questions on VenSAT are prepared based on real sources and Digital SAT standards. AI is used to adapt them to the user's level, write explanations, and provide personal recommendations." },
      { q: "How does VenSAT adapt to my level?", a: "The platform analyzes your diagnostic test, completed questions, vocabulary size, mistakes, and overall results. Based on this data, AI recommends suitable reading texts, practice questions, and new words." },
      { q: "Are there mock tests on the platform?", a: "Yes. VenSAT offers full 54-question mock tests in the Digital SAT format. After completing a test, you get a detailed analysis, explanations, your strengths and weaknesses, and recommendations for improvement." },
      { q: "How is vocabulary learning organized?", a: "You can create unlimited vocabulary groups, save new words from articles or reading passages with a single click, practice them, and reinforce them through various interactive games." },
      { q: "Can the platform be used without internet access?", a: "Internet access is required for the core AI features, translation, synchronization, and loading new content. However, the ability to use some previously loaded materials and saved data offline is planned for future versions." }
    ]
  }
};

export const stats = translations.uz.stats;
export const features = translations.uz.features;
export const testimonials = translations.uz.testimonials;
export const faqs = translations.uz.faqs;

const LandingPage = () => {
    const { login, user } = useUserStore();
    const navigate = useNavigate();
    const [authModalOpen, setAuthModalOpen] = useState(false);
    const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({ email: '', password: '', displayName: '' });
    const [localLoading, setLocalLoading] = useState(false);
    const [openIndex, setOpenIndex] = useState<number | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [itemsPerView, setItemsPerView] = useState(3);
    const [lang, setLang] = useState<Lang>('uz');
    const t = translations[lang];

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 640) setItemsPerView(1);
            else if (window.innerWidth < 1024) setItemsPerView(2);
            else setItemsPerView(3);
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const extendedTestimonials = [...t.testimonials, ...t.testimonials];
    const maxIndex = t.testimonials.length;

    const openAuthModal = (mode: 'login' | 'register') => {
        setAuthMode(mode);
        setAuthModalOpen(true);
        setFormData({ email: '', password: '', displayName: '' });
        setShowPassword(false);
    };

    const handleAuthSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.email || !formData.password) return toast.error(t.modal.fillAll);
        if (authMode === "register" && !formData.displayName) return toast.error(t.modal.enterName);
        setLocalLoading(true);
        try {
            const res = await api.post(authMode === "login" ? "/api/auth/login" : "/api/auth/register",
                authMode === "login" ? { email: formData.email, password: formData.password } : { email: formData.email, password: formData.password, displayName: formData.displayName }
            );
            login(res.data.user);
            localStorage.setItem("aero_token", res.data.token);
            toast.success(authMode === "login" ? t.modal.welcomeBack : t.modal.accountCreated);
            setAuthModalOpen(false);
            navigate('/dashboard')
        } catch (error: any) {
            toast.error(error?.response ? error.response.data.error : t.modal.connectionError);
        } finally {
            setLocalLoading(false);
        }
    };

    useEffect(() => {
        if (user) navigate("dashboard");
    }, [user, navigate]);

    return (
        <div className="min-h-screen bg-white font-sans" style={{ fontFamily: "'Sora', 'Plus Jakarta Sans', sans-serif" }}>
            <header className="fixed top-0 left-0 right-0 z-50 h-16 px-2 lg:px-12 bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm">
                <div className="h-full flex items-center justify-between max-w-7xl mx-auto">
                    <div className="flex items-center gap-2.5"><img src={image} alt="project logo" className='md:h-12 h-8' /></div>
                    <nav className="hidden md:flex items-center gap-8">
                        {t.nav.map((n: string) => (<a key={n} href="#" className="text-sm font-medium text-gray-500 hover:text-blue-950 transition-colors">{n}</a>))}
                    </nav>
                    <div className="flex items-center gap-2">
                        <div className="hidden sm:flex items-center gap-1 mr-1 bg-gray-100 rounded-lg p-0.5">
                            {(['uz', 'ru', 'en'] as Lang[]).map((l) => (
                                <button key={l} onClick={() => setLang(l)} className={`px-2 py-1 text-xs font-bold rounded-md transition-colors cursor-pointer ${lang === l ? 'bg-blue-950 text-white' : 'text-gray-500 hover:text-blue-950'}`}>{l.toUpperCase()}</button>
                            ))}
                        </div>
                        <button onClick={() => openAuthModal('login')} className="md:px-4 px-2 cursor-pointer py-2 text-sm text-blue-950 border border-blue-950 hover:bg-blue-950 hover:text-white rounded-lg transition-colors">{t.login}</button>
                        <button onClick={() => openAuthModal('register')} className="md:px-4 px-2 cursor-pointer py-2 text-sm bg-blue-950 text-white rounded-lg hover:bg-white hover:text-blue-950 border hover:border-blue-950 transition-colors">{t.start}</button>
                    </div>
                </div>
            </header>
            {authModalOpen && (
                <div className="fixed inset-0 z-60 flex items-center justify-center md:p-4 p-2 bg-slate-950/70 backdrop-blur-sm" onClick={() => setAuthModalOpen(false)}>
                    <div onClick={e => e.stopPropagation()} className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl">
                        <div className="relative bg-blue-950 px-5 py-5">
                            <button onClick={() => setAuthModalOpen(false)} className="absolute right-4 top-4 rounded-lg p-1.5 text-blue-300 hover:bg-white/10 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
                            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/10"><BookOpen className="h-5 w-5 text-white" /></div>
                            <h2 className="text-xl font-black text-white">{authMode === "login" ? t.modal.loginTitle : t.modal.registerTitle}</h2>
                            <p className="mt-1 text-sm text-blue-300">{authMode === "login" ? t.modal.loginSubtitle : t.modal.registerSubtitle}</p>
                        </div>
                        <div className="p-5">
                            <form onSubmit={handleAuthSubmit} className="space-y-4">
                                {authMode === "register" && (
                                    <div><label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-400">{t.modal.fullName}</label><div className="relative"><User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" /><input type="text" value={formData.displayName} onChange={e => setFormData(p => ({ ...p, displayName: e.target.value }))} placeholder={t.modal.fullNamePlaceholder} className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm text-gray-800 outline-none focus:border-blue-950" /></div></div>
                                )}
                                <div><label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-400">{t.modal.email}</label><div className="relative"><Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" /><input type="email" required value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} placeholder={t.modal.emailPlaceholder} className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm text-gray-800 outline-none focus:border-blue-950" /></div></div>
                                <div><label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-400">{t.modal.password}</label><div className="relative"><Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" /><input type={showPassword ? "text" : "password"} required value={formData.password} onChange={e => setFormData(p => ({ ...p, password: e.target.value }))} placeholder="••••••••" className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-11 text-sm text-gray-800 outline-none focus:border-blue-950" /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></div>
                                <button type="submit" disabled={localLoading} className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-950 px-4 py-3 text-sm font-bold text-white hover:bg-blue-900 disabled:bg-gray-300">{localLoading ? <><Loader2 className="h-4 w-4 animate-spin" /><span>{t.modal.loading}</span></> : <><span>{authMode === "login" ? t.modal.submitLogin : t.modal.submitRegister}</span><ArrowRight className="h-4 w-4" /></>}</button>
                            </form>
                            <div className="mt-4 pt-4 border-t border-gray-100 text-center"><p className="text-sm text-gray-500">{authMode === 'login' ? t.modal.noAccount : t.modal.hasAccount}<button onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} className="ml-1.5 font-bold text-blue-950 hover:underline transition-colors">{authMode === 'login' ? t.modal.registerLink : t.modal.loginLink}</button></p></div>
                        </div>
                    </div>
                </div>
            )}
            <section className="pt-16 min-h-screen flex flex-col">
                <div className="flex-1 flex flex-col lg:flex-row items-center max-w-7xl mx-auto px-2 lg:px-12 py-20 gap-16">
                    <div className="flex-1 space-y-8">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 border border-gray-200 rounded-full"><Sparkles className="w-3.5 h-3.5 text-blue-950" /><span className="text-xs font-bold text-blue-950 tracking-wide">{t.hero.badge}</span></div>
                        <h1 className="text-5xl lg:text-6xl xl:text-7xl font-black text-blue-950 leading-[1.05] tracking-tight">{t.hero.titleLine1}<br /><span className="relative">{t.hero.titleLine2}<svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none"><path d="M2 9 C75 3, 150 3, 298 9" stroke="#1e3a8a" strokeWidth="3" strokeLinecap="round" /></svg></span></h1>
                        <p className="text-lg text-gray-500 leading-relaxed max-w-lg">{t.hero.subtitle}</p>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <button onClick={() => openAuthModal('register')} className="flex items-center justify-center gap-2 px-7 py-4 bg-blue-950 text-white font-bold rounded-xl hover:bg-blue-900 transition-all text-sm shadow-lg shadow-blue-950/20">{t.hero.ctaPrimary} <ArrowRight className="w-4 h-4" /></button>
                            <button onClick={() => openAuthModal('login')} className="flex items-center justify-center gap-2 px-7 py-4 bg-white text-blue-950 font-bold rounded-xl border-2 border-blue-950/10 hover:border-blue-950/30 transition-all text-sm">{t.hero.ctaSecondary} <ChevronRight className="w-4 h-4" /></button>
                        </div>
                        <div className="flex items-center gap-6 pt-2">{t.hero.badges.map((bText: string) => (<div key={bText} className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-blue-950" /><span className="text-xs text-gray-500 font-medium">{bText}</span></div>))}</div>
                    </div>
                    <div className="flex-1 flex justify-center">
                        <div className="relative w-72 h-80">
                            <div className="absolute top-6 right-0 w-64 h-72 bg-gray-100 rounded-2xl rotate-6" />
                            <div className="absolute top-3 left-4 w-64 h-72 bg-gray-200 rounded-2xl -rotate-2" />
                            <div className="absolute top-0 left-0 w-64 h-72 bg-blue-950 rounded-2xl shadow-2xl p-6 flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center justify-between mb-4"><div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center"><BookOpen className="w-4 h-4 text-white" /></div><span className="text-xs text-blue-300 font-semibold">VenSAT</span></div>
                                    <p className="text-blue-300 text-xs font-medium mb-1">{t.hero.cardTotalScore}</p>
                                    <p className="text-5xl font-black text-white">1520</p>
                                    <div className="flex items-center gap-1 mt-1"><TrendingUp className="w-3.5 h-3.5 text-emerald-400" /><span className="text-emerald-400 text-xs font-bold">{t.hero.cardGrowth}</span></div>
                                </div>
                                <div className="space-y-2">{[[t.hero.cardLabels[0], 790, 800], [t.hero.cardLabels[1], 730, 800]].map(([l, v, max]) => (<div key={l as string}><div className="flex justify-between mb-1"><span className="text-xs text-blue-300">{l as string}</span><span className="text-xs text-white font-bold">{v}/{max}</span></div><div className="h-1.5 bg-white/10 rounded-full"><div className="h-1.5 bg-white rounded-full" style={{ width: `${(v as number) / (max as number) * 100}%` }} /></div></div>))}</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="bg-blue-950 py-8"><div className="max-w-5xl mx-auto px-6 grid grid-cols-2 lg:grid-cols-4 gap-8">{t.stats.map((s: any, i: number) => (<div key={i} className="text-center"><div className="text-3xl font-black text-white mb-0.5">{s.n}</div><div className="text-xs font-medium text-blue-300 uppercase tracking-wider">{s.l}</div></div>))}</div></div>
            </section>
            {/* NEW SECTION: Built on Real Sources */}
            <section className="py-24 bg-gray-50">
                <div className="max-w-7xl mx-auto px-2 lg:px-12">
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-full mb-6"><Microscope className="w-3.5 h-3.5 text-blue-950" /><span className="text-xs font-bold text-blue-950 tracking-wide">{t.sources.badge}</span></div>
                        <h2 className="text-4xl lg:text-5xl font-black text-blue-950 leading-tight mb-4">{t.sources.title1}<br />{t.sources.title2}</h2>
                        <p className="text-gray-500 max-w-2xl mx-auto">{t.sources.desc}</p>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Card 1: Real Reading Materials */}
                        <div className="p-6 rounded-2xl border border-gray-200 bg-white hover:shadow-xl transition-all duration-300 group">
                            <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center mb-4 group-hover:bg-blue-950 transition-colors">
                                <BookText className="w-5 h-5 text-blue-950 group-hover:text-white transition-colors" />
                            </div>
                            <h3 className="text-lg font-bold text-blue-950 mb-2">{t.sources.card1.title}</h3>
                            <p className="text-sm text-gray-500 leading-relaxed mb-4">{t.sources.card1.desc}</p>
                            <div className="space-y-2">
                                {t.sources.card1.items.map((item: string) => (
                                    <div key={item} className="flex items-center gap-2 text-sm text-gray-600">
                                        <CheckSquare className="w-4 h-4 text-blue-950" />
                                        <span>{item}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
                                <p className="text-xs text-gray-500">{t.sources.card1.note}</p>
                            </div>
                        </div>
                        {/* Card 2: Authentic SAT-Style Questions */}
                        <div className="p-6 rounded-2xl border border-gray-200 bg-white hover:shadow-xl transition-all duration-300 group">
                            <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center mb-4 group-hover:bg-blue-950 transition-colors">
                                <Target className="w-5 h-5 text-blue-950 group-hover:text-white transition-colors" />
                            </div>
                            <h3 className="text-lg font-bold text-blue-950 mb-2">{t.sources.card2.title}</h3>
                            <p className="text-sm text-gray-500 leading-relaxed mb-4">{t.sources.card2.desc}</p>
                            <div className="space-y-2">
                                {t.sources.card2.items.map((item: string) => (
                                    <div key={item} className="flex items-center gap-2 text-sm text-gray-600">
                                        <CheckSquare className="w-4 h-4 text-blue-950" />
                                        <span>{item}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
                                <p className="text-xs text-gray-500">{t.sources.card2.note}</p>
                            </div>
                        </div>
                        {/* Card 3: AI as an Assistant */}
                        <div className="p-6 rounded-2xl border border-gray-200 bg-white hover:shadow-xl transition-all duration-300 group">
                            <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center mb-4 group-hover:bg-blue-950 transition-colors">
                                <Brain className="w-5 h-5 text-blue-950 group-hover:text-white transition-colors" />
                            </div>
                            <h3 className="text-lg font-bold text-blue-950 mb-2">{t.sources.card3.title}</h3>
                            <p className="text-sm text-gray-500 leading-relaxed mb-4">{t.sources.card3.desc}</p>
                            <div className="space-y-2">
                                {t.sources.card3.items.map((item: string) => (
                                    <div key={item} className="flex items-center gap-2 text-sm text-gray-600">
                                        <CheckSquare className="w-4 h-4 text-blue-950" />
                                        <span>{item}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
                                <p className="text-xs text-gray-500">{t.sources.card3.note}</p>
                            </div>
                        </div>
                        {/* Card 4: High Reliability */}
                        <div className="md:col-span-2 lg:col-span-3 p-6 rounded-2xl border border-gray-200 bg-white hover:shadow-xl transition-all duration-300 group">
                            <div className="flex flex-col md:flex-row gap-6 items-start">
                                <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-950 transition-colors">
                                    <Shield className="w-5 h-5 text-blue-950 group-hover:text-white transition-colors" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold text-blue-950 mb-2">{t.sources.card4.title}</h3>
                                    <p className="text-sm text-gray-500 leading-relaxed mb-4">{t.sources.card4.desc}</p>
                                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {[CheckCircle, FileCheck, Target, GraduationCap, Lightbulb].map((Icon, idx) => (
                                            <div key={idx} className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
                                                <Icon className="w-4 h-4 text-blue-950 flex-shrink-0" />
                                                <span className="text-sm text-blue-900">{t.sources.card4.items[idx]}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                                        <p className="text-xs text-blue-900">{t.sources.card4.note}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            <section className="py-24 bg-white overflow-hidden">
                <div className="max-w-7xl mx-auto px-2 lg:px-12 grid lg:grid-cols-2 gap-16 items-center">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 border border-gray-200 rounded-full mb-6"><Globe className="w-3.5 h-3.5 text-blue-950" /><span className="text-xs font-bold text-blue-950 tracking-wide">{t.translateSection.badge}</span></div>
                        <h2 className="text-4xl lg:text-5xl font-black text-blue-950 leading-tight mb-6">{t.translateSection.title1}<br />{t.translateSection.title2}</h2>
                        <p className="text-gray-500 leading-relaxed mb-8">{t.translateSection.desc}</p>
                        <div className="space-y-4">
                            {t.translateSection.items.map(([txt, d]: string[]) => (
                                <div key={txt} className="flex gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:shadow-md transition-all">
                                    <div className="mt-0.5 w-8 h-8 rounded-lg bg-blue-950 flex items-center justify-center flex-shrink-0"><CheckCircle className="w-4 h-4 text-white" /></div>
                                    <div><h4 className="font-bold text-sm text-blue-950 mb-1">{txt}</h4><p className="text-sm text-gray-500">{d}</p></div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="relative flex justify-center">
                        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 p-6 space-y-5">
                            <div className="flex items-center gap-3 pb-4 border-b border-gray-100"><div className="w-8 h-8 rounded-full bg-blue-950 flex items-center justify-center text-white text-xs font-bold">S</div><div className="flex-1 bg-gray-50 rounded-full h-2"><div className="bg-blue-950 h-2 rounded-full w-1/3"></div></div><span className="text-xs font-bold text-gray-400">1/3</span></div>
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100"><p className="text-sm text-gray-800 font-medium">{t.translateSection.sampleSentence[0]}<span className="bg-blue-100 text-blue-950 px-1 rounded font-bold">{t.translateSection.sampleSentence[1]}</span>{t.translateSection.sampleSentence[2]}</p></div>
                            <div className="bg-blue-950 p-4 rounded-xl text-white space-y-2"><p className="text-xs text-blue-300 font-semibold">{t.translateSection.translationLabel}</p><p className="text-sm font-medium">{t.translateSection.sampleTranslation[0]}<span className="text-blue-300 font-bold">{t.translateSection.sampleTranslation[1]}</span>{t.translateSection.sampleTranslation[2]}</p><div className="flex items-center gap-2 pt-2 border-t border-white/10"><span className="text-xs text-blue-300">{t.translateSection.wordLabel}</span><span className="text-xs text-white font-medium">{t.translateSection.wordMeaning}</span></div></div>
                            <div className="flex gap-2"><button className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gray-100 text-gray-600 rounded-lg text-sm font-bold hover:bg-gray-200 transition-colors"><Copy className="w-4 h-4" />{t.translateSection.copy}</button><button className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-950 text-white rounded-lg text-sm font-bold hover:bg-blue-900 transition-colors"><Plus className="w-4 h-4" />{t.translateSection.addToDict}</button></div>
                        </div>
                    </div>
                </div>
            </section>
            <section className="py-24 bg-gray-50">
                <div className="max-w-7xl mx-auto px-2 lg:px-12 grid lg:grid-cols-2 gap-16 items-center">
                    <div className="order-2 lg:order-1 flex justify-center">
                        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 space-y-5 relative overflow-hidden">
                            <div className="absolute top-4 right-4 bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-[10px] font-black flex items-center gap-1"><Zap className="w-3 h-3" />50/50</div>
                            <div className="flex items-center justify-between"><span className="text-xs font-bold text-gray-400 uppercase">{t.algoSection.cardCategory}</span><span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">+15 XP</span></div>
                            <p className="text-gray-800 font-semibold text-sm">{t.algoSection.cardQuestion}</p>
                            <div className="space-y-2">
                                {t.algoSection.cardOptions.map((v: string, i: number) => (
                                    <div key={i} className={`p-3 rounded-xl text-sm font-medium border transition-all ${i === 0 ? "bg-blue-50 border-blue-200 text-blue-900 shadow-sm" : i > 1 ? "bg-gray-50 border-gray-100 text-gray-300 line-through" : "bg-white border-gray-200 text-gray-700"}`}>{v}</div>
                                ))}
                            </div>
                            <div className="pt-3 border-t border-gray-100 flex items-center gap-2"><Sparkles className="w-4 h-4 text-amber-500" /><span className="text-xs text-gray-500">{t.algoSection.cardHint}</span></div>
                        </div>
                    </div>
                    <div className="order-1 lg:order-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-full mb-6"><Layers className="w-3.5 h-3.5 text-blue-950" /><span className="text-xs font-bold text-blue-950 tracking-wide">{t.algoSection.badge}</span></div>
                        <h2 className="text-4xl lg:text-5xl font-black text-blue-950 leading-tight mb-6">{t.algoSection.title1}<br />{t.algoSection.title2}</h2>
                        <p className="text-gray-600 leading-relaxed mb-8">{t.algoSection.desc}</p>
                        <div className="space-y-4">
                            {t.algoSection.items.map(([txt, d]: string[]) => (
                                <div key={txt} className="flex gap-4 p-4 bg-white rounded-xl border border-gray-200 hover:shadow-md transition-all">
                                    <div className="mt-0.5 w-8 h-8 rounded-lg bg-blue-950 flex items-center justify-center flex-shrink-0"><CheckCircle className="w-4 h-4 text-white" /></div>
                                    <div><h4 className="font-bold text-sm text-blue-950 mb-1">{txt}</h4><p className="text-sm text-gray-500">{d}</p></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>
            <section className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-2 lg:px-12 grid lg:grid-cols-2 gap-16 items-center">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 border border-gray-200 rounded-full mb-6"><BarChart3 className="w-3.5 h-3.5 text-blue-950" /><span className="text-xs font-bold text-blue-950 tracking-wide">{t.dashboardSection.badge}</span></div>
                        <h2 className="text-4xl lg:text-5xl font-black text-blue-950 leading-tight mb-6">{t.dashboardSection.title1}<br />{t.dashboardSection.title2}</h2>
                        <p className="text-gray-500 leading-relaxed mb-8">{t.dashboardSection.desc}</p>
                        <div className="grid grid-cols-2 gap-4">
                            {t.dashboardSection.items.map(([txt, d]: string[]) => (
                                <div key={txt} className="p-4 bg-gray-50 rounded-xl border border-gray-100 hover:shadow-md transition-all">
                                    <ArrowUpRight className="w-5 h-5 text-blue-950 mb-3" />
                                    <h4 className="font-bold text-sm text-blue-950 mb-1">{txt}</h4>
                                    <p className="text-xs text-gray-500 leading-relaxed">{d}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="flex justify-center">
                        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 p-6 space-y-4">
                            <div className="flex items-center justify-between mb-2"><h3 className="font-black text-blue-950">{t.dashboardSection.cardTitle}</h3><span className="text-xs bg-blue-100 text-blue-950 px-2 py-1 rounded-full font-bold">{t.dashboardSection.cardToday}</span></div>
                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { ...t.dashboardSection.stats[0], c: "bg-blue-950 text-white" },
                                    { ...t.dashboardSection.stats[1], c: "bg-emerald-50 text-emerald-700 border border-emerald-100" },
                                    { ...t.dashboardSection.stats[2], c: "bg-rose-50 text-rose-700 border border-rose-100" }
                                ].map((s: any, i: number) => (
                                    <div key={i} className={`p-3 rounded-xl text-center ${s.c}`}><div className="text-xl font-black">{s.v}</div><div className="text-[10px] font-semibold opacity-80 mt-0.5">{s.l}</div></div>
                                ))}
                            </div>
                            <div className="pt-4 border-t border-gray-100 space-y-3">
                                <div className="flex items-center justify-between text-sm"><span className="text-gray-500">{t.dashboardSection.mockLabel}</span><span className="font-bold text-blue-950">92%</span></div>
                                <div className="h-2 bg-gray-100 rounded-full"><div className="h-2 bg-blue-950 rounded-full" style={{ width: "92%" }}></div></div>
                            </div>
                            <div className="pt-2 border-t border-gray-100 space-y-3">
                                <div className="flex items-center justify-between text-sm"><span className="text-gray-500">{t.dashboardSection.readingLabel}</span><span className="font-bold text-blue-950">790/800</span></div>
                                <div className="h-2 bg-gray-100 rounded-full"><div className="h-2 bg-blue-950 rounded-full" style={{ width: "98%" }}></div></div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            <section className="py-24 bg-gray-50">
                <div className="max-w-7xl mx-auto px-2 lg:px-12 grid lg:grid-cols-2 gap-16 items-center">
                    <div className="order-2 lg:order-1 flex justify-center">
                        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-200 p-0 overflow-hidden">
                            <div className="bg-blue-950 px-6 py-4 flex items-center justify-between"><div className="flex items-center gap-2"><BookMarked className="w-4 h-4 text-white" /><span className="text-sm font-bold text-white">{t.readingSection.cardTitle}</span></div><span className="text-xs text-blue-300 font-medium">3/5</span></div>
                            <div className="p-6 space-y-4">
                                <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 text-sm text-blue-950 leading-relaxed font-medium">{t.readingSection.sampleText[0]}<span className="bg-white px-1 rounded shadow-sm border border-blue-100 cursor-pointer">{t.readingSection.sampleText[1]}</span>{t.readingSection.sampleText[2]}<span className="bg-white px-1 rounded shadow-sm border border-blue-100 cursor-pointer">{t.readingSection.sampleText[3]}</span>{t.readingSection.sampleText[4]}</div>
                                <div className="flex items-center gap-2 text-xs text-blue-900/70 bg-blue-50 rounded-lg p-2"><Plus className="w-3.5 h-3.5 text-blue-950" /><span>{t.readingSection.selectHint}</span></div>
                                <div className="pt-3 border-t border-blue-100"><p className="text-xs font-bold text-blue-950 mb-2">{t.readingSection.awlTitle}</p><div className="flex flex-wrap gap-2">{["Analysis", "Concept", "Establish", "Impact"].map(w => (<span key={w} className="px-3 py-1.5 bg-blue-950 text-white rounded-lg text-xs font-bold">{w}</span>))}</div></div>
                            </div>
                        </div>
                    </div>
                    <div className="order-1 lg:order-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-blue-200 rounded-full mb-6"><Library className="w-3.5 h-3.5 text-blue-950" /><span className="text-xs font-bold text-blue-950 tracking-wide">{t.readingSection.badge}</span></div>
                        <h2 className="text-4xl lg:text-5xl font-black text-blue-950 leading-tight mb-6">{t.readingSection.title1}<br />{t.readingSection.title2}</h2>
                        <p className="text-blue-900/70 leading-relaxed mb-8">{t.readingSection.desc}</p>
                        <div className="space-y-4">
                            {t.readingSection.items.map(([txt, d]: string[]) => (
                                <div key={txt} className="flex gap-4 p-4 bg-white rounded-xl border border-blue-200 hover:shadow-md transition-all">
                                    <div className="mt-0.5 w-8 h-8 rounded-lg bg-blue-950 flex items-center justify-center flex-shrink-0"><CheckCircle className="w-4 h-4 text-white" /></div>
                                    <div><h4 className="font-bold text-sm text-blue-950 mb-1">{txt}</h4><p className="text-sm text-blue-900/70">{d}</p></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>
            <section className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-2 lg:px-12">
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 border border-gray-200 rounded-full mb-6"><Gamepad2 className="w-3.5 h-3.5 text-blue-950" /><span className="text-xs font-bold text-blue-950 tracking-wide">{t.practiceSection.badge}</span></div>
                        <h2 className="text-4xl lg:text-5xl font-black text-blue-950 leading-tight mb-4">{t.practiceSection.title1}<br />{t.practiceSection.title2}</h2>
                        <p className="text-gray-500 max-w-2xl mx-auto">{t.practiceSection.desc}</p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-6">
                        {[
                            { icon: MessageSquare, title: t.practiceSection.card1.title, desc: t.practiceSection.card1.desc, visual: <div className="mt-5 bg-gray-50 p-3 rounded-xl border border-gray-100 space-y-2"><div className="flex items-start gap-2"><div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-600 mt-0.5">S</div><p className="text-xs text-gray-600 bg-white p-2 rounded-lg border border-gray-100">{t.practiceSection.card1.prompt}</p></div><div className="flex items-start gap-2"><div className="w-5 h-5 rounded-full bg-blue-950 flex items-center justify-center mt-0.5"><Sparkle className="w-3 h-3 text-white" /></div><p className="text-xs text-gray-800 bg-blue-50 p-2 rounded-lg border border-blue-100">{t.practiceSection.card1.answer}</p></div></div> },
                            { icon: FileText, title: t.practiceSection.card2.title, desc: t.practiceSection.card2.desc, visual: <div className="mt-5 bg-gray-50 p-3 rounded-xl border border-gray-100 space-y-2"><div className="flex items-center justify-between"><span className="text-xs font-bold text-gray-800">@abdulloh_sati</span><span className="text-[10px] text-white bg-blue-950 px-2 py-0.5 rounded-full">{t.practiceSection.card2.refLabel}</span></div><p className="text-xs text-gray-500">{t.practiceSection.card2.refDesc}</p><button className="w-full py-2 text-xs font-bold text-blue-950 bg-white border border-gray-200 rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center gap-1">{t.practiceSection.card2.btn} <ArrowRight className="w-3 h-3" /></button></div> },
                            { icon: ShoppingBag, title: t.practiceSection.card3.title, desc: t.practiceSection.card3.desc, visual: <div className="mt-5 bg-gray-50 p-3 rounded-xl border border-gray-100 space-y-3">{t.practiceSection.card3.items.map((it: string[], i: number) => (<div key={i} className="flex items-center gap-3 bg-white p-2 rounded-lg border border-gray-100"><div className="w-8 h-8 bg-blue-950 rounded-lg flex items-center justify-center text-white text-[10px] font-bold">{it[0][0]}{it[0].split(' ')[1] ? it[0].split(' ')[1][0] : ''}</div><div className="flex-1"><p className="text-xs font-bold text-gray-800">{it[1]}</p><p className="text-[10px] text-gray-400">{it[2]}</p></div><ArrowUpRight className="w-4 h-4 text-gray-400" /></div>))}</div> }
                        ].map((item, i) => (
                            <div key={i} className="p-6 rounded-2xl border border-gray-100 hover:shadow-xl transition-all duration-300 bg-white">
                                <div className="w-11 h-11 rounded-xl bg-blue-950 flex items-center justify-center mb-4"><item.icon className="w-5 h-5 text-white" /></div>
                                <h3 className="text-lg font-bold text-blue-950 mb-2">{item.title}</h3>
                                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                                {item.visual}
                            </div>
                        ))}
                    </div>
                </div>
            </section>
            <section className="py-20 bg-gradient-to-br from-slate-50 via-white to-blue-50/50">
                <div className="max-w-7xl mx-auto px-4 lg:px-8">
                    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-14">
                        <div>
                            <p className="inline-block text-xs font-bold text-indigo-600 uppercase tracking-widest mb-3 bg-indigo-50 px-4 py-1.5 rounded-full">{t.testimonialsSection.badge}</p>
                            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">{t.testimonialsSection.title1}<span className="text-indigo-600">{t.testimonialsSection.titleHighlight}</span>{t.testimonialsSection.title2}</h2>
                            <p className="text-slate-500 mt-2 max-w-lg">{t.testimonialsSection.desc}</p>
                        </div>
                    </div>
                    <div className="relative overflow-hidden">
                        <div className="flex transition-transform duration-[50ms] ease-linear"
                            style={{
                                transform: `translateX(-${currentIndex * (100 / itemsPerView)}%)`,
                                width: `${(extendedTestimonials.length / itemsPerView) * 100}%`
                            }}>
                            {extendedTestimonials.map((tm, i) => (
                                <div key={i} className="px-3" style={{ width: `${100 / t.testimonials.length}%` }}>
                                    <div className="h-full p-7 rounded-2xl bg-white border border-slate-200 hover:border-indigo-200 shadow-sm hover:shadow-xl transition-all duration-300 group relative">
                                        <div className="flex mb-4 gap-0.5">
                                            {[...Array(5)].map((_, j) => <Star key={j} className={`w-4 h-4 ${j < tm.stars ? 'text-yellow-400 fill-yellow-400' : 'text-slate-200 fill-slate-200'}`} />)}
                                        </div>
                                        <p className="text-sm text-slate-600 leading-relaxed mb-6 italic">"{tm.text}"</p>
                                        <div className="flex items-center gap-3 mt-auto pt-4 border-t border-slate-100">
                                            <div className={`w-10 h-10 rounded-full ${tm.avatarColor} flex items-center justify-center text-white text-xs font-bold shadow-md`}>{tm.initials || tm.name[0]}</div>
                                            <div><div className="text-sm font-bold text-slate-800">{tm.name}</div><div className="text-xs text-slate-400">{tm.role}</div></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    {t.testimonials.length > itemsPerView && (
                        <div className="flex justify-center mt-8 gap-1.5 sm:hidden">
                            {Array.from({ length: maxIndex + 1 }).map((_, idx) => (
                                <button key={idx} onClick={() => setCurrentIndex(idx)} className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentIndex ? 'w-6 bg-indigo-600' : 'w-1.5 bg-slate-300'}`} />
                            ))}
                        </div>
                    )}
                </div>
            </section>
            <section className="py-20 bg-gradient-to-b from-white via-blue-50/30 to-white">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-14">
                        <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200/50 rounded-full px-4 py-1.5 mb-4">
                            <HelpCircle className="w-4 h-4 text-blue-950" />
                            <span className="text-xs font-bold text-blue-950 uppercase tracking-widest">{t.faqSection.badge}</span>
                        </div>
                        <p className="text-slate-500 mt-3 max-w-lg mx-auto">{t.faqSection.desc}</p>
                    </div>
                    <div className="space-y-3">
                        {t.faqs.map((f: any, index: number) => {
                            const isOpen = openIndex === index;
                            return (
                                <div key={index} className={`rounded-2xl border transition-all duration-300 overflow-hidden ${isOpen ? 'border-blue-300 bg-white shadow-lg shadow-blue-100/50' : 'border-slate-200 bg-white/60 hover:border-slate-300 hover:bg-white hover:shadow-sm'}`}>
                                    <button onClick={() => setOpenIndex(isOpen ? null : index)} className="w-full px-6 py-5 flex items-center justify-between gap-4 text-left group" aria-expanded={isOpen}>
                                        <h3 className={`text-base font-bold transition-colors duration-200 flex-1 ${isOpen ? 'text-blue-950' : 'text-slate-800 group-hover:text-blue-950'}`}>{f.q}</h3>
                                        <span className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 ${isOpen ? 'bg-blue-950 text-white rotate-180' : 'bg-slate-100 text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-950'}`}>
                                            <ChevronDown className="w-4 h-4" />
                                        </span>
                                    </button>
                                    <div className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                                        <div className="px-6 pb-6 pt-0">
                                            <div className="h-px bg-gradient-to-r from-transparent via-blue-200 to-transparent mb-4" />
                                            <p className="text-sm text-slate-600 leading-relaxed">{f.a}</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>
            <footer className="bg-white border-t border-gray-400 text-blue-950 py-12">
                <div className="max-w-7xl mx-auto px-2 lg:px-12">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
                        <div className="col-span-2 md:col-span-1">
                            <div className="flex items-center gap-2.5 mb-4"><img src={image} alt="project logo" className='md:h-12 h-8' /></div>
                            <p className="text-gray-500 text-sm leading-relaxed">{t.footer.tagline}</p>
                        </div>
                        {t.footer.columns.map((col: any) => (
                            <div key={col.t}>
                                <h4 className="text-blue-950 font-bold text-sm mb-4">{col.t}</h4>
                                <ul className="space-y-2">{col.links.map((l: string) => (<li key={l}><a href="#" className="text-gray-500 text-sm hover:text-blue-950 transition-colors">{l}</a></li>))}</ul>
                            </div>
                        ))}
                    </div>
                    <div className="pt-6 border-t border-gray-100"><p className="text-gray-400 text-sm">{t.footer.rights}</p></div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;