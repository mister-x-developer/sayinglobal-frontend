const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..', 'messages');

const ADD = {
  uz: {
    report: {
      title: 'Shikoyat',
      subject: 'Shikoyat qilingan',
      reasonLabel: 'Sabab',
      adminResponse: 'Admin javobi',
      status: 'Holat',
      created: 'Yuborildi',
      resolved: 'Hal qilindi',
      titleListing: 'E\'lon ustidan shikoyat',
      titleSeller: 'Sotuvchi ustidan shikoyat',
      complainant: 'Shikoyat yuboruvchi',
      'status.pending': 'Kutilmoqda',
      'status.under_review': 'Ko\'rib chiqilmoqda',
      'status.resolved_valid': 'Tasdiqlandi',
      'status.resolved_invalid': 'Rad etildi',
    },
    adminMod: {
      status_pending: 'Kutilmoqda',
      status_under_review: 'Ko\'rib chiqilmoqda',
      status_resolved_valid: 'Tasdiqlandi',
      status_resolved_invalid: 'Rad etildi',
      severity: 'Darajasi',
      description: 'Tavsif',
      moderatorNotes: 'Moderator izohi',
      assignedTo: 'Tayinlangan',
      reportedListing: 'Shikoyat qilingan e\'lon',
      startReview: 'Ko\'rib chiqishni boshlash',
      resolveValid: 'Tasdiqlash',
      resolveInvalid: 'Rad etish',
      reason_fake_animal_age: 'Yoshi to\'g\'ri emas',
      reason_hidden_illness: 'Kasallik yashirilgan',
      reason_fake_vaccination: 'Soxta vaksina',
      reason_misleading_photos: 'Rasmlar noto\'g\'ri',
      reason_fraudulent_pricing: 'Narx aldamchi',
      reason_duplicate_listing: 'Takroriy e\'lon',
      reason_false_breed_claim: 'Zot noto\'g\'ri',
      reason_fake_location: 'Joylashuv soxta',
      reason_unavailable_after_agreement: 'Kelishuvdan keyin yo\'qoldi',
      reason_prohibited_animal: 'Taqiqlangan hayvon',
      reason_misleading_description: 'Noto\'g\'ri tavsif',
      reason_repeated_violations: 'Qayta-qayta qoidabuzarlik',
      reason_aggressive_behavior: 'Tajovuzkor muomala',
      reason_scam_attempt: 'Firibgarlik urinishi',
      reason_no_show_after_deal: 'Kelishuvdan keyin kelmadi',
      reason_false_identity: 'Yolg\'on shaxs',
      reason_repeated_fake_listings: 'Qayta soxta e\'lonlar',
      reason_demanding_prepayment_scam: 'Oldindan to\'lov firibgarlik',
      reason_harassment: 'Bezovta qilish',
      reason_off_platform_payment_pressure: 'Platforma tashqarida to\'lov',
      reason_other: 'Boshqa sabab',
    },
    sellers: {
      reviews: 'Sharhlar',
      totalReviews: 'sharh',
      noReviews: 'Sharhlar yo\'q',
      beFirstToReview: 'Birinchi sharh qoldiring',
      topSellers: 'Top sotuvchilar',
      newSellers: 'Yangi sotuvchilar',
      message: 'Yozish',
      responseRate: 'Javob darajasi',
      responseTime: 'Javob vaqti',
      totalSales: 'Jami sotuvlar',
      trustNotice: 'Platforma buyer-seller o\'rtasidagi bitim uchun javobgar emas',
      followers: 'Obunachilar',
      directory: 'Sotuvchilar katalogi',
      trustedSellers: 'Tasdiqlangan sotuvchilar',
    },
    notifications: {
      title: 'Bildirishnomalar',
      empty: 'Bildirishnomalar yo\'q',
      markAllRead: 'Barchasini o\'qilgan deb belgilash',
      read: 'O\'qildi',
      unread: 'Yangi',
    },
    userStatus: {
      good: 'Yaxshi',
      warning: 'Ogohlantirish',
      restricted: 'Cheklangan',
      blocked: 'Bloklangan',
    },
    security: {
      title: 'Xavfsizlik',
      sessions: 'Seanslat',
      revokeSession: 'Seansni bekor qilish',
      revokeAllOthers: 'Boshqa seanslarga ruxsatni qaytarib olish',
      events: 'Xavfsizlik voqealari',
    },
    chat: {
      title: 'Chat',
      send: 'Yuborish',
      placeholder: 'Xabar yozing...',
      noConversations: 'Chatlar yo\'q',
      noMessages: 'Xabarlar yo\'q',
    },
    search: {
      placeholder: 'Qoramol, qo\'y, echki...',
      noResults: 'Natija topilmadi',
      recent: 'So\'nggi qidiruvlar',
      popular: 'Mashhur qidiruvlar',
      sellers: 'Sotuvchilar',
    },
    listings: {
      title: 'E\'lonlar',
      title2: 'E\'lon nomi',
      description: 'Tavsif',
      descriptionPlaceholder: 'Hayvon haqida batafsil yozing...',
      titlePlaceholder: 'E\'lon sarlavhasi',
      price: 'Narx',
      location: 'Joylashuv',
      region: 'Viloyat',
      district: 'Tuman',
      age: 'Yoshi',
      gender: 'Jinsi',
      male: 'Erkak',
      female: 'Urg\'ochi',
      weight: 'Vazni',
      breed: 'Zot',
      specifications: 'Xususiyatlar',
      category: 'Kategoriya',
      negotiable: 'Kelishuv mumkin',
      createNew: 'E\'lon qo\'shish',
      editListing: 'E\'lonni tahrirlash',
      myListings: 'Mening e\'lonlarim',
      active: 'Faol',
      pending: 'Tekshiruvda',
      sold: 'Sotilgan',
      rejected: 'Rad etilgan',
      expired: 'Muddati o\'tgan',
      archived: 'Arxiv',
      draft: 'Qoralama',
      markAsSold: 'Sotilgan deb belgilash',
      restore: 'Qayta aktivlashtirish',
      deleteConfirm: 'E\'lonni o\'chirishni tasdiqlaysizmi?',
      seller: 'Sotuvchi',
      rejectedNoticeTitle: 'E\'lon rad etildi',
      rejectedNoticeBody: 'E\'lonni tahrirlang va qayta yuboring.',
      pendingNoticeTitle: 'E\'lon tekshiruvda',
      pendingNoticeBody: 'Moderator ko\'rib chiqayapti.',
      markAsSoldConfirm: 'E\'lon sotilgan deb belgilanadi va 30 kundan so\'ng o\'chiriladi.',
      locationOnMap: 'Xaritada joylashuv',
      favorites: 'Sevimlilar',
      healthStatus: 'Sog\'lig\'i',
    },
    create: {
      stepBasics: 'Asosiy ma\'lumot',
      stepLocation: 'Joylashuv',
      stepPrice: 'Narx',
      stepPhotos: 'Rasmlar',
      maxPhotos: 'Maksimal 10 ta rasm',
      publishSuccess: 'E\'lon joylashtirildi',
      mapPinLabel: 'Xaritada belgi (ixtiyoriy)',
      mapPinHelp: 'Xaritada belgini qo\'ying.',
    },
    marketplace: {
      title: 'Bozor',
      feed: 'Yangi e\'lonlar',
      recommended: 'Tavsiya etilgan',
      trending: 'Ko\'rishlar',
      views: 'Ko\'rishlar',
      noResults: 'Natija topilmadi',
      tryAdjusting: 'Filtrlarni o\'zgartiring.',
      showResults: '{count} ta natija',
      filters: 'Filtr',
      mapUnavailable: 'Xarita yuklanmadi',
      mapTapToSetPin: 'Xaritani bosib belgini qo\'ying',
      useMyLocation: 'Mening joyim',
      shares: 'Ulashishlar',
    },
    profile: {
      title: 'Profil',
      myListings: 'Mening e\'lonlarim',
      favorites: 'Sevimlilar',
      activity: 'Faollik',
      editProfile: 'Profilni tahrirlash',
      responseRate: 'Javob darajasi',
      followers: 'Obunachilar',
      following: 'Obunalar',
      followedSellers: 'Kuzatilayotgan sotuvchilar',
      activeListings: 'Faol e\'lonlar',
      soldListings: 'Sotilgan e\'lonlar',
      noListings: 'E\'lonlar yo\'q',
      myReports: 'Shikoyatlarim',
      accountSummary: 'Hisob qisqacha',
    },
    empty: {
      noListings: 'E\'lonlar yo\'q',
      noListingsDescription: 'Birinchi e\'loningizni joylang',
      noFavorites: 'Sevimlilar yo\'q',
      noFavoritesDescription: 'E\'lonlarni saqlab boring',
      noActivity: 'Faollik yo\'q',
      noActivityDescription: 'Hozircha hech narsa yo\'q',
    },
    common: {
      appName: 'SAYIN.Global',
      tagline: 'Raqamli Chorva Bozori',
      welcome: 'Xush kelibsiz',
      loading: 'Yuklanmoqda',
      save: 'Saqlash',
      cancel: 'Bekor qilish',
      delete: 'O\'chirish',
      edit: 'Tahrirlash',
      view: 'Ko\'rish',
      close: 'Yopish',
      back: 'Orqaga',
      continue: 'Davom etish',
      confirm: 'Tasdiqlash',
      search: 'Qidirish',
      all: 'Hammasi',
      showAll: 'Barchasini ko\'rsatish',
      refresh: 'Yangilash',
      translate: 'Tarjima',
      showOriginal: 'Asl matn',
      details: 'Batafsil',
      settings: 'Sozlamalar',
      report: 'Shikoyat qilish',
      next: 'Keyingi',
      previous: 'Oldingi',
      accountSummary: 'Hisob qisqacha',
    },
    success: {
      updated: 'Yangilandi',
      created: 'Yaratildi',
      deleted: 'O\'chirildi',
      saved: 'Saqlandi',
      sent: 'Yuborildi',
      approved: 'Tasdiqlandi',
      rejected: 'Rad etildi',
      favorited: 'Sevimlilarga qo\'shildi',
      followed: 'Obuna bo\'lindi',
    },
    errors: {
      generic: 'Xatolik yuz berdi',
      required: 'Majburiy maydon',
      network: 'Tarmoq xatosi',
      serverError: 'Server xatosi',
      permissionDenied: 'Ruxsat yo\'q',
      saveFailed: 'Saqlab bo\'lmadi',
    },
    nav: {
      home: 'Bosh sahifa',
      listings: 'E\'lonlar',
      sellers: 'Sotuvchilar',
      chat: 'Chat',
      notifications: 'Bildirishnomalar',
      profile: 'Profil',
      nearby: 'Yaqinlik',
      createListing: 'E\'lon qo\'shish',
      settings: 'Sozlamalar',
      admin: 'Admin',
    },
    admin: {
      title: 'Admin panel',
      dashboard: 'Bosh sahifa',
      users: 'Foydalanuvchilar',
      listings: 'E\'lonlar',
      complaints: 'Shikoyatlar',
      reports: 'Hisobotlar',
      broadcasts: 'Xabarlar',
      analytics: 'Analitika',
      moderation: 'Moderatsiya',
      auditLogs: 'Audit jurnali',
      systemHealth: 'Tizim holati',
      settings: 'Sozlamalar',
      pending: 'Kutilmoqda',
      listingModeration: 'E\'lon moderatsiyasi',
      viewDetails: 'Batafsil',
      approve: 'Tasdiqlash',
      reject: 'Rad etish',
      restore: 'Tiklash',
      actions: 'Amallar',
      stats: 'Statistika',
      relatedReports: 'Shikoyatlar',
      noReports: 'Shikoyat yo\'q',
      rejectionReason: 'Rad etish sababi',
      confirmReject: 'Rad etishni tasdiqlash',
      rejectionReasonPlaceholder: 'Sababni yozing',
      rejectionReasonRequired: 'Sabab majburiy',
      ratingsModeration: 'Sharhlarni moderatsiya',
      broadcastTitle: 'Sarlavha',
      broadcastMessage: 'Matn',
      broadcastSent: 'Xabar yuborildi',
      createBroadcast: 'Yangi xabar',
      autoTranslateHint: 'Avtomatik 4 tilga tarjima qilinadi.',
      originalLocale: 'Asl til',
      translations: 'Tarjimalar',
      delivery: 'Yetkazib berish',
      recipients: 'Qabul qiluvchilar',
      read: 'O\'qildi',
      created: 'Yaratildi',
      sentAt: 'Yuborildi',
      notSentYet: 'Yuborilmagan',
      send: 'Yuborish',
      message: 'Xabar',
      status: 'Holat',
      flagged: 'shikoyat',
      reportsReceived: 'Foydalanuvchiga shikoyatlar',
      reportsFiled: 'Yuborilgan shikoyatlar',
      broadcast: 'Xabar',
      warn: 'Ogohlantirish',
      restrict: 'Cheklash',
      block: 'Bloklash',
      unblock: 'Blokdan chiqarish',
      notesRequiredToResolve: 'Hal qilish uchun izoh qo\'shing.',
    },
    analytics: {
      title: 'Analitika',
    },
    regions: {
      tashkent_city: 'Toshkent shahri',
      tashkent: 'Toshkent viloyati',
      samarkand: 'Samarqand',
      bukhara: 'Buxoro',
      andijan: 'Andijon',
      fergana: 'Farg\'ona',
      namangan: 'Namangan',
      kashkadarya: 'Qashqadaryo',
      surkhandarya: 'Surxondaryo',
      jizzakh: 'Jizzax',
      navoi: 'Navoiy',
      syrdarya: 'Sirdaryo',
      khorezm: 'Xorazm',
      karakalpakstan: 'Qoraqalpog\'iston',
    },
    categories: {
      cattle: 'Qoramol',
      sheep: 'Qo\'y',
      goats: 'Echki',
      horses: 'Ot',
      camels: 'Tuya',
      poultry: 'Parranda',
      rabbits: 'Quyon',
      bees: 'Asalari',
      fish: 'Baliq',
    },
    animal: {
      breed: 'Zot',
      years: 'yil',
      months: 'oy',
      male: 'Erkak',
      female: 'Urg\'ochi',
      vaccinatedYes: 'Vaktsina qilingan',
      vaccinatedPartial: 'Qisman',
      vaccinatedNo: 'Yo\'q',
    },
    landing: {
      categoriesTitle: 'Kategoriyalar',
    },
    profileInfo: {
      statusTitle: 'Holat tizimi',
      statusBody: 'Foydalanuvchilar holati: yaxshi, ogohlantirish, cheklangan, bloklangan.',
      ratingTitle: 'Reyting',
      ratingBody: 'Sotuvchilarni baholash tizimi.',
      moderationTitle: 'Moderatsiya',
      moderationBody: 'Barcha e\'lonlar moderatorlar tomonidan ko\'rib chiqiladi.',
      lifecycleTitle: 'Hayot sikli',
      lifecycleBody: 'E\'lonlar 30 kundan keyin muddati o\'tgan bo\'ladi.',
      complaintTitle: 'Shikoyatlar',
      complaintBody: 'Shikoyat yuborishingiz mumkin.',
      rulesTitle: 'Qoidalar',
      rulesBody: 'Platforma qoidalarini buzuvchilar bloklanadi.',
    },
    terms: {
      title: 'Foydalanish shartlari',
      subtitle: 'Davom etishdan oldin shartlarni qabul qiling',
      intro: 'SAYIN.Global platformasidan foydalanish uchun quyidagi shartlarga rozilik bildirishingiz lozim.',
      point1: 'Platforma sotuvchi va xaridor o\'rtasidagi bitim uchun javobgar emas.',
      point2: 'Sotuvchining halolligi yoki hayvon sifati uchun platforma javobgar emas.',
      point3: 'Firibgarlik uchun platforma yoki ma\'muriyat huquqiy javobgar emas.',
      point4: 'Foydalanuvchi shaxsan ehtiyot bo\'lishi kerak.',
      disclaimer: 'Platforma faqat muloqot vositasi bo\'lib xizmat qiladi.',
      checkboxLabel: 'Shartlarni qabul qilaman.',
      accept: 'Roziman va davom etaman',
    },
    reviews: {
      writeReview: 'Sharh yozish',
      editYourReview: 'Sharhni tahrirlash',
      placeholder: 'Tajribangizni baham ko\'ring',
      post: 'Yuborish',
      posted: 'Sharh yuborildi',
      cannotRateSelf: 'O\'zingizga sharh qoldirib bo\'lmaydi',
      reportSent: 'Shikoyat yuborildi',
      replyPrompt: 'Javobingiz',
      reply: 'Javob',
      helpful: 'Foydali',
      edited: 'tahrirlangan',
      sellerBadge: 'Sotuvchi',
      viewAll: 'Barcha sharhlar',
      sort_newest: 'Yangi',
      sort_highest: 'Yuqori baho',
      sort_lowest: 'Past baho',
      sort_most_useful: 'Foydali',
      moderation: 'Sharhlarni moderatsiya',
      reportPrompt: 'Sabab: spam / abuse / off_topic',
    },
    nearby: {
      eyebrow: 'Yaqin atrofdagilar',
      title: 'Yaqin atrofdagi e\'lonlar',
      modeGps: '{km} km radiusda',
      modeRegion: 'Viloyat/tuman bo\'yicha',
      location: 'Joylashuv',
      requesting: 'Joyni aniqlamoqda...',
      permissionDenied: 'Joylashuv ruxsat berilmadi',
      tryAgain: 'Qayta urinish',
      radius: 'Radius',
      empty: 'Yaqinda e\'lon topilmadi',
      emptyDesc: 'Radiusni kattalashtiring.',
    },
    time: {
      justNow: 'Hozir',
      minutesAgo: '{n} daqiqa oldin',
      hoursAgo: '{n} soat oldin',
      daysAgo: '{n} kun oldin',
    },
    validation: {
      required: 'Majburiy maydon',
      atLeastOneFieldRequired: 'Kamida bitta maydon to\'ldiring',
    },
  },
};

