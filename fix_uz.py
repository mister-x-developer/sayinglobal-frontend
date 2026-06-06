import json
import re

def fix_uzbek_text(text):
    if not isinstance(text, str):
        return text
        
    # specific tutuq belgisi
    text = re.sub(r"e[ʻ'‘’`ʼ]lon", r"e’lon", text)
    text = re.sub(r"E[ʻ'‘’`ʼ]lon", r"E’lon", text)
    text = re.sub(r"sa[ʻ'‘’`ʼ]y", r"sa’y", text)
    text = re.sub(r"ta[ʻ'‘’`ʼ]lim", r"ta’lim", text)
    text = re.sub(r"ma[ʻ'‘’`ʼ]lum", r"ma’lum", text)
    text = re.sub(r"Ma[ʻ'‘’`ʼ]lum", r"Ma’lum", text)
    text = re.sub(r"san[ʻ'‘’`ʼ]at", r"san’at", text)
    text = re.sub(r"mas[ʻ'‘’`ʼ]ul", r"mas’ul", text)
    text = re.sub(r"me[ʻ'‘’`ʼ]yor", r"me’yor", text)
    text = re.sub(r"a[ʻ'‘’`ʼ]zo", r"a’zo", text)
    text = re.sub(r"A[ʻ'‘’`ʼ]zo", r"A’zo", text)
    text = re.sub(r"ta[ʻ'‘’`ʼ]sir", r"ta’sir", text)
    text = re.sub(r"qat[ʻ'‘’`ʼ]iy", r"qat’iy", text)
    text = re.sub(r"su[ʻ'‘’`ʼ]iy", r"sun’iy", text) # sun'iy
    text = re.sub(r"sun[ʻ'‘’`ʼ]iy", r"sun’iy", text)
    text = re.sub(r"san[ʻ'‘’`ʼ]iy", r"san’iy", text)
    text = re.sub(r"ma[ʻ'‘’`ʼ]no", r"ma’no", text)
    text = re.sub(r"Ma[ʻ'‘’`ʼ]no", r"Ma’no", text)
    
    # general O' and G'
    text = re.sub(r"G[ʻ'‘’`ʼ](?=[a-zA-Z])", r"Gʻ", text)
    text = re.sub(r"g[ʻ'‘’`ʼ](?=[a-zA-Z])", r"gʻ", text)
    text = re.sub(r"g[ʻ'‘’`ʼ]\b", r"gʻ", text)

    text = re.sub(r"O[ʻ'‘’`ʼ](?=[a-zA-Z])", r"Oʻ", text)
    text = re.sub(r"o[ʻ'‘’`ʼ](?=[a-zA-Z])", r"oʻ", text)
    text = re.sub(r"o[ʻ'‘’`ʼ]\b", r"oʻ", text)
    
    return text

def process_dict(d):
    for k, v in d.items():
        if isinstance(v, dict):
            process_dict(v)
        elif isinstance(v, str):
            d[k] = fix_uzbek_text(v)

filepath = "/home/lochinbek/Desktop/sayinglobal/frontend/messages/uz.json"
with open(filepath, 'r', encoding='utf-8') as f:
    data = json.load(f)

process_dict(data)

with open(filepath, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("Done replacing in uz.json")
