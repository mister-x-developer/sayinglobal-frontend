const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..', 'messages');

const CATS = {
  uz: {
    cattle: 'Qoramollar',
    sheep: "Qo'ylar",
    goats: 'Echkilar',
    horses: 'Otlar',
    camels: 'Tuyalar',
    poultry: 'Parrandalar',
    rabbits: 'Quyonlar',
    bees: 'Asalarilar',
    fish: 'Baliqlar',
  },
  'uz-cyrl': {
    cattle: 'Қорамоллар',
    sheep: 'Қўйлар',
    goats: 'Эчкилар',
    horses: 'Отлар',
    camels: 'Туялар',
    poultry: 'Паррандалар',
    rabbits: 'Қуёнлар',
    bees: 'Асалариlar',
    fish: 'Балиқлар',
  },
  ru: {
    cattle: 'Крупный рогатый скот',
    sheep: 'Овцы',
    goats: 'Козы',
    horses: 'Лошади',
    camels: 'Верблюды',
    poultry: 'Птица',
    rabbits: 'Кролики',
    bees: 'Пчёлы',
    fish: 'Рыба',
  },
  en: {
    cattle: 'Cattle',
    sheep: 'Sheep',
    goats: 'Goats',
    horses: 'Horses',
    camels: 'Camels',
    poultry: 'Poultry',
    rabbits: 'Rabbits',
    bees: 'Bees',
    fish: 'Fish',
  },
};

for (const [locale, cats] of Object.entries(CATS)) {
  const file = path.join(ROOT, `${locale}.json`);
  const data = JSON.parse(fs.readFileSync(file, 'utf-8'));
  data.categories = data.categories || {};
  Object.assign(data.categories, cats);
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf-8');
  console.log(`${locale}: updated categories`);
}
