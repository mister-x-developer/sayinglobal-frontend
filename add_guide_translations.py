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

guide_uz = {
    "Guide.title": "Platformadan Foydalanish Qo'llanmasi",
    "Guide.subtitle": "Sayin Global platformasida qanday qilib to'g'ri, xavfsiz va samarali savdo qilish bo'yicha to'liq ma'lumot.",
    "Guide.sections.login.title": "Platformaga Kirish",
    "Guide.sections.login.content": "Sayin Global platformasi sizga qishloq xo'jaligi hayvonlarini ishonchli sotib olish va sotish imkonini beradi. Ro'yxatdan o'tish uchun telefon raqamingizdan foydalaning va profilingizni to'ldiring.",
    "Guide.sections.search.title": "E'lonlar Qidirish",
    "Guide.sections.search.content": "Asosiy sahifadagi qidiruv orqali yoki toifalar (Qoramol, Qo'y, Echki va h.k.) bo'yicha hayvonlarni izlashingiz mumkin. Filtrlar yordamida narx, viloyat va zotini tanlang.",
    "Guide.sections.post.title": "E'lon Joylash",
    "Guide.sections.post.content": "O'z hayvoningizni sotish uchun 'E'lon berish' tugmasini bosing. Sifatli rasm yuklang, aniq narx va ma'lumotlarni kiriting. Bu xaridorlar e'tiborini tez tortadi.",
    "Guide.sections.security.title": "Xavfsizlik va Ishonch",
    "Guide.sections.security.content": "Boshqa foydalanuvchilar bilan muomala qilganda, ularning reytingiga va sharhlariga e'tibor bering. To'lovlarni faqat ishonch hosil qilgandan so'ng amalga oshiring.",
    "Guide.sections.contact.title": "Sotuvchi bilan Bog'lanish",
    "Guide.sections.contact.content": "Sotuvchi bilan bevosita platformamizdagi chat orqali yozishishingiz yoki ko'rsatilgan telefon raqamiga qo'ng'iroq qilishingiz mumkin.",
    "Guide.sections.report.title": "Shikoyat Qilish",
    "Guide.sections.report.content": "Agar e'lon yoki sotuvchi qoidalarni buzsa, sahifadagi 'Shikoyat qilish' tugmasi orqali tizimga xabar bering. AI va moderatorlarimiz darhol chora ko'radi.",
    "Guide.footer.title": "Qo'shimcha savollaringiz bormi?",
    "Guide.footer.subtitle": "Bizning aqlli AI yordamchimiz barcha savollaringizga javob berishga tayyor.",
    "Guide.footer.button": "AI Yordamchiga savol berish"
}

guide_en = {
    "Guide.title": "Platform User Guide",
    "Guide.subtitle": "Complete information on how to trade correctly, safely and effectively on the Sayin Global platform.",
    "Guide.sections.login.title": "Platform Login",
    "Guide.sections.login.content": "The Sayin Global platform allows you to buy and sell agricultural animals reliably. Use your phone number to register and fill out your profile.",
    "Guide.sections.search.title": "Search Listings",
    "Guide.sections.search.content": "You can search for animals through the main page search or by categories (Cattle, Sheep, Goats, etc.). Use filters to select price, region, and breed.",
    "Guide.sections.post.title": "Post a Listing",
    "Guide.sections.post.content": "Click the 'Post' button to sell your animal. Upload high-quality photos, enter exact price and details. This will quickly attract buyers' attention.",
    "Guide.sections.security.title": "Security and Trust",
    "Guide.sections.security.content": "When dealing with other users, pay attention to their rating and reviews. Make payments only after you are confident.",
    "Guide.sections.contact.title": "Contact Seller",
    "Guide.sections.contact.content": "You can communicate with the seller directly through our platform chat or call the provided phone number.",
    "Guide.sections.report.title": "Report",
    "Guide.sections.report.content": "If a listing or seller violates the rules, report it to the system via the 'Report' button on the page. Our AI and moderators will take immediate action.",
    "Guide.footer.title": "Do you have additional questions?",
    "Guide.footer.subtitle": "Our smart AI assistant is ready to answer all your questions.",
    "Guide.footer.button": "Ask AI Assistant"
}

