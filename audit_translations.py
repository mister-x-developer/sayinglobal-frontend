import json

known_acronyms = {"SAYIN GLOBAL", "USD", "Telegram", "Email", "Push", "ID", "IP", "OTP", "AI", "{current} / {total}"}

with open("messages/en.json") as f:
    en = json.load(f)

for lang in ["uz", "uz-cyrl", "ru"]:
    with open(f"messages/{lang}.json") as f:
        data = json.load(f)
    
    def compare(e, d, path=""):
        for k, v in e.items():
            current_path = f"{path}.{k}" if path else k
            if isinstance(v, dict):
                compare(v, d.get(k, {}), current_path)
            else:
                val = d.get(k)
                if val == v and val not in known_acronyms and not (k == 'appName' or k == 'telegramOtp' or k == 'usd'):
                    # some numeric/symbols are fine
                    import re
                    if re.match(r'^[\d\s\.\,\%\/\-\{\}]+$', val):
                        continue
                    print(f"Fallback found in {lang}.json at {current_path}: {v}")

    compare(en, data)
