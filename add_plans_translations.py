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

plans_uz = {
    "plans.statusActive": "Faol",
    "plans.statusInactive": "Faol emas",
    "plans.expiresOn": "Tugaydi: {date}",
    "plans.unlimitedTime": "Muddatsiz",
    "plans.max": "Maks",
    "plans.bumpLimit": "Oyiga {limit} marta ko'tarish",
    "plans.noPlanData": "Tarif ma'lumotlari topilmadi.",
    "plans.promoPlaceholder": "PROMO-KOD",
    "plans.current": "Joriy",
    "plans.free": "Bepul",
    "plans.durationDays": "/ {days} kun",
    "plans.featureMonthlyLimit": "Oylik chegara: {limit} e'lon",
    "plans.featureActiveLimit": "Faol e'lonlar: {limit} ta",
    "plans.featureWholesale": "Ulgurji savdoga ruxsat",
    "plans.featureBump": "E'lonni tez-tez tepaga chiqarish",
    "plans.yourCurrentPlan": "Hozirgi tarifingiz",
    "plans.buySoon": "Sotib olish (Tez kunda)"
}

plans_en = {
    "plans.statusActive": "Active",
    "plans.statusInactive": "Inactive",
    "plans.expiresOn": "Expires: {date}",
    "plans.unlimitedTime": "Unlimited",
    "plans.max": "Max",
    "plans.bumpLimit": "{limit} bumps per month",
    "plans.noPlanData": "Plan data not found.",
    "plans.promoPlaceholder": "PROMO CODE",
    "plans.current": "Current",
    "plans.free": "Free",
    "plans.durationDays": "/ {days} days",
    "plans.featureMonthlyLimit": "Monthly limit: {limit} listings",
    "plans.featureActiveLimit": "Active listings: {limit}",
    "plans.featureWholesale": "Wholesale trading allowed",
    "plans.featureBump": "Frequent listing bumps",
    "plans.yourCurrentPlan": "Your current plan",
    "plans.buySoon": "Buy (Coming soon)"
}

plans_ru = {
    "plans.statusActive": "Активен",
    "plans.statusInactive": "Не активен",
    "plans.expiresOn": "Истекает: {date}",
    "plans.unlimitedTime": "Без ограничений",
    "plans.max": "Макс",
    "plans.bumpLimit": "{limit} поднятий в месяц",
    "plans.noPlanData": "Данные о тарифе не найдены.",
    "plans.promoPlaceholder": "ПРОМОКОД",
    "plans.current": "Текущий",
    "plans.free": "Бесплатно",
    "plans.durationDays": "/ {days} дней",
    "plans.featureMonthlyLimit": "Месячный лимит: {limit} объявлений",
    "plans.featureActiveLimit": "Активные объявления: {limit}",
    "plans.featureWholesale": "Разрешена оптовая торговля",
    "plans.featureBump": "Частое поднятие объявлений",
    "plans.yourCurrentPlan": "Ваш текущий тариф",
    "plans.buySoon": "Купить (Скоро)"
}

plans_cyrl = {
    "plans.statusActive": "Фаол",
    "plans.statusInactive": "Фаол эмас",
    "plans.expiresOn": "Тугайди: {date}",
    "plans.unlimitedTime": "Муддатсиз",
    "plans.max": "Макс",
    "plans.bumpLimit": "Ойига {limit} марта кўтариш",
    "plans.noPlanData": "Тариф маълумотлари топилмади.",
    "plans.promoPlaceholder": "ПРОМО-КОД",
    "plans.current": "Жорий",
    "plans.free": "Бепул",
    "plans.durationDays": "/ {days} кун",
    "plans.featureMonthlyLimit": "Ойлик чегара: {limit} эълон",
    "plans.featureActiveLimit": "Фаол эълонлар: {limit} та",
    "plans.featureWholesale": "Улгуржи савдога рухсат",
    "plans.featureBump": "Эълонни тез-тез тепага чиқариш",
    "plans.yourCurrentPlan": "Ҳозирги тарифингиз",
    "plans.buySoon": "Сотиб олиш (Тез кунда)"
}

update_json('uz', plans_uz)
update_json('en', plans_en)
update_json('ru', plans_ru)
update_json('uz-cyrl', plans_cyrl)

print("Plans translation keys added successfully!")