guide_ru = {
    "Guide.title": "Руководство Пользователя",
    "Guide.subtitle": "Полная информация о том, как правильно, безопасно и эффективно торговать на платформе Sayin Global.",
    "Guide.sections.login.title": "Вход на платформу",
    "Guide.sections.login.content": "Платформа Sayin Global позволяет надежно покупать и продавать сельскохозяйственных животных. Используйте номер телефона для регистрации и заполните профиль.",
    "Guide.sections.search.title": "Поиск объявлений",
    "Guide.sections.search.content": "Вы можете искать животных через поиск на главной странице или по категориям (Крупный рогатый скот, Овцы, Козы и т.д.). Используйте фильтры для выбора цены, региона и породы.",
    "Guide.sections.post.title": "Разместить объявление",
    "Guide.sections.post.content": "Нажмите кнопку «Подать объявление», чтобы продать свое животное. Загрузите качественные фото, укажите точную цену и детали. Это быстро привлечет внимание покупателей.",
    "Guide.sections.security.title": "Безопасность и Доверие",
    "Guide.sections.security.content": "При сделках с другими пользователями обращайте внимание на их рейтинг и отзывы. Совершайте платежи только после того, как убедитесь в надежности.",
    "Guide.sections.contact.title": "Связаться с продавцом",
    "Guide.sections.contact.content": "Вы можете напрямую общаться с продавцом через чат на нашей платформе или позвонить по указанному номеру.",
    "Guide.sections.report.title": "Пожаловаться",
    "Guide.sections.report.content": "Если объявление или продавец нарушают правила, сообщите об этом в систему через кнопку «Пожаловаться». Наш ИИ и модераторы примут немедленные меры.",
    "Guide.footer.title": "У вас есть дополнительные вопросы?",
    "Guide.footer.subtitle": "Наш умный ИИ-помощник готов ответить на все ваши вопросы.",
    "Guide.footer.button": "Спросить ИИ-помощника"
}

guide_cyrl = {
    "Guide.title": "Платформадан Фойдаланиш Қўлланмаси",
    "Guide.subtitle": "Sayin Global платформасида қандай қилиб тўғри, хавфсиз ва самарали савдо қилиш бўйича тўлиқ маълумот.",
    "Guide.sections.login.title": "Платформага Кириш",
    "Guide.sections.login.content": "Sayin Global платформаси сизга қишлоқ хўжалиги ҳайвонларини ишончли сотиб олиш ва сотиш имконини беради. Рўйхатдан ўтиш учун телефон рақамингиздан фойдаланинг ва профилингизни тўлдиринг.",
    "Guide.sections.search.title": "Эълонлар Қидириш",
    "Guide.sections.search.content": "Асосий саҳифадаги қидирув орқали ёки тоифалар (Қорамол, Қўй, Эчки ва ҳ.к.) бўйича ҳайвонларни излашингиз мумкин. Фильтрлар ёрдамида нарх, вилоят ва зотини танланг.",
    "Guide.sections.post.title": "Эълон Жойлаш",
    "Guide.sections.post.content": "Ўз ҳайвонингизни сотиш учун 'Эълон бериш' тугмасини босинг. Сифатли расм юкланг, аниқ нарх ва маълумотларни киритинг. Бу харидорлар эътиборини тез тортади.",
    "Guide.sections.security.title": "Хавфсизлик ва Ишонч",
    "Guide.sections.security.content": "Бошқа фойдаланувчилар билан муомала қилганда, уларнинг рейтингига ва шарҳларига эътибор беринг. Тўловларни фақат ишонч ҳосил қилгандан сўнг амалга оширинг.",
    "Guide.sections.contact.title": "Сотувчи билан Боғланиш",
    "Guide.sections.contact.content": "Сотувчи билан бевосита платформамиздаги чат орқали ёзишишингиз ёки кўрсатилган телефон рақамига қўнғироқ қилишингиз мумкин.",
    "Guide.sections.report.title": "Шикоят Қилиш",
    "Guide.sections.report.content": "Агар эълон ёки сотувчи қоидаларни бузса, саҳифадаги 'Шикоят қилиш' тугмаси орқали тизимга хабар беринг. АИ ва модераторларимиз дарҳол чора кўради.",
    "Guide.footer.title": "Қўшимча саволларингиз борми?",
    "Guide.footer.subtitle": "Бизнинг ақлли АИ ёрдамчимиз барча саволларингизга жавоб беришга тайёр.",
    "Guide.footer.button": "АИ Ёрдамчига савол бериш"
}

update_json('uz', guide_uz)
update_json('en', guide_en)
update_json('ru', guide_ru)
update_json('uz-cyrl', guide_cyrl)

print("Guide translation keys added successfully!")