// ru, en, uz-cyrl — copy same keys with translated values
const RU = {
  'report.status.pending': 'Ожидает',
  'report.status.under_review': 'На рассмотрении',
  'report.status.resolved_valid': 'Подтверждена',
  'report.status.resolved_invalid': 'Отклонена',
};

function deepMerge(a, b) {
  for (const k of Object.keys(b)) {
    if (b[k] && typeof b[k] === 'object' && !Array.isArray(b[k])) {
      a[k] = (a[k] && typeof a[k] === 'object') ? a[k] : {};
      deepMerge(a[k], b[k]);
    } else if (!(k in a) || a[k] === '' || a[k] == null) {
      a[k] = b[k];
    }
  }
  return a;
}

// ROOT = path.join(__dirname, '..', 'messages');

// Apply to uz first
const uzFile = path.join(ROOT, 'uz.json');
const uz = JSON.parse(fs.readFileSync(uzFile, 'utf-8'));
deepMerge(uz, ADD.uz);
// uz report.status nested
uz.report = uz.report || {};
uz.report['status'] = uz.report['status'] || {};
uz.report['status']['pending'] = uz.report['status']['pending'] || 'Kutilmoqda';
uz.report['status']['under_review'] = uz.report['status']['under_review'] || 'Ko\'rib chiqilmoqda';
uz.report['status']['resolved_valid'] = uz.report['status']['resolved_valid'] || 'Tasdiqlandi';
uz.report['status']['resolved_invalid'] = uz.report['status']['resolved_invalid'] || 'Rad etildi';
fs.writeFileSync(uzFile, JSON.stringify(uz, null, 2) + '\n', 'utf-8');
console.log('updated uz.json');

