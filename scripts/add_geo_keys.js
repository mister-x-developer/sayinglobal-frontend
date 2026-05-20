/**
 * Add geo / map / nearby translation keys to all 4 locales.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', 'messages');

const ADD = {
  uz: {
    nav: { nearby: 'Yaqinlik' },
    listings: { locationOnMap: 'Xaritada joylashuv' },
    create: {
      mapPinLabel: 'Xarita ustida belgi (ixtiyoriy)',
      mapPinHelp: 'Xaritada belgini qo\u2018ying: xaridorlar e\u2019lonni xaritada koʻrishi uchun.',
    },
    marketplace: {
      mapUnavailable: 'Xarita yuklanmadi',
      mapTapToSetPin: 'Xaritani bosib belgini qoʻying',
      useMyLocation: 'Mening joyim',
    },
    nearby: {
      eyebrow: 'Yaqin atrof',
      title: 'Yaqin atrofdagi e\u2019lonlar',
      modeGps: '{km} km radiusda',
      modeRegion: 'Viloyat / tuman bo\u2018yicha',
      location: 'Joylashuv',
      requesting: 'Joyni aniqlamoqda...',
      permissionDenied: 'Joylashuv ruxsat berilmadi — viloyat bo\u2018yicha qidirish.',
      tryAgain: 'Qayta urinish',
      radius: 'Radius',
      empty: 'Yaqin atrofda e\u2019lon topilmadi',
      emptyDesc: 'Radiusni yoki kategoriyani o\u2018zgartirib koʻring.',
    },
  },
  'uz-cyrl': {
    nav: { nearby: 'Яқинлик' },
    listings: { locationOnMap: 'Харитада жойлашув' },
    create: {
      mapPinLabel: 'Харита устида белги (ихтиёрий)',
      mapPinHelp: 'Харитада белгини қўйинг: харидорлар эълонни харитада кўриши учун.',
    },
    marketplace: {
      mapUnavailable: 'Харита юкланмади',
      mapTapToSetPin: 'Харитани босиб белгини қўйинг',
      useMyLocation: 'Менинг жойим',
    },
    nearby: {
      eyebrow: 'Яқин атроф',
      title: 'Яқин атрофдаги эълонлар',
      modeGps: '{km} км радиусда',
      modeRegion: 'Вилоят / туман бўйича',
      location: 'Жойлашув',
      requesting: 'Жойни аниқламоқда...',
      permissionDenied: 'Жойлашув рухсат берилмади — вилоят бўйича қидириш.',
      tryAgain: 'Қайта уриниш',
      radius: 'Радиус',
      empty: 'Яқин атрофда эълон топилмади',
      emptyDesc: 'Радиусни ёки категорияни ўзгартириб кўринг.',
    },
  },
  ru: {
    nav: { nearby: 'Рядом' },
    listings: { locationOnMap: 'Местоположение на карте' },
    create: {
      mapPinLabel: 'Метка на карте (необязательно)',
      mapPinHelp: 'Поставьте метку, чтобы покупатели видели объявление на карте.',
    },
    marketplace: {
      mapUnavailable: 'Карта недоступна',
      mapTapToSetPin: 'Нажмите на карту, чтобы поставить метку',
      useMyLocation: 'Моё местоположение',
    },
    nearby: {
      eyebrow: 'Поблизости',
      title: 'Объявления поблизости',
      modeGps: 'Радиус {km} км',
      modeRegion: 'По области / району',
      location: 'Местоположение',
      requesting: 'Определяем местоположение...',
      permissionDenied: 'Доступ к геолокации не получен — поиск по области.',
      tryAgain: 'Повторить',
      radius: 'Радиус',
      empty: 'Поблизости объявлений нет',
      emptyDesc: 'Попробуйте изменить радиус или категорию.',
    },
  },
  en: {
    nav: { nearby: 'Nearby' },
    listings: { locationOnMap: 'Location on map' },
    create: {
      mapPinLabel: 'Map pin (optional)',
      mapPinHelp: 'Drop a pin so buyers can see the listing on the map.',
    },
    marketplace: {
      mapUnavailable: 'Map unavailable',
      mapTapToSetPin: 'Tap the map to drop the pin',
      useMyLocation: 'Use my location',
    },
    nearby: {
      eyebrow: 'Nearby',
      title: 'Nearby listings',
      modeGps: 'Within {km} km',
      modeRegion: 'Filter by region / district',
      location: 'Location',
      requesting: 'Locating...',
      permissionDenied: 'Location not available — using region fallback.',
      tryAgain: 'Try again',
      radius: 'Radius',
      empty: 'No nearby listings',
      emptyDesc: 'Try adjusting the radius or category.',
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
