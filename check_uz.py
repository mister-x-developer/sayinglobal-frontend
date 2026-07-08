import json

with open("messages/uz.json", "r") as f:
    data = json.load(f)

def extract_values(d, path=""):
    vals = []
    for k, v in d.items():
        if isinstance(v, dict):
            vals.extend(extract_values(v, path + k + "."))
        elif isinstance(v, str):
            vals.append((path + k, v))
    return vals

values = extract_values(data)

errors = []
for p, v in values:
    if 'ў' in v or 'ғ' in v or 'қ' in v or 'ҳ' in v:
        errors.append((p, v, "cyrillic mixed"))
    if 'o`' in v or 'g`' in v or 'O`' in v or 'G`' in v:
        errors.append((p, v, "wrong apostrophe `"))
    if 'o‘' in v or 'g‘' in v or 'O‘' in v or 'G‘' in v:
        errors.append((p, v, "wrong apostrophe ‘"))

print(f"Found {len(errors)} formatting errors.")
for e in errors[:20]:
    print(e)
