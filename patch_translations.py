import json
import os

langs = {
    'uz': {
        'adminMod': {
            'status_all': 'Barchasi',
            'status_pending': 'Kutilmoqda',
            'status_under_review': 'Ko\'rib chiqilmoqda',
            'status_resolved_valid': 'Tasdiqlangan',
            'status_resolved_invalid': 'Rad etilgan',
            'reason_fraudulent_pricing': 'Soxta narx',
            'reason_fake_vaccination': 'Soxta emlash',
            'reason_no_show_after_deal': 'Kelishuvdan so\'ng kelmaslik',
            'reason_false_identity': 'Soxta shaxsiyat',
            'reason_aggressive_behavior': 'Tajovuzkor xulq'
        },
        'admin_visitSite': 'Saytga o\'tish (Kuzatuv)'
    },
    'uz-cyrl': {
        'adminMod': {
            'status_all': 'Барчаси',
            'status_pending': 'Кутилмоқда',
            'status_under_review': 'Кўриб чиқилмоқда',
            'status_resolved_valid': 'Тасдиқланган',
            'status_resolved_invalid': 'Рад этилган',
            'reason_fraudulent_pricing': 'Сохта нарх',
            'reason_fake_vaccination': 'Сохта эмлаш',
            'reason_no_show_after_deal': 'Келишувдан сўнг келмаслик',
            'reason_false_identity': 'Сохта шахсият',
            'reason_aggressive_behavior': 'Тажовузкор хулқ'
        },
        'admin_visitSite': 'Сайтга ўтиш (Кузатув)'
    },
    'ru': {
        'adminMod': {
            'status_all': 'Все',
            'status_pending': 'В ожидании',
            'status_under_review': 'На рассмотрении',
            'status_resolved_valid': 'Одобрено',
            'status_resolved_invalid': 'Отклонено',
            'reason_fraudulent_pricing': 'Мошенническая цена',
            'reason_fake_vaccination': 'Фальшивая вакцинация',
            'reason_no_show_after_deal': 'Неявка после сделки',
            'reason_false_identity': 'Фальшивая личность',
            'reason_aggressive_behavior': 'Агрессивное поведение'
        },
        'admin_visitSite': 'Перейти на сайт (Наблюдение)'
    },
    'en': {
        'adminMod': {
            'status_all': 'All',
            'status_pending': 'Pending',
            'status_under_review': 'Under Review',
            'status_resolved_valid': 'Resolved (Valid)',
            'status_resolved_invalid': 'Resolved (Invalid)',
            'reason_fraudulent_pricing': 'Fraudulent Pricing',
            'reason_fake_vaccination': 'Fake Vaccination',
            'reason_no_show_after_deal': 'No Show After Deal',
            'reason_false_identity': 'False Identity',
            'reason_aggressive_behavior': 'Aggressive Behavior'
        },
        'admin_visitSite': 'Visit Site (Monitor)'
    }
}

messages_dir = '/home/lochinbek/Desktop/sayinglobal/frontend/messages'

for lang, data in langs.items():
    file_path = os.path.join(messages_dir, f'{lang}.json')
    if os.path.exists(file_path):
        with open(file_path, 'r', encoding='utf-8') as f:
            content = json.load(f)
        
        # Add adminMod
        if 'adminMod' not in content:
            content['adminMod'] = {}
        for k, v in data['adminMod'].items():
            content['adminMod'][k] = v
            
        # Add admin_visitSite to admin section
        if 'admin' not in content:
            content['admin'] = {}
        content['admin']['visitSite'] = data['admin_visitSite']
        
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(content, f, ensure_ascii=False, indent=2)
        
        print(f"Updated {lang}.json")

