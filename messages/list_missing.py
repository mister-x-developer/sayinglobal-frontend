import json
import re

def flatten(d, parent_key='', sep='.'):
    items = []
    for k, v in d.items():
        new_key = f"{parent_key}{sep}{k}" if parent_key else k
        if isinstance(v, dict):
            items.extend(flatten(v, new_key, sep=sep).items())
        else:
            items.append((new_key, v))
    return dict(items)

def load_json(p):
    with open(p, 'r', encoding='utf-8') as f:
        return json.load(f)

ru = flatten(load_json('ru.json'))
uz_cyrl = flatten(load_json('uz-cyrl.json'))

def check_latin(lang, data):
    print(f"\n--- {lang} Latin Check ---")
    for k, v in data.items():
        if isinstance(v, str):
            # Remove placeholders like {name}
            clean_v = re.sub(r'\{[^}]+\}', '', v)
            # Remove allowed english words
            for word in ['USD', 'Telegram OTP', 'SAYIN GLOBAL', 'SAYIN', 'CEO', 'Sayin', 'Global', 'kg', 'Bio', 'Spam', 'Radius', 'Admin', 'Super Admin']:
                clean_v = clean_v.replace(word, '')
            if re.search(r'[a-zA-Z]', clean_v):
                print(f"  {k}: {v}")

check_latin('RU', ru)
check_latin('UZ-CYRL', uz_cyrl)

