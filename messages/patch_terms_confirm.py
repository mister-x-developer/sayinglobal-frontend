import json

files = ['en.json', 'ru.json']

for f in files:
    with open(f, 'r', encoding='utf-8') as file:
        data = json.load(file)
    
    if 'auth' in data and 'termsConfirm' in data['auth']:
        if f == 'en.json':
            data['auth']['termsConfirm'] = "you accept"
        else:
            data['auth']['termsConfirm'] = "вы принимаете"
            
    with open(f, 'w', encoding='utf-8') as file:
        json.dump(data, file, ensure_ascii=False, indent=2)

print("Updated termsConfirm")
