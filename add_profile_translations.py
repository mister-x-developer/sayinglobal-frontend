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

my_listings_uz = {
    "actions.edit": "Tahrirlash",
    "actions.markSold": "Sotildi",
    "actions.cancel": "Bekor qilish",
    "actions.restore": "Tiklash",
    "actions.submitReview": "Tekshiruvga yuborish",
    "listings.deleteConfirm": "Ushbu e'lonni o'chirishni xohlaysizmi?",
    "listings.markSoldConfirm": "E'lonni sotildi deb belgilaysizmi?",
    "listings.cancelReviewConfirm": "Tekshiruvni bekor qilasizmi? E'lon qoralamaga qaytadi.",
    "listings.restoreConfirm": "E'lonni qayta sotuvga qo'yasizmi? U yana tekshiruvdan o'tadi.",
    "listings.submitReviewConfirm": "E'lonni adminga tekshirishga yuborasizmi?",
    "listings.statusActive": "Sotuvda",
    "listings.statusSold": "Sotilgan",
    "listings.statusPending": "Kutilmoqda",
    "listings.statusRejected": "Rad etilgan",
    "listings.statusDraft": "Qoralama"
}

my_listings_en = {
    "actions.edit": "Edit",
    "actions.markSold": "Mark Sold",
    "actions.cancel": "Cancel",
    "actions.restore": "Restore",
    "actions.submitReview": "Submit for Review",
    "listings.deleteConfirm": "Are you sure you want to delete this listing?",
    "listings.markSoldConfirm": "Mark this listing as sold?",
    "listings.cancelReviewConfirm": "Cancel the review? The listing will return to drafts.",
    "listings.restoreConfirm": "Put the listing back on sale? It will go through review again.",
    "listings.submitReviewConfirm": "Submit the listing to the admin for review?",
    "listings.statusActive": "Active",
    "listings.statusSold": "Sold",
    "listings.statusPending": "Pending",
    "listings.statusRejected": "Rejected",
    "listings.statusDraft": "Draft"
}

my_listings_ru = {
    "actions.edit": "Редактировать",
    "actions.markSold": "Продано",
    "actions.cancel": "Отменить",
    "actions.restore": "Восстановить",
    "actions.submitReview": "Отправить на проверку",
    "listings.deleteConfirm": "Вы уверены, что хотите удалить это объявление?",
    "listings.markSoldConfirm": "Отметить это объявление как проданное?",
    "listings.cancelReviewConfirm": "Отменить проверку? Объявление вернется в черновики.",
    "listings.restoreConfirm": "Вернуть объявление в продажу? Оно снова пройдет проверку.",
    "listings.submitReviewConfirm": "Отправить объявление админу на проверку?",
    "listings.statusActive": "Активно",
    "listings.statusSold": "Продано",
    "listings.statusPending": "В ожидании",
    "listings.statusRejected": "Отклонено",
    "listings.statusDraft": "Черновик"
}

my_listings_cyrl = {
    "actions.edit": "Таҳрирлаш",
    "actions.markSold": "Сотилди",
    "actions.cancel": "Бекор қилиш",
    "actions.restore": "Тиклаш",
    "actions.submitReview": "Текширувга юбориш",
    "listings.deleteConfirm": "Ушбу эълонни ўчиришни хоҳлайсизми?",
    "listings.markSoldConfirm": "Эълонни сотилди деб белгилайсизми?",
    "listings.cancelReviewConfirm": "Текширувни бекор қиласизми? Эълон қораламага қайтади.",
    "listings.restoreConfirm": "Эълонни қайта сотувга қўясизми? У яна текширувдан ўтади.",
    "listings.submitReviewConfirm": "Эълонни админга текширишга юборасизми?",
    "listings.statusActive": "Сотувда",
    "listings.statusSold": "Сотилган",
    "listings.statusPending": "Кутилмоқда",
    "listings.statusRejected": "Рад этилган",
    "listings.statusDraft": "Қоралама"
}

update_json('uz', my_listings_uz)
update_json('en', my_listings_en)
update_json('ru', my_listings_ru)
update_json('uz-cyrl', my_listings_cyrl)

print("MyListings translation keys added successfully!")
