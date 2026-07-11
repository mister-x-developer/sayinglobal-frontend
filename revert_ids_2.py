import os
import re

files = [
    'app/admin/moderation/detail/page.tsx',
    'app/admin/users/detail/page.tsx',
    'app/admin/users/page.tsx',
    'app/profile/reports/detail/page.tsx',
    'app/profile/reports/page.tsx',
    'components/listings/ListingGrid.tsx',
    'lib/api/users.ts'
]

for file in files:
    path = os.path.join('/home/lochinbek/Desktop/sayinglobal/frontend', file)
    if os.path.exists(path):
        with open(path, 'r') as f:
            content = f.read()
        
        content = re.sub(r'reported_user\?\.public_id', 'reported_user?.id', content)
        content = re.sub(r'reported_user\.public_id', 'reported_user.id', content)
        
        content = re.sub(r'\bu\.public_id\b', 'u.id', content)
        content = re.sub(r'selectedUser\.public_id', 'selectedUser.id', content)
        content = re.sub(r'\buser\.public_id\b', 'user.id', content)
        
        content = re.sub(r'listing\.public_id', 'listing.id', content)
        
        # In lib/api/users.ts, revert the id?: number injection from fix_ids.py if any.
        # SellerSummary had `id?: number` and `public_id: number`. 
        # Actually I can just make `id: number` in SellerSummary.
        if file == 'lib/api/users.ts':
            content = re.sub(r'id\?:\s*number;', 'id: number;', content)
            content = re.sub(r'public_id:\s*number;', '', content)
            content = re.sub(r'seller\.public_id\s*\|\|\s*seller\.id', 'seller.id', content)
            content = re.sub(r'\(seller\.id\)', 'seller.id', content)

        with open(path, 'w') as f:
            f.write(content)
        print(f"Updated {path}")
