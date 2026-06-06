import json
import os
from pathlib import Path

DIR = Path(__file__).parent
FILES = ['uz.json', 'uz-cyrl.json', 'ru.json', 'en.json']

def flatten_dict(d, parent_key='', sep='.'):
    items = []
    for k, v in d.items():
        new_key = f"{parent_key}{sep}{k}" if parent_key else k
        if isinstance(v, dict):
            items.extend(flatten_dict(v, new_key, sep=sep).items())
        else:
            items.append((new_key, v))
    return dict(items)

def unflatten_dict(d, sep='.'):
    result_dict = dict()
    for key, value in d.items():
        parts = key.split(sep)
        d = result_dict
        for part in parts[:-1]:
            if part not in d:
                d[part] = dict()
            d = d[part]
        d[parts[-1]] = value
    return result_dict

def sync_translations():
    data = {}
    for f in FILES:
        path = DIR / f
        if path.exists():
            with open(path, 'r', encoding='utf-8') as file:
                data[f] = flatten_dict(json.load(file))
        else:
            data[f] = {}

    # Get all unique keys
    all_keys = set()
    for d in data.values():
        all_keys.update(d.keys())

    # Sort keys for consistent output
    all_keys = sorted(list(all_keys))

    # Fill missing translations
    for f in FILES:
        for k in all_keys:
            if k not in data[f]:
                # Try to get value from uz.json, then en.json, then others
                val = ""
                for src in ['uz.json', 'en.json', 'ru.json', 'uz-cyrl.json']:
                    if k in data[src]:
                        val = data[src][k]
                        break
                data[f][k] = val

    # Write back
    for f in FILES:
        path = DIR / f
        unflattened = unflatten_dict(data[f])
        with open(path, 'w', encoding='utf-8') as file:
            json.dump(unflattened, file, ensure_ascii=False, indent=2)
            file.write("\n")

if __name__ == '__main__':
    sync_translations()
    print("Translations synchronized successfully!")
