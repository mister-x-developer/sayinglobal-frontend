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
    'components/profile/MyListingsManager.tsx': [
        (r'l\.id', r'l.public_id'),
    ],
    'components/listings/CommentThread.tsx': [
        (r'comment\.user\.id', r'comment.user.public_id'),
    ],
    'components/sellers/SellerRatingsThread.tsx': [
        (r'buyer\?\.id', r'buyer?.public_id'),
        (r'seller\?\.id', r'seller?.public_id'),
        (r'me\?\.id', r'me?.public_id'),
    ],
    'app/admin/users/detail/page.tsx': [
        (r'complainant\?\.id', r'complainant?.public_id'),
        (r'reported_user\?\.id', r'reported_user?.public_id'),
        (r'seller\?\.id', r'seller?.public_id'),
    ],
    'app/admin/users/page.tsx': [
        (r'user\.id', r'user.public_id'),
        (r'selectedUser\.id', r'selectedUser.public_id'),
        (r'u\.id', r'u.public_id'),
        (r'userId', r'userPublicId'), # Assuming it's safe to rename for consistency or just keep as is, but we'll stick to properties
    ]
}

for filepath, replacements in file_updates.items():
    if os.path.exists(filepath):
        replace_in_file(filepath, replacements)
    else:
        print(f"File not found: {filepath}")
