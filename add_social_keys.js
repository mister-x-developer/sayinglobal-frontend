import fs from 'fs';
import path from 'path';

const langs = [
  { file: 'messages/en.json', t: 'Telegram', i: 'Instagram', y: 'YouTube' },
  { file: 'messages/uz.json', t: 'Telegram', i: 'Instagram', y: 'YouTube' },
  { file: 'messages/ru.json', t: 'Телеграм', i: 'Инстаграм', y: 'Ютуб' },
  { file: 'messages/uz-cyrl.json', t: 'Телеграм', i: 'Инстаграм', y: 'Ютуб' }
];

for (const lang of langs) {
  const fullPath = path.resolve(lang.file);
  if (fs.existsSync(fullPath)) {
    let data = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    if (!data.common) data.common = {};
    data.common.telegram = lang.t;
    data.common.instagram = lang.i;
    data.common.youtube = lang.y;
    fs.writeFileSync(fullPath, JSON.stringify(data, null, 2) + '\n', 'utf8');
  }
}
console.log('Added social keys to dictionaries');
