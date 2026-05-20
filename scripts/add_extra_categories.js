const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', 'messages');

const ADD = {
  uz: {
    categories: {
      rabbits: 'Quyon',
      bees: 'Asalari',
      fish: 'Baliq',
    },
  },
  'uz-cyrl': {
    categories: {
      rabbits: 'Қуён',
      bees: 'Асалари',
      fish: 'Балиқ',
    },
  },
  ru: {
    categories: {
      rabbits: 'Кролики',
      bees: 'Пчёлы',
      fish: 'Рыба',
    },
  },
  en: {
    categories: {
      rabbits: 'Rabbits',
      bees: 'Bees',
      fish: 'Fish',
    },
  },
};

function deepMerge(a, b) {
  for (const k of Object.keys(b)) {
    if (b[k] && typeof b[k] === 'object') {
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
