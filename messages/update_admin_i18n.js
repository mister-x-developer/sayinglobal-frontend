const fs = require('fs');
const path = require('path');

const updates = {
  'en.json': {
    "activeUsers": "Active Users", "newToday": "New Today", "marketplaceVolume": "Marketplace Volume",
    "listingsCreated": "Listings Created", "operationsQueue": "Operations Queue", "systemTelemetry": "System Telemetry",
    "apiGateway": "API Gateway", "primaryDb": "Primary DB", "redisCache": "Redis Cache", "celeryWorkers": "Celery Workers",
    "syncData": "SYNC DATA", "critical": "CRITICAL", "high": "HIGH", "nominal": "NOMINAL", "fault": "FAULT",
    "syncing": "SYNC...", "degraded": "DEGRADED", "optimal": "OPTIMAL"
  },
  'uz.json': {
    "activeUsers": "Faol Foydalanuvchilar", "newToday": "Bugun qoʻshilgan", "marketplaceVolume": "Bozor Hajmi",
    "listingsCreated": "Yaratilgan E'lonlar", "operationsQueue": "Operatsiyalar Navbati", "systemTelemetry": "Tizim Telemetriyasi",
    "apiGateway": "API Shlyuzi", "primaryDb": "Asosiy Ma'lumotlar Bazasi", "redisCache": "Redis Kesh", "celeryWorkers": "Celery Ishchilari",
    "syncData": "MA'LUMOTLARNI SINXRONLASH", "critical": "KRITIK", "high": "YUQORI", "nominal": "NORMAL", "fault": "XATO",
    "syncing": "SINX...", "degraded": "PASAYGAN", "optimal": "OPTIMAL"
  },
  'ru.json': {
    "activeUsers": "Активные пользователи", "newToday": "Новые сегодня", "marketplaceVolume": "Объем рынка",
    "listingsCreated": "Создано объявлений", "operationsQueue": "Очередь операций", "systemTelemetry": "Телеметрия системы",
    "apiGateway": "API Шлюз", "primaryDb": "Основная БД", "redisCache": "Кэш Redis", "celeryWorkers": "Воркеры Celery",
    "syncData": "СИНХРОНИЗАЦИЯ", "critical": "КРИТИЧЕСКИЙ", "high": "ВЫСОКИЙ", "nominal": "В НОРМЕ", "fault": "СБОЙ",
    "syncing": "СИНХ...", "degraded": "УХУДШЕНО", "optimal": "ОПТИМАЛЬНО"
  },
  'uz-cyrl.json': {
    "activeUsers": "Фаол Фойдаланувчилар", "newToday": "Бугун қўшилган", "marketplaceVolume": "Бозор Ҳажми",
    "listingsCreated": "Яратилган Эълонлар", "operationsQueue": "Операциялар Навбати", "systemTelemetry": "Тизим Телеметрияси",
    "apiGateway": "API Шлюзи", "primaryDb": "Асосий Маълумотлар Базаси", "redisCache": "Redis Кеш", "celeryWorkers": "Celery Ишчилари",
    "syncData": "МАЪЛУМОТЛАРНИ СИНХРОНЛАШ", "critical": "КРИТИК", "high": "ЮҚОРИ", "nominal": "НОРМАЛ", "fault": "ХАТО",
    "syncing": "СИНХ...", "degraded": "ПАСАЙГАН", "optimal": "ОПТИМАЛ"
  }
};

for (const [filename, newKeys] of Object.entries(updates)) {
  const filepath = path.join(__dirname, filename);
  if (fs.existsSync(filepath)) {
    const data = JSON.parse(fs.readFileSync(filepath, 'utf8'));
    data.Admin = { ...data.Admin, ...newKeys };
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2) + '\n');
    console.log(`Updated ${filename}`);
  } else {
    console.log(`${filename} not found`);
  }
}
