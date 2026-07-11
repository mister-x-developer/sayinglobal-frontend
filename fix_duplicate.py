import os
import re

files = [
    'components/map/Map.tsx',
    'lib/api/chat.ts'
]

for file in files:
    path = os.path.join('/home/lochinbek/Desktop/sayinglobal/frontend', file)
    if os.path.exists(path):
        with open(path, 'r') as f:
            content = f.read()
        
        # for Map.tsx
        content = re.sub(r'id:\s*string;\s*id:\s*string;', 'id: string;', content)
        content = re.sub(r'id:\s*string;\n\s*id:\s*string;', 'id: string;', content)
        
        # for chat.ts:
        # id: number;  // 9-digit numeric
        # id?: string;
        content = re.sub(r'id:\s*number;[^\n]*\n\s*id\?:\s*string;[^\n]*\n', 'id: number;\n', content)

        with open(path, 'w') as f:
            f.write(content)
        print(f"Updated {path}")