// uz-cyrl — same structure, Cyrillic
const ucFile = path.join(ROOT, 'uz-cyrl.json');
const uc = JSON.parse(fs.readFileSync(ucFile, 'utf-8'));
const ucAdd = JSON.parse(JSON.stringify(ADD.uz));
// Override with Cyrillic where needed
const cyrOverrides = {
  'report.status.pending': 'Кутилмоқда',
  'report.status.under_review': 'Кўриб чиқилмоқда',
  'report.status.resolved_valid': 'Тасдиқланди',
  'report.status.resolved_invalid': 'Рад этилди',
};
deepMerge(uc, ucAdd);
uc.report = uc.report || {};
uc.report['status'] = uc.report['status'] || {};
uc.report['status']['pending'] = 'Кутилмоқда';
uc.report['status']['under_review'] = 'Кўриб чиқилмоқда';
uc.report['status']['resolved_valid'] = 'Тасдиқланди';
uc.report['status']['resolved_invalid'] = 'Рад этилди';
fs.writeFileSync(ucFile, JSON.stringify(uc, null, 2) + '\n', 'utf-8');
console.log('updated uz-cyrl.json');

// ru
const ruFile = path.join(ROOT, 'ru.json');
const ru = JSON.parse(fs.readFileSync(ruFile, 'utf-8'));
const ruBase = JSON.parse(JSON.stringify(ADD.uz));
deepMerge(ru, ruBase);
ru.report = ru.report || {};
ru.report['status'] = ru.report['status'] || {};
ru.report['status']['pending'] = 'Ожидает';
ru.report['status']['under_review'] = 'На рассмотрении';
ru.report['status']['resolved_valid'] = 'Подтверждена';
ru.report['status']['resolved_invalid'] = 'Отклонена';
// ru-specific overrides
const ruOverrides = {
  'common.welcome': 'Добро пожаловать',
  'common.loading': 'Загрузка',
  'common.save': 'Сохранить',
  'common.cancel': 'Отмена',
  'common.delete': 'Удалить',
  'common.edit': 'Редактировать',
  'common.search': 'Поиск',
  'common.all': 'Все',
  'common.back': 'Назад',
  'common.confirm': 'Подтвердить',
  'common.settings': 'Настройки',
  'nav.listings': 'Объявления',
  'nav.sellers': 'Продавцы',
  'nav.nearby': 'Рядом',
  'listings.sold': 'Продано',
  'listings.active': 'Активные',
  'listings.pending': 'На проверке',
  'listings.rejected': 'Отклонено',
  'listings.expired': 'Истекло',
  'listings.category': 'Категория',
  'listings.breed': 'Порода',
  'listings.location': 'Местоположение',
  'listings.title': 'Объявления',
  'listings.description': 'Описание',
  'listings.price': 'Цена',
  'listings.seller': 'Продавец',
  'categories.cattle': 'Крупный рогатый скот',
  'categories.sheep': 'Овцы',
  'categories.goats': 'Козы',
  'categories.horses': 'Лошади',
  'categories.camels': 'Верблюды',
  'categories.poultry': 'Птица',
  'categories.rabbits': 'Кролики',
  'categories.bees': 'Пчёлы',
  'categories.fish': 'Рыба',
  'sellers.reviews': 'Отзывы',
  'sellers.totalReviews': 'отзывов',
  'sellers.noReviews': 'Отзывов нет',
  'sellers.beFirstToReview': 'Оставьте первый отзыв',
  'sellers.topSellers': 'Топ продавцы',
  'sellers.newSellers': 'Новые продавцы',
  'sellers.message': 'Написать',
  'sellers.followers': 'Подписчики',
  'sellers.directory': 'Каталог продавцов',
  'sellers.trustedSellers': 'Проверенные продавцы',
  'notifications.title': 'Уведомления',
  'notifications.empty': 'Уведомлений нет',
  'notifications.markAllRead': 'Отметить все прочитанными',
  'notifications.read': 'Прочитано',
  'notifications.unread': 'Новое',
  'success.updated': 'Обновлено',
  'success.created': 'Создано',
  'success.deleted': 'Удалено',
  'success.saved': 'Сохранено',
  'errors.generic': 'Произошла ошибка',
  'errors.required': 'Обязательное поле',
  'errors.serverError': 'Ошибка сервера',
};
for (const [dotKey, val] of Object.entries(ruOverrides)) {
  const parts = dotKey.split('.');
  let obj = ru;
  for (let i = 0; i < parts.length - 1; i++) {
    obj[parts[i]] = obj[parts[i]] || {};
    obj = obj[parts[i]];
  }
  if (!obj[parts[parts.length-1]]) obj[parts[parts.length-1]] = val;
}
fs.writeFileSync(ruFile, JSON.stringify(ru, null, 2) + '\n', 'utf-8');
console.log('updated ru.json');

