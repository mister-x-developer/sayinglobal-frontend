const fs = require('fs');
const path = require('path');

const files = {
  'uz.json': {
    "ai.newChat": "Yangi chat ochish",
    "ai.chatHistory": "Suhbatlar tarixi",
    "ai.noChats": "Hali hech qanday chat yo'q.",
    "ai.adminGreeting": "👋 Assalomu alaykum! Platformani boshqarish bo'yicha savollaringiz bormi?",
    "ai.prompt.adminCheckNew": "Yangi e'lonlarni tekshirish",
    "ai.prompt.adminComplaints": "Shikoyatlarni ko'rib chiqish",
    "ai.prompt.adminStats": "Tizim statistikasi",
    "ai.prompt.adminSpam": "Spam va shubhali e'lonlar",
    "ai.prompt.findCattle": "Qoramol topish",
    "ai.prompt.findHorse": "Ot topish",
    "ai.prompt.priceCheck": "Narx tekshirish",
    "ai.prompt.nearbyListings": "Yaqin e'lonlar",
    "ai.errorReply": "Xatolik yuz berdi.",
    "ai.inputPlaceholder": "Savol yozing...",
    "adminMod.bulkAiCheck": "Barcha yangilarini AI orqali tekshirish",
    "adminMod.loading": "Yuklanmoqda...",
    "admin.rejectionReasonRequired": "Rad etish sababi (Majburiy)",
    "admin.rejectionReason": "Rad etish sababi"
  },
  'uz-cyrl.json': {
    "ai.newChat": "Янги чат очиш",
    "ai.chatHistory": "Суҳбатлар тарихи",
    "ai.noChats": "Ҳали ҳеч қандай чат йўқ.",
    "ai.adminGreeting": "👋 Ассалому алайкум! Платформани бошқариш бўйича саволларингиз борми?",
    "ai.prompt.adminCheckNew": "Янги эълонларни текшириш",
    "ai.prompt.adminComplaints": "Шикоятларни кўриб чиқиш",
    "ai.prompt.adminStats": "Тизим статистикаси",
    "ai.prompt.adminSpam": "Спам ва шубҳали эълонлар",
    "ai.prompt.findCattle": "Қорамол топиш",
    "ai.prompt.findHorse": "От топиш",
    "ai.prompt.priceCheck": "Нарх текшириш",
    "ai.prompt.nearbyListings": "Яқин эълонлар",
    "ai.errorReply": "Хатолик юз берди.",
    "ai.inputPlaceholder": "Савол ёзинг...",
    "adminMod.bulkAiCheck": "Барча янгиларини AI орқали текшириш",
    "adminMod.loading": "Юкланмоқда...",
    "admin.rejectionReasonRequired": "Рад этиш сабаби (Мажбурий)",
    "admin.rejectionReason": "Рад этиш сабаби"
  },
  'ru.json': {
    "ai.newChat": "Новый чат",
    "ai.chatHistory": "История чатов",
    "ai.noChats": "Пока нет чатов.",
    "ai.adminGreeting": "👋 Здравствуйте! Есть ли у вас вопросы по управлению платформой?",
    "ai.prompt.adminCheckNew": "Проверить новые объявления",
    "ai.prompt.adminComplaints": "Рассмотреть жалобы",
    "ai.prompt.adminStats": "Статистика системы",
    "ai.prompt.adminSpam": "Спам и подозрительные",
    "ai.prompt.findCattle": "Найти скот",
    "ai.prompt.findHorse": "Найти лошадь",
    "ai.prompt.priceCheck": "Проверить цены",
    "ai.prompt.nearbyListings": "Объявления рядом",
    "ai.errorReply": "Произошла ошибка.",
    "ai.inputPlaceholder": "Напишите вопрос...",
    "adminMod.bulkAiCheck": "Проверить все новые через AI",
    "adminMod.loading": "Загрузка...",
    "admin.rejectionReasonRequired": "Причина отказа (Обязательно)",
    "admin.rejectionReason": "Причина отказа"
  },
  'en.json': {
    "ai.newChat": "New Chat",
    "ai.chatHistory": "Chat History",
    "ai.noChats": "No chats yet.",
    "ai.adminGreeting": "👋 Hello! Do you have any questions about managing the platform?",
    "ai.prompt.adminCheckNew": "Check new listings",
    "ai.prompt.adminComplaints": "Review complaints",
    "ai.prompt.adminStats": "System statistics",
    "ai.prompt.adminSpam": "Spam and suspicious",
    "ai.prompt.findCattle": "Find cattle",
    "ai.prompt.findHorse": "Find horse",
    "ai.prompt.priceCheck": "Check prices",
    "ai.prompt.nearbyListings": "Nearby listings",
    "ai.errorReply": "An error occurred.",
    "ai.inputPlaceholder": "Type a question...",
    "adminMod.bulkAiCheck": "Check all new with AI",
    "adminMod.loading": "Loading...",
    "admin.rejectionReasonRequired": "Rejection reason (Required)",
    "admin.rejectionReason": "Rejection reason"
  }
};

const updateObj = (obj, keyPath, value) => {
  const parts = keyPath.split('.');
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!current[parts[i]]) current[parts[i]] = {};
    current = current[parts[i]];
  }
  current[parts[parts.length - 1]] = value;
};

for (const [filename, updates] of Object.entries(files)) {
  const filePath = path.join('/home/lochinbek/Desktop/sayinglobal/frontend/messages', filename);
  if (fs.existsSync(filePath)) {
    let content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    for (const [key, val] of Object.entries(updates)) {
      updateObj(content, key, val);
    }
    fs.writeFileSync(filePath, JSON.stringify(content, null, 2));
    console.log(`Updated ${filename}`);
  }
}
