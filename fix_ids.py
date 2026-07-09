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
    'components/listings/ListingCard.tsx': [
        (r'  id: number;', r'  public_id: number;'),
        (r'    id: number;', r'    public_id: number;'),
        (r'listing\.id', r'listing.public_id'),
    ],
    'components/sellers/SellerCard.tsx': [
        (r'seller\.id', r'seller.public_id'),
    ],
    'components/map/Map.tsx': [
        (r'listing\.id', r'listing.public_id'),
    ],
    'components/listings/ListingGrid.tsx': [
        (r'listing\.id', r'listing.public_id'),
    ],
    'components/listings/NearbyListingsSection.tsx': [
        (r'l\.id', r'l.public_id'),
        (r'listing\.id', r'listing.public_id'),
    ],
    'app/search/page.tsx': [
        (r'l\.id', r'l.public_id'),
        (r's\.id', r's.public_id'),
    ],
    'app/sellers/page.tsx': [
        (r's\.id', r's.public_id'),
    ],
    'app/sellers/detail/page.tsx': [
        (r'l\.id', r'l.public_id'),
        (r'seller\.id', r'seller.public_id'),
    ],
    'app/sellers/following/page.tsx': [
        (r's\.id', r's.public_id'),
        (r'l\.id', r'l.public_id'),
    ],
    'app/profile/page.tsx': [
        (r'l\.id', r'l.public_id'),
    ],
    'app/profile/favorites/page.tsx': [
        (r'l\.id', r'l.public_id'),
    ],
    'app/admin/users/detail/page.tsx': [
        (r'l\.id', r'l.public_id'),
        (r'user\.id', r'user.public_id'),
    ],
    'lib/api/users.ts': [
        (r'  id: number;', r'  public_id: number;\n  id?: number;'),
        (r'seller\.id', r'(seller.public_id || seller.id)'),
    ],
    'lib/store/auth.ts': [
        (r'  id: number;', r'  id?: number;\n  public_id: number;'),
    ]
}

for filepath, replacements in file_updates.items():
    if os.path.exists(filepath):
        replace_in_file(filepath, replacements)
    else:
        print(f"File not found: {filepath}")
