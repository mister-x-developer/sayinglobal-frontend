import fs from 'fs';
import path from 'path';

function replaceTelegram(filePath) {
  const fullPath = path.resolve(filePath);
  let content = fs.readFileSync(fullPath, 'utf8');
  let data = JSON.parse(content);

  function processObj(obj) {
    if (typeof obj === 'string') {
      let str = obj;
      // Exclude strings that look like english or latin things. We only care about russian/cyrillic.
      str = str.replace(/Telegram-бот/g, "Телеграм-бот");
      str = str.replace(/Telegram-бота/g, "Телеграм-бота");
      str = str.replace(/Telegram-боте/g, "Телеграм-боте");
      str = str.replace(/Telegram бот/g, "Телеграм бот");
      str = str.replace(/Telegram/g, "Телеграм");
      // For lowercase:
      str = str.replace(/telegram/g, "телеграм");
      return str;
    } else if (Array.isArray(obj)) {
      return obj.map(item => processObj(item));
    } else if (typeof obj === 'object' && obj !== null) {
      const newObj = {};
      for (const key in obj) {
        newObj[key] = processObj(obj[key]);
      }
      return newObj;
    }
    return obj;
  }

  const newData = processObj(data);
  fs.writeFileSync(fullPath, JSON.stringify(newData, null, 2) + '\n', 'utf8');
}

replaceTelegram('messages/uz-cyrl.json');
replaceTelegram('messages/ru.json');
console.log('Done replacing telegram with Телеграм');
