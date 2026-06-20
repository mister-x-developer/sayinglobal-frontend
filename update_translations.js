const fs = require('fs');
const files = {
  'messages/en.json': { uzs: 'UZS', usd: 'USD' },
  'messages/ru.json': { uzs: 'СУМ', usd: 'ДОЛ' },
  'messages/uz.json': { uzs: 'SOʻM', usd: 'USD' },
  'messages/uz-cyrl.json': { uzs: 'СЎМ', usd: 'USD' }
};

for (const [file, values] of Object.entries(files)) {
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  data.common.uzs = values.uzs;
  data.common.usd = values.usd;
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}
