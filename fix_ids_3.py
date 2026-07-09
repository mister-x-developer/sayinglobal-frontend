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
    'app/admin/moderation/detail/page.tsx': [
        (r'report\.listing\.id', r'report.listing.public_id'),
        (r'report\.reported_user\.id', r'report.reported_user.public_id'),
    ],
    'app/admin/users/page.tsx': [
        (r'selectedUser\?\.id', r'selectedUser?.public_id'),
    ],
}

for filepath, replacements in file_updates.items():
    if os.path.exists(filepath):
        replace_in_file(filepath, replacements)
    else:
        print(f"File not found: {filepath}")
