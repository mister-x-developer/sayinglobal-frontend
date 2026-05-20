/**
 * Add `listings.restore`, `listings.markAsSoldConfirm`, `success.approved`,
 * `success.rejected`, `admin.relatedReports`, `admin.noReports`, `admin.actions`,
 * `admin.stats`, `admin.restore`, `admin.rejectionReason`, `admin.confirmReject`,
 * `admin.rejectionReasonPlaceholder`, `admin.rejectionReasonRequired`,
 * `marketplace.shares`, `comments.title`, `sellers.followers`, `sellers.followersLabel`,
 * `animal.years`, `adminMod.status_pending`, `adminMod.status_under_review`,
 * `adminMod.status_resolved_valid`, `adminMod.status_resolved_invalid`,
 * `common.refresh`, `common.translate`, `common.showOriginal`, `common.confirm`
 * to all 4 message files. Idempotent.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', 'messages');

const ADDITIONS = {
  uz: {
    listings: {
      restore: 'Qayta aktivlashtirish',
      markAsSoldConfirm: 'E\u2019lon sotilgan deb belgilanadi va 30 kundan so\u2018ng o\u2018chiriladi.',
    },
    success: {
      approved: 'Tasdiqlandi',
      rejected: 'Rad etildi',
    },
    admin: {
      relatedReports: 'Shikoyatlar',
      noReports: 'Shikoyatlar yo\u2018q',
      actions: 'Amallar',
      stats: 'Statistika',
      restore: 'Qayta aktivlashtirish',
      rejectionReason: 'Rad etish sababi',
      confirmReject: 'Rad etishni tasdiqlash',
      rejectionReasonPlaceholder: 'Sababni batafsil yozing',
      rejectionReasonRequired: 'Sabab yozish majburiy',
    },
    marketplace: {
      shares: 'Ulashishlar',
    },
    comments: {
      title: 'Izohlar',
    },
    sellers: {
      followers: 'Obunachilar',
    },
    animal: {
      years: 'yil',
    },
    adminMod: {
      status_pending: 'Kutilmoqda',
      status_under_review: 'Ko\u2018rib chiqilmoqda',
      status_resolved_valid: 'Tasdiqlandi',
      status_resolved_invalid: 'Inkor etildi',
    },
    common: {
      refresh: 'Yangilash',
      translate: 'Tarjima',
      showOriginal: 'Asl matn',
      confirm: 'Tasdiqlash',
    },
  },
  'uz-cyrl': {
    listings: {
      restore: 'Қайта активлаштириш',
      markAsSoldConfirm: 'Эълон сотилган деб белгиланади ва 30 кундан сўнг ўчирилади.',
    },
    success: {
      approved: 'Тасдиқланди',
      rejected: 'Рад этилди',
    },
    admin: {
      relatedReports: 'Шикоятлар',
      noReports: 'Шикоятлар йўқ',
      actions: 'Амаллар',
      stats: 'Статистика',
      restore: 'Қайта активлаштириш',
      rejectionReason: 'Рад этиш сабаби',
      confirmReject: 'Рад этишни тасдиқлаш',
      rejectionReasonPlaceholder: 'Сабабни батафсил ёзинг',
      rejectionReasonRequired: 'Сабаб ёзиш мажбурий',
    },
    marketplace: {
      shares: 'Улашишлар',
    },
    comments: {
      title: 'Изоҳлар',
    },
    sellers: {
      followers: 'Обуначилар',
    },
    animal: {
      years: 'йил',
    },
    adminMod: {
      status_pending: 'Кутилмоқда',
      status_under_review: 'Кўриб чиқилмоқда',
      status_resolved_valid: 'Тасдиқланди',
      status_resolved_invalid: 'Инкор этилди',
    },
    common: {
      refresh: 'Янгилаш',
      translate: 'Таржима',
      showOriginal: 'Асл матн',
      confirm: 'Тасдиқлаш',
    },
  },
  ru: {
    listings: {
      restore: 'Восстановить',
      markAsSoldConfirm: 'Объявление будет помечено как проданное и удалено через 30 дней.',
    },
    success: {
      approved: 'Одобрено',
      rejected: 'Отклонено',
    },
    admin: {
      relatedReports: 'Жалобы',
      noReports: 'Жалоб нет',
      actions: 'Действия',
      stats: 'Статистика',
      restore: 'Восстановить',
      rejectionReason: 'Причина отклонения',
      confirmReject: 'Подтвердить отклонение',
      rejectionReasonPlaceholder: 'Опишите причину подробно',
      rejectionReasonRequired: 'Причина обязательна',
    },
    marketplace: {
      shares: 'Поделились',
    },
    comments: {
      title: 'Комментарии',
    },
    sellers: {
      followers: 'Подписчики',
    },
    animal: {
      years: 'лет',
    },
    adminMod: {
      status_pending: 'Ожидает',
      status_under_review: 'На рассмотрении',
      status_resolved_valid: 'Подтверждена',
      status_resolved_invalid: 'Отклонена',
    },
    common: {
      refresh: 'Обновить',
      translate: 'Перевести',
      showOriginal: 'Оригинал',
      confirm: 'Подтвердить',
    },
  },
  en: {
    listings: {
      restore: 'Reactivate',
      markAsSoldConfirm: 'The listing will be marked sold and deleted after 30 days.',
    },
    success: {
      approved: 'Approved',
      rejected: 'Rejected',
    },
    admin: {
      relatedReports: 'Reports',
      noReports: 'No reports',
      actions: 'Actions',
      stats: 'Stats',
      restore: 'Restore',
      rejectionReason: 'Rejection reason',
      confirmReject: 'Confirm rejection',
      rejectionReasonPlaceholder: 'Describe the reason in detail',
      rejectionReasonRequired: 'Reason is required',
    },
    marketplace: {
      shares: 'Shares',
    },
    comments: {
      title: 'Comments',
    },
    sellers: {
      followers: 'Followers',
    },
    animal: {
      years: 'years',
    },
    adminMod: {
      status_pending: 'Pending',
      status_under_review: 'Under review',
      status_resolved_valid: 'Confirmed',
      status_resolved_invalid: 'Dismissed',
    },
    common: {
      refresh: 'Refresh',
      translate: 'Translate',
      showOriginal: 'Original',
      confirm: 'Confirm',
    },
  },
};

function deepMerge(a, b) {
  for (const key of Object.keys(b)) {
    if (b[key] && typeof b[key] === 'object' && !Array.isArray(b[key])) {
      a[key] = a[key] && typeof a[key] === 'object' ? a[key] : {};
      deepMerge(a[key], b[key]);
    } else {
      a[key] = b[key];
    }
  }
  return a;
}

for (const code of Object.keys(ADDITIONS)) {
  const file = path.join(ROOT, `${code}.json`);
  const data = JSON.parse(fs.readFileSync(file, 'utf-8'));
  deepMerge(data, ADDITIONS[code]);
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf-8');
  console.log(`updated ${file}`);
}
