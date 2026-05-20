const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', 'messages');

const ADD = {
  uz: {
    admin: {
      ratingsModeration: 'Sharhlarni moderatsiya',
      broadcastTitle: 'Sarlavha',
      broadcastMessage: 'Matn',
      broadcastSent: 'Xabar yuborildi',
      createBroadcast: 'Yangi xabar',
      autoTranslateHint: 'Kontent avtomatik 4 tilga tarjima qilinadi.',
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
      title: 'Sarlavha',
      status: 'Holat',
      flagged: 'shikoyat',
      reportsReceived: 'Ushbu foydalanuvchiga shikoyatlar',
      reportsFiled: 'Foydalanuvchi yuborgan shikoyatlar',
      broadcast: 'Xabar',
      warn: 'Ogohlantirish',
      restrict: 'Cheklash',
      block: 'Bloklash',
      unblock: 'Blokdan chiqarish',
      stats: 'Statistika',
      accountSummary: 'Hisob qisqacha',
      actions: 'Amallar',
      approve: 'Tasdiqlash',
      reject: 'Rad etish',
      restore: 'Tiklash',
      relatedReports: 'Shikoyatlar',
      noReports: 'Shikoyat yo\'q',
      rejectionReason: 'Rad etish sababi',
      confirmReject: 'Rad etishni tasdiqlash',
      rejectionReasonPlaceholder: 'Sababni batafsil yozing',
      rejectionReasonRequired: 'Sabab yozish majburiy',
    },
    common: {
      details: 'Batafsil',
      accountSummary: 'Hisob qisqacha',
    },
    notifications: {
      read: 'O\'qildi',
      unread: 'Yangi',
    },
    profile: {
      accountSummary: 'Hisob qisqacha',
      myReports: 'Shikoyatlarim',
      myReportsDesc: 'Siz yuborgan shikoyatlar ro\'yxati',
      noReports: 'Hozircha shikoyat yo\'q',
      noReportsDesc: 'Shikoyat yuborish uchun e\'lon yoki sotuvchi sahifasini oching',
      following: 'Obunalar',
    },
    report: {
      title: 'Shikoyat',
      titleListing: 'E\'lon ustidan shikoyat',
      titleSeller: 'Sotuvchi ustidan shikoyat',
      subject: 'Shikoyat qilingan',
      reasonLabel: 'Sabab',
      adminResponse: 'Admin javobi',
      status: 'Holat',
      created: 'Yuborildi',
      resolved: 'Hal qilindi',
    },
    reviews: {
      moderation: 'Sharhlarni moderatsiya',
    },
    success: {
      created: 'Yaratildi',
      approved: 'Tasdiqlandi',
      rejected: 'Rad etildi',
      deleted: 'O\'chirildi',
    },
    errors: {
      serverError: 'Server xatosi. Keyinroq urinib ko\'ring.',
      permissionDenied: 'Ruxsat yo\'q',
    },
    empty: {
      noActivityDescription: 'Hozircha faollik yo\'q',
    },
  },
  'uz-cyrl': {
    admin: {
      ratingsModeration: 'Шарҳларни модерация',
      broadcastTitle: 'Сарлавҳа',
      broadcastMessage: 'Матн',
      broadcastSent: 'Хабар юборилди',
      createBroadcast: 'Янги хабар',
      autoTranslateHint: 'Контент автоматик 4 тилга таржима қилинади.',
      originalLocale: 'Асл тил',
      translations: 'Таржималар',
      delivery: 'Тарқатиш',
      recipients: 'Қабул қилувчилар',
      read: 'Ўқилди',
      created: 'Яратилди',
      sentAt: 'Юборилди',
      notSentYet: 'Юборилмаган',
      send: 'Юбориш',
      message: 'Хабар',
      title: 'Сарлавҳа',
      status: 'Ҳолат',
      flagged: 'шикоят',
      warn: 'Огоҳлантириш',
      restrict: 'Чеклаш',
      block: 'Блоклаш',
      unblock: 'Блокдан чиқариш',
    },
    common: {
      details: 'Батафсил',
    },
    notifications: {
      read: 'Ўқилди',
      unread: 'Янги',
    },
    profile: {
      myReports: 'Шикоятларим',
      following: 'Обуналар',
    },
    success: {
      created: 'Яратилди',
      approved: 'Тасдиқланди',
      rejected: 'Рад этилди',
      deleted: 'Ўчирилди',
    },
    errors: {
      serverError: 'Сервер хатоси.',
      permissionDenied: 'Рухсат йўқ',
    },
    reviews: {
      moderation: 'Шарҳларни модерация',
    },
  },
  ru: {
    admin: {
      ratingsModeration: 'Модерация отзывов',
      broadcastTitle: 'Заголовок',
      broadcastMessage: 'Текст',
      broadcastSent: 'Рассылка отправлена',
      createBroadcast: 'Новая рассылка',
      autoTranslateHint: 'Контент автоматически переводится на 4 языка.',
      originalLocale: 'Язык оригинала',
      translations: 'Переводы',
      delivery: 'Доставка',
      recipients: 'Получатели',
      read: 'Прочитано',
      created: 'Создано',
      sentAt: 'Отправлено',
      notSentYet: 'Не отправлено',
      send: 'Отправить',
      message: 'Сообщение',
      title: 'Заголовок',
      status: 'Статус',
      flagged: 'жалоб',
      reportsReceived: 'Жалобы на пользователя',
      reportsFiled: 'Жалобы от пользователя',
      broadcast: 'Рассылка',
      warn: 'Предупредить',
      restrict: 'Ограничить',
      block: 'Заблокировать',
      unblock: 'Разблокировать',
      stats: 'Статистика',
    },
    common: {
      details: 'Подробнее',
    },
    notifications: {
      read: 'Прочитано',
      unread: 'Новое',
    },
    profile: {
      myReports: 'Мои жалобы',
      following: 'Подписки',
    },
    success: {
      created: 'Создано',
      approved: 'Одобрено',
      rejected: 'Отклонено',
      deleted: 'Удалено',
    },
    errors: {
      serverError: 'Ошибка сервера.',
      permissionDenied: 'Нет доступа',
    },
    reviews: {
      moderation: 'Модерация отзывов',
    },
  },
  en: {
    admin: {
      ratingsModeration: 'Reviews Moderation',
      broadcastTitle: 'Title',
      broadcastMessage: 'Message body',
      broadcastSent: 'Broadcast sent',
      createBroadcast: 'New broadcast',
      autoTranslateHint: 'Content is auto-translated to all 4 languages.',
      originalLocale: 'Original language',
      translations: 'Translations',
      delivery: 'Delivery',
      recipients: 'Recipients',
      read: 'Read',
      created: 'Created',
      sentAt: 'Sent',
      notSentYet: 'Not sent yet',
      send: 'Send',
      message: 'Message',
      title: 'Title',
      status: 'Status',
      flagged: 'flagged',
      reportsReceived: 'Reports against this user',
      reportsFiled: 'Reports filed by user',
      broadcast: 'Broadcast',
      warn: 'Warn',
      restrict: 'Restrict',
      block: 'Block',
      unblock: 'Unblock',
      stats: 'Stats',
    },
    common: {
      details: 'Details',
    },
    notifications: {
      read: 'Read',
      unread: 'New',
    },
    profile: {
      myReports: 'My reports',
      following: 'Following',
    },
    success: {
      created: 'Created',
      approved: 'Approved',
      rejected: 'Rejected',
      deleted: 'Deleted',
    },
    errors: {
      serverError: 'Server error. Please try again.',
      permissionDenied: 'Permission denied',
    },
    reviews: {
      moderation: 'Reviews Moderation',
    },
  },
};

function deepMerge(a, b) {
  for (const k of Object.keys(b)) {
    if (b[k] && typeof b[k] === 'object' && !Array.isArray(b[k])) {
      a[k] = a[k] && typeof a[k] === 'object' ? a[k] : {};
      deepMerge(a[k], b[k]);
    } else {
      a[k] = b[k];
    }
  }
  return a;
}

for (const code of Object.keys(ADD)) {
  const file = path.join(ROOT, `${code}.json`);
  const data = JSON.parse(fs.readFileSync(file, 'utf-8'));
  deepMerge(data, ADD[code]);
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf-8');
  console.log(`updated ${file}`);
}
