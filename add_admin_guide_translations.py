import json
import os

def update_json(lang, new_keys):
    filepath = f"frontend/messages/{lang}.json"
    if not os.path.exists(filepath): return
    with open(filepath, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    # merge new keys
    for k, v in new_keys.items():
        if '.' in k:
            parts = k.split('.')
            d = data
            for p in parts[:-1]:
                d = d.setdefault(p, {})
            d[parts[-1]] = v
        else:
            data[k] = v
            
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

admin_guide_uz = {
    "AdminGuide.title": "Administrator Qo'llanmasi",
    "AdminGuide.subtitle": "Platformani samarali boshqarish, xavfsizlikni ta'minlash va moderatsiya qilish bo'yicha to'liq yo'riqnoma.",
    "AdminGuide.sections.dashboard.title": "Asosiy Ko'rsatkichlar (Dashboard)",
    "AdminGuide.sections.dashboard.content": "Dashboard sahifasida platformaning umumiy holati, yangi foydalanuvchilar, e'lonlar va tranzaksiyalar soni aks etadi. Tizim holatini shu yerdan kuzatib boring.",
    "AdminGuide.sections.moderation.title": "Moderatsiya va Shikoyatlar",
    "AdminGuide.sections.moderation.content": "Foydalanuvchilar tomonidan tushgan shikoyatlarni (spam, firibgarlik) zudlik bilan tekshiring. E'lonlarni yoki foydalanuvchilarni bloklash vakolati sizda mavjud.",
    "AdminGuide.sections.users.title": "Foydalanuvchilarni Boshqarish",
    "AdminGuide.sections.users.content": "Foydalanuvchilar ro'yxatida ularning holatini (faol, bloklangan, tasdiqlanmagan) ko'rishingiz, shubhali akkauntlarni tekshirishingiz mumkin.",
    "AdminGuide.sections.broadcasts.title": "Ommaviy Xabarlar (Broadcasts)",
    "AdminGuide.sections.broadcasts.content": "Barcha foydalanuvchilarga yoki ma'lum bir guruhga tizim yangiliklari, ogohlantirishlar yoki reklama xabarlarini yuborish uchun shu bo'limdan foydalaning.",
    "AdminGuide.sections.security.title": "Tizim Xavfsizligi",
    "AdminGuide.sections.security.content": "Admin parollari va tizim loglarini muntazam tekshirib turing. Shubhali IP manzillar yoki ketma-ket xato kirish urinishlariga e'tibor qarating.",
    "AdminGuide.sections.categories.title": "Kategoriyalar va Zotlar",
    "AdminGuide.sections.categories.content": "Ma'lumotnomalar bo'limida hayvon turlari (Qoramol, Qo'y, Ot va h.k.) va ularning zotlarini boshqarishingiz mumkin. Keraksiz toifalarni (masalan, baliq, quyon) o'chirishingiz mumkin."
}

admin_guide_en = {
    "AdminGuide.title": "Administrator Guide",
    "AdminGuide.subtitle": "Complete guide on effective platform management, ensuring security, and moderation.",
    "AdminGuide.sections.dashboard.title": "Key Metrics (Dashboard)",
    "AdminGuide.sections.dashboard.content": "The Dashboard page displays the overall status of the platform, the number of new users, listings, and transactions. Monitor the system status from here.",
    "AdminGuide.sections.moderation.title": "Moderation and Complaints",
    "AdminGuide.sections.moderation.content": "Immediately review complaints (spam, fraud) submitted by users. You have the authority to block listings or users.",
    "AdminGuide.sections.users.title": "User Management",
    "AdminGuide.sections.users.content": "In the user list, you can view their status (active, blocked, unverified) and inspect suspicious accounts.",
    "AdminGuide.sections.broadcasts.title": "Mass Messages (Broadcasts)",
    "AdminGuide.sections.broadcasts.content": "Use this section to send system news, warnings, or promotional messages to all users or a specific group.",
    "AdminGuide.sections.security.title": "System Security",
    "AdminGuide.sections.security.content": "Regularly check admin passwords and system logs. Pay attention to suspicious IP addresses or consecutive failed login attempts.",
    "AdminGuide.sections.categories.title": "Categories and Breeds",
    "AdminGuide.sections.categories.content": "In the reference section, you can manage animal types (Cattle, Sheep, Horses, etc.) and their breeds. You can delete unnecessary categories (e.g., fish, rabbits)."
}

admin_guide_ru = {
    "AdminGuide.title": "Руководство Администратора",
    "AdminGuide.subtitle": "Полное руководство по эффективному управлению платформой, обеспечению безопасности и модерации.",
    "AdminGuide.sections.dashboard.title": "Основные показатели (Дашборд)",
    "AdminGuide.sections.dashboard.content": "На странице дашборда отображается общее состояние платформы, количество новых пользователей, объявлений и транзакций. Отслеживайте состояние системы отсюда.",
    "AdminGuide.sections.moderation.title": "Модерация и Жалобы",
    "AdminGuide.sections.moderation.content": "Немедленно проверяйте жалобы (спам, мошенничество), поданные пользователями. У вас есть полномочия блокировать объявления или пользователей.",
    "AdminGuide.sections.users.title": "Управление Пользователями",
    "AdminGuide.sections.users.content": "В списке пользователей вы можете видеть их статус (активный, заблокированный, неподтвержденный) и проверять подозрительные аккаунты.",
    "AdminGuide.sections.broadcasts.title": "Массовые рассылки",
    "AdminGuide.sections.broadcasts.content": "Используйте этот раздел для отправки системных новостей, предупреждений или рекламных сообщений всем пользователям или определенной группе.",
    "AdminGuide.sections.security.title": "Безопасность системы",
    "AdminGuide.sections.security.content": "Регулярно проверяйте пароли администраторов и системные журналы. Обращайте внимание на подозрительные IP-адреса или последовательные неудачные попытки входа.",
    "AdminGuide.sections.categories.title": "Категории и Породы",
    "AdminGuide.sections.categories.content": "В разделе справочников вы можете управлять видами животных (КРС, Овцы, Лошади и т.д.) и их породами. Вы можете удалять ненужные категории (например, рыба, кролики)."
}

admin_guide_cyrl = {
    "AdminGuide.title": "Администратор Қўлланмаси",
    "AdminGuide.subtitle": "Платформани самарали бошқариш, хавфсизликни таъминлаш ва модерация қилиш бўйича тўлиқ йўриқнома.",
    "AdminGuide.sections.dashboard.title": "Асосий Кўрсаткичлар (Dashboard)",
    "AdminGuide.sections.dashboard.content": "Dashboard саҳифасида платформанинг умумий ҳолати, янги фойдаланувчилар, эълонлар ва транзакциялар сони акс этади. Тизим ҳолатини шу ердан кузатиб боринг.",
    "AdminGuide.sections.moderation.title": "Модерация ва Шикоятлар",
    "AdminGuide.sections.moderation.content": "Фойдаланувчилар томонидан тушган шикоятларни (спам, фирибгарлик) зудлик билан текширинг. Эълонларни ёки фойдаланувчилани блоклаш ваколати сизда мавжуд.",
    "AdminGuide.sections.users.title": "Фойдаланувчиларни Бошқариш",
    "AdminGuide.sections.users.content": "Фойдаланувчилар рўйхатида уларнинг ҳолатини (фаол, блокланган, тасдиқланмаган) кўришингиз, шубҳали аккаунтларни текширишингиз мумкин.",
    "AdminGuide.sections.broadcasts.title": "Оммавий Хабарлар (Broadcasts)",
    "AdminGuide.sections.broadcasts.content": "Барча фойдаланувчиларга ёки маълум бир гуруҳга тизим янгиликлари, огоҳлантиришлар ёки реклама хабарларини юбориш учун шу бўлимдан фойдаланинг.",
    "AdminGuide.sections.security.title": "Тизим Хавфсизлиги",
    "AdminGuide.sections.security.content": "Админ пароллари ва тизим логларини мунтазам текшириб туринг. Шубҳали IP манзиллар ёки кетма-кет хато кириш уринишларига эътибор қаратинг.",
    "AdminGuide.sections.categories.title": "Категориялар ва Зотлар",
    "AdminGuide.sections.categories.content": "Маълумотномалар бўлимида ҳайвон турлари (Қорамол, Қўй, От ва ҳ.к.) ва уларнинг зотларини бошқаришингиз мумкин. Кераксиз тоифаларни (масалан, балиқ, қуён) ўчиришингиз мумкин."
}

update_json('uz', admin_guide_uz)
update_json('en', admin_guide_en)
update_json('ru', admin_guide_ru)
update_json('uz-cyrl', admin_guide_cyrl)

print("Admin Guide translation keys added successfully!")
