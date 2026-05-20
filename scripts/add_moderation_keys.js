const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..', 'messages');

const ADD = {
  uz: {
    adminMod: {
      startReview: 'Ko\'rib chiqishni boshlash',
      resolveValid: 'Tasdiqlash (Shikoyat to\'g\'ri)',
      resolveInvalid: 'Rad etish (Shikoyat to\'g\'ri emas)',
      severity: 'Darajasi',
      description: 'Tavsif',
      moderatorNotes: 'Moderator izohi',
      assignedTo: 'Tayinlangan',
      reportedListing: 'Shikoyat qilingan e\'lon',
    },
    report: {
      complainant: 'Shikoyat yuboruvchi',
    },
    admin: {
      notesRequiredToResolve: 'Hal qilish uchun izoh qo\'shing.',
      viewDetails: 'Batafsil',
    },
  },
  'uz-cyrl': {
    adminMod: {
      startReview: 'Кўриб чиқишни бошлаш',
      resolveValid: 'Тасдиқлаш (Шикоят тўғри)',
      resolveInvalid: 'Рад этиш (Шикоят тўғри эмас)',
      severity: 'Даражаси',
      description: 'Тавсиф',
      moderatorNotes: 'Модератор изоҳи',
      assignedTo: 'Тайинланган',
    },
    report: { complainant: 'Шикоят юборувчи' },
    admin: { notesRequiredToResolve: 'Ҳал қилиш учун изоҳ қўшинг.', viewDetails: 'Батафсил' },
  },
  ru: {
    adminMod: {
      startReview: 'Начать проверку',
      resolveValid: 'Подтвердить (жалоба обоснована)',
      resolveInvalid: 'Отклонить (жалоба необоснована)',
      severity: 'Серьёзность',
      description: 'Описание',
      moderatorNotes: 'Заметка модератора',
      assignedTo: 'Назначено',
    },
    report: { complainant: 'Заявитель' },
    admin: { notesRequiredToResolve: 'Добавьте заметку перед решением.', viewDetails: 'Подробнее' },
  },
  en: {
    adminMod: {
      startReview: 'Start Review',
      resolveValid: 'Resolve: Valid',
      resolveInvalid: 'Resolve: Invalid',
      severity: 'Severity',
      description: 'Description',
      moderatorNotes: 'Moderator notes',
      assignedTo: 'Assigned to',
    },
    report: { complainant: 'Filed by' },
    admin: { notesRequiredToResolve: 'Add a note before resolving.', viewDetails: 'Details' },
  },
};

function deepMerge(a, b) {
  for (const k of Object.keys(b)) {
    if (b[k] && typeof b[k] === 'object') { a[k] = a[k] && typeof a[k] === 'object' ? a[k] : {}; deepMerge(a[k], b[k]); }
    else a[k] = b[k];
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
