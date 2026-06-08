import json
import re
from pathlib import Path

def fix_uzbek_text(text):
    if not isinstance(text, str):
        return text
        
    # specific tutuq belgisi
    text = re.sub(r"e[ʻ'‘’`ʼ]lon", r"eʼlon", text)
    text = re.sub(r"E[ʻ'‘’`ʼ]lon", r"Eʼlon", text)
    text = re.sub(r"sa[ʻ'‘’`ʼ]y", r"saʼy", text)
    text = re.sub(r"ta[ʻ'‘’`ʼ]lim", r"taʼlim", text)
    text = re.sub(r"ma[ʻ'‘’`ʼ]lum", r"maʼlum", text)
    text = re.sub(r"Ma[ʻ'‘’`ʼ]lum", r"Maʼlum", text)
    text = re.sub(r"san[ʻ'‘’`ʼ]at", r"sanʼat", text)
    text = re.sub(r"mas[ʻ'‘’`ʼ]ul", r"masʼul", text)
    text = re.sub(r"me[ʻ'‘’`ʼ]yor", r"meʼyor", text)
    text = re.sub(r"a[ʻ'‘’`ʼ]zo", r"aʼzo", text)
    text = re.sub(r"A[ʻ'‘’`ʼ]zo", r"Aʼzo", text)
    text = re.sub(r"ta[ʻ'‘’`ʼ]sir", r"taʼsir", text)
    text = re.sub(r"qat[ʻ'‘’`ʼ]iy", r"qatʼiy", text)
    text = re.sub(r"su[ʻ'‘’`ʼ]iy", r"sunʼiy", text) # sun'iy
    text = re.sub(r"sun[ʻ'‘’`ʼ]iy", r"sunʼiy", text)
    text = re.sub(r"san[ʻ'‘’`ʼ]iy", r"sanʼiy", text)
    text = re.sub(r"ma[ʻ'‘’`ʼ]no", r"maʼno", text)
    text = re.sub(r"Ma[ʻ'‘’`ʼ]no", r"Maʼno", text)
    
    # general O' and G'
    text = re.sub(r"G[ʻ'‘’`ʼ](?!s\b)(?=[a-zA-Z])", r"Gʻ", text)
    text = re.sub(r"g[ʻ'‘’`ʼ](?!s\b)(?=[a-zA-Z])", r"gʻ", text)
    text = re.sub(r"g[ʻ'‘’`ʼ]\b", r"gʻ", text)

    text = re.sub(r"O[ʻ'‘’`ʼ](?!s\b)(?=[a-zA-Z])", r"Oʻ", text)
    text = re.sub(r"o[ʻ'‘’`ʼ](?!s\b)(?=[a-zA-Z])", r"oʻ", text)
    text = re.sub(r"o[ʻ'‘’`ʼ]\b", r"oʻ", text)
    
    return text

def process_dict(d):
    for k, v in d.items():
        if isinstance(v, dict):
            process_dict(v)
        elif isinstance(v, str):
            d[k] = fix_uzbek_text(v)

messages_dir = Path(__file__).resolve().parent / "messages"
changed = 0

for filepath in sorted(messages_dir.glob("*.json")):
    with filepath.open('r', encoding='utf-8') as f:
        data = json.load(f)

    before = json.dumps(data, ensure_ascii=False, sort_keys=True)
    process_dict(data)
    after = json.dumps(data, ensure_ascii=False, sort_keys=True)
    if before == after:
        continue

    with filepath.open('w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write('\n')
    changed += 1
    print(f"Updated {filepath.name}")

print(f"Done. Updated {changed} locale file(s).")
