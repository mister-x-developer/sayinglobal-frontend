import json
import re

def fix_uz_latin(text):
    if not isinstance(text, str):
        return text
    # Fix O'/o' and G'/g'
    text = re.sub(r"([OoOo])[`'‘’]", r"\1ʻ", text)
    text = re.sub(r"([GgGg])[`'‘’]", r"\1ʻ", text)
    
    # Fix tutuk belgi (apostrophe after consonants or e/a)
    text = re.sub(r"([a-zA-Z])[`'‘’]([a-zA-Z])", r"\1ʼ\2", text)
    return text

def process_dict(d, lang):
    for k, v in d.items():
        if isinstance(v, dict):
            process_dict(v, lang)
        elif isinstance(v, str):
            if lang == 'uz':
                d[k] = fix_uz_latin(v)
            elif lang == 'uz-cyrl':
                # In cyrillic, sometimes people write o' instead of ў, or g' instead of ғ
                val = v
                val = val.replace("o'", "ў").replace("o`", "ў").replace("O'", "Ў")
                val = val.replace("g'", "ғ").replace("g`", "ғ").replace("G'", "Ғ")
                d[k] = val

def fix_file(lang):
    filepath = f"messages/{lang}.json"
    with open(filepath, "r", encoding="utf-8") as f:
        data = json.load(f)
        
    process_dict(data, lang)
    
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

fix_file('uz')
fix_file('uz-cyrl')
print("Fixed orthography for uz and uz-cyrl.")