// en
const enFile = path.join(ROOT, 'en.json');
const en = JSON.parse(fs.readFileSync(enFile, 'utf-8'));
const enBase = JSON.parse(JSON.stringify(ADD.uz));
deepMerge(en, enBase);
en.report = en.report || {};
en.report['status'] = en.report['status'] || {};
en.report['status']['pending'] = 'Pending';
en.report['status']['under_review'] = 'Under review';
en.report['status']['resolved_valid'] = 'Confirmed';
en.report['status']['resolved_invalid'] = 'Dismissed';
const enOverrides = {
  'common.welcome': 'Welcome',
  'common.loading': 'Loading',
  'common.save': 'Save',
  'common.cancel': 'Cancel',
  'common.delete': 'Delete',
  'common.edit': 'Edit',
  'common.search': 'Search',
  'common.all': 'All',
  'common.back': 'Back',
  'common.confirm': 'Confirm',
  'common.settings': 'Settings',
  'nav.listings': 'Listings',
  'nav.sellers': 'Sellers',
  'nav.nearby': 'Nearby',
  'listings.sold': 'Sold',
  'listings.active': 'Active',
  'listings.pending': 'Under review',
  'listings.rejected': 'Rejected',
  'listings.expired': 'Expired',
  'listings.category': 'Category',
  'listings.breed': 'Breed',
  'listings.location': 'Location',
  'listings.title': 'Listings',
  'listings.description': 'Description',
  'listings.price': 'Price',
  'listings.seller': 'Seller',
  'categories.cattle': 'Cattle',
  'categories.sheep': 'Sheep',
  'categories.goats': 'Goats',
  'categories.horses': 'Horses',
  'categories.camels': 'Camels',
  'categories.poultry': 'Poultry',
  'categories.rabbits': 'Rabbits',
  'categories.bees': 'Bees',
  'categories.fish': 'Fish',
  'sellers.reviews': 'Reviews',
  'sellers.totalReviews': 'reviews',
  'sellers.noReviews': 'No reviews yet',
  'sellers.beFirstToReview': 'Be the first to review',
  'sellers.topSellers': 'Top sellers',
  'sellers.newSellers': 'New sellers',
  'sellers.message': 'Message',
  'sellers.followers': 'Followers',
  'sellers.directory': 'Sellers Directory',
  'sellers.trustedSellers': 'Trusted sellers',
  'notifications.title': 'Notifications',
  'notifications.empty': 'No notifications',
  'notifications.markAllRead': 'Mark all as read',
  'notifications.read': 'Read',
  'notifications.unread': 'New',
  'success.updated': 'Updated',
  'success.created': 'Created',
  'success.deleted': 'Deleted',
  'success.saved': 'Saved',
  'errors.generic': 'Something went wrong',
  'errors.required': 'Required field',
  'errors.serverError': 'Server error',
  'report.titleListing': 'Listing report',
  'report.titleSeller': 'Seller report',
  'report.reasonLabel': 'Reason',
  'report.adminResponse': 'Admin response',
  'report.status': 'Status',
  'report.subject': 'Reported entity',
  'report.complainant': 'Filed by',
};
for (const [dotKey, val] of Object.entries(enOverrides)) {
  const parts = dotKey.split('.');
  let obj = en;
  for (let i = 0; i < parts.length - 1; i++) {
    obj[parts[i]] = obj[parts[i]] || {};
    obj = obj[parts[i]];
  }
  if (!obj[parts[parts.length-1]]) obj[parts[parts.length-1]] = val;
}
fs.writeFileSync(enFile, JSON.stringify(en, null, 2) + '\n', 'utf-8');
console.log('updated en.json');

console.log('All done.');
