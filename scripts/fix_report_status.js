const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..', 'messages');

const STATUS = {
  uz: { pending: 'Kutilmoqda', under_review: "Koʻrib chiqilmoqda", resolved_valid: 'Tasdiqlandi', resolved_invalid: 'Rad etildi' },
  'uz-cyrl': { pending: 'Кутилмоқда', under_review: 'Кўриб чиқилмоқда', resolved_valid: 'Тасдиқланди', resolved_invalid: 'Рад этилди' },
  ru: { pending: 'Ожидает', under_review: 'На рассмотрении', resolved_valid: 'Подтверждена', resolved_invalid: 'Отклонена' },
  en: { pending: 'Pending', under_review: 'Under review', resolved_valid: 'Confirmed', resolved_invalid: 'Dismissed' },
};

for (const [locale, statuses] of Object.entries(STATUS)) {
  const file = path.join(ROOT, `${locale}.json`);
  const data = JSON.parse(fs.readFileSync(file, 'utf-8'));
  
  // Ensure report is object
  if (!data.report || typeof data.report !== 'object') data.report = {};
  
  // Replace report.status (was "Holat" string) with object
  data.report.status = {
    ...(typeof data.report.status === 'object' ? data.report.status : {}),
    ...statuses,
  };
  // Keep the string label separately if needed
  data.report.statusLabel = typeof data.report.status === 'string' 
    ? data.report.status 
    : (data.report.statusLabel || 'Holat');
  
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf-8');
  console.log(`fixed ${locale}.json - report.status is now object with: ${Object.keys(statuses).join(', ')}`);
}
