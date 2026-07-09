import os
import re

def replace_in_file(path, replacements):
    with open(path, 'r') as f:
        content = f.read()
    
    new_content = content
    for pattern, repl in replacements:
        new_content = re.sub(pattern, repl, new_content)
        
    if new_content != content:
        with open(path, 'w') as f:
            f.write(new_content)
        print(f"Updated {path}")

# Updates mapping
file_updates = {
    'app/sellers/detail/page.tsx': [
        (r'seller\?\.id', r'seller?.public_id'),
    ],
    'app/listings/detail/page.tsx': [
        (r'listing\?\.id', r'listing?.public_id'),
    ],
    'app/listings/detail/edit/page.tsx': [
        (r'seller\?\.id', r'seller?.public_id'),
    ],
    'app/profile/reports/page.tsx': [
        (r'listing\?\.id', r'listing?.public_id'),
    ],
    'app/admin/listings/detail/page.tsx': [
        (r'listing\?\.id', r'listing?.public_id'),
    ],
    'app/admin/listings/detail/edit/page.tsx': [
        (r'seller\?\.id', r'seller?.public_id'),
    ],
    'app/admin/moderation/detail/page.tsx': [
        (r'complainant\?\.id', r'complainant?.public_id'),
    ],
    'app/chat/page.tsx': [
        (r'sender\?\.id', r'sender?.public_id'),
    ]
}

for filepath, replacements in file_updates.items():
    if os.path.exists(filepath):
        replace_in_file(filepath, replacements)
    else:
        print(f"File not found: {filepath}")
