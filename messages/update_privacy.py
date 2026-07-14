import json
import os

locales = {
    'uz.json': {
        "title": "SAYIN GLOBAL - Maxfiylik siyosati",
        "dataCollectionTitle": "1. Ma'lumotlarni toʻplash va foydalanish",
        "dataCollectionBody": "SAYIN GLOBAL platformasi xizmatlardan foydalanish jarayonida foydalanuvchilarning ismini, telefon raqamini, ruxsat etilganda GPS joylashuvini hamda qurilma turini (IP, browser) toʻplaydi. Bu ma'lumotlar faqatgina e'lonlarni koʻrsatish va xavfsiz muhitni ta'minlash uchun ishlatiladi.",
        "dataUsageTitle": "2. Uchinchi tomonlar va ma'lumotlarni almashish",
        "dataUsageBody": "Foydalanuvchining shaxsiy ma'lumotlari (masalan, telefon raqam) uchinchi shaxslarga tijorat maqsadida sotilmaydi. Telefon raqamingiz faqatgina tizimga kirish (Telegram orqali) va profil orqali aloqa qilishga ruxsat bersangizgina e'londa koʻrsatiladi.",
        "locationTitle": "3. Joylashuv ma'lumotlari (GPS)",
        "locationBody": "Joylashuv ma'lumotlari faqatgina \"Yaqin atrof\" xizmati uchun va xaritada e'lon joylashuvini belgilash uchun ishlatiladi. Sizning aniq lokatsiyangiz boshqa foydalanuvchilarga xarita belgisi (pin) shaklida koʻrsatiladi.",
        "securityTitle": "4. Axborot xavfsizligi",
        "securityBody": "Platforma zamonaviy shifrlash standartlari (JWT, HTTPS/SSL) yordamida foydalanuvchi ma'lumotlarini himoya qiladi. Sessiyalar qurilma darajasida nazorat qilinadi va xohlagan paytingizda boshqa qurilmalardan chiqish (logout) imkoniyati mavjud.",
        "rightsTitle": "5. Foydalanuvchi huquqlari va Hisobni oʻchirish",
        "rightsBody": "Foydalanuvchi istalgan vaqtda oʻz hisobini toʻliq oʻchirib tashlash huquqiga ega. Hisob oʻchirilganda, unga tegishli barcha e'lonlar, chatlar va rasm fayllari tizimdan tiklanmas tarzda tozalanadi.",
        "cookiesTitle": "6. Cookie fayllari (Cookies)",
        "cookiesBody": "Tizim qulayligini oshirish maqsadida cookie va local storage fayllaridan foydalanamiz (masalan: til sozlamalari, tungi/kunduzgi rejim va avtorizatsiya tokenlarini saqlash).",
        "changesTitle": "7. Siyosatga kiritiladigan oʻzgartirishlar",
        "changesBody": "SAYIN GLOBAL ma'muriyati mazkur Maxfiylik Siyosatiga oʻzgartirishlar kiritish huquqini oʻzida saqlab qoladi. Katta oʻzgarishlar boʻlganda, platforma orqali sizga xabar beriladi.",
        "contactTitle": "8. Biz bilan bogʻlanish",
        "contactBody": "Maxfiylik siyosati boʻyicha savollaringiz, takliflaringiz boʻlsa, rasmiy Telegram manzilimiz (@sayinglobal_support) yoki elektron pochta (support@sayinglobal.uz) orqali biz bilan bogʻlanishingiz mumkin."
    },
    'uz-cyrl.json': {
        "title": "SAYIN GLOBAL - Махфийлик сиёсати",
        "dataCollectionTitle": "1. Маълумотларни тўплаш ва фойдаланиш",
        "dataCollectionBody": "SAYIN GLOBAL платформаси хизматлардан фойдаланиш жараёнида фойдаланувчиларнинг исмини, телефон рақамини, рухсат этилганда GPS жойлашувини ҳамда қурилма турини (IP, browser) тўплайди. Бу маълумотлар фақатгина эълонларни кўрсатиш ва хавфсиз муҳитни таъминлаш учун ишлатилади.",
        "dataUsageTitle": "2. Учинчи томонлар ва маълумотларни алмашиш",
        "dataUsageBody": "Фойдаланувчининг шахсий маълумотлари (масалан, телефон рақам) учинчи шахсларга тижорат мақсадида сотилмайди. Телефон рақамингиз фақатгина тизимга кириш (Telegram орқали) ва профил орқали алоқа қилишга рухсат берсангизгина эълонда кўрсатилади.",
        "locationTitle": "3. Жойлашув маълумотлари (GPS)",
        "locationBody": "Жойлашув маълумотлари фақатгина \"Яқин атроф\" хизмати учун ва харитада эълон жойлашувини белгилаш учун ишлатилади. Сизнинг аниқ локациянгиз бошқа фойдаланувчиларга харита белгиси (pin) шаклида кўрсатилади.",
        "securityTitle": "4. Ахборот хавфсизлиги",
        "securityBody": "Платформа замонавий шифрлаш стандартлари (JWT, HTTPS/SSL) ёрдамида фойдаланувчи маълумотларини ҳимоя қилади. Сессиялар қурилма даражасида назорат қилинади ва хоҳлаган пайтингизда бошқа қурилмалардан чиқиш (logout) имконияти мавжуд.",
        "rightsTitle": "5. Фойдаланувчи ҳуқуқлари ва Ҳисобни ўчириш",
        "rightsBody": "Фойдаланувчи исталган вақтда ўз ҳисобини тўлиқ ўчириб ташлаш ҳуқуқига эга. Ҳисоб ўчирилганда, унга тегишли барча эълонлар, чатлар ва расм файллар тизимдан тикланмас тарзда тозаланади.",
        "cookiesTitle": "6. Cookie файллари (Cookies)",
        "cookiesBody": "Тизим қулайлигини ошириш мақсадида cookie ва local storage файлларидан фойдаланамиз (масалан: тил созламалари, тунги/кундузги режим ва авторизация токенларини сақлаш).",
        "changesTitle": "7. Сиёсатга киритиладиган ўзгартиришлар",
        "changesBody": "SAYIN GLOBAL маъмурияти мазкур Махфийлик Сиёсатига ўзгартиришлар киритиш ҳуқуқини ўзида сақлаб қолади. Катта ўзгаришлар бўлганда, платформа орқали сизга хабар берилади.",
        "contactTitle": "8. Биз билан боғланиш",
        "contactBody": "Махфийлик сиёсати бўйича саволларингиз, таклифларингиз бўлса, расмий Telegram манзилимиз (@sayinglobal_support) ёки электрон почта (support@sayinglobal.uz) орқали биз билан боғланишингиз мумкин."
    },
    'ru.json': {
        "title": "SAYIN GLOBAL - Политика конфиденциальности",
        "dataCollectionTitle": "1. Сбор и использование данных",
        "dataCollectionBody": "Платформа SAYIN GLOBAL в процессе использования услуг собирает имя пользователя, номер телефона, GPS-местоположение (при наличии разрешения) и информацию об устройстве (IP, браузер). Эти данные используются исключительно для отображения объявлений и обеспечения безопасной среды.",
        "dataUsageTitle": "2. Третьи стороны и обмен данными",
        "dataUsageBody": "Личные данные пользователя (например, номер телефона) не продаются третьим лицам в коммерческих целях. Ваш номер телефона будет отображаться в объявлении только в том случае, если вы разрешите связь через свой профиль.",
        "locationTitle": "3. Данные о местоположении (GPS)",
        "locationBody": "Данные о местоположении используются только для функции «Поблизости» и для указания местоположения объявления на карте. Ваше точное местоположение будет показано другим пользователям в виде метки (pin) на карте.",
        "securityTitle": "4. Информационная безопасность",
        "securityBody": "Платформа защищает данные пользователей с использованием современных стандартов шифрования (JWT, HTTPS/SSL). Сеансы контролируются на уровне устройства, и вы можете в любое время завершить сеанс на других устройствах (logout).",
        "rightsTitle": "5. Права пользователя и удаление аккаунта",
        "rightsBody": "Пользователь имеет право в любой момент полностью удалить свою учетную запись. При удалении аккаунта все связанные с ним объявления, чаты и изображения безвозвратно удаляются из системы.",
        "cookiesTitle": "6. Файлы Cookie",
        "cookiesBody": "Мы используем файлы cookie и локальное хранилище (local storage) для повышения удобства системы (например, для сохранения языковых настроек, ночного/дневного режима и токенов авторизации).",
        "changesTitle": "7. Изменения в Политике",
        "changesBody": "Администрация SAYIN GLOBAL оставляет за собой право вносить изменения в настоящую Политику конфиденциальности. В случае существенных изменений вы будете уведомлены через платформу.",
        "contactTitle": "8. Свяжитесь с нами",
        "contactBody": "Если у вас есть вопросы или предложения относительно Политики конфиденциальности, вы можете связаться с нами через наш официальный Telegram (@sayinglobal_support) или по электронной почте (support@sayinglobal.uz)."
    },
    'en.json': {
        "title": "SAYIN GLOBAL - Privacy Policy",
        "dataCollectionTitle": "1. Data Collection and Usage",
        "dataCollectionBody": "The SAYIN GLOBAL platform collects the user's name, phone number, GPS location (if permitted), and device information (IP, browser) while using our services. This data is exclusively used to display listings and ensure a secure environment.",
        "dataUsageTitle": "2. Third Parties and Data Sharing",
        "dataUsageBody": "User's personal data (e.g. phone number) is not sold to third parties for commercial purposes. Your phone number will only be displayed on the listing if you permit communication through your profile.",
        "locationTitle": "3. Location Data (GPS)",
        "locationBody": "Location data is only used for the 'Nearby' feature and to pin the listingʻs location on the map. Your exact location will be shown to other users as a map pin.",
        "securityTitle": "4. Information Security",
        "securityBody": "The platform protects user data using modern encryption standards (JWT, HTTPS/SSL). Sessions are controlled at the device level, and you can log out from other devices at any time.",
        "rightsTitle": "5. User Rights and Account Deletion",
        "rightsBody": "The user has the right to completely delete their account at any time. When an account is deleted, all associated listings, chats, and image files are irretrievably removed from the system.",
        "cookiesTitle": "6. Cookies",
        "cookiesBody": "We use cookies and local storage to improve system convenience (e.g. saving language preferences, dark/light mode, and authorization tokens).",
        "changesTitle": "7. Policy Changes",
        "changesBody": "The administration of SAYIN GLOBAL reserves the right to make changes to this Privacy Policy. In the event of major changes, you will be notified via the platform.",
        "contactTitle": "8. Contact Us",
        "contactBody": "If you have any questions or suggestions regarding the Privacy Policy, you can contact us via our official Telegram (@sayinglobal_support) or email (support@sayinglobal.uz)."
    }
}

dir_path = "/home/lochinbek/Desktop/sayinglobal/frontend/messages/"

for filename, privacy_data in locales.items():
    filepath = os.path.join(dir_path, filename)
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    if "privacy" not in data:
        data["privacy"] = {}
        
    data["privacy"].update(privacy_data)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

print("Updated all privacy policies.")
