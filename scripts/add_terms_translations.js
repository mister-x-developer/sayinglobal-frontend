/**
 * Add the `terms` namespace to all 4 message files.
 * Idempotent — re-running just overwrites the same keys.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', 'messages');

const TERMS = {
  uz: {
    title: 'Foydalanish shartlari',
    subtitle: 'Davom etishdan oldin shartlarni qabul qiling',
    intro: 'SAYIN GLOBAL platformasidan foydalanish uchun quyidagi shartlarga rozilik bildirishingiz lozim.',
    point1: 'SAYIN GLOBAL — chorva eʼlonlari bozori platformasi. Sotuvchi va xaridor oʻrtasidagi bitim ikki tomonning shaxsiy masʼuliyatidir.',
    point2: 'Platforma sotuvchining halolligi, hayvon sifati yoki bitim natijasi uchun javobgar emas.',
    point3: 'Firibgarlik, soxta eʼlon yoki sifatsiz mahsulot uchun platforma yoki maʼmuriyat huquqiy javobgar emas.',
    point4: 'Foydalanuvchi shaxsan ehtiyot boʻlishi, sotuvchini tekshirishi va xavfsizlik choralarini koʻrishi shart.',
    disclaimer: 'Platforma faqat sotuvchi va xaridor oʻrtasida muloqot vositasi boʻlib xizmat qiladi. Hech qanday bitim platforma orqali rasmiylashtirilmaydi.',
    checkboxLabel: 'Yuqoridagi shartlarni oʻqib chiqdim va toʻliq qabul qilaman.',
    accept: 'Roziman va davom etaman',
  },
  'uz-cyrl': {
    title: 'Фойдаланиш шартлари',
    subtitle: 'Давом этишдан олдин шартларни қабул қилинг',
    intro: 'SAYIN GLOBAL платформасидан фойдаланиш учун қуйидаги шартларга розилик билдиришингиз лозим.',
    point1: 'SAYIN GLOBAL — чорва эълонлари бозори платформаси. Сотувчи ва харидор ўртасидаги битим икки томоннинг шахсий масъулиятидир.',
    point2: 'Платформа сотувчининг ҳалоллиги, ҳайвон сифати ёки битим натижаси учун жавобгар эмас.',
    point3: 'Фирибгарлик, сохта эълон ёки сифатсиз маҳсулот учун платформа ёки маъмурият ҳуқуқий жавобгар эмас.',
    point4: 'Фойдаланувчи шахсан эҳтиёт бўлиши, сотувчини текшириши ва хавфсизлик чораларини кўриши шарт.',
    disclaimer: 'Платформа фақат сотувчи ва харидор ўртасида мулоқот воситаси бўлиб хизмат қилади. Ҳеч қандай битим платформа орқали расмийлаштирилмайди.',
    checkboxLabel: 'Юқоридаги шартларни ўқиб чиқдим ва тўлиқ қабул қиламан.',
    accept: 'Розиман ва давом этаман',
  },
  ru: {
    title: 'Условия использования',
    subtitle: 'Перед продолжением примите условия',
    intro: 'Для использования платформы SAYIN GLOBAL необходимо принять следующие условия.',
    point1: 'SAYIN GLOBAL — площадка объявлений о скоте. Сделка между продавцом и покупателем — личная ответственность сторон.',
    point2: 'Платформа не несёт ответственности за добросовестность продавца, качество животного или результат сделки.',
    point3: 'За мошенничество, ложные объявления или товар низкого качества платформа и администрация юридической ответственности не несут.',
    point4: 'Пользователь обязан проявлять осторожность, проверять продавца и принимать меры безопасности самостоятельно.',
    disclaimer: 'Платформа служит только средством общения между продавцом и покупателем. Сделки через платформу не оформляются.',
    checkboxLabel: 'Я прочитал(а) условия выше и полностью их принимаю.',
    accept: 'Согласен(на), продолжить',
  },
  en: {
    title: 'Platform Terms',
    subtitle: 'Accept the terms to continue',
    intro: 'To use the SAYIN GLOBAL platform you must accept the following terms.',
    point1: 'SAYIN GLOBAL is a livestock-listings marketplace. Any transaction between seller and buyer is the personal responsibility of both parties.',
    point2: 'The platform is not responsible for the seller’s honesty, the quality of the animal, or the outcome of the transaction.',
    point3: 'The platform and its administration bear no legal responsibility for fraud, false listings, or substandard goods.',
    point4: 'Users must exercise their own caution, verify the seller, and take their own safety measures.',
    disclaimer: 'The platform serves only as a communication channel between sellers and buyers. No transactions are processed through the platform.',
    checkboxLabel: 'I have read the terms above and fully accept them.',
    accept: 'Accept and continue',
  },
};

for (const code of Object.keys(TERMS)) {
  const file = path.join(ROOT, `${code}.json`);
  const data = JSON.parse(fs.readFileSync(file, 'utf-8'));
  data.terms = TERMS[code];
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf-8');
  console.log(`wrote ${file}`);
}
