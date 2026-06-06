import json
import os

locales = {
    'uz.json': {
        "point1": "SAYIN GLOBAL platformasidan foydalanish faqat qonuniy maqsadlar uchun ruxsat etiladi. Foydalanuvchilar oʻzlariga tegishli boʻlmagan yoki noqonuniy hayvonlarni sotish huquqiga ega emas.",
        "point2": "Platformaga kiritilayotgan barcha ma'lumotlar (rasmlar, narxlar, hayvonning sogʻligʻi haqidagi ma'lumotlar) aniq va toʻgʻri boʻlishi shart. Yolgʻon ma'lumot berish taqiqlanadi.",
        "point3": "SAYIN GLOBAL faqatgina sotuvchi va xaridor oʻrtasidagi aloqani ta'minlovchi platforma hisoblanadi. Biz tranzaksiyalar va toʻlovlar xavfsizligi uchun bevosita javobgar emasmiz.",
        "point4": "Barcha e'lonlar moderatsiyadan oʻtadi. Qoidalarga va axloq me'yorlariga zid boʻlgan, shuningdek shubhali e'lonlar ogohlantirishsiz oʻchirib tashlanadi.",
        "point5": "Foydalanuvchilar oʻzaro muloqotda (chat va izohlarda) hurmat saqlashlari shart. Soʻkinish, haqorat yoki kamsitish holatlarida hisobingiz bloklanadi.",
        "point6": "Sizning shaxsiy ma'lumotlaringiz (telefon raqamingiz va joylashuvingiz) faqatgina e'lonlarni koʻrsatish va xavfsiz savdo qilish uchun tizim qoidalariga muvofiq ishlatiladi.",
        "point7": "Platformadagi dizayn, logotip va kod SAYIN GLOBAL intellektual mulki hisoblanadi. Ulardan ruxsatsiz tijorat maqsadida foydalanish qat'iyan man etiladi.",
        "point8": "Spam, firibgarlik harakatlari, shuningdek, platforma faoliyatiga sun'iy aralashish (botlar, sun'iy trafik) aniqlanganda profil doimiy ravishda bloklanadi."
    },
    'uz-cyrl.json': {
        "point1": "SAYIN GLOBAL платформасидан фойдаланиш фақат қонуний мақсадлар учун рухсат этилади. Фойдаланувчилар ўзларига тегишли бўлмаган ёки ноқонуний ҳайвонларни сотиш ҳуқуқига эга эмас.",
        "point2": "Платформага киритилаётган барча маълумотлар (расмлар, нархлар, ҳайвоннинг соғлиғи ҳақидаги маълумотлар) аниқ ва тўғри бўлиши шарт. Ёлғон маълумот бериш тақиқланади.",
        "point3": "SAYIN GLOBAL фақатгина сотувчи ва харидор ўртасидаги алоқани таъминловчи платформа ҳисобланади. Биз транзакциялар ва тўловлар хавфсизлиги учун бевосита жавобгар эмасмиз.",
        "point4": "Барча эълонлар модерациядан ўтади. Қоидаларга ва ахлоқ меъёрларига зид бўлган, шунингдек шубҳали эълонлар огоҳлантиришсиз ўчириб ташланади.",
        "point5": "Фойдаланувчилар ўзаро мулоқотда (чат ва изоҳларда) ҳурмат сақлашлари шарт. Сўкиниш, ҳақорат ёки камситиш ҳолатларида ҳисобингиз блокланади.",
        "point6": "Сизнинг шахсий маълумотларингиз (телефон рақамингиз ва жойлашувингиз) фақатгина эълонларни кўрсатиш ва хавфсиз савдо қилиш учун тизим қоидаларига мувофиқ ишлатилади.",
        "point7": "Платформадаги дизайн, логотип ва код SAYIN GLOBAL интеллектуал мулки ҳисобланади. Улардан рухсатсиз тижорат мақсадида фойдаланиш қатъиян ман этилади.",
        "point8": "Спам, фирибгарлик ҳаракатлари, шунингдек, платформа фаолиятига сунъий аралашиш (ботлар, сунъий трафик) аниқланганда профил доимий равишда блокланади."
    },
    'ru.json': {
        "point1": "Использование платформы SAYIN GLOBAL разрешено только в законных целях. Пользователи не имеют права продавать животных, которые им не принадлежат или продажа которых незаконна.",
        "point2": "Вся информация, добавляемая на платформу (фотографии, цены, данные о здоровье животного), должна быть точной и достоверной. Предоставление ложной информации запрещено.",
        "point3": "SAYIN GLOBAL — это платформа, которая лишь обеспечивает связь между продавцом и покупателем. Мы не несем прямой ответственности за безопасность транзакций и платежей.",
        "point4": "Все объявления проходят модерацию. Объявления, нарушающие правила и моральные нормы, а также подозрительные публикации будут удалены без предупреждения.",
        "point5": "Пользователи обязаны проявлять уважение друг к другу в общении (в чатах и комментариях). При использовании ненормативной лексики, оскорблений или дискриминации аккаунт будет заблокирован.",
        "point6": "Ваши персональные данные (номер телефона и местоположение) используются в соответствии с правилами системы исключительно для показа объявлений и обеспечения безопасной торговли.",
        "point7": "Дизайн, логотип и код платформы являются интеллектуальной собственностью SAYIN GLOBAL. Их несанкционированное использование в коммерческих целях строго запрещено.",
        "point8": "В случае выявления спама, мошеннических действий, а также искусственного вмешательства в работу платформы (использование ботов, искусственного трафика), профиль блокируется навсегда."
    },
    'en.json': {
        "point1": "The use of the SAYIN GLOBAL platform is permitted only for lawful purposes. Users are not entitled to sell animals that they do not own or whose sale is illegal.",
        "point2": "All information entered into the platform (pictures, prices, animal health information) must be accurate and true. Providing false information is prohibited.",
        "point3": "SAYIN GLOBAL is solely a platform that connects sellers and buyers. We are not directly responsible for the security of transactions and payments.",
        "point4": "All listings are moderated. Listings that violate rules and moral norms, as well as suspicious listings, will be removed without warning.",
        "point5": "Users must maintain respect in their communication (chats and comments). In cases of profanity, insult, or discrimination, your account will be blocked.",
        "point6": "Your personal data (phone number and location) is used strictly in accordance with system rules to display listings and facilitate secure trading.",
        "point7": "The platform's design, logo, and code are the intellectual property of SAYIN GLOBAL. Unauthorized commercial use is strictly prohibited.",
        "point8": "If spam, fraudulent activities, or artificial interference with the platform (bots, artificial traffic) are detected, the profile will be permanently blocked."
    }
}

dir_path = "/home/lochinbek/Desktop/sayinglobal/frontend/messages/"

for filename, terms_data in locales.items():
    filepath = os.path.join(dir_path, filename)
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    if "terms" not in data:
        continue
        
    for k, v in terms_data.items():
        data["terms"][k] = v
        
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

print("Updated all terms of use policies.")
